'use strict';
module.exports = {
  name:        'ping',
  description: 'Cek apakah userbot aktif dan ukur response time',
  category:    'Utils',
  aliases:     ['p', 'test'],

  execute: async (ctx) => {
    const start = Date.now();
    await ctx.message.edit({ text: '`Pinging...`' });
    const latency = Date.now() - start;
    await ctx.message.edit({
      text:        ` *Pong!*\n⚡ Latency: \`${latency}ms\``,
      parseMode:   'markdown',
    });
  },
};