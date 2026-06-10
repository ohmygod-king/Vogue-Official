'use strict';

module.exports = {
  name:    'ping',
  aliases: ['p'],
  category: 'Utils',
  description: 'Cek response time',

  execute: async ({ message }) => {
    const start = Date.now();
    await message.edit({ text: 'Pinging...' });
    const latency = Date.now() - start;
    await message.edit({
      text:      `🏓 **Pong!** \`${latency}ms\``,
      parseMode: 'md',
    });
  },
};