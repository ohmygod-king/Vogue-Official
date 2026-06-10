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

    await client.sendMessage(message.chatId, {
      message: `🌸 **${config.botName} Help**\n\nPilih kategori:`,
      parseMode: 'md',
      buttons,
    });
  },
};