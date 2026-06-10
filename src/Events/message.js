'use strict';

const { NewMessage } = require('telegram/events');
const logger         = require('../Utils/logger');

const handler = async (event) => {
  try {
    const message = event.message;
    if (!message) return;
    if (!message.senderId) return;

    logger.debug(
      `[Event:message] ` +
      `from=${message.senderId} ` +
      `chat=${message.chatId} ` +
      `text="${message.text?.slice(0, 50) ?? ''}"`
    );

  } catch (err) {
    logger.error(`[Event:message] Error: ${err.message}`);
    logger.debug(err.stack);
  }
};

module.exports = {
  event:   new NewMessage({}),
  handler,
};