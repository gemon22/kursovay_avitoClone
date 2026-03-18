@echo off
chcp 65001 >nul
title Avito 2.0 — режим разработки
cd /d "%~dp0"

echo.
echo Запуск сервера (nodemon, порт 5001)...
echo Сайт: http://localhost:5001
echo Остановка: Ctrl+C
echo.
npm run dev

pause
