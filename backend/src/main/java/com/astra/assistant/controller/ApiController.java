package com.astra.assistant.controller;

import com.astra.assistant.service.ConfigService;
import com.astra.assistant.service.LlmService;
import com.astra.assistant.service.SystemService;
import com.astra.assistant.service.WallpaperService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class ApiController {

    @Autowired
    private ConfigService configService;

    @Autowired
    private LlmService llmService;

    @Autowired
    private SystemService systemService;

    @Autowired
    private WallpaperService wallpaperService;

    /**
     * Chat response endpoint. Coordinates regex matching and Gemini fallback.
     */
    @PostMapping("/chat")
    public ResponseEntity<Map<String, Object>> chat(@RequestBody Map<String, String> request) {
        String message = request.get("message");
        if (message == null || message.trim().isEmpty()) {
            Map<String, Object> err = new HashMap<>();
            err.put("error", "Message cannot be empty");
            return ResponseEntity.badRequest().body(err);
        }
        
        Map<String, Object> response = llmService.processMessage(message);
        return ResponseEntity.ok(response);
    }

    /**
     * Get system configuration (excluding sensitive values, only showing partial API keys).
     */
    @GetMapping("/config")
    public ResponseEntity<Map<String, Object>> getConfig() {
        Map<String, Object> config = configService.getAllConfig();
        // Resolve active API key (including .env loading checks)
        String rawKey = configService.getGeminiApiKey();
        String maskedKey = "";
        if (rawKey != null && !rawKey.trim().isEmpty()) {
            maskedKey = rawKey.substring(0, Math.min(6, rawKey.length())) + "..." + 
                    (rawKey.length() > 6 ? rawKey.substring(rawKey.length() - 4) : "");
        }
        config.put("geminiApiKey", maskedKey);
        config.put("hasApiKey", rawKey != null && !rawKey.trim().isEmpty());
        config.put("astraDir", configService.getAstraDir());
        return ResponseEntity.ok(config);
    }

    /**
     * Save/Update configuration parameters.
     */
    @PostMapping("/config")
    public ResponseEntity<Map<String, String>> updateConfig(@RequestBody Map<String, Object> request) {
        Map<String, String> response = new HashMap<>();
        
        // Handle Gemini API Key specially
        if (request.containsKey("geminiApiKey")) {
            String newKey = (String) request.get("geminiApiKey");
            // If the user inputs masked key (because they loaded it and hit save), do not change it
            if (newKey != null && !newKey.contains("...")) {
                configService.setGeminiApiKey(newKey);
            }
        }
        
        // Handle other general configs
        Map<String, Object> generalConfig = new HashMap<>(request);
        generalConfig.remove("geminiApiKey");
        configService.updateConfig(generalConfig);
        
        response.put("status", "success");
        response.put("message", "Configuration saved successfully.");
        return ResponseEntity.ok(response);
    }

    /**
     * Execute: Open folder in VS Code
     */
    @PostMapping("/system/vscode")
    public ResponseEntity<Map<String, Object>> openVsCode(@RequestBody Map<String, String> request) {
        String path = request.get("path");
        Map<String, Object> response = new HashMap<>();
        try {
            boolean success = systemService.openInVsCode(path);
            response.put("success", success);
            response.put("message", success ? "VS Code opened successfully." : "Failed to open VS Code.");
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * Execute: Open command terminal
     */
    @PostMapping("/system/terminal")
    public ResponseEntity<Map<String, Object>> openTerminal(@RequestBody Map<String, String> request) {
        String path = request.get("path");
        String shell = request.getOrDefault("shell", "cmd");
        boolean success = systemService.openTerminal(path, shell);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", success);
        response.put("message", success ? "Terminal opened successfully." : "Failed to launch terminal process.");
        return ResponseEntity.ok(response);
    }

    /**
     * Execute: Organize Desktop Files
     */
    @PostMapping("/system/organize-desktop")
    public ResponseEntity<Map<String, Object>> organizeDesktop() {
        Map<String, List<String>> report = systemService.organizeDesktop();
        Map<String, Object> response = new HashMap<>();
        response.put("success", report.get("Errors").isEmpty());
        response.put("moved", report.get("Moved"));
        response.put("errors", report.get("Errors"));
        return ResponseEntity.ok(response);
    }

    /**
     * Execute: Search Wallpapers
     */
    @GetMapping("/system/wallpaper/search")
    public ResponseEntity<List<Map<String, String>>> searchWallpapers(@RequestParam(required = false) String query) {
        List<Map<String, String>> wallpapers = wallpaperService.searchWallpapers(query);
        return ResponseEntity.ok(wallpapers);
    }

    /**
     * Execute: Apply Wallpaper
     */
    @PostMapping("/system/wallpaper/set")
    public ResponseEntity<Map<String, Object>> setWallpaper(@RequestBody Map<String, String> request) {
        String url = request.get("url");
        Map<String, Object> response = new HashMap<>();
        if (url == null || url.trim().isEmpty()) {
            response.put("success", false);
            response.put("error", "URL cannot be empty");
            return ResponseEntity.badRequest().body(response);
        }
        
        boolean success = wallpaperService.setWallpaper(url);
        response.put("success", success);
        response.put("message", success ? "Wallpaper applied successfully." : "Failed to set wallpaper.");
        return ResponseEntity.ok(response);
    }

    /**
     * Security Report Endpoint. Displays security measures in the UI dashboard.
     */
    @GetMapping("/security")
    public ResponseEntity<Map<String, Object>> getSecurityReport() {
        Map<String, Object> report = new HashMap<>();
        report.put("serverAddress", "127.0.0.1 (Localhost Bind Only)");
        report.put("serverPort", "8080");
        report.put("corsRestricted", true);
        report.put("corsOrigins", List.of("http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:8080"));
        report.put("authMechanism", "Header Handshake (X-ASTRA-Token)");
        report.put("sessionActive", true);
        report.put("osType", System.getProperty("os.name"));
        report.put("javaVersion", System.getProperty("java.version"));
        report.put("tokenActive", true);
        return ResponseEntity.ok(report);
    }

    /**
     * Get real-time hardware metrics.
     */
    @GetMapping("/system/metrics")
    public ResponseEntity<Map<String, Object>> getMetrics() {
        return ResponseEntity.ok(systemService.getSystemMetrics());
    }

}
