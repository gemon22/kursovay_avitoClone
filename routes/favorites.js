const express = require('express');
const router = express.Router();
const { authRequired } = require('../middleware/authMiddleware');
const { getFavoriteIdsForUser, addFavorite, removeFavorite, isFavorite, getFavoriteCount } = require('../data/favoritesStore');
const { getItemById } = require('../data/itemsStore');

// Все маршруты требуют авторизации
router.use(authRequired);

// Список избранных объявлений (полные объекты)
router.get('/', (req, res) => {
  const ids = getFavoriteIdsForUser(req.user.id);
  const items = ids
    .map((id) => getItemById(id))
    .filter(Boolean)
    .map((i) => ({ ...i, viewCount: i.viewCount ?? 0, favoriteCount: getFavoriteCount(i.id) }));
  res.json(items);
});

// Добавить в избранное
router.post('/:itemId', (req, res) => {
  const itemId = Number.parseInt(req.params.itemId, 10);
  const item = getItemById(itemId);
  if (!item) {
    return res.status(404).json({ message: 'Объявление не найдено' });
  }
  addFavorite(req.user.id, itemId);
  res.json({ added: true, inFavorites: true });
});

// Удалить из избранного
router.delete('/:itemId', (req, res) => {
  const itemId = Number.parseInt(req.params.itemId, 10);
  removeFavorite(req.user.id, itemId);
  res.json({ removed: true, inFavorites: false });
});

// Проверить, в избранном ли объявление
router.get('/check/:itemId', (req, res) => {
  const itemId = Number.parseInt(req.params.itemId, 10);
  res.json({ inFavorites: isFavorite(req.user.id, itemId) });
});

module.exports = router;
