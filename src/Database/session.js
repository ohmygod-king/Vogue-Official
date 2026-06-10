'use strict';

const Database = require('better-sqlite3');
const path     = require('path');
const fs       = require('fs');
const logger   = require('../src/Utils/logger');
const DB_DIR  = path.resolve(__dirname);
const DB_PATH = path.join(DB_DIR, 'vogue.db');

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  );
`);

const SessionStore = {
  save(key, value) {
    const stmt = db.prepare(`
      INSERT INTO sessions (key, value, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET
        value      = excluded.value,
        updated_at = excluded.updated_at
    `);
    stmt.run(key, value, Date.now());
    logger.debug(`[SessionStore] Session disimpan: ${key}`);
  },

  load(key) {
    const stmt = db.prepare('SELECT value FROM sessions WHERE key = ?');
    const row  = stmt.get(key);
    return row ? row.value : null;
  },

  delete(key) {
    const stmt = db.prepare('DELETE FROM sessions WHERE key = ?');
    stmt.run(key);
    logger.info(`[SessionStore] Session dihapus: ${key}`);
  },
};

module.exports = SessionStore;