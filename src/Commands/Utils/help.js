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

    const rows = categories.map((cat) =>
      new Api.KeyboardButtonRow({
        buttons: [
          new Api.KeyboardButtonCallback({
            text: `📂 ${cat}`,
            data: Buffer.from(`help:${cat}`),
          }),
        ],
      })
    );

    rows.push(
      new Api.KeyboardButtonRow({
        buttons: [
          new Api.KeyboardButtonCallback({
            text: '✖ Close',
            data: Buffer.from('help:close'),
          }),
        ],
      })
    );

    await client.invoke(
      new Api.messages.SendMessage({
        peer:        await client.getInputEntity(message.chatId),
        message:     `🌸 **Vogue Help**\n\nPilih kategori:`,
        parseMode:   'md',
        replyMarkup: new Api.ReplyInlineMarkup({ rows }),
        noWebpage:   true,
      })
    );
  },
};