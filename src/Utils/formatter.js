const makeHeader = (title) => {
  return `**≡ ${title.toUpperCase()} ≡**\n${'─'.repeat(28)}`;
};
const makeField = (key, value) => `› **${key}:** ${value}`;
const makeError = (message) => `**✗ Error:** ${message}`;
const makeSuccess = (message) => `**✓** ${message}`;
const formatBytes = (bytes) => {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unit = 0;

  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit++;
  }

  return `${size.toFixed(2)} ${units[unit]}`;
};

module.exports = {
  makeHeader,
  makeField,
  makeError,
  makeSuccess,
  formatBytes,
};