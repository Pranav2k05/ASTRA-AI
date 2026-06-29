# 🌌 ASTRA: Secure Local AI Laptop Assistant

```
    ▲   ███████╗████████╗██████╗  █████╗ 
   / \  ██╔════╝╚══██╔══╝██╔══██╗██╔══██╗
  /   \ ███████╗   ██║   ██████╔╝███████║
 /     \╚════██║   ██║   ██╔══██╗██╔══██║
/_______\███████║  ██║   ██║  ██║██║  ██║
        ╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝
```

**ASTRA** is a local, private AI assistant for your Windows laptop. It lets you control your computer using plain English (like opening folders in VS Code, launching terminals, sorting your messy desktop files, or setting high-res wallpapers). Since it runs entirely on your local machine, it keeps your system secure and your data completely private.

It combines a **Java (Spring Boot 3)** backend control engine with a clean, glassmorphic **React + TypeScript** web interface.

---

## 🛠️ Tech Stack
*   **Backend**: Java 21+, Spring Boot 3.4, Apache Maven
*   **Frontend**: React 18, Vite 5, TypeScript, Lucide Icons, Custom CSS
*   **AI Integration**: Google Gemini 2.5 API (over secure HTTPS) with a local regex fallback parser for offline command execution.
*   **System Controls**: Windows Command Prompt, PowerShell, and Java `ProcessBuilder` (for running OS tasks safely).

---

## 🛡️ Security: How ASTRA Keeps Your Laptop Safe
Security isn't an afterthought here—ASTRA is built from the ground up to be safe:

1. **Local Loopback Only (`127.0.0.1`)**  
   The backend server binds strictly to `127.0.0.1`. This means all network ports are closed to your local Wi-Fi, local area network, or the internet. No outside computer can ever connect to or query ASTRA.
2. **Cryptographic Handshake (`X-ASTRA-Token`)**  
   Every time ASTRA starts up, it generates a fresh, secure random 32-character session token. The backend dynamically injects this token into the browser DOM. Every single system API request (`/api/**`) must include this token in the `X-ASTRA-Token` HTTP header. This prevents Cross-Origin Request Forgery (CSRF) or malicious scripts running on other browser tabs from executing commands on your computer.
3. **Safe Process Execution**  
   To prevent command injection (like malicious inputs trying to run `rm -rf` or `format C:`), ASTRA never runs raw user text directly in command shells. Instead, it parses, validates files/folders to make sure they exist, and runs them using isolated arguments inside Java's `ProcessBuilder`.

### 📊 How It Works
When you start ASTRA, the backend generates a random session token and injects it into the frontend page. When you type a request (like opening a folder or searching), the frontend includes this token in its API request. The backend validates the token, determines if the command matches a local offline rule (like launching VS Code), or passes the prompt to Google Gemini. Gemini responds with the text reply and any necessary action tags (like `[ACTION:PLAY_YOUTUBE]`). The backend then executes the requested action securely using native Windows APIs or `ProcessBuilder` before sending the final status back to your browser.

---

## 🚀 Getting Started

### 📋 Prerequisites
Make sure you have these installed on your Windows machine:
*   **Java Development Kit (JDK)**: Version 21 or newer
*   **Node.js & npm**: For building the frontend
*   **Apache Maven**: For compiling the backend

### 📥 Setup
Clone this repository locally:
```bash
git clone https://github.com/Pranav2k05/ASTRA-AI.git
cd ASTRA-AI
```

### ⚡ Run It (One-Click)
1. Double-click the **`run.bat`** file in your project directory.
2. The script will automatically:
   * Install frontend dependencies and build the static assets.
   * Move the built assets to the backend.
   * Compile and start the Spring Boot server.
   * Launch Google Chrome pointing to [http://localhost:8080](http://localhost:8080) (or fallback to your default browser).
3. Keep the command prompt window open. When you are done, press `CTRL + C` in that window to shut it down.

---

## 💡 Prompt Examples
Once you're in the chat interface, try typing things like:

*   **Play Music on YouTube (Autoplay)**:
    *   `play chill lofi beats`
    *   `play some music on youtube`
*   **Search Google**:
    *   `google how to write a binary search in Java`
    *   `search google for latest web dev trends`
*   **Open Projects in VS Code**:
    *   `open vscode C:\Users\User\Desktop\ProjectClge\ASTRA`
*   **Open Terminals**:
    *   `open terminal` (opens CMD in your user directory)
    *   `open powershell C:\Users\User\Documents`
*   **Clean Up Your Desktop**:
    *   `organize desktop` (moves stray files on your desktop into categorized folders like Images, Documents, Archives, Audio, etc.)
*   **Find & Set Wallpapers**:
    *   `search wallpapers dark cyberpunk`
    *   *(You can preview results in the UI and click to set your desktop background instantly!)*

---

## 📁 Project Layout
```
ASTRA/
│
├── run.bat                     # Double-click to start
├── run.ps1                     # PowerShell build & launch script
├── README.md                   # This file
│
├── backend/                    # Spring Boot Application
│   ├── pom.xml                 # Maven dependencies
│   └── src/main/
│       ├── java/com/astra/assistant/
│       │   ├── AstraApplication.java
│       │   ├── config/         # Security configs and interceptors
│       │   ├── controller/     # API and page view controllers
│       │   └── service/        # Core logic: LLM, system, wallpapers
│       └── resources/
│           ├── application.properties
│           └── static/         # Location of built frontend assets
│
└── frontend/                   # React Web App
    ├── package.json
    ├── vite.config.ts          # Compiles and outputs static files to backend
    ├── index.html
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── index.css           # 3D Glassmorphism styling
        └── components/         # Chat, settings, and UI components
```

---

## 🔒 Where is data stored?
All local settings and downloaded wallpapers are cached on your hard drive under:
*   `C:\Users\<Your-Username>\.astra\`
    *   `config.json`: Stores your Gemini API key locally (never shared or uploaded).
    *   `wallpapers\`: Caches background images downloaded from Unsplash.
