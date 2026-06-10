'use strict';

const sqlite3 = require('sqlite3').verbose();
const path    = require('path');
const logger  = require('../Utils/logger');

const DB_PATH = path.resolve(__dirname, 'vogue.db');
const db      = new sqlite3.Database(DB_PATH);

db.run('PRAGMA journal_mode = WAL');

db.run(`
  CREATE TABLE IF NOT EXISTS store (
    key        TEXT PRIMARY KEY,
    value      TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  )
`);

const Store = {
  set(key, value) {
    return new Promise((resolve, reject) => {
      const serialized = JSON.stringify(value);
      db.run(
        `INSERT INTO store (key, value, updated_at)
         VALUES (?, ?, ?)
         ON CONFLICT(key) DO UPDATE SET
           value      = excluded.value,
           updated_at = excluded.updated_at`,
        [key, serialized, Date.now()],
        (err) => {
          if (err) return reject(err);
          resolve();
        }
      );
    });
  },

  get(key, fallback = null) {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT value FROM store WHERE key = ?',
        [key],
        (err, row) => {
          if (err) return reject(err);
          if (!row) return resolve(fallback);
          try {
            resolve(JSON.parse(row.value));
          } catch {
            resolve(row.value);
          }
        }
      );
    });
  },

  delete(key) {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM store WHERE key = ?', [key], (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  },

  has(key) {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT 1 FROM store WHERE key = ? LIMIT 1',
        [key],
        (err, row) => {
          if (err) return reject(err);
          resolve(!!row);
        }
      );
    });
  },
};

module.exports = Store;