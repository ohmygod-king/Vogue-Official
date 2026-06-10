'use strict';

const { Api } = require('telegram');

module.exports = {
  name:        'help',
  description: 'Tampilkan semua commands',
  category:    'Utils',
  aliases:     ['h', 'menu'],

  execute: async ({ client, message, registry }) => {
    const allCmds    = registry.getAllCommands();
    const categories = [...new Set(allCmds.map((c) => c.category))].sort();

    const buttons = categories.map((cat) => ([
      new Api.KeyboardButtonCallback({
        text: `📂 ${cat}`,
        data: Buffer.from(`help:${cat}`),
      })
    ]));

    // Tambah close button
    buttons.push([
      new Api.KeyboardButtonCallback({
        text: '✖ Close',
        data: Buffer.from('help:close'),
      })
    ]);

    await client.sendMessage(message.chatId, {
      message:   `🌸 **Vogue Help**\n\nPilih kategori:`,
      parseMode: 'md',
      buttons,
    });
  },
};