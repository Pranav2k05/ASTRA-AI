package com.astra.assistant.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ConfigService {
    private final String ASTRA_DIR = System.getProperty("user.home") + File.separator + ".astra";
    private final String CONFIG_FILE = ASTRA_DIR + File.separator + "config.json";
    private final ObjectMapper objectMapper = new ObjectMapper();
    private String sessionToken;
    private String envApiKey = "";
    private Map<String, Object> config = new HashMap<>();

    @PostConstruct
    public void init() {
        File dir = new File(ASTRA_DIR);
        if (!dir.exists()) {
            dir.mkdirs();
        }
        
        // Generate a new secure session token on startup
        SecureRandom random = new SecureRandom();
        byte[] bytes = new byte[24];
        random.nextBytes(bytes);
        this.sessionToken = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        
        loadEnvFile();
        loadConfig();
    }

    private void loadEnvFile() {
        // Paths to search: current directory, parent (project root), user profile configuration folder
        File[] paths = {
            new File(".env"),
            new File("../.env"),
            new File(ASTRA_DIR + File.separator + ".env")
        };

        for (File path : paths) {
            if (path.exists()) {
                try {
                    List<String> lines = Files.readAllLines(path.toPath());
                    for (String line : lines) {
                        line = line.trim();
                        if (line.isEmpty() || line.startsWith("#")) {
                            continue;
                        }
                        String[] parts = line.split("=", 2);
                        if (parts.length == 2) {
                            String key = parts[0].trim();
                            String value = parts[1].trim();
                            
                            // Strip surrounding single/double quotes if present
                            if ((value.startsWith("\"") && value.endsWith("\"")) || 
                                (value.startsWith("'") && value.endsWith("'"))) {
                                value = value.substring(1, value.length() - 1);
                            }
                            
                            if ("GEMINI_API_KEY".equals(key) && !value.isEmpty()) {
                                this.envApiKey = value;
                                System.out.println("[Security] Loaded Gemini API Key from local env file: " + path.getCanonicalPath());
                                return; // Successfully loaded, skip other files
                            }
                        }
                    }
                } catch (IOException e) {
                    System.err.println("Error reading env file: " + e.getMessage());
                }
            }
        }
    }

    @SuppressWarnings("unchecked")
    private void loadConfig() {
        File file = new File(CONFIG_FILE);
        if (file.exists()) {
            try {
                config = objectMapper.readValue(file, Map.class);
            } catch (IOException e) {
                System.err.println("Error reading config: " + e.getMessage());
            }
        }
    }

    public synchronized void saveConfig() {
        try {
            objectMapper.writeValue(new File(CONFIG_FILE), config);
        } catch (IOException e) {
            System.err.println("Error writing config: " + e.getMessage());
        }
    }

    public String getSessionToken() {
        return sessionToken;
    }

    public String getGeminiApiKey() {
        // .env API key has higher precedence over config.json key
        if (envApiKey != null && !envApiKey.trim().isEmpty()) {
            return envApiKey;
        }
        return (String) config.getOrDefault("geminiApiKey", "");
    }

    public void setGeminiApiKey(String apiKey) {
        // If loaded from .env, do not overwrite config.json with empty or mock values
        if (isKeyFromEnv()) {
            return;
        }
        config.put("geminiApiKey", apiKey);
        saveConfig();
    }

    public boolean isKeyFromEnv() {
        return envApiKey != null && !envApiKey.trim().isEmpty();
    }
    
    public Map<String, Object> getAllConfig() {
        Map<String, Object> cleanConfig = new HashMap<>(config);
        cleanConfig.put("isLoadedFromEnv", isKeyFromEnv());
        return cleanConfig;
    }
    
    public void updateConfig(Map<String, Object> newConfig) {
        config.putAll(newConfig);
        saveConfig();
    }

    public String getAstraDir() {
        return ASTRA_DIR;
    }
}
