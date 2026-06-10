'use strict';

const { TelegramClient }  = require('telegram');
const { StringSession }   = require('telegram/sessions');
const input               = require('input');

const config     = require('../Settings');
const Registry   = require('./registry');
const Loader     = require('./loader');
const { defaultChain } = require('./middleware');
const logger     = require('../Utils/logger');


const SessionStore = require('../../Database/session');
const savedSession = SessionStore.load(config.sessionName) || '';
const session = new StringSession(savedSession);

async function boot() {
  logger.info(`[Vogue] Starting ${config.botName} v${config.version}...`);

  const client = new TelegramClient(session, config.apiId, config.apiHash, {
    connectionRetries: 5,
    retryDelay:        1000,
    autoReconnect:     true,
    baseLogger:        logger,
  });

  await client.start({
    phoneNumber: async () => await input.text('[Auth] Nomor HP (format +628xxx): '),
    password:    async () => await input.text('[Auth] 2FA Password (kosongkan jika tidak ada): '),
    phoneCode:   async () => await input.text('[Auth] Kode OTP dari Telegram: '),
    onError:     (err)    => logger.error(`[Auth] Error: ${err.message}`),
  });

  logger.info('[Vogue] Berhasil terkoneksi ke Telegram');

 
  const sessionString = client.session.save();
  await SessionStore.save(config.sessionName, sessionString);
  logger.info('[Vogue] Session tersimpan ke database');

  const registry = new Registry();
  const loader   = new Loader(registry);

  loader.loadCommands();

  _attachMessageHandler(client, registry);

  loader.loadEvents(client);

  const stats = registry.getStats();
  logger.info(
    `[Vogue] ✓ Ready — ` +
    `${stats.commands} commands, ${stats.aliases} aliases terdaftar`
  );

  _handleShutdown(client);
}


function _attachMessageHandler(client, registry) {
  const { NewMessage } = require('telegram/events');

  client.addEventHandler(async (event) => {
    try {
      const message = event.message;
      if (!message || !message.text) return;

      const text = message.text.trim();

      if (!text.startsWith(config.prefix)) return;

      const body        = text.slice(config.prefix.length).trim();
      const parts       = body.split(/\s+/);
      const commandName = parts[0].toLowerCase();
      const args        = parts.slice(1);

      const command = registry.resolve(commandName);
      if (!command) return;

      const ctx = {
        client,
        message,
        event,
        senderId:    Number(message.senderId),
        chatId:      Number(message.chatId),
        commandName,
        args,
        text,
        reply: async (content) => message.reply({ message: content }),
      };

      const allowed = defaultChain(ctx);
      if (!allowed) return;

      await command.execute(ctx);

    } catch (err) {
      logger.error(`[Vogue] Unhandled error di message handler: ${err.message}`);
      logger.debug(err.stack);
    }
  }, new NewMessage({}));

  logger.debug('[Vogue] Message handler terpasang');
}


function _handleShutdown(client) {
  const shutdown = async (signal) => {
    logger.info(`[Vogue] ${signal} diterima — shutdown...`);
    try {
      await client.disconnect();
      logger.info('[Vogue] Client disconnected. Bye.');
    } catch (err) {
      logger.error(`[Vogue] Error saat disconnect: ${err.message}`);
    }
    process.exit(0);
  };

  process.on('SIGINT',  () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('uncaughtException', (err) => {
    logger.error(`[Vogue] Uncaught Exception: ${err.message}`);
    logger.debug(err.stack);
  });
  process.on('unhandledRejection', (reason) => {
    logger.error(`[Vogue] Unhandled Rejection: ${reason}`);
  });
}

boot().catch((err) => {
  logger.error(`[Vogue] Boot failed: ${err.message}`);
  logger.debug(err.stack);
  process.exit(1);
});