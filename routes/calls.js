const express = require('express');
const router = express.Router();

const { authRequired } = require('../middleware/authMiddleware');
const { getUserCalls } = require('../data/callsStore');

router.use(authRequired);

router.get('/', (req, res) => {
  res.json(getUserCalls(req.user.id));
});

module.exports = router;

