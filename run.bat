@echo off
title ASTRA Bootloader
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0run.ps1"
pause
