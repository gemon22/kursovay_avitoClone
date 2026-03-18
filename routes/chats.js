const express = require('express');
const router = express.Router();

const { authRequired } = require('../middleware/authMiddleware');
const { getItemById } = require('../data/itemsStore');
const { findUserById } = require('../data/usersStore');
const {
  getUserChats,
  getChatById,
  findChatByParticipants,
  createChat,
  getMessagesByChat,
  createMessage,
} = require('../data/chatsStore');

router.use(authRequired);

router.get('/', (req, res) => {
  const chats = getUserChats(req.user.id);
  const normalized = chats.map((chat) => {
    const item = getItemById(chat.itemId);
    const isBuyer = chat.buyerId === req.user.id;
    const peerId = isBuyer ? chat.sellerId : chat.buyerId;
    const peer = findUserById(peerId);
    return {
      ...chat,
      itemTitle: item ? item.title : 'Удаленное объявление',
      peer: peer ? { id: peer.id, name: peer.name } : null,
    };
  });
  res.json(normalized);
});

router.post('/', (req, res) => {
  const itemId = Number.parseInt(req.body.itemId, 10);
  const firstMessage = String(req.body.message || '').trim();
  const item = getItemById(itemId);
  if (!item) {
    return res.status(404).json({ message: 'Объявление не найдено' });
  }
  if (item.ownerId === req.user.id) {
    return res.status(400).json({ message: 'Нельзя открыть чат по своему объявлению' });
  }

  let chat = findChatByParticipants(item.id, req.user.id, item.ownerId);
  if (!chat) {
    chat = createChat({
      itemId: item.id,
      buyerId: req.user.id,
      sellerId: item.ownerId,
    });
  }
  if (firstMessage) {
    createMessage({ chatId: chat.id, authorId: req.user.id, text: firstMessage });
  }

  return res.status(201).json(chat);
});

router.get('/:id/messages', (req, res) => {
  const chatId = Number.parseInt(req.params.id, 10);
  const chat = getChatById(chatId);
  if (!chat) {
    return res.status(404).json({ message: 'Чат не найден' });
  }
  if (chat.buyerId !== req.user.id && chat.sellerId !== req.user.id) {
    return res.status(403).json({ message: 'Нет доступа к этому чату' });
  }
  return res.json(getMessagesByChat(chatId));
});

router.post('/:id/messages', (req, res) => {
  const chatId = Number.parseInt(req.params.id, 10);
  const text = String(req.body.text || '').trim();
  if (!text) {
    return res.status(400).json({ message: 'Сообщение не должно быть пустым' });
  }

  const chat = getChatById(chatId);
  if (!chat) {
    return res.status(404).json({ message: 'Чат не найден' });
  }
  if (chat.buyerId !== req.user.id && chat.sellerId !== req.user.id) {
    return res.status(403).json({ message: 'Нет доступа к этому чату' });
  }

  const message = createMessage({ chatId, authorId: req.user.id, text });
  return res.status(201).json(message);
});

module.exports = router;

