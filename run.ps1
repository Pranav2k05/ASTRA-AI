# ASTRA Secure Launcher Script
Clear-Host

Write-Host '=======================================================' -ForegroundColor Cyan
Write-Host '                ASTRA AI LAPTOP ASSISTANT               ' -ForegroundColor Magenta
Write-Host '               Secure Local Assistant Suite            ' -ForegroundColor Cyan
Write-Host '=======================================================' -ForegroundColor Cyan
Write-Host ''

# Determine the project root folder safely
$ProjectRoot = $PSScriptRoot
if (-not $ProjectRoot) {
    $ProjectRoot = $pwd.Path
}

Write-Host ('[*] Project root resolved to: ' + $ProjectRoot) -ForegroundColor Gray

# 1. Check prerequisites
Write-Host '[*] Verifying system dependencies...' -ForegroundColor Yellow
$javaCheck = Get-Command java -ErrorAction SilentlyContinue
$nodeCheck = Get-Command node -ErrorAction SilentlyContinue
$mvnCheck = Get-Command mvn -ErrorAction SilentlyContinue

if (-not $javaCheck) {
    Write-Host '[!] Java SDK is missing. ASTRA backend requires Java (JDK 21+).' -ForegroundColor Red
    Exit 1
}
if (-not $nodeCheck) {
    Write-Host '[!] Node.js is missing. ASTRA frontend build requires Node.' -ForegroundColor Red
    Exit 1
}
if (-not $mvnCheck) {
    Write-Host '[!] Apache Maven is missing. ASTRA backend requires Maven build tool.' -ForegroundColor Red
    Exit 1
}
Write-Host '[✓] Core systems checked successfully.' -ForegroundColor Green

# 2. Setup Frontend
Write-Host ''
Write-Host '[*] Auditing User Interface - Frontend...' -ForegroundColor Yellow
$FrontendDir = Join-Path $ProjectRoot 'frontend'

if (-not (Test-Path $FrontendDir)) {
    Write-Host ('[!] Frontend directory not found at: ' + $FrontendDir) -ForegroundColor Red
    Exit 1
}

Set-Location $FrontendDir
Write-Host ('[*] Switched directory to: ' + $FrontendDir) -ForegroundColor Gray

if (-not (Test-Path 'node_modules')) {
    Write-Host '[*] First time run: Installing frontend dependencies (npm install)...' -ForegroundColor Cyan
    npm install
}

Write-Host '[*] Bundling frontend views (npm run build)...' -ForegroundColor Cyan
npm run build

# 3. Start Backend
Write-Host ''
Write-Host '[*] Triggering ASTRA Engine - Java Server...' -ForegroundColor Yellow
$BackendDir = Join-Path $ProjectRoot 'backend'

if (-not (Test-Path $BackendDir)) {
    Write-Host ('[!] Backend directory not found at: ' + $BackendDir) -ForegroundColor Red
    Exit 1
}

Set-Location $BackendDir
Write-Host ('[*] Switched directory to: ' + $BackendDir) -ForegroundColor Gray

# Trigger a background job to wait 6 seconds and open browser
Start-Job -ScriptBlock {
    Start-Sleep -Seconds 6
    try {
        Start-Process "chrome.exe" "http://localhost:8080" -ErrorAction Stop
    } catch {
        Start-Process "http://localhost:8080"
    }
} | Out-Null

Write-Host '[✓] ASTRA server launching. Browser will open at http://localhost:8080.' -ForegroundColor Green
Write-Host '    Keep this terminal window open. Press CTRL+C to terminate ASTRA.' -ForegroundColor Gray
Write-Host ''

mvn spring-boot:run
