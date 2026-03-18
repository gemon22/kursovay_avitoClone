# Avito 2.0 — курсовой проект

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
