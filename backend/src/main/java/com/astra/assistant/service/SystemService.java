package com.astra.assistant.service;

import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.*;

@Service
public class SystemService {

    /**
     * Open a folder in VS Code.
     */
    public boolean openInVsCode(String folderPath) {
        String path = resolveHomePath(folderPath);
        File folder = new File(path);
        if (!folder.exists() || !folder.isDirectory()) {
            throw new IllegalArgumentException("Folder path does not exist or is not a directory: " + path);
        }

        try {
            // Run "code <path>" securely
            ProcessBuilder pb = new ProcessBuilder("cmd.exe", "/c", "code", folder.getAbsolutePath());
            pb.start();
            return true;
        } catch (IOException e) {
            System.err.println("Failed to open VS Code: " + e.getMessage());
            return false;
        }
    }

    /**
     * Open a terminal (CMD or PowerShell) in the specified folder.
     */
    public boolean openTerminal(String folderPath, String shellType) {
        String rawPath = (folderPath == null || folderPath.trim().isEmpty()) ? System.getProperty("user.home") : folderPath;
        String path = resolveHomePath(rawPath);
        File folder = new File(path);
        if (!folder.exists() || !folder.isDirectory()) {
            folder = new File(System.getProperty("user.home"));
        }

        try {
            ProcessBuilder pb;
            if ("powershell".equalsIgnoreCase(shellType)) {
                // Open new PowerShell window in target directory
                pb = new ProcessBuilder("cmd.exe", "/c", "start", "powershell.exe", "-NoExit", "-Command", "Set-Location -Path '" + folder.getAbsolutePath() + "'");
            } else {
                // Open new CMD window in target directory
                pb = new ProcessBuilder("cmd.exe", "/c", "start", "cmd.exe", "/K", "cd /d " + folder.getAbsolutePath());
            }
            pb.start();
            return true;
        } catch (IOException e) {
            System.err.println("Failed to open terminal: " + e.getMessage());
            return false;
        }
    }

    /**
     * Organize the Windows Desktop by moving files into structured folders based on extensions.
     */
    public Map<String, List<String>> organizeDesktop() {
        String userHome = System.getProperty("user.home");
        Path desktopPath = Paths.get(userHome, "Desktop");
        
        if (!Files.exists(desktopPath)) {
            throw new IllegalStateException("Desktop directory not found: " + desktopPath);
        }

        File desktopDir = desktopPath.toFile();
        File[] files = desktopDir.listFiles();
        
        Map<String, List<String>> report = new HashMap<>();
        report.put("Moved", new ArrayList<>());
        report.put("Errors", new ArrayList<>());

        if (files == null) {
            return report;
        }

        // Define extension categories
        Map<String, String> categoryMapping = new HashMap<>();
        
        // Images
        setCategoryMapping(categoryMapping, "Images", "png", "jpg", "jpeg", "gif", "bmp", "tiff", "svg", "webp", "ico");
        // Documents
        setCategoryMapping(categoryMapping, "Documents", "pdf", "docx", "doc", "xlsx", "xls", "pptx", "ppt", "txt", "rtf", "csv", "md");
        // Archives
        setCategoryMapping(categoryMapping, "Archives", "zip", "rar", "7z", "tar", "gz", "bz2");
        // Installers
        setCategoryMapping(categoryMapping, "Installers", "exe", "msi");
        // Audio
        setCategoryMapping(categoryMapping, "Audio", "mp3", "wav", "flac", "m4a", "aac", "ogg");
        // Video
        setCategoryMapping(categoryMapping, "Video", "mp4", "mkv", "avi", "mov", "wmv", "flv");
        // Code
        setCategoryMapping(categoryMapping, "Code", "java", "py", "js", "ts", "html", "css", "cpp", "c", "cs", "go", "json", "sh", "bat", "ps1");

        for (File file : files) {
            // Do not move directories or hidden/system files
            if (file.isDirectory() || file.isHidden() || !file.canRead() || file.getName().startsWith(".")) {
                continue;
            }

            // Also ignore shortcut files like .lnk if you don't want to mess up desktop shortcuts
            String extension = getFileExtension(file.getName()).toLowerCase();
            if (extension.equals("lnk") || extension.equals("ini")) {
                continue;
            }

            String category = categoryMapping.getOrDefault(extension, "Others");
            File categoryFolder = new File(desktopDir, category);
            
            if (!categoryFolder.exists()) {
                categoryFolder.mkdirs();
            }

            File targetFile = new File(categoryFolder, file.getName());
            
            // If destination file already exists, append timestamp to prevent overwrite
            if (targetFile.exists()) {
                String baseName = getFileBaseName(file.getName());
                targetFile = new File(categoryFolder, baseName + "_" + System.currentTimeMillis() + "." + extension);
            }

            try {
                Files.move(file.toPath(), targetFile.toPath(), StandardCopyOption.REPLACE_EXISTING);
                report.get("Moved").add(file.getName() + " -> " + category + "/" + targetFile.getName());
            } catch (IOException e) {
                report.get("Errors").add("Failed to move " + file.getName() + ": " + e.getMessage());
            }
        }

        return report;
    }

    /**
     * Resolves shortcut strings like "~" or "Desktop" to full absolute paths.
     */
    private String resolveHomePath(String path) {
        if (path == null) {
            return System.getProperty("user.home");
        }
        if (path.startsWith("~")) {
            return System.getProperty("user.home") + path.substring(1);
        }
        return path;
    }

    private void setCategoryMapping(Map<String, String> map, String category, String... extensions) {
        for (String ext : extensions) {
            map.put(ext, category);
        }
    }

    private String getFileExtension(String fileName) {
        int lastIndexOf = fileName.lastIndexOf(".");
        if (lastIndexOf == -1) {
            return ""; // empty extension
        }
        return fileName.substring(lastIndexOf + 1);
    }

    private String getFileBaseName(String fileName) {
        int lastIndexOf = fileName.lastIndexOf(".");
        if (lastIndexOf == -1) {
            return fileName;
        }
        return fileName.substring(0, lastIndexOf);
    }

    /**
     * Launch any registered app, protocol, or website via Windows start resolver.
     */
    public boolean openApplication(String appName) {
        if (appName == null || appName.trim().isEmpty()) {
            return false;
        }

        // Clean input to block malicious characters while permitting standard letters, paths, websites, and protocols
        String cleanName = appName.replaceAll("[^a-zA-Z0-9.:/\\-_ ]", "").trim();
        if (cleanName.isEmpty()) {
            return false;
        }

        try {
            // Double quotes prevent parameter breaking if application path has spaces
            ProcessBuilder pb = new ProcessBuilder("cmd.exe", "/c", "start", "", cleanName);
            pb.start();
            return true;
        } catch (IOException e) {
            System.err.println("Failed to launch application '" + cleanName + "': " + e.getMessage());
            return false;
        }
    }
}
