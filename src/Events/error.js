'use strict';

const logger = require('../Utils/logger');

process.on('uncaughtException', (err) => {
  logger.error(`[Event:error] Uncaught Exception: ${err.message}`);
  logger.debug(err.stack);
});

process.on('unhandledRejection', (reason) => {
  logger.error(`[Event:error] Unhandled Rejection: ${String(reason)}`);
});


module.exports = {
  event:   null,
  handler: () => {},
  _selfManaged: true,
};