'use strict';

const pino     = require('pino');
const settings = require('../Settings');

const logger = pino({
  level: settings.isDev ? 'debug' : 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize:      true,
      translateTime: 'SYS:HH:MM:ss',
      ignore:        'pid,hostname',
    },
  },
});

module.exports = logger;