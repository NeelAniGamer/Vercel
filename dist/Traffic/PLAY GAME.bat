@echo off
title Mumbai Traffic Hero
cd /d "%~dp0"
echo ============================================
echo   MUMBAI TRAFFIC HERO - Starting...
echo   (First launch takes ~15 seconds)
echo   Close this window to quit the game.
echo ============================================
call npm run electron:dev
pause