const crypto = require('node:crypto');
const { send, method, requireSession, requireOrigin, readJson, env } = require('../lib/admin');
const MAX_BYTES = 2 * 1024 * 1024;
const FOLDERS = new Set(['layanan', 'blog', 'gallery', 'umum']);
const EMPTY_HASH = crypto.createHash('sha256').update('').digest('hex');

function hmac(key, value, encoding) { return crypto.createHmac('sha256', key).update(value, 'utf8').digest(encoding); }
function sha256(value) { return crypto.createHash('sha256').update(value).digest('hex'); }
function awsEncode(value) { return encodeURIComponent(value).replace(/[!'()*]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase()); }
function signingKey(secret, date, region, service) {
  const kDate = hmac('AWS4' + secret, date);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  return hmac(kService, 'aws4_request');
}

// Tanda tangan AWS SigV4 untuk R2 (S3 API). Dipisah supaya bisa diuji.
function signR2({ method: verb, host, path, contentType, payloadHash, access, secret, now = new Date() }) {
  const region = 'auto'; const service = 's3';
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, ''); const date = amzDate.slice(0, 8);
  const headers = { host, 'x-amz-content-sha256': payloadHash, 'x-amz-date': amzDate };
  if (contentType) headers['content-type'] = contentType;
  const names = Object.keys(headers).sort();
  const canonicalHeaders = names.map(n => `${n}:${headers[n]}\n`).join('');
  const signedHeaders = names.join(';');
  const canonicalRequest = `${verb}\n${path}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;
  const scope = `${date}/${region}/${service}/aws4_request`;
  const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${scope}\n${sha256(canonicalRequest)}`;
  const signature = hmac(signingKey(secret, date, region, service), stringToSign, 'hex');
  headers.authorization = `AWS4-HMAC-SHA256 Credential=${access}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  return headers;
}

function r2Config() {
  return { account: env('R2_ACCOUNT_ID'), access: env('R2_ACCESS_KEY_ID'), secret: env('R2_SECRET_ACCESS_KEY'), bucket: env('R2_BUCKET'), publicUrl: env('R2_PUBLIC_URL').replace(/\/+$/, '') };
}
function r2Target(cfg, key) {
  return { host: `${cfg.account}.r2.cloudflarestorage.com`, path: `/${awsEncode(cfg.bucket)}/${key.split('/').map(awsEncode).join('/')}` };
}
async function r2Exists(cfg, key) {
  const { host, path } = r2Target(cfg, key);
  const headers = signR2({ method: 'HEAD', host, path, payloadHash: EMPTY_HASH, access: cfg.access, secret: cfg.secret });
  const response = await fetch(`https://${host}${path}`, { method: 'HEAD', headers });
  if (response.status === 200) return true;
  if (response.status === 404) return false;
  throw new Error('Pengecekan nama file di Cloudflare R2 gagal. Periksa izin token dan konfigurasi bucket.');
}
async function r2Put(cfg, key, bytes, contentType) {
  const { host, path } = r2Target(cfg, key);
  const headers = signR2({ method: 'PUT', host, path, contentType, payloadHash: sha256(bytes), access: cfg.access, secret: cfg.secret });
  const response = await fetch(`https://${host}${path}`, { method: 'PUT', headers, body: bytes });
  if (!response.ok) throw new Error('Unggahan ke Cloudflare R2 gagal. Periksa izin token dan konfigurasi bucket.');
}

function slug(value, max = 60) {
  return String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, max).replace(/-+$/g, '');
}
function randomSuffix(length = 4) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'; const bytes = crypto.randomBytes(length);
  return Array.from(bytes, b => chars[b % chars.length]).join('');
}
// Susun lokasi file: folder/subfolder/nama.webp. Nama dari judul + kategori; bila kosong dipakai kode acak.
function buildKey(body) {
  const subs = (Array.isArray(body.subfolders) ? body.subfolders : []).slice(0, 2).map(s => slug(s, 40)).filter(Boolean);
  const name = slug(body.name, 80) || randomSuffix(10);
  return { dir: [body.folder, ...subs].join('/'), name };
}
async function uniqueKey(cfg, dir, name) {
  let candidate = name;
  for (let attempt = 0; attempt < 4; attempt++) {
    const key = `${dir}/${candidate}.webp`;
    if (!(await r2Exists(cfg, key))) return key;
    candidate = `${name}-${randomSuffix(attempt < 2 ? 4 : 8)}`;
  }
  return `${dir}/${name}-${randomSuffix(12)}.webp`;
}

async function handler(req, res) {
  if (!method(req, res, 'POST') || !requireOrigin(req, res) || !requireSession(req, res)) return;
  try {
    const body = await readJson(req, 3 * 1024 * 1024);
    if (!FOLDERS.has(body.folder)) return send(res, 400, { error: 'Folder harus layanan, blog, gallery, atau umum.' });
    if (body.mimeType !== 'image/webp') return send(res, 415, { error: 'Gambar harus berformat WebP. Panel mengubahnya otomatis sebelum diunggah.' });
    if (typeof body.data !== 'string' || !/^data:image\/webp;base64,[A-Za-z0-9+/=]+$/.test(body.data)) return send(res, 400, { error: 'Data gambar tidak valid.' });
    const bytes = Buffer.from(body.data.split(',')[1], 'base64');
    if (!bytes.length || bytes.length > MAX_BYTES) return send(res, 413, { error: 'Ukuran gambar setelah diperkecil maksimal 2 MB.' });
    if (!(bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP')) return send(res, 415, { error: 'Isi file bukan gambar WebP yang valid.' });
    const cfg = r2Config();
    const { dir, name } = buildKey(body);
    const key = await uniqueKey(cfg, dir, name);
    await r2Put(cfg, key, bytes, 'image/webp');
    return send(res, 200, { ok: true, url: `${cfg.publicUrl}/${key.split('/').map(awsEncode).join('/')}` });
  } catch (error) {
    return send(res, error.statusCode || 500, { error: error.statusCode ? error.message : (error.message || 'Unggahan gagal.') });
  }
}
module.exports = handler;
module.exports.signR2 = signR2;
module.exports.slug = slug;
