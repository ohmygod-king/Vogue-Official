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

    await message.delete({ revoke: true });

    // Kirim dengan bot = undefined (userbot, bukan bot)
    const sent = await client.invoke(
      new Api.messages.SendMessage({
        peer:        message.peerId,
        message:     '🌸 Vogue Help\n\nPilih kategori:',
        replyMarkup: new Api.ReplyInlineMarkup({ rows }),
        noWebpage:   true,
        randomId:    BigInt(Math.floor(Math.random() * 1e15)),
      })
    );

    console.log('Sent:', JSON.stringify(sent, null, 2));
  },
};