const crypto = require('node:crypto');
const { send, method, env, safeEqual, createSession, cookie, readJson, requireOrigin } = require('../lib/admin');

// Pembatasan ini membantu dalam satu instance saja. Serverless tidak membagikan memori antar-instance.
const attempts = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 6;
function hashMatches(password, stored) {
  const parts = String(stored || '').split('$');
  if (parts.length !== 4 || parts[0] !== 'scrypt' || parts[1] !== '16384') return false;
  const salt = Buffer.from(parts[2], 'base64url');
  const expected = Buffer.from(parts[3], 'base64url');
  if (salt.length < 16 || expected.length !== 64) return false;
  const actual = crypto.scryptSync(password, salt, expected.length, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  return safeEqual(actual, expected);
}
module.exports = async function handler(req, res) {
  if (!method(req, res, 'POST')) return;
  if (!requireOrigin(req, res)) return;
  const key = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  const now = Date.now();
  if (attempts.size > 1000) { for (const [ip, item] of attempts) if (now - item.start >= WINDOW_MS) attempts.delete(ip); }
  const entry = attempts.get(key);
  if (entry && now - entry.start < WINDOW_MS && entry.count >= MAX_ATTEMPTS) {
    res.setHeader('Retry-After', String(Math.ceil((WINDOW_MS - (now - entry.start)) / 1000)));
    return send(res, 429, { error: 'Terlalu banyak percobaan masuk. Coba lagi setelah 15 menit.' });
  }
  try {
    const body = await readJson(req, 4096);
    if (typeof body.password !== 'string' || body.password.length > 1024) return send(res, 400, { error: 'Masukkan kata sandi.' });
    const stored = env('ADMIN_PASSWORD_HASH');
    let ok = false;
    try { ok = hashMatches(body.password, stored); } catch (_) { ok = false; }
    if (!ok) {
      if (!entry || now - entry.start >= WINDOW_MS) attempts.set(key, { start: now, count: 1 });
      else attempts.set(key, { start: entry.start, count: entry.count + 1 });
      await new Promise(resolve => setTimeout(resolve, Math.min(1500, 250 + ((entry?.count || 0) * 200))));
      return send(res, 401, { error: 'Kata sandi tidak benar.' });
    }
    attempts.delete(key);
    return send(res, 200, { ok: true }, { 'Set-Cookie': cookie(createSession(), 12 * 60 * 60) });
  } catch (error) {
    return send(res, error.statusCode || 500, { error: error.statusCode ? error.message : 'Terjadi masalah pada server.' });
  }
};
