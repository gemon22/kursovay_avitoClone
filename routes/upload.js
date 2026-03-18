const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { authRequired } = require('../middleware/authMiddleware');

/* Максимальное разрешение: фото приводится к размеру, подходящему для блока (карточка 176px, страница 340px). */
const MAX_WIDTH = 800;
const MAX_HEIGHT = 600;

const router = express.Router();
const uploadsDir = path.resolve(__dirname, '..', 'public', 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = (path.extname(file.originalname) || '').toLowerCase() || '.jpg';
    const safeExt = ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext) ? ext : '.jpg';
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + safeExt);
  },
});

/* Максимальный размер фото: 2 МБ */
const MAX_FILE_SIZE = 2 * 1024 * 1024;

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    const type = (file.mimetype || '').toLowerCase();
    if (type.startsWith('image/')) return cb(null, true);
    cb(new Error('Можно загружать только изображения (JPG, PNG, GIF, WebP)'));
  },
});

router.post('/', authRequired, upload.single('photo'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Выберите файл изображения' });
  }
  const filePath = path.join(uploadsDir, req.file.filename);
  const baseName = path.basename(req.file.filename, path.extname(req.file.filename));
  const outPath = path.join(uploadsDir, baseName + '.jpg');
  try {
    const pipeline = sharp(filePath)
      .resize(MAX_WIDTH, MAX_HEIGHT, { fit: 'inside', withoutEnlargement: true });
    await pipeline.jpeg({ quality: 85 }).toFile(outPath);
    if (outPath !== filePath) fs.unlinkSync(filePath);
  } catch (err) {
    try { fs.unlinkSync(filePath); } catch (_) {}
    try { if (fs.existsSync(outPath)) fs.unlinkSync(outPath); } catch (_) {}
    return res.status(400).json({ message: 'Не удалось обработать изображение' });
  }
  res.json({ url: '/uploads/' + baseName + '.jpg' });
});

router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'Файл слишком большой. Максимум 2 МБ.' });
  }
  res.status(400).json({ message: err.message || 'Ошибка загрузки' });
});

module.exports = router;
