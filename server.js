// Node.js + SQLite (sql.js). Инициализация БД — в start().
const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const { initDb } = require('./db/init');

const app = express();
// Порт 5001 при запуске через npm run dev, иначе 3000 (или PORT из окружения)
const PORT = process.env.PORT || (process.env.npm_lifecycle_event === 'dev' ? 5001 : 3000);

// Middleware
app.use(cors());
app.use(express.json());

const publicDir = path.resolve(__dirname, 'public');
const indexPath = path.join(publicDir, 'index.html');

// Лог только API-запросов (без спама от статики и SPA)
app.use((req, res, next) => {
  const isApi = (req.path || '').startsWith('/api');
  if (!isApi) return next();
  const start = Date.now();
  res.on('finish', () => {
    console.log(`API ${req.method} ${req.path} ${res.statusCode} ${Date.now() - start}ms`);
  });
  next();
});

// API — до статики, чтобы /api/items и т.д. не искались как файлы
const authRouter = require('./routes/auth');
const itemsRouter = require('./routes/items');
const favoritesRouter = require('./routes/favorites');
const chatsRouter = require('./routes/chats');
const callsRouter = require('./routes/calls');
const uploadRouter = require('./routes/upload');
app.use('/api/auth', authRouter);
app.use('/api/items', itemsRouter);
app.use('/api/favorites', favoritesRouter);
app.use('/api/chats', chatsRouter);
app.use('/api/calls', callsRouter);
app.use('/api/upload', uploadRouter);

app.use(express.static(publicDir));

// Favicon
app.get('/favicon.ico', (req, res) => res.status(204).end());

// SPA fallback: для не-API маршрутов отдаём index.html
app.use((req, res) => {
  const url = (req.originalUrl || req.url || '').split('?')[0];
  if (url.startsWith('/api')) {
    return res.status(404).json({ message: 'Ресурс не найден' });
  }
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('index.html не найден:', indexPath, err.message);
      res.status(500).send('Ошибка загрузки страницы.');
    }
  });
});

async function start() {
  await initDb();
  app.listen(PORT, () => {
    console.log('Сервер запущен на http://localhost:' + PORT);
    console.log('Фронтенд: public (Vue build)');
  });
}

start().catch((err) => {
  console.error('Ошибка запуска:', err);
  process.exit(1);
});