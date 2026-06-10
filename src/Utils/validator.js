
const settings   = require('../Settings');
const { getSenderId } = require('./helpers');

const isOwner = (message) => {
  const id = getSenderId(message);
  if (id === null) return false;
  return settings.ownerIds.includes(id);
};

const hasMinArgs = (args, min) => Array.isArray(args) && args.length >= min;

const isValidUrl = (str) => {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
};

module.exports = {
  isOwner,
  hasMinArgs,
  isValidUrl,
};