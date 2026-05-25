"""
Cliente browser que se conecta a un Chrome real via CDP (puerto 9222).

Estrategia: el usuario lanza Chrome con `scraper/launch_chrome.ps1` (puerto
debug 9222 + perfil persistido), pasa el Turnstile/cookies de forma manual una
sola vez, y deja la ventana abierta. Este cliente se engancha por CDP a esa
instancia y reutiliza la sesion humana, asi Cloudflare no detecta automatizacion.
"""
from __future__ import annotations

import asyncio
import json
import logging
import os
from typing import Any

import httpx
from playwright.async_api import async_playwright, Browser, BrowserContext, Page, Playwright

_CDP_URL = os.getenv("SCRAPER_CDP_URL", "http://localhost:9222")


class FotmobBrowserClient:
    """Cliente que se conecta a Chrome real por CDP."""

    def __init__(self) -> None:
        self._lock = asyncio.Lock()
        self._playwright: Playwright | None = None
        self._browser: Browser | None = None
        self._context: BrowserContext | None = None
        self._page: Page | None = None

    async def _ensure(self) -> Page | None:
        if self._playwright is None:
            try:
                self._playwright = await async_playwright().start()
            except Exception as exc:
                logging.warning(
                    "No se pudo iniciar Playwright en este proceso (%s). "
                    "En Windows con recarga en caliente puede fallar el loop de subprocess. "
                    "Prueba a arrancar el scraper sin --reload.",
                    exc,
                )
                return None

        if self._browser is None or not self._browser.is_connected():
            self._browser = None
            self._context = None
            self._page = None
            try:
                self._browser = await self._playwright.chromium.connect_over_cdp(_CDP_URL)
            except Exception as exc:
                logging.warning(
                    "No se pudo conectar a Chrome CDP en %s -> %s. "
                    "Lanza scraper/launch_chrome.ps1 y deja la ventana abierta.",
                    _CDP_URL,
                    exc,
                )
                return None

        contexts = self._browser.contexts
        self._context = contexts[0] if contexts else await self._browser.new_context()

        page = None
        for p in self._context.pages:
            url = p.url or ""
            if "fotmob.com" in url:
                page = p
                break
        if page is None:
            page = self._context.pages[0] if self._context.pages else await self._context.new_page()
            try:
                if "fotmob.com" not in (page.url or ""):
                    await page.goto("https://www.fotmob.com/", wait_until="domcontentloaded", timeout=30000)
            except Exception:
                pass

        self._page = page
        return page

    async def fetch_match_details(self, match_id: int) -> Any:
        return await self.fetch_json(f"/api/data/matchDetails?matchId={match_id}")

    async def fetch_json(self, path: str) -> Any:
        async with self._lock:
            page = await self._ensure()
            if page is None:
                return {"error": "browser_not_available", "hint": "lanza scraper/launch_chrome.ps1"}
            return await self._do_fetch(page, path)

    async def _do_fetch(self, page: Page, path: str) -> Any:
        url = path if path.startswith("http") else f"https://www.fotmob.com{path}"
        try:
            result = await page.evaluate(
                """
                async (u) => {
                    try {
                        const r = await fetch(u, { headers: { accept: 'application/json' }, credentials: 'include' });
                        const text = await r.text();
                        return { status: r.status, body: text };
                    } catch (e) {
                        return { error: String(e) };
                    }
                }
                """,
                url,
            )
        except Exception as exc:
            return {"error": "browser_failed", "message": str(exc)}

        if not isinstance(result, dict):
            return {"error": "unexpected_eval_result"}
        if "error" in result and "status" not in result:
            return {"error": "browser_fetch_failed", "message": result["error"]}

        status = result.get("status")
        body = result.get("body", "")
        if status is None or status >= 400:
            return {"error": "fotmob_error", "status": status, "path": path, "snippet": body[:300]}
        try:
            return json.loads(body)
        except Exception:
            return {"error": "invalid_json", "path": path, "snippet": body[:300]}

    async def close(self) -> None:
        async with self._lock:
            try:
                if self._browser:
                    await self._browser.close()
            except Exception:
                pass
            try:
                if self._playwright:
                    await self._playwright.stop()
            except Exception:
                pass
            self._page = None
            self._context = None
            self._browser = None
            self._playwright = None


browser_client = FotmobBrowserClient()


async def cdp_healthcheck() -> dict:
    """Diagnostico: verifica si Chrome esta escuchando en CDP."""
    try:
        async with httpx.AsyncClient(timeout=2) as c:
            r = await c.get(f"{_CDP_URL}/json/version")
            return {"ok": r.status_code == 200, "info": r.json() if r.status_code == 200 else r.text}
    except Exception as exc:
        return {"ok": False, "error": str(exc)}
