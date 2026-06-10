'use strict';

const logger = require('../Utils/logger');

class Registry {
  constructor() {
    this._commands = new Map();
    this._aliases = new Map();
  }

  registerCommand(def) {
    this._validateDef(def);

    if (this._commands.has(def.name)) {
      throw new Error(`[Registry] Duplicate command: "${def.name}"`);
    }

    this._commands.set(def.name, def);

    if (Array.isArray(def.aliases)) {
      for (const alias of def.aliases) {
        if (this._aliases.has(alias)) {
          throw new Error(
            `[Registry] Duplicate alias: "${alias}" → command "${def.name}"`
          );
        }
        this._aliases.set(alias, def);
      }
    }

    logger.debug(`[Registry] Registered: .${def.name} [${def.category}]`);
  }

  resolve(name) {
    return this._commands.get(name)
      || this._aliases.get(name)
      || null;
  }

  getAllCommands() {
    return Array.from(this._commands.values());
  }

  getByCategory(category) {
    return this.getAllCommands().filter(
      (cmd) => cmd.category.toLowerCase() === category.toLowerCase()
    );
  }

  getCategories() {
    const cats = new Set(this.getAllCommands().map((cmd) => cmd.category));
    return Array.from(cats);
  }

  getStats() {
    return {
      commands: this._commands.size,
      aliases: this._aliases.size,
    };
  }


  _validateDef(def) {
    const required = ['name', 'description', 'category', 'execute'];

    for (const field of required) {
      if (!def[field]) {
        throw new Error(
          `[Registry] Command definition missing field: "${field}"`
        );
      }
    }

    if (typeof def.execute !== 'function') {
      throw new Error(
        `[Registry] Command "${def.name}" — execute harus berupa function`
      );
    }

    if (typeof def.name !== 'string' || !/^[a-z0-9_-]+$/.test(def.name)) {
      throw new Error(
        `[Registry] Command name "${def.name}" hanya boleh huruf kecil, angka, _ dan -`
      );
    }
  }
}

module.exports = Registry;