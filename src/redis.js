const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL, {
  tls: {}, // REQUIRED for Upstash
});

redis.on('connect', () => {
  console.log('✅ Redis connected');
});

redis.on('ready', () => {
  console.log('🟢 Redis ready');
});

redis.on('error', (err) => {
  console.error('❌ Redis error:', err.message);
});

module.exports = redis;
