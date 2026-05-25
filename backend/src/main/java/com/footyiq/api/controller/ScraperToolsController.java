package com.footyiq.api.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Endpoints auxiliares de control del scraper: lanzar Chrome real con
 * --remote-debugging-port=9222 para que el scraper se conecte por CDP y
 * pueda saltar Cloudflare Turnstile en FotMob.
 */
@RestController
@RequestMapping("/api/scraper")
public class ScraperToolsController {

    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(2))
            .build();

    /** Devuelve si Chrome esta accesible por CDP (puerto 9222 por defecto). */
    @GetMapping("/browser/status")
    public Map<String, Object> browserStatus() {
        Map<String, Object> result = new HashMap<>();
        boolean ok = isCdpAlive();
        result.put("running", ok);
        return result;
    }

    /**
     * Si Chrome no esta ya en :9222, lanza launch_chrome.ps1 en segundo plano.
     * Idempotente: si ya esta vivo, devuelve {"running": true, "launched": false}.
     */
    @PostMapping("/browser/launch")
    public Map<String, Object> launchBrowser() {
        Map<String, Object> result = new HashMap<>();
        if (isCdpAlive()) {
            result.put("running", true);
            result.put("launched", false);
            result.put("reason", "already_running");
            return result;
        }

        Path script = resolveLaunchScript();
        if (script == null) {
            result.put("running", false);
            result.put("launched", false);
            result.put("error", "launch_chrome.ps1 no encontrado");
            return result;
        }

        try {
            ProcessBuilder pb = new ProcessBuilder(List.of(
                    "powershell.exe",
                    "-ExecutionPolicy", "Bypass",
                    "-WindowStyle", "Hidden",
                    "-File", script.toString()));
            pb.redirectErrorStream(true);
            pb.redirectOutput(ProcessBuilder.Redirect.DISCARD);
            Process p = pb.start();
            result.put("running", false);
            result.put("launched", true);
            result.put("pid", p.pid());
            result.put("script", script.toString());
            return result;
        } catch (IOException ex) {
            result.put("running", false);
            result.put("launched", false);
            result.put("error", ex.getMessage());
            return result;
        }
    }

    private boolean isCdpAlive() {
        try {
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create("http://localhost:9222/json/version"))
                    .timeout(Duration.ofSeconds(2))
                    .GET()
                    .build();
            HttpResponse<String> resp = http.send(req, HttpResponse.BodyHandlers.ofString());
            return resp.statusCode() == 200;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Busca launch_chrome.ps1 en rutas candidatas relativas al cwd del backend.
     * En desarrollo el backend se lanza desde nuevoFootballHub/backend, asi que
     * el script vive en ../scraper/launch_chrome.ps1.
     */
    private Path resolveLaunchScript() {
        List<Path> candidates = List.of(
                Paths.get("../scraper/launch_chrome.ps1"),
                Paths.get("./scraper/launch_chrome.ps1"),
                Paths.get("scraper/launch_chrome.ps1"),
                Paths.get(System.getProperty("user.dir"), "..", "scraper", "launch_chrome.ps1"));
        for (Path c : candidates) {
            Path abs = c.toAbsolutePath().normalize();
            if (Files.isRegularFile(abs)) {
                return abs;
            }
        }
        return null;
    }
}
