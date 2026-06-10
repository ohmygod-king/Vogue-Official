'use strict';

const { Button } = require('telegram/tl/custom/button');

module.exports = {
  name:        'help',
  description: 'Tampilkan semua commands',
  category:    'Utils',
  aliases:     ['h', 'menu'],

  execute: async ({ client, message, registry }) => {
    const allCmds    = registry.getAllCommands();
    const categories = [...new Set(allCmds.map((c) => c.category))].sort();

    const buttons = categories.map((cat) => [
      Button.inline(`📂 ${cat}`, Buffer.from(`help:${cat}`)),
    ]);

    buttons.push([
      Button.inline('✖ Close', Buffer.from('help:close')),
    ]);

    // Hapus pesan command
    await message.delete({ revoke: true });

    // Pakai senderId langsung
    await client.sendMessage(message.senderId, {
      message: '🌸 Vogue Help\n\nPilih kategori:',
      buttons,
    });
  },
};