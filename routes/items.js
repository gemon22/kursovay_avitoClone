const express = require('express');
const router = express.Router();

const {
  searchItems,
  getItemById,
  incrementViewCount,
  createItem,
  updateItem,
  deleteItem,
} = require('../data/itemsStore');
const { findUserById } = require('../data/usersStore');
const { getFavoriteCount, isFavorite } = require('../data/favoritesStore');
const { authRequired, optionalAuth } = require('../middleware/authMiddleware');
const { logCall } = require('../data/callsStore');

function withStats(item) {
  if (!item) return item;
  return {
    ...item,
    viewCount: item.viewCount ?? 0,
    favoriteCount: getFavoriteCount(item.id),
  };
}

// Получить все объявления
router.get('/', (req, res) => {
  const items = searchItems(req.query || {});
  const withStatsList = (Array.isArray(items) ? items : []).map((i) => withStats({ ...i, viewCount: i.viewCount ?? 0 }));
  res.json(withStatsList);
});

// Получить одно объявление по ID (увеличиваем счётчик просмотров)
router.get('/:id', optionalAuth, (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  const item = getItemById(id);
  if (!item) {
    return res.status(404).json({ message: 'Объявление не найдено' });
  }
  incrementViewCount(id);
  const itemWithViews = getItemById(id);
  const seller = findUserById(item.ownerId);
  const payload = {
    ...withStats(itemWithViews),
    seller: seller
      ? { id: seller.id, name: seller.name, phone: seller.phone }
      : null,
  };
  if (req.user) {
    payload.inFavorites = isFavorite(req.user.id, id);
  }
  res.json(payload);
});

// Создать новое объявление
router.post('/', authRequired, (req, res) => {
  const payload = req.body || {};
  if (!payload.title || !payload.price || !payload.category || !payload.location) {
    return res.status(400).json({ message: 'Заполните обязательные поля' });
  }

  const newItem = createItem({
    ...payload,
    ownerId: req.user.id,
  });
  res.status(201).json(withStats(newItem));
});

// Обновить объявление
router.put('/:id', authRequired, (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  const item = getItemById(id);
  if (!item) {
    return res.status(404).json({ message: 'Объявление не найдено' });
  }
  if (item.ownerId !== req.user.id) {
    return res.status(403).json({ message: 'Можно редактировать только свои объявления' });
  }

  const updated = updateItem(id, req.body || {});
  if (!updated) {
    return res.status(404).json({ message: 'Объявление не найдено' });
  }
  res.json(updated);
});

// Удалить объявление
router.delete('/:id', authRequired, (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  const item = getItemById(id);
  if (!item) {
    return res.status(404).json({ message: 'Объявление не найдено' });
  }
  if (item.ownerId !== req.user.id) {
    return res.status(403).json({ message: 'Можно удалять только свои объявления' });
  }

  const removed = deleteItem(id);
  if (!removed) {
    return res.status(404).json({ message: 'Объявление не найдено' });
  }
  res.status(204).end();
});

// Эмуляция звонка по объявлению
router.post('/:id/call', authRequired, (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  const item = getItemById(id);
  if (!item) {
    return res.status(404).json({ message: 'Объявление не найдено' });
  }

  const seller = findUserById(item.ownerId);
  const call = logCall({
    itemId: item.id,
    callerId: req.user.id,
    sellerId: item.ownerId,
  });

  res.status(201).json({
    call,
    phone: seller?.phone || 'Телефон не указан',
  });
});

module.exports = router;