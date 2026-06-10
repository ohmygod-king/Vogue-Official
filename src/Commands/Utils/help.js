'use strict';

const { Api } = require('telegram');

module.exports = {
  name: 'help',
  description: 'Tampilkan semua commands',
  category: 'Utils',
  aliases: ['h', 'menu'],
  
  execute: async ({ client, message, registry }) => {
      const allCmds = registry.getAllCommands();
      console.log('Total commands:', allCmds.length);
      console.log('Commands:', allCmds.map(c => ({ name: c.name, category: c.category })));
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
    
    // Hapus pesan command asli
    await message.delete({ revoke: true });
    
    // Ambil chat via getEntity
    const chat = await message.getChat();
    
    await client.invoke(
      new Api.messages.SendMessage({
        peer: chat,
        message: '🌸 Vogue Help\n\nPilih kategori:',
        replyMarkup: new Api.ReplyInlineMarkup({ rows }),
        noWebpage: true,
        randomId: BigInt(Math.floor(Math.random() * 1e15)),
      })
    );
  },
};