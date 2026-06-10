'use strict';

const fs   = require('fs');
const path = require('path');
const logger = require('../Utils/logger');

class Loader {
  constructor(registry) {
    if (!registry) {
      throw new Error('[Loader] Registry instance wajib di-inject');
    }

    this._registry    = registry;
    this._commandsDir = path.resolve(__dirname, '../Commands');
    this._eventsDir   = path.resolve(__dirname, '../Events');
  }

  loadCommands() {
    const files = this._walkDir(this._commandsDir);
    let loaded = 0;
    let failed = 0;

    for (const filePath of files) {
      try {
        this._clearCache(filePath);
        const def = require(filePath);

        if (!def || typeof def !== 'object') {
          throw new Error('Module harus export sebuah plain object');
        }

        this._registry.registerCommand(def);
        loaded++;
      } catch (err) {
        failed++;
        logger.error(
          `[Loader] Gagal load command: ${this._shortPath(filePath)}\n  → ${err.message}`
        );
      }
    }

    const stats = this._registry.getStats();
    logger.info(
      `[Loader] Commands: ${loaded} loaded, ${failed} failed` +
      ` | Total registered: ${stats.commands} commands, ${stats.aliases} aliases`
    );

    return { loaded, failed };
  }

  loadEvents(client) {
    if (!client) {
      throw new Error('[Loader] TelegramClient instance wajib di-inject');
    }

    const files = this._walkDir(this._eventsDir);
    let loaded = 0;
    let failed = 0;

    for (const filePath of files) {
      try {
        this._clearCache(filePath);
        const mod = require(filePath);

        if (!mod.event) {
          throw new Error('Event module harus export field "event"');
        }
        if (typeof mod.handler !== 'function') {
          throw new Error('Event module harus export field "handler" berupa function');
        }


        if (mod._selfManaged) {
          logger.debug(`[Loader] Self-managed event: ${this._shortPath(filePath)}`);
          loaded++;
          continue;
        }
        
        client.addEventHandler(mod.handler, mod.event);
        loaded++;
        logger.debug(
          `[Loader] Event loaded: ${this._shortPath(filePath)}`
        );
      } catch (err) {
        failed++;
        logger.error(
          `[Loader] Gagal load event: ${this._shortPath(filePath)}\n  → ${err.message}`
        );
      }
    }

    logger.info(`[Loader] Events: ${loaded} loaded, ${failed} failed`);

    return { loaded, failed };
  }

  _walkDir(dir) {
    if (!fs.existsSync(dir)) {
      logger.warn(`[Loader] Direktori tidak ditemukan: ${dir}`);
      return [];
    }

    const results  = [];
    const entries  = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        results.push(...this._walkDir(fullPath));
      } else if (entry.isFile() && entry.name.endsWith('.js')) {
        results.push(fullPath);
      }
    }

    return results;
  }


  _clearCache(filePath) {
    const resolved = require.resolve(filePath);
    delete require.cache[resolved];
  }


  _shortPath(filePath) {
    return path.relative(path.resolve(__dirname, '../../'), filePath);
  }
}

module.exports = Loader;