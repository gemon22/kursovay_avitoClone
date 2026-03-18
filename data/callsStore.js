const { getDb } = require('../db/init');

function logCall({ itemId, callerId, sellerId }) {
  const db = getDb();
  const now = new Date().toISOString();
  const info = db
    .prepare('INSERT INTO calls (itemId, callerId, sellerId, createdAt) VALUES (?, ?, ?, ?)')
    .run(itemId, callerId, sellerId, now);
  const row = db.prepare('SELECT * FROM calls WHERE id = ?').get(info.lastInsertRowid);
  return row;
}

function getUserCalls(userId) {
  return getDb()
    .prepare('SELECT * FROM calls WHERE callerId = ? OR sellerId = ? ORDER BY createdAt DESC')
    .all(userId, userId);
}

module.exports = {
  logCall,
  getUserCalls,
};
