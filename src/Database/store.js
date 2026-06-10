'use strict';

const Database = require('better-sqlite3');
const path     = require('path');
const logger   = require('../src/Utils/logger');

const DB_PATH = path.resolve(__dirname, 'vogue.db');
const db      = new Database(DB_PATH);

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS store (
    key        TEXT PRIMARY KEY,
    value      TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  );
`);

const Store = {
  set(key, value) {
    const serialized = JSON.stringify(value);
    const stmt = db.prepare(`
      INSERT INTO store (key, value, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET
        value      = excluded.value,
        updated_at = excluded.updated_at
    `);
    stmt.run(key, serialized, Date.now());
  },

  get(key, fallback = null) {
    const stmt = db.prepare('SELECT value FROM store WHERE key = ?');
    const row  = stmt.get(key);
    if (!row) return fallback;

    try {
      return JSON.parse(row.value);
    } catch {
      return row.value;
    }
  },

  delete(key) {
    const stmt = db.prepare('DELETE FROM store WHERE key = ?');
    stmt.run(key);
  },

  has(key) {
    const stmt = db.prepare('SELECT 1 FROM store WHERE key = ? LIMIT 1');
    return !!stmt.get(key);
  },

  getByPrefix(prefix) {
    const stmt = db.prepare(
      "SELECT key, value FROM store WHERE key LIKE ?"
    );
    const rows = stmt.all(`${prefix}%`);
    return rows.map((row) => ({
      key:   row.key,
      value: JSON.parse(row.value),
    }));
  },
};

module.exports = Store;