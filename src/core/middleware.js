'use strict';

const config = require('../Settings');
const logger = require('../Utils/logger');
const _rateLimitStore = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [key, record] of _rateLimitStore) {
    if (now - record.windowStart > 60_000) {
      _rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

const authMiddleware = (ctx) => {
  if (!config.ownerId) {
    logger.warn('[Auth] ownerId tidak di-set di Settings — semua user bisa akses');
    return true;
  }

  if (ctx.senderId !== config.ownerId) {
    logger.warn(`[Auth] Blocked: userId=${ctx.senderId} mencoba eksekusi .${ctx.commandName}`);
    return false;
  }

  return true;
};

const rateLimitMiddleware = (ctx) => {
  const LIMIT     = 5;
  const WINDOW_MS = 10_000;

  const key    = String(ctx.senderId);
  const now    = Date.now();
  const record = _rateLimitStore.get(key);

  if (!record || now - record.windowStart > WINDOW_MS) {
    _rateLimitStore.set(key, { count: 1, windowStart: now });
    return true;
  }

  if (record.count >= LIMIT) {
    logger.warn(`[RateLimit] userId=${key} hit limit (${LIMIT} cmd/${WINDOW_MS}ms)`);
    return false;
  }

  record.count++;
  return true;
};


const loggingMiddleware = (ctx) => {
  logger.info(
    `[CMD] user=${ctx.senderId} ` +
    `cmd=${ctx.commandName} ` +
    `args=${JSON.stringify(ctx.args)} ` +
    `chat=${ctx.chatId}`
  );
  return true;
};

const composeMiddleware = (middlewares) => {
  if (!Array.isArray(middlewares) || middlewares.length === 0) {
    throw new Error('[Middleware] composeMiddleware butuh minimal satu middleware');
  }

  return (ctx) => {
    for (const mw of middlewares) {
      const passed = mw(ctx);
      if (!passed) return false;
    }
    return true;
  };
};

const defaultChain = composeMiddleware([
  loggingMiddleware,
  authMiddleware,
  rateLimitMiddleware,
]);

module.exports = {
  defaultChain,
  authMiddleware,
  rateLimitMiddleware,
  loggingMiddleware,
  composeMiddleware,
};