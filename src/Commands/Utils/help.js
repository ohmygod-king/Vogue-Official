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

    const buttonRows = categories.map((cat) => [
      Button.inline(`📂 ${cat}`, Buffer.from(`help:${cat}`)),
    ]);

    buttonRows.push([
      Button.inline('✖ Close', Buffer.from('help:close')),
    ]);

    const markup = client.buildReplyMarkup(buttonRows);

    await message.delete({ revoke: true });

    await client.sendMessage(message.peerId, {
      message: '🌸 Vogue Help\n\nPilih kategori:',
      buttons: markup,
    });
  },
};