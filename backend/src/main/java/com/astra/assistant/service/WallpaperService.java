package com.astra.assistant.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.*;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class WallpaperService {

    @Autowired
    private ConfigService configService;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Search wallpapers using Unsplash's public API.
     */
    public List<Map<String, String>> searchWallpapers(String query) {
        List<Map<String, String>> wallpapers = new ArrayList<>();
        try {
            String searchQuery = query == null || query.trim().isEmpty() ? "wallpaper landscape" : query.trim() + " wallpaper";
            String apiUrl = "https://unsplash.com/napi/search/photos?query=" + searchQuery + "&per_page=15";
            
            ResponseEntity<String> response = restTemplate.getForEntity(apiUrl, String.class);
            if (response.getStatusCode().is2xxSuccessful()) {
                JsonNode root = objectMapper.readTree(response.getBody());
                JsonNode results = root.path("results");
                
                if (results.isArray()) {
                    for (JsonNode node : results) {
                        Map<String, String> img = new HashMap<>();
                        img.put("id", node.path("id").asText());
                        img.put("description", node.path("alt_description").asText("A beautiful wallpaper"));
                        img.put("rawUrl", node.path("urls").path("raw").asText());
                        img.put("fullUrl", node.path("urls").path("full").asText() + "&w=1920&q=80"); // optimized for screen
                        img.put("thumbUrl", node.path("urls").path("thumb").asText());
                        img.put("author", node.path("user").path("name").asText());
                        wallpapers.add(img);
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Error searching wallpapers: " + e.getMessage());
            // Fallback: Add some high quality default wallpapers if the search fails or rate limits apply
            addFallbackWallpapers(wallpapers);
        }
        return wallpapers;
    }

    /**
     * Download the image from a URL and apply it as the system wallpaper.
     */
    public boolean setWallpaper(String imageUrl) {
        String targetDir = configService.getAstraDir() + File.separator + "wallpapers";
        File dir = new File(targetDir);
        if (!dir.exists()) {
            dir.mkdirs();
        }

        File wallpaperFile = new File(dir, "current_wallpaper.jpg");

        // Download image to local storage
        try (InputStream in = new URL(imageUrl).openStream()) {
            Files.copy(in, wallpaperFile.toPath(), StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            System.err.println("Failed to download wallpaper image: " + e.getMessage());
            return false;
        }

        // Invoke User32 API via PowerShell to set the desktop wallpaper immediately
        return applyWallpaperWindows(wallpaperFile.getAbsolutePath());
    }

    /**
     * Executes PowerShell instructions to call SystemParametersInfo (SPI_SETDESKWALLPAPER)
     */
    private boolean applyWallpaperWindows(String wallpaperPath) {
        // PowerShell command that declares a C# pinvoke signature to call User32.dll
        String psCommand = "Add-Type -TypeDefinition '" +
                "using System; " +
                "using System.Runtime.InteropServices; " +
                "public class Wallpaper { " +
                "  [DllImport(\"user32.dll\", CharSet = CharSet.Auto)] " +
                "  public static extern int SystemParametersInfo(int uAction, int uParam, string lpvParam, int fuWinIni); " +
                "}'; " +
                "[Wallpaper]::SystemParametersInfo(20, 0, '" + wallpaperPath.replace("'", "''") + "', 3)";

        try {
            ProcessBuilder pb = new ProcessBuilder("powershell.exe", "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", psCommand);
            Process process = pb.start();
            int exitCode = process.waitFor();
            return exitCode == 0;
        } catch (Exception e) {
            System.err.println("Failed to execute PowerShell wallpaper updater: " + e.getMessage());
            return false;
        }
    }

    private void addFallbackWallpapers(List<Map<String, String>> list) {
        // Landscape nature
        Map<String, String> w1 = new HashMap<>();
        w1.put("id", "fb1");
        w1.put("description", "Beautiful Mountain Lake Landscape");
        w1.put("fullUrl", "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1920&q=80");
        w1.put("thumbUrl", "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&q=80");
        w1.put("author", "Unsplash Landscape");
        list.add(w1);

        // Cyberpunk
        Map<String, String> w2 = new HashMap<>();
        w2.put("id", "fb2");
        w2.put("description", "Cyberpunk Neon City Streets");
        w2.put("fullUrl", "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1920&q=80");
        w2.put("thumbUrl", "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=400&q=80");
        w2.put("author", "Unsplash Space/Dark");
        list.add(w2);

        // Minimalist
        Map<String, String> w3 = new HashMap<>();
        w3.put("id", "fb3");
        w3.put("description", "Minimalist Sunset Desert");
        w3.put("fullUrl", "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=1920&q=80");
        w3.put("thumbUrl", "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=400&q=80");
        w3.put("author", "Unsplash Abstract");
        list.add(w3);
    }
}
