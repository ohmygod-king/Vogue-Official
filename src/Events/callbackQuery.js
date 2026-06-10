'use strict';

const { CallbackQuery } = require('telegram/events');
const logger            = require('../Utils/logger');

const handler = async (event) => {
  try {
    const data = event.data?.toString('utf-8');
    if (!data) return;

    logger.debug(
      `[Event:callbackQuery] ` +
      `from=${event.query.userId} ` +
      `data="${data}"`
    );

  } catch (err) {
    logger.error(`[Event:callbackQuery] Error: ${err.message}`);
    logger.debug(err.stack);
  }
};

module.exports = {
  event:   new CallbackQuery({}),
  handler,
};