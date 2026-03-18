const { getDb } = require('../db/init');

function normalizeImageUrl(image) {
  const raw = String(image || '').trim();
  if (!raw) return '/img/no-image.svg';
  if (raw.startsWith('/')) return raw;
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  return `https://${raw}`;
}

function searchItems(filters = {}) {
  const {
    q = '',
    category = '',
    location = '',
    priceFrom = '',
    priceTo = '',
    ownerId = '',
    status = 'active',
  } = filters;

  const qLower = String(q).trim().toLowerCase();
  const qWords = qLower.split(/\s+/).filter(Boolean);
  const categoryLower = String(category).trim().toLowerCase();
  const locationLower = String(location).trim().toLowerCase();
  const from = Number.isFinite(Number(priceFrom)) && priceFrom !== '' ? Number(priceFrom) : null;
  const to = Number.isFinite(Number(priceTo)) && priceTo !== '' ? Number(priceTo) : null;
  const owner = ownerId === '' ? null : Number(ownerId);

  const db = getDb();
  let sql = 'SELECT * FROM items WHERE 1=1';
  const params = [];

  if (status && status !== 'all') {
    sql += ' AND status = ?';
    params.push(status);
  }
  if (categoryLower) {
    sql += ' AND LOWER(category) LIKE ?';
    params.push('%' + categoryLower + '%');
  }
  if (locationLower) {
    sql += ' AND LOWER(location) LIKE ?';
    params.push('%' + locationLower + '%');
  }
  if (from !== null) {
    sql += ' AND price >= ?';
    params.push(from);
  }
  if (to !== null) {
    sql += ' AND price <= ?';
    params.push(to);
  }
  if (owner !== null) {
    sql += ' AND ownerId = ?';
    params.push(owner);
  }

  sql += ' ORDER BY createdAt DESC';
  let rows = db.prepare(sql).all(...params);

  if (qWords.length) {
    rows = rows.filter((item) => {
      const hay = `${item.title} ${item.description}`.toLowerCase();
      return qWords.every((word) => hay.includes(word));
    });
  }

  return rows;
}

function getItemById(id) {
  const row = getDb().prepare('SELECT * FROM items WHERE id = ?').get(id);
  if (!row) return null;
  return { ...row, viewCount: row.viewCount ?? 0 };
}

function incrementViewCount(id) {
  getDb().prepare('UPDATE items SET viewCount = COALESCE(viewCount, 0) + 1 WHERE id = ?').run(id);
}

function createItem(data) {
  const db = getDb();
  const now = new Date().toISOString();
  const image = normalizeImageUrl(data.image);
  const stmt = db.prepare(
    `INSERT INTO items (title, price, category, location, image, description, ownerId, status, viewCount, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'active', 0, ?)`
  );
  const info = stmt.run(
    data.title || 'Без названия',
    Number(data.price) || 0,
    data.category || 'Другое',
    data.location || 'Не указан',
    image,
    data.description || '',
    data.ownerId,
    now
  );
  return getItemById(info.lastInsertRowid);
}

function updateItem(id, data) {
  const db = getDb();
  const current = getItemById(id);
  if (!current) return null;
  const image = normalizeImageUrl(data.image !== undefined ? data.image : current.image);
  db.prepare(
    `UPDATE items SET title = ?, price = ?, category = ?, location = ?, image = ?, description = ?, status = ?
     WHERE id = ?`
  ).run(
    data.title !== undefined ? data.title : current.title,
    data.price !== undefined ? Number(data.price) : current.price,
    data.category !== undefined ? data.category : current.category,
    data.location !== undefined ? data.location : current.location,
    image,
    data.description !== undefined ? data.description : current.description,
    data.status !== undefined ? data.status : current.status,
    id
  );
  return getItemById(id);
}

function deleteItem(id) {
  const db = getDb();
  const info = db.prepare('DELETE FROM items WHERE id = ?').run(id);
  return info.changes > 0;
}

module.exports = {
  searchItems,
  getItemById,
  incrementViewCount,
  createItem,
  updateItem,
  deleteItem,
};
