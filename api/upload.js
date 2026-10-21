const crypto = require('node:crypto');
const { send, method, requireSession, requireOrigin, readJson, env } = require('../lib/admin');
const MAX_BYTES = 2 * 1024 * 1024;
const FOLDERS = new Set(['layanan', 'blog', 'galeri', 'umum']);
function hmac(key, value, encoding) { return crypto.createHmac('sha256', key).update(value, 'utf8').digest(encoding); }
function sha256(value) { return crypto.createHash('sha256').update(value).digest('hex'); }
function awsEncode(value) { return encodeURIComponent(value).replace(/[!'()*]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase()); }
function signingKey(secret, date, region, service) {
  const kDate = hmac('AWS4' + secret, date);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  return hmac(kService, 'aws4_request');
}
async function putR2(key, bytes, contentType) {
  const account = env('R2_ACCOUNT_ID'); const access = env('R2_ACCESS_KEY_ID'); const secret = env('R2_SECRET_ACCESS_KEY'); const bucket = env('R2_BUCKET'); const publicUrl = env('R2_PUBLIC_URL').replace(/\/+$/, '');
  const region = 'auto'; const service = 's3'; const host = `${account}.r2.cloudflarestorage.com`;
  const path = `/${awsEncode(bucket)}/${key.split('/').map(awsEncode).join('/')}`;
  const now = new Date(); const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, ''); const date = amzDate.slice(0, 8); const payloadHash = sha256(bytes);
  const canonicalHeaders = `content-type:${contentType}\nhost:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;
  const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date';
  const canonicalRequest = `PUT\n${path}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;
  const scope = `${date}/${region}/${service}/aws4_request`;
  const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${scope}\n${sha256(canonicalRequest)}`;
  const signature = hmac(signingKey(secret, date, region, service), stringToSign, 'hex');
  const authorization = `AWS4-HMAC-SHA256 Credential=${access}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  const response = await fetch(`https://${host}${path}`, { method: 'PUT', headers: { Authorization: authorization, 'Content-Type': contentType, Host: host, 'x-amz-content-sha256': payloadHash, 'x-amz-date': amzDate }, body: bytes });
  if (!response.ok) throw new Error('Unggahan ke Cloudflare R2 gagal. Periksa izin token dan konfigurasi bucket.');
  return `${publicUrl}/${key.split('/').map(awsEncode).join('/')}`;
}
module.exports = async function handler(req, res) {
  if (!method(req, res, 'POST') || !requireOrigin(req, res) || !requireSession(req, res)) return;
  try {
    const body = await readJson(req, 3 * 1024 * 1024);
    if (!FOLDERS.has(body.folder)) return send(res, 400, { error: 'Folder harus layanan, blog, galeri, atau umum.' });
    if (!['image/webp', 'image/jpeg', 'image/png'].includes(body.mimeType)) return send(res, 415, { error: 'Format gambar hanya WebP, JPEG, atau PNG.' });
    if (typeof body.data !== 'string' || !/^data:image\/(?:webp|jpeg|png);base64,[A-Za-z0-9+/=]+$/.test(body.data)) return send(res, 400, { error: 'Data gambar tidak valid.' });
    const bytes = Buffer.from(body.data.split(',')[1], 'base64');
    if (!bytes.length || bytes.length > MAX_BYTES) return send(res, 413, { error: 'Ukuran gambar setelah diperkecil maksimal 2 MB.' });
    const magic = body.mimeType === 'image/png' ? bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) : body.mimeType === 'image/jpeg' ? bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff : bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP';
    if (!magic) return send(res, 415, { error: 'Isi file tidak cocok dengan format gambar yang diklaim.' });
    const ext = body.mimeType === 'image/jpeg' ? 'jpg' : body.mimeType === 'image/png' ? 'png' : 'webp';
    const key = `${body.folder}/${crypto.randomUUID()}.${ext}`;
    const url = await putR2(key, bytes, body.mimeType);
    return send(res, 200, { ok: true, url });
  } catch (error) {
    return send(res, error.statusCode || 500, { error: error.statusCode ? error.message : (error.message || 'Unggahan gagal.') });
  }
};
