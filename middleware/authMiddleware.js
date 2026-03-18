const { verifyToken } = require('../utils/jwt');
const { findUserById } = require('../data/usersStore');

function authRequired(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Требуется авторизация' });
  }

  const payload = verifyToken(token);
  if (!payload || !payload.userId) {
    return res.status(401).json({ message: 'Неверный или просроченный токен' });
  }

  const user = findUserById(payload.userId);
  if (!user) {
    return res.status(401).json({ message: 'Пользователь не найден' });
  }

  req.user = {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    role: user.role,
  };

  return next();
}

function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return next();
  }
  const payload = verifyToken(token);
  if (!payload || !payload.userId) return next();
  const user = findUserById(payload.userId);
  if (!user) return next();
  req.user = { id: user.id, email: user.email, name: user.name, phone: user.phone, role: user.role };
  next();
}

module.exports = {
  authRequired,
  optionalAuth,
};

