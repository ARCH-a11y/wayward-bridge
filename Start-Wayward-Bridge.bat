@echo off
title Wayward Bridge
cd /d "%~dp0"
where node >NUL 2>&1 || (echo Node.js is not installed. Get it from https://nodejs.org ^(version 18 or newer^). & pause & exit /b 1)
node wayward-bridge.js %*
pause
