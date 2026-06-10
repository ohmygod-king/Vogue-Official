'use strict';

const sqlite3 = require('sqlite3').verbose();
const path    = require('path');
const fs      = require('fs');
const logger  = require('../Utils/logger');

const DB_DIR  = path.resolve(__dirname);
const DB_PATH = path.join(DB_DIR, 'vogue.db');

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const db = new sqlite3.Database(DB_PATH);

db.run('PRAGMA journal_mode = WAL');
db.run('PRAGMA synchronous = NORMAL');

db.run(`
  CREATE TABLE IF NOT EXISTS sessions (
    key        TEXT PRIMARY KEY,
    value      TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  )
`);

const SessionStore = {
  save(key, value) {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO sessions (key, value, updated_at)
         VALUES (?, ?, ?)
         ON CONFLICT(key) DO UPDATE SET
           value      = excluded.value,
           updated_at = excluded.updated_at`,
        [key, value, Date.now()],
        (err) => {
          if (err) {
            logger.error(`[SessionStore] Gagal simpan: ${err.message}`);
            return reject(err);
          }
          logger.debug(`[SessionStore] Session disimpan: ${key}`);
          resolve();
        }
      );
    });
  },

  load(key) {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT value FROM sessions WHERE key = ?',
        [key],
        (err, row) => {
          if (err) {
            logger.error(`[SessionStore] Gagal load: ${err.message}`);
            return reject(err);
          }
          resolve(row ? row.value : null);
        }
      );
    });
  },

  delete(key) {
    return new Promise((resolve, reject) => {
      db.run(
        'DELETE FROM sessions WHERE key = ?',
        [key],
        (err) => {
          if (err) return reject(err);
          logger.info(`[SessionStore] Session dihapus: ${key}`);
          resolve();
        }
      );
    });
  },
};

module.exports = SessionStore;