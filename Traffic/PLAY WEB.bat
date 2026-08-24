@echo off
title Mumbai Traffic Hero - Web
cd /d "%~dp0"
echo ============================================
echo   MUMBAI TRAFFIC HERO - Web version
echo   Open http://localhost:5173 in your browser
echo   Close this window to stop.
echo ============================================
start http://localhost:5173
call npm run dev
pause