'use strict';

const { TelegramClient } = require('telegram');
const { StringSession }  = require('telegram/sessions');
const { NewMessage }     = require('telegram/events');
const input              = require('input');
const sqlite3            = require('sqlite3').verbose();
const fs                 = require('fs');
const path               = require('path');
const config             = require('./src/Settings');
const chalk = require('chalk');

const client = new TelegramClient(session, config.apiId, config.apiHash, {
  connectionRetries: 5,
  autoReconnect:     true,
  baseLogger: {
    levels: [],
    log: () => {},
    error: () => {},
    warn: () => {},
    info: () => {},
    debug: () => {},
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
};

const printBanner = () => {
  console.log('');
  console.log(chalk.magenta.bold('  ██╗   ██╗ ██████╗  ██████╗ ██╗   ██╗███████╗'));
  console.log(chalk.magenta.bold('  ██║   ██║██╔═══██╗██╔════╝ ██║   ██║██╔════╝'));
  console.log(chalk.magenta.bold('  ██║   ██║██║   ██║██║  ███╗██║   ██║█████╗  '));
  console.log(chalk.magenta.bold('  ╚██╗ ██╔╝██║   ██║██║   ██║██║   ██║██╔══╝  '));
  console.log(chalk.magenta.bold('   ╚████╔╝ ╚██████╔╝╚██████╔╝╚██████╔╝███████╗'));
  console.log(chalk.magenta.bold('    ╚═══╝   ╚═════╝  ╚═════╝  ╚═════╝ ╚══════╝'));
  console.log('');
  console.log(chalk.gray('  ') + chalk.white.bold(`${config.botName}`) + chalk.gray(` v${config.version} — Telegram Userbot`));
  console.log(chalk.gray('  ') + chalk.gray('─'.repeat(44)));
  console.log('');
};

const log = {
  info:    (msg) => console.log(chalk.cyan('  ❯') + chalk.white(` ${msg}`)),
  success: (msg) => console.log(chalk.green('  ✓') + chalk.white(` ${msg}`)),
  warn:    (msg) => console.log(chalk.yellow('  ⚠') + chalk.white(` ${msg}`)),
  error:   (msg) => console.log(chalk.red('  ✗') + chalk.white(` ${msg}`)),
  debug:   (msg) => config.isDev && console.log(chalk.gray('  ·') + chalk.gray(` ${msg}`)),
  divider: ()    => console.log(chalk.gray('  ' + '─'.repeat(44))),
  blank:   ()    => console.log(''),
};

(async () => {
  printBanner();
  
  const saved = await Session.load(config.sessionName);
  const session = new StringSession(saved);
  
  const client = new TelegramClient(session, config.apiId, config.apiHash, {
    connectionRetries: 5,
    autoReconnect: true,
    baseLogger: {
      levels: [],
      log: () => {},
      error: () => {},
      warn: () => {},
      info: () => {},
      debug: () => {},
    },
  });
  
  await client.start({
    phoneNumber: () => input.text(chalk.gray('  › ') + 'Phone number (+628xxx): '),
    password: () => input.text(chalk.gray('  › ') + '2FA Password: '),
    phoneCode: () => input.text(chalk.gray('  › ') + 'OTP Code: '),
    onError: (err) => log.error(`Auth failed: ${err.message}`),
  });
  
  log.success('Connected to Telegram');
  
  await Session.save(config.sessionName, client.session.save());
  log.success('Session saved');
  
  log.blank();
  log.divider();
  loadCommands(path.resolve(__dirname, 'src/Commands'));
  log.success(`${commands.size} commands registered`);
  log.divider();
  
  client.addEventHandler(async (event) => {
    try {
      const msg = event.message;
      if (!msg?.text) return;
      
      const text = msg.text.trim();
      if (!text.startsWith(config.prefix)) return;
      
      const parts = text.slice(config.prefix.length).trim().split(/\s+/);
      const name = parts[0].toLowerCase();
      const args = parts.slice(1);
      const cmd = resolve(name);
      if (!cmd) return;
      
      if (config.ownerId && Number(msg.senderId) !== config.ownerId) return;
      
      await cmd.execute({
        client,
        message: msg,
        args,
        reply: (t) => msg.reply({ message: t }),
      });
      
    } catch (err) {
      log.error(`Handler: ${err.message}`);
    }
  }, new NewMessage({}));
  
  log.blank();
  log.success(chalk.magenta.bold(`${config.botName} is online`) + chalk.gray(` — prefix "${config.prefix}"`));
  log.blank();
  
  process.on('SIGINT', async () => {
    log.blank();
    log.warn('Shutting down...');
    await client.disconnect();
    log.success('Disconnected. Goodbye.');
    log.blank();
    process.exit(0);
  });
  
})().catch((err) => {
  log.error(`Boot failed: ${err.message}`);
  process.exit(1);
});