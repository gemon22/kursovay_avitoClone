const { getDb } = require('../db/init');

function getAllUsers() {
  return getDb().prepare('SELECT * FROM users').all();
}

function findUserByEmail(email) {
  return getDb().prepare('SELECT * FROM users WHERE email = ?').get(email) || null;
}

function findUserById(id) {
  return getDb().prepare('SELECT * FROM users WHERE id = ?').get(id) || null;
}

function createUser(data) {
  const now = new Date().toISOString();
  const db = getDb();
  const stmt = db.prepare(
    `INSERT INTO users (name, email, phone, passwordHash, avatarUrl, role, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );
  const info = stmt.run(
    (data.name || '').trim(),
    data.email,
    data.phone || '',
    data.passwordHash,
    data.avatarUrl || '',
    data.role || 'user',
    now
  );
  return findUserById(info.lastInsertRowid);
}

function updateUser(id, data) {
  const db = getDb();
  const user = findUserById(id);
  if (!user) return null;
  const name = data.name !== undefined ? String(data.name).trim() : user.name;
  const phone = data.phone !== undefined ? String(data.phone).trim() : user.phone;
  const avatarUrl = data.avatarUrl !== undefined ? String(data.avatarUrl).trim() : user.avatarUrl;
  db.prepare('UPDATE users SET name = ?, phone = ?, avatarUrl = ? WHERE id = ?').run(name, phone, avatarUrl, id);
  return findUserById(id);
}

function toPublicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    avatarUrl: user.avatarUrl || '',
    role: user.role,
    createdAt: user.createdAt,
  };
}

module.exports = {
  getAllUsers,
  findUserByEmail,
  findUserById,
  createUser,
  updateUser,
  toPublicUser,
};
