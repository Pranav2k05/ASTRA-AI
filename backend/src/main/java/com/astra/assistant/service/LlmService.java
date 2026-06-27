package com.astra.assistant.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class LlmService {

    @Autowired
    private ConfigService configService;

    @Autowired
    private SystemService systemService;

    @Autowired
    private WallpaperService wallpaperService;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    // Regex pattern to extract action tags from the LLM output
    private static final Pattern ACTION_PATTERN = Pattern.compile("\\[ACTION:(\\w+)(?:;PATH:([^;]*))?(?:;QUERY:([^;]*))?\\]");

    /**
     * Process a chat message. Check local rules first. Then delegate to Gemini if available.
     */
    public Map<String, Object> processMessage(String userMessage) {
        Map<String, Object> result = new HashMap<>();
        String trimmed = userMessage.trim().toLowerCase();

        // 1. Quick regex parsing for offline / instant commands
        Map<String, Object> directCommand = parseDirectCommand(trimmed);
        if (directCommand != null) {
            return directCommand;
        }

        // 2. LLM Call
        String apiKey = configService.getGeminiApiKey();
        if (apiKey == null || apiKey.trim().isEmpty()) {
            // No API key configured fallback
            result.put("reply", "Hello! I am ASTRA, your local assistant. To start chatting with me, please add your **Gemini API Key** in the **Settings** menu.\n\n" +
                    "However, you can still use direct local commands! Try typing:\n" +
                    "- `open vscode C:\\path\\to\\folder`\n" +
                    "- `open terminal` or `open powershell`\n" +
                    "- `open whatsapp` or `open calculator`\n" +
                    "- `organize desktop`\n" +
                    "- `search wallpapers nature` (will pull Unsplash catalog to choose from)");
            result.put("actionExecuted", "NONE");
            return result;
        }

        return callGemini(userMessage, apiKey);
    }

    /**
     * Local regex parser for instant command routing
     */
    private Map<String, Object> parseDirectCommand(String message) {
        Map<String, Object> res = new HashMap<>();
        
        // Open Application
        // Format: "open whatsapp", "open chrome", "open calc", "open calculator", "open notepad", "open settings"
        if (message.startsWith("open ") || message.startsWith("launch ")) {
            String app = message.replace("open ", "").replace("launch ", "").trim();
            String executable = null;
            if (app.equals("calculator") || app.equals("calc")) {
                executable = "calc";
            } else if (app.equals("notepad")) {
                executable = "notepad";
            } else if (app.equals("chrome") || app.equals("google chrome")) {
                executable = "chrome";
            } else if (app.equals("whatsapp")) {
                executable = "whatsapp:";
            } else if (app.equals("paint") || app.equals("mspaint")) {
                executable = "mspaint";
            } else if (app.equals("settings")) {
                executable = "ms-settings:";
            } else if (app.equals("explorer") || app.equals("file explorer")) {
                executable = "explorer";
            } else if (app.equals("task manager") || app.equals("taskmgr")) {
                executable = "taskmgr";
            } else if (app.startsWith("http://") || app.startsWith("https://")) {
                executable = app;
            }

            if (executable != null) {
                boolean success = systemService.openApplication(executable);
                res.put("reply", "Opening application: `" + app + "`");
                res.put("actionExecuted", "OPEN_APP");
                res.put("success", success);
                return res;
            }
        }

        // Open VS Code
        // Format: "open vscode C:\path" or "open folder in vscode" etc.
        if (message.contains("vscode") || message.contains("vs code")) {
            String path = extractPath(message);
            if (path != null) {
                try {
                    boolean success = systemService.openInVsCode(path);
                    res.put("reply", "Opening VS Code at: `" + path + "`");
                    res.put("actionExecuted", "OPEN_VSCODE");
                    res.put("success", success);
                    return res;
                } catch (Exception e) {
                    res.put("reply", "Error opening VS Code: " + e.getMessage());
                    res.put("actionExecuted", "OPEN_VSCODE");
                    res.put("success", false);
                    return res;
                }
            }
        }

        // Open terminal / powershell
        if (message.contains("open terminal") || message.contains("open cmd") || message.contains("open command prompt") || message.contains("open powershell") || message.contains("open shell")) {
            String shell = message.contains("powershell") ? "powershell" : "cmd";
            String path = extractPath(message);
            boolean success = systemService.openTerminal(path, shell);
            res.put("reply", "Opening " + (shell.equals("powershell") ? "PowerShell" : "Command Prompt") + 
                    (path != null ? " at `" + path + "`" : ""));
            res.put("actionExecuted", "OPEN_TERMINAL");
            res.put("success", success);
            return res;
        }

        // Organize desktop
        if (message.contains("organize desktop") || message.contains("clean desktop") || message.contains("clean up desktop") || message.contains("desktop organize")) {
            try {
                Map<String, List<String>> report = systemService.organizeDesktop();
                int count = report.get("Moved").size();
                res.put("reply", "Desktop cleanup completed successfully! I moved **" + count + "** files to categorised folders on your Desktop.\n\n" +
                        "**Files Organized:**\n" + 
                        (count == 0 ? "- *No stray files found to move!*" : String.join("\n", report.get("Moved").stream().map(s -> "* " + s).toList())));
                res.put("actionExecuted", "ORGANIZE_DESKTOP");
                res.put("success", true);
                return res;
            } catch (Exception e) {
                res.put("reply", "Error organizing desktop: " + e.getMessage());
                res.put("actionExecuted", "ORGANIZE_DESKTOP");
                res.put("success", false);
                return res;
            }
        }

        // Search wallpaper
        if (message.startsWith("search wallpapers") || message.startsWith("search wallpaper") || message.startsWith("find wallpaper")) {
            String query = message.replace("search wallpapers", "")
                                  .replace("search wallpaper", "")
                                  .replace("find wallpaper", "").trim();
            res.put("reply", "Here are the wallpaper search results for: **" + (query.isEmpty() ? "Landscape" : query) + "**");
            res.put("actionExecuted", "SEARCH_WALLPAPERS");
            res.put("wallpapers", wallpaperService.searchWallpapers(query));
            res.put("success", true);
            return res;
        }

        return null; // Let LLM handle it
    }

    private String extractPath(String msg) {
        // Look for path patterns (C:\..., D:\..., or paths starting with / or ~)
        Pattern pathPattern = Pattern.compile("([a-zA-Z]:\\\\[^\\s\"']+)|(~\\\\[^\\s\"']+)");
        Matcher m = pathPattern.matcher(msg);
        if (m.find()) {
            return m.group(0);
        }
        return null;
    }

    /**
     * Send message to Google Gemini API and execute any triggered local action tags.
     */
    private Map<String, Object> callGemini(String message, String apiKey) {
        Map<String, Object> result = new HashMap<>();
        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + apiKey;

        try {
            // Build Gemini Request Payload
            ObjectNode rootNode = objectMapper.createObjectNode();
            
            // System instructions to guide the AI capability
            ObjectNode systemInstruction = objectMapper.createObjectNode();
            ArrayNode sysParts = objectMapper.createArrayNode();
            sysParts.add(objectMapper.createObjectNode().put("text", 
                "You are ASTRA, a secure and highly responsive AI assistant running locally on the user's Windows laptop.\n" +
                "You can chat naturally, but you also have full power to run system actions by appending standard command tags at the END of your responses.\n\n" +
                "Available system actions:\n" +
                "1. Open folder in VS Code:\n" +
                "   Format: [ACTION:OPEN_VSCODE;PATH:C:\\path\\to\\folder]\n" +
                "2. Open Command Prompt or PowerShell:\n" +
                "   Format: [ACTION:OPEN_TERMINAL;PATH:C:\\path\\to\\folder;QUERY:cmd] or [ACTION:OPEN_TERMINAL;PATH:C:\\path\\to\\folder;QUERY:powershell]\n" +
                "3. Clean up and organize Desktop files:\n" +
                "   Format: [ACTION:ORGANIZE_DESKTOP]\n" +
                "4. Search and browse desktop wallpapers:\n" +
                "   Format: [ACTION:SEARCH_WALLPAPERS;QUERY:keyword]\n" +
                "5. Open any registered Windows application, protocol (e.g. whatsapp:), or website URL:\n" +
                "   Format: [ACTION:OPEN_APP;QUERY:appName_or_URL_or_protocol]\n" +
                "   Examples: [ACTION:OPEN_APP;QUERY:calc], [ACTION:OPEN_APP;QUERY:notepad], [ACTION:OPEN_APP;QUERY:whatsapp:], [ACTION:OPEN_APP;QUERY:chrome], [ACTION:OPEN_APP;QUERY:https://google.com], [ACTION:OPEN_APP;QUERY:ms-settings:]\n\n" +
                "Security & Formatting Guidelines:\n" +
                "- Ensure paths are valid and Windows formatted.\n" +
                "- ONLY trigger actions if the user explicitly requests them.\n" +
                "- Do NOT output malicious shell commands. If the user asks you to run arbitrary commands (e.g. format C, shutdown, delete system files), refuse politely and state your security limits.\n" +
                "- Respond in elegant Markdown. Keep responses clear and brief.\n" +
                "- Do NOT write standard system commands inside markdown backticks unless explaining them; if executing them, output the tag."
            ));
            systemInstruction.set("parts", sysParts);
            rootNode.set("systemInstruction", systemInstruction);

            // Contents array (Chat History / Current Prompt)
            ArrayNode contents = objectMapper.createArrayNode();
            ObjectNode contentObj = objectMapper.createObjectNode();
            ArrayNode parts = objectMapper.createArrayNode();
            parts.add(objectMapper.createObjectNode().put("text", message));
            contentObj.set("parts", parts);
            contents.add(contentObj);
            rootNode.set("contents", contents);

            // Set headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<String> entity = new HttpEntity<>(objectMapper.writeValueAsString(rootNode), headers);

            // POST to Gemini API
            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);
            if (response.getStatusCode().is2xxSuccessful()) {
                JsonNode responseJson = objectMapper.readTree(response.getBody());
                String reply = responseJson.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText();
                
                // Parse and execute actions in the LLM reply
                result = executeActionFromLlm(reply);
            } else {
                result.put("reply", "Error communicating with Gemini: " + response.getStatusCode());
                result.put("actionExecuted", "NONE");
            }

        } catch (Exception e) {
            System.err.println("Gemini API error: " + e.getMessage());
            result.put("reply", "Failed to connect to Gemini API. Please check your API key in Settings or your internet connection.\n\n*Error: " + e.getMessage() + "*");
            result.put("actionExecuted", "NONE");
        }

        return result;
    }

    /**
     * Parses the LLM reply, executes the requested action if found, and returns cleaned content
     */
    private Map<String, Object> executeActionFromLlm(String reply) {
        Map<String, Object> result = new HashMap<>();
        Matcher matcher = ACTION_PATTERN.matcher(reply);
        
        if (matcher.find()) {
            String action = matcher.group(1);
            String path = matcher.group(2);
            String query = matcher.group(3);
            
            // Clean the reply by removing the action tag
            String cleanedReply = reply.replaceAll("\\[ACTION:[^\\]]+\\]", "").trim();
            result.put("reply", cleanedReply);
            result.put("actionExecuted", action);
            
            boolean success = false;
            switch (action) {
                case "OPEN_VSCODE":
                    if (path != null && !path.trim().isEmpty()) {
                        success = systemService.openInVsCode(path);
                    }
                    break;
                case "OPEN_TERMINAL":
                    String shell = (query != null && query.contains("powershell")) ? "powershell" : "cmd";
                    success = systemService.openTerminal(path, shell);
                    break;
                case "ORGANIZE_DESKTOP":
                    try {
                        Map<String, List<String>> report = systemService.organizeDesktop();
                        int count = report.get("Moved").size();
                        String details = "\n\n**Organized files on Desktop:**\n" + 
                                (count == 0 ? "- *Desktop was already clean!*" : String.join("\n", report.get("Moved").stream().map(s -> "* " + s).toList()));
                        result.put("reply", cleanedReply + details);
                        success = true;
                    } catch (Exception e) {
                        result.put("reply", cleanedReply + "\n\n*(Error organizing desktop: " + e.getMessage() + ")*");
                    }
                    break;
                case "SEARCH_WALLPAPERS":
                    result.put("wallpapers", wallpaperService.searchWallpapers(query));
                    success = true;
                    break;
                case "OPEN_APP":
                    if (query != null && !query.trim().isEmpty()) {
                        success = systemService.openApplication(query);
                    }
                    break;
                default:
                    System.err.println("Unknown LLM action: " + action);
            }
            result.put("success", success);
        } else {
            result.put("reply", reply);
            result.put("actionExecuted", "NONE");
        }
        
        return result;
    }
}
