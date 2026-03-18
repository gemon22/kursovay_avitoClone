# Avito 2.0 — курсовой проект

Веб-сервис объявлений (клон Avito): Node.js + SQLite (sql.js) + Vue 3.

## Запуск

1. Установить зависимости и собрать фронтенд:
   ```
   npm install
   cd frontend && npm install && npm run build && cd ..
   ```
2. Запустить сервер:
   ```
   node server.js
   ```
   Или использовать **start.bat** (Windows) — он сделает всё автоматически.

Сайт: **http://localhost:5001** (при `npm run dev` порт 5001, иначе смотрите вывод в консоли).

## Стек

- **Backend:** Node.js, Express, SQLite (sql.js), JWT, bcrypt, multer, sharp
- **Frontend:** Vue 3, Vue Router, Vite
- **БД:** SQLite, файл `data/avito.db` (создаётся при первом запуске)

## Структура

- `server.js` — точка входа
- `routes/` — API (auth, items, favorites, chats, calls, upload)
- `data/` — хранилища (работа с SQLite через db/init.js)
- `db/init.js` — инициализация БД, схема, сиды
- `frontend/` — исходники Vue (сборка → `public/`)
- `public/` — статика и собранный SPA
