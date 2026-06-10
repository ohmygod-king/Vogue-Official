'use strict';

const logger = require('../Utils/logger');

process.on('uncaughtException', (err) => {
  logger.error(`[Event:error] Uncaught Exception: ${err.message}`);
  logger.debug(err.stack);
});

process.on('unhandledRejection', (reason) => {
  logger.error(`[Event:error] Unhandled Rejection: ${String(reason)}`);
});

// ✅ Dummy event agar loader tidak throw
const { NewMessage } = require('telegram/events');

module.exports = {
  event:   new NewMessage({ outgoing: false, incoming: false }),
  handler: () => {},
};