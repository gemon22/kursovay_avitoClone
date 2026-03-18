const { getDb } = require('../db/init');

function getFavoriteIdsForUser(userId) {
  const rows = getDb().prepare('SELECT itemId FROM favorites WHERE userId = ?').all(userId);
  return rows.map((r) => r.itemId);
}

function getFavoriteCount(itemId) {
  const row = getDb().prepare('SELECT COUNT(*) as c FROM favorites WHERE itemId = ?').get(itemId);
  return row ? row.c : 0;
}

function isFavorite(userId, itemId) {
  const row = getDb().prepare('SELECT 1 FROM favorites WHERE userId = ? AND itemId = ?').get(userId, itemId);
  return !!row;
}

function addFavorite(userId, itemId) {
  const db = getDb();
  try {
    db.prepare('INSERT INTO favorites (userId, itemId) VALUES (?, ?)').run(userId, itemId);
    return true;
  } catch (e) {
    if (e.code === 'SQLITE_CONSTRAINT_PRIMARYKEY') return false;
    throw e;
  }
}

function removeFavorite(userId, itemId) {
  const info = getDb().prepare('DELETE FROM favorites WHERE userId = ? AND itemId = ?').run(userId, itemId);
  return info.changes > 0;
}

module.exports = {
  getFavoriteIdsForUser,
  getFavoriteCount,
  isFavorite,
  addFavorite,
  removeFavorite,
};
