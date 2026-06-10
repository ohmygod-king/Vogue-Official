'use strict';

const { Api } = require('telegram');

module.exports = {
  name: 'help',
  description: 'Tampilkan semua commands',
  category: 'Utils',
  aliases: ['h', 'menu'],
  
  execute: async ({ client, message, registry }) => {
    const allCmds = registry.getAllCommands();
    const categories = [...new Set(allCmds.map((c) => c.category))].sort();
    
    const buttons = categories.map((cat) => ([
      new Api.KeyboardButtonCallback({
        text: `📂 ${cat}`,
        data: Buffer.from(`help:${cat}`),
      }),
    ]));
    
    buttons.push([
      new Api.KeyboardButtonCallback({
        text: '✖ Close',
        data: Buffer.from('help:close'),
      }),
    ]);
    
    // Hapus pesan command asli
    await message.delete({ revoke: true });
    
    // Kirim ke chat yang sama pakai sendMessage bawaan gramjs
    await client.sendMessage(message.peerId, {
      message: '🌸 Vogue Help\n\nPilih kategori:',
      buttons,
    });
  },
};