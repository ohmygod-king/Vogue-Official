'use strict';

const { TelegramClient } = require('telegram');
const { StringSession }  = require('telegram/sessions');
const { NewMessage }     = require('telegram/events');
const input              = require('input');
const sqlite3            = require('sqlite3').verbose();
const pino               = require('pino');
const fs                 = require('fs');
const path               = require('path');
const config             = require('./src/Settings');


const logger = pino({
  level: config.isDev ? 'debug' : 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize:      true,
      translateTime: 'SYS:HH:MM:ss',
      ignore:        'pid,hostname',
    },
  },
});


const DB_PATH = path.resolve(__dirname, 'Database/vogue.db');
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new sqlite3.Database(DB_PATH);
db.serialize(() => {
  db.run('PRAGMA journal_mode = WAL');
  db.run(`
    CREATE TABLE IF NOT EXISTS sessions (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);
});

const Session = {
  load: (key) => new Promise((resolve) => {
    db.get('SELECT value FROM sessions WHERE key = ?', [key], (err, row) => {
      resolve(row ? row.value : '');
    });
  }),
  save: (key, value) => new Promise((resolve) => {
    db.run(
      `INSERT INTO sessions (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      [key, value],
      () => resolve()
    );
  }),
};

const commands = new Map();

const register = (def) => {
  commands.set(def.name, def);
  if (Array.isArray(def.aliases)) {
    def.aliases.forEach((a) => commands.set(a, def));
  }
  logger.debug(`[Registry] Registered: ${config.prefix}${def.name}`);
};

const resolve = (name) => commands.get(name) || null;

const loadCommands = (dir) => {
  if (!fs.existsSync(dir)) return;

  const walk = (d) => {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.js')) {
        try {
          delete require.cache[require.resolve(full)];
          register(require(full));
        } catch (err) {
          logger.error(`[Loader] Gagal load: ${entry.name} → ${err.message}`);
        }
      }
    }
  };

  walk(dir);
  logger.info(`[Loader] ${commands.size} commands terdaftar`);
};


(async () => {
  logger.info(`[Vogue] Starting ${config.botName} v${config.version}...`);

  const saved  = await Session.load(config.sessionName);
  const session = new StringSession(saved);

  const client = new TelegramClient(session, config.apiId, config.apiHash, {
    connectionRetries: 5,
    autoReconnect:     true,
  });

  await client.start({
    phoneNumber: () => input.text('[Auth] Nomor HP (+628xxx): '),
    password:    () => input.text('[Auth] 2FA Password: '),
    phoneCode:   () => input.text('[Auth] Kode OTP: '),
    onError:     (err) => logger.error(`[Auth] ${err.message}`),
  });

  await Session.save(config.sessionName, client.session.save());
  logger.info('[Vogue] Session tersimpan');

  loadCommands(path.resolve(__dirname, 'src/Commands'));

  client.addEventHandler(async (event) => {
    try {
      const msg  = event.message;
      if (!msg?.text) return;

      const text = msg.text.trim();
      if (!text.startsWith(config.prefix)) return;

      const parts = text.slice(config.prefix.length).trim().split(/\s+/);
      const name  = parts[0].toLowerCase();
      const args  = parts.slice(1);
      const cmd   = resolve(name);
      if (!cmd) return;

      if (config.ownerId && Number(msg.senderId) !== config.ownerId) {
        logger.warn(`[Auth] Blocked: ${msg.senderId}`);
        return;
      }

      await cmd.execute({
        client,
        message: msg,
        args,
        reply: (text) => msg.reply({ message: text }),
      });

    } catch (err) {
      logger.error(`[Handler] ${err.message}`);
    }
  }, new NewMessage({}));

  logger.info(`[Vogue] ✓ Ready — prefix "${config.prefix}"`);

  process.on('SIGINT', async () => {
    logger.info('[Vogue] Shutdown...');
    await client.disconnect();
    process.exit(0);
  });

})().catch((err) => {
  console.error('[Vogue] Boot failed:', err.message);
  process.exit(1);
});