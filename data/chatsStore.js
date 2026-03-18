const { getDb } = require('../db/init');

function getUserChats(userId) {
  const rows = getDb()
    .prepare(
      'SELECT * FROM chats WHERE buyerId = ? OR sellerId = ? ORDER BY COALESCE(lastMessageAt, createdAt) DESC'
    )
    .all(userId, userId);
  return rows;
}

function getChatById(chatId) {
  return getDb().prepare('SELECT * FROM chats WHERE id = ?').get(chatId) || null;
}

function findChatByParticipants(itemId, buyerId, sellerId) {
  return (
    getDb()
      .prepare('SELECT * FROM chats WHERE itemId = ? AND buyerId = ? AND sellerId = ?')
      .get(itemId, buyerId, sellerId) || null
  );
}

function createChat(data) {
  const db = getDb();
  const now = new Date().toISOString();
  const info = db
    .prepare(
      'INSERT INTO chats (itemId, buyerId, sellerId, createdAt, lastMessageAt) VALUES (?, ?, ?, ?, NULL)'
    )
    .run(data.itemId, data.buyerId, data.sellerId, now);
  return getChatById(info.lastInsertRowid);
}

function getMessagesByChat(chatId) {
  return getDb()
    .prepare('SELECT * FROM messages WHERE chatId = ? ORDER BY createdAt ASC')
    .all(chatId);
}

function createMessage(data) {
  const db = getDb();
  const now = new Date().toISOString();
  const info = db
    .prepare('INSERT INTO messages (chatId, authorId, text, createdAt, isRead) VALUES (?, ?, ?, ?, 0)')
    .run(data.chatId, data.authorId, data.text, now);
  db.prepare('UPDATE chats SET lastMessageAt = ? WHERE id = ?').run(now, data.chatId);
  const row = db.prepare('SELECT * FROM messages WHERE id = ?').get(info.lastInsertRowid);
  return row ? { ...row, isRead: !!row.isRead } : null;
}

module.exports = {
  getUserChats,
  getChatById,
  findChatByParticipants,
  createChat,
  getMessagesByChat,
  createMessage,
};
