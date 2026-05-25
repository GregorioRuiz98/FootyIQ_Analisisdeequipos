"""Seed de equipos de LaLiga (Primera, id 87) y Segunda (id 141) en MongoDB.

Llama a los endpoints del backend Spring Boot, que a su vez piden los datos al
scraper FastAPI y los persisten en las colecciones `teams`, `players`,
`matches` y `competitions`.

Uso:
    python scripts/seed_la_liga_teams.py --user demo@footyiq.dev --password demo
    python scripts/seed_la_liga_teams.py --token <jwt>            # si ya lo tienes
    python scripts/seed_la_liga_teams.py --leagues 87 141 47      # otras ligas

Requiere backend en :8080 y scraper en :8001 corriendo.
"""

from __future__ import annotations

import argparse
import getpass
import sys
import time
from typing import Iterable

import httpx

LEAGUE_NAMES = {
    87: "LaLiga (Primera Division)",
    141: "LaLiga 2 (Segunda Division)",
}

DEFAULT_BACKEND = "http://localhost:8080/api"


def login(backend: str, email: str, password: str) -> str:
    """Autentica contra /auth/login y devuelve el JWT."""
    resp = httpx.post(
        f"{backend}/auth/login",
        json={"email": email, "password": password},
        timeout=20.0,
    )
    resp.raise_for_status()
    payload = resp.json()
    token = payload.get("token") or payload.get("accessToken")
    if not token:
        raise RuntimeError(f"Login OK pero no se encontro token en la respuesta: {payload}")
    return token


def import_league(backend: str, token: str, league_id: int) -> dict:
    """Dispara la importacion de una liga en backend (teams, players, matches)."""
    headers = {"Authorization": f"Bearer {token}"}
    resp = httpx.post(
        f"{backend}/data/import/league/{league_id}",
        headers=headers,
        timeout=180.0,
    )
    resp.raise_for_status()
    return resp.json()


def list_teams(backend: str, token: str, league_id: int) -> list:
    headers = {"Authorization": f"Bearer {token}"}
    resp = httpx.get(
        f"{backend}/data/competition/{league_id}/teams",
        headers=headers,
        timeout=30.0,
    )
    resp.raise_for_status()
    return resp.json()


def seed(backend: str, token: str, leagues: Iterable[int]) -> int:
    rc = 0
    for league_id in leagues:
        name = LEAGUE_NAMES.get(league_id, f"Liga {league_id}")
        print(f"\n=== Importando {name} (id={league_id}) ===")
        started = time.time()
        try:
            run = import_league(backend, token, league_id)
            elapsed = time.time() - started
            print(
                f"  OK en {elapsed:5.1f}s -> teamsCount={run.get('teamsCount')}"
                f" matchesCount={run.get('matchesCount')}"
                f" playersCount={run.get('playersCount')}"
            )
        except httpx.HTTPStatusError as exc:
            rc = 2
            print(f"  ERROR HTTP {exc.response.status_code}: {exc.response.text[:200]}")
            continue
        except Exception as exc:  # noqa: BLE001
            rc = 2
            print(f"  ERROR {type(exc).__name__}: {exc}")
            continue

        try:
            teams = list_teams(backend, token, league_id)
            print(f"  Equipos almacenados: {len(teams)}")
            for t in teams[:8]:
                ext = t.get("externalId")
                print(f"    - {ext:>6}  {t.get('name')}")
            if len(teams) > 8:
                print(f"    ... y {len(teams) - 8} mas")
        except Exception as exc:  # noqa: BLE001
            print(f"  AVISO no se pudo listar equipos: {exc}")
    return rc


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--backend", default=DEFAULT_BACKEND, help="URL base del backend (default %(default)s)")
    p.add_argument("--user", help="Email de login (si no se pasa --token)")
    p.add_argument("--password", help="Contrasena de login")
    p.add_argument("--token", help="JWT ya emitido (alternativa a --user/--password)")
    p.add_argument(
        "--leagues",
        type=int,
        nargs="+",
        default=[87, 141],
        help="Lista de leagueIds a importar (default LaLiga 87 + Segunda 141)",
    )
    return p.parse_args()


def main() -> int:
    args = parse_args()

    token = args.token
    if not token:
        if not args.user:
            print("ERROR: hay que pasar --token o --user (la password se pedira por consola)", file=sys.stderr)
            return 1
        password = args.password or getpass.getpass(f"Password para {args.user}: ")
        try:
            token = login(args.backend, args.user, password)
            print(f"Login OK como {args.user}")
        except Exception as exc:  # noqa: BLE001
            print(f"ERROR login: {exc}", file=sys.stderr)
            return 1

    return seed(args.backend, token, args.leagues)


if __name__ == "__main__":
    raise SystemExit(main())
