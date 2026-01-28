const express = require('express');
const redis = require('../redis');

const router = express.Router();

router.get('/healthz', async (req, res) => {
  try {
    await redis.ping();
    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false });
  }
});

module.exports = router;
