const express = require('express');
const router = express.Router();

const { findUserByEmail, findUserById, createUser, updateUser, toPublicUser } = require('../data/usersStore');
const { hashPassword, comparePassword } = require('../utils/password');
const { signToken } = require('../utils/jwt');
const { authRequired } = require('../middleware/authMiddleware');

router.post('/register', async (req, res) => {
  const { name, email, phone, password } = req.body || {};
  const normalizedEmail = String(email || '').trim().toLowerCase();

  if (!normalizedEmail || !password) {
    return res.status(400).json({ message: 'Email и пароль обязательны' });
  }
  if (String(password).length < 8) {
    return res.status(400).json({ message: 'Пароль должен быть не менее 8 символов' });
  }

  if (findUserByEmail(normalizedEmail)) {
    return res.status(409).json({ message: 'Пользователь с таким email уже существует' });
  }

  try {
    const passwordHash = await hashPassword(password);
    const user = createUser({ name, email: normalizedEmail, phone, passwordHash });
    const token = signToken({ userId: user.id });

    return res.status(201).json({
      token,
      user: toPublicUser(user),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Ошибка регистрации' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  const normalizedEmail = String(email || '').trim().toLowerCase();

  if (!normalizedEmail || !password) {
    return res.status(400).json({ message: 'Email и пароль обязательны' });
  }
  if (String(password).length < 8) {
    return res.status(400).json({ message: 'Пароль должен быть не менее 8 символов' });
  }

  const user = findUserByEmail(normalizedEmail);
  if (!user) {
    return res.status(401).json({ message: 'Неверный email или пароль' });
  }

  const ok = await comparePassword(password, user.passwordHash);
  if (!ok) {
    return res.status(401).json({ message: 'Неверный email или пароль' });
  }

  const token = signToken({ userId: user.id });

  return res.json({
    token,
    user: toPublicUser(user),
  });
});

router.get('/me', authRequired, (req, res) => {
  const user = findUserById(req.user.id);
  if (!user) {
    return res.status(404).json({ message: 'Пользователь не найден' });
  }
  return res.json(toPublicUser(user));
});

router.put('/me', authRequired, (req, res) => {
  const user = findUserById(req.user.id);
  if (!user) {
    return res.status(404).json({ message: 'Пользователь не найден' });
  }
  const { name, phone, avatarUrl } = req.body || {};
  updateUser(user.id, { name, phone, avatarUrl });
  const updated = findUserById(user.id);
  return res.json(toPublicUser(updated));
});

module.exports = router;

