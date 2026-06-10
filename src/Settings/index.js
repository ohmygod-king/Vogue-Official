const settings = {
  apiId: 123456,
  apiHash: 'your_api_hash_here',
  sessionString: '', // KOSONGKAN SAJA
  prefix: 'v.',
  ownerIds: [123456789],
  botName: 'Vogue',
  version: '1.0.0',
  logLevel: 'info',             
  rateLimit: {
    maxRequests: 10,
    windowMs: 60_000,
  },
};

const validate = () => {
  const errors = [];

  if (!settings.apiId)
    errors.push('[x] Silahkan isi API ID!');

  if (!settings.apiHash)
    errors.push('[x] Silahkan isi API HASH!');

  if (!settings.prefix)
    errors.push('[x] Silahkan set Prefix!');

  if (!Array.isArray(settings.ownerIds))
    errors.push('[x] Owner ID tidak boleh kosongn');

  if (errors.length > 0) {
    const msg = errors.map((e) => `  ✗ ${e}`).join('\n');
    throw new Error(`\n[Settings] Konfigurasi tidak valid:\n${msg}\n`);
  }
};

validate();

module.exports = Object.freeze(settings);