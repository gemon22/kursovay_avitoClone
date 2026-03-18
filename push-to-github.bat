@echo off
chcp 65001 >nul
title Отправка проекта на GitHub
cd /d "%~dp0"

echo.
echo Проверка Git...
git status >nul 2>&1
if errorlevel 1 (
  echo Инициализация репозитория...
  git init
)

echo.
echo Подключение удалённого репозитория...
git remote remove origin 2>nul
git remote add origin https://github.com/gemon22/kursovay_avitoClone.git

echo.
echo Добавление файлов (node_modules и data/avito.db в .gitignore)...
git add .
git status

echo.
echo Создание коммита...
git commit -m "Avito 2.0: Node.js + SQLite (sql.js) + Vue 3" 2>nul || git commit -m "Update project"

echo.
echo Отправка на GitHub (ветка main)...
git branch -M main
git push -u origin main

echo.
if errorlevel 1 (
  echo Если запросили логин/пароль: на GitHub используйте Personal Access Token вместо пароля.
  echo Или настройте SSH. Репозиторий: https://github.com/gemon22/kursovay_avitoClone
) else (
  echo Готово. Репозиторий: https://github.com/gemon22/kursovay_avitoClone
)
echo.
pause
