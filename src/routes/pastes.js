const express = require('express');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const redis = require('../redis');
const { nowMs } = require('../utils/time');

const router = express.Router();


//  POST /api/pastes
 
router.post(
  '/pastes',
  body('content').isString().notEmpty(),
  body('ttl_seconds').optional().isInt({ min: 1 }),
  body('max_views').optional().isInt({ min: 1 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid input' });
    }

    const { content, ttl_seconds, max_views } = req.body;
    const id = uuidv4();

    const createdAt = nowMs(req);
    const expiresAt = ttl_seconds ? createdAt + ttl_seconds * 1000 : null;

    await redis.hmset(`paste:${id}`, {
      content,
      created_at: createdAt,
      expires_at: expiresAt ?? '',
      max_views: max_views ?? '',
      views: 0
    });

    res.status(201).json({
      id,
      url: `${req.protocol}://${req.get('host')}/p/${id}`
    });
  }
);


//  GET /api/pastes/:id
 
router.get('/pastes/:id', async (req, res) => {
  const key = `paste:${req.params.id}`;
  const data = await redis.hgetall(key);

  // Missing paste
  if (!data || !data.content) {
    return res.status(404).json({ error: 'Not found' });
  }

  const now = nowMs(req);
  const expiresAt = data.expires_at ? Number(data.expires_at) : null;
  const maxViews = data.max_views ? Number(data.max_views) : null;
  const views = Number(data.views);

  // Expired or view limit exceeded
  if ((expiresAt && now > expiresAt) || (maxViews && views >= maxViews)) {
    return res.status(404).json({ error: 'Not found' });
  }

  // Increment view count
  await redis.hincrby(key, 'views', 1);

  res.status(200).json({
    content: data.content,
    remaining_views: maxViews ? maxViews - views - 1 : null,
    expires_at: expiresAt ? new Date(expiresAt).toISOString() : null
  });
});

//  GET /p/:id (HTML view)
router.get('/p/:id', async (req, res) => {
  const key = `paste:${req.params.id}`;
  const data = await redis.hgetall(key);

  if (!data || !data.content) {
    return res.sendStatus(404);
  }

  const now = nowMs(req);
  const expiresAt = data.expires_at ? Number(data.expires_at) : null;
  const maxViews = data.max_views ? Number(data.max_views) : null;
  const views = Number(data.views);

  if ((expiresAt && now > expiresAt) || (maxViews && views >= maxViews)) {
    return res.sendStatus(404);
  }

  await redis.hincrby(key, 'views', 1);

  res.render('paste', {
    content: data.content
  });
});

module.exports = router;
