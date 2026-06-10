
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const formatDuration = (ms) => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours   = Math.floor(minutes / 60);
  const days    = Math.floor(hours / 24);

  if (days > 0)    return `${days}d ${hours % 24}h ${minutes % 60}m`;
  if (hours > 0)   return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
};

const truncate = (text, maxLength = 100) => {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3)}...`;
};

const escapeMarkdown = (text) => {
  return String(text).replace(/[_*[\]()~`>#+=|{}.!\\-]/g, '\\$&');
};