@echo off
chcp 65001 >nul
title Avito 2.0 — запуск сервера
cd /d "%~dp0"

echo.
echo [1/3] Установка зависимостей бэкенда...
call npm install
if errorlevel 1 (
  echo Ошибка: не удалось установить зависимости.
  pause
  exit /b 1
)

echo.
echo [2/3] Сборка фронтенда...
cd frontend
call npm install
if errorlevel 1 (
  echo Ошибка: не удалось установить зависимости фронтенда.
  cd ..
  pause
  exit /b 1
)
call npm run build
cd ..
if errorlevel 1 (
  echo Ошибка: не удалось собрать фронтенд.
  pause
  exit /b 1
)

echo.
echo [3/3] Запуск сервера...
echo.
echo Сайт будет доступен: http://localhost:5001
echo Остановка: Ctrl+C
echo.
node server.js

pause
