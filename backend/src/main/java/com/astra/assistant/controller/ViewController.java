package com.astra.assistant.controller;

import com.astra.assistant.service.ConfigService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.util.StreamUtils;
import org.springframework.web.bind.annotation.GetMapping;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

@Controller
public class ViewController {

    @Autowired
    private ConfigService configService;

    @Autowired
    private ResourceLoader resourceLoader;

    @GetMapping(value = {"/", "/index.html"}, produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> index() {
        try {
            Resource resource = resourceLoader.getResource("classpath:/static/index.html");
            if (!resource.exists()) {
                // Friendly error page if static build is not copied yet
                return ResponseEntity.ok(
                    "<!DOCTYPE html>" +
                    "<html>" +
                    "<head>" +
                    "  <title>ASTRA Initialization</title>" +
                    "  <style>" +
                    "    body { font-family: 'Segoe UI', system-ui, sans-serif; background: #0f0f15; color: #e5e5e7; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }" +
                    "    .card { background: #1a1a24; padding: 40px; border-radius: 12px; border: 1px solid #2d2d3f; max-width: 500px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }" +
                    "    h1 { color: #8855ff; margin-bottom: 20px; }" +
                    "    code { background: #0c0c10; padding: 4px 8px; border-radius: 4px; color: #ff55bb; font-family: consolas, monospace; }" +
                    "    p { line-height: 1.6; color: #a0a0b0; }" +
                    "  </style>" +
                    "</head>" +
                    "<body>" +
                    "  <div class='card'>" +
                    "    <h1>ASTRA AI Assistant</h1>" +
                    "    <p>The backend is running successfully, but the frontend React app has not been compiled or copied yet.</p>" +
                    "    <p>Please compile the frontend using <code>npm run build</code> in the <code>frontend</code> folder, or run the master script <code>run.ps1</code> in the root folder.</p>" +
                    "  </div>" +
                    "</body>" +
                    "</html>"
                );
            }
            String html = StreamUtils.copyToString(resource.getInputStream(), StandardCharsets.UTF_8);
            String token = configService.getSessionToken();
            
            // Replace the token placeholder dynamically in the index.html template
            String replacedHtml = html.replace("${ASTRA_TOKEN}", token);
            return ResponseEntity.ok(replacedHtml);
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body("Error loading index.html template: " + e.getMessage());
        }
    }
}
