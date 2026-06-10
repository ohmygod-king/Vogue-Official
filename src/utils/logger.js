// src/utils/logger.js
const winston = require('winston');
const chalk   = require('chalk');
const settings = require('../settings');

const { combine, timestamp, printf } = winston.format;

// Warna per log level
const colorLevel = (level) => {
  const map = {
    error: chalk.bold.red,
    warn:  chalk.bold.yellow,
    info:  chalk.bold.cyan,
    debug: chalk.bold.gray,
  };
  const fn = map[level] || chalk.white;
  return fn(level.toUpperCase().padEnd(5));
};

const devFormat = combine(
  timestamp({ format: 'HH:mm:ss' }),
  printf(({ level, message, timestamp, ...meta }) => {
    const metaStr = Object.keys(meta).length
      ? chalk.gray(` » ${JSON.stringify(meta)}`)
      : '';
    return `${chalk.gray(timestamp)} ${colorLevel(level)} ${message}${metaStr}`;
  })
);

const prodFormat = combine(
  timestamp(),
  winston.format.json()
);

const logger = winston.createLogger({
  level: settings.logLevel,
  transports: [
    new winston.transports.Console({
      format: devFormat,
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5 * 1024 * 1024,
      maxFiles: 3,
      format: prodFormat,
    }),
    new winston.transports.File({
      filename: 'logs/app.log',
      maxsize: 10 * 1024 * 1024,
      maxFiles: 5,
      format: prodFormat,
    }),
  ],
});

module.exports = { logger };