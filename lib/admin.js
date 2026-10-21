const crypto = require('node:crypto');

const ALLOWED_PATHS = ['content/layanan.json', 'content/blog.json', 'content/gallery.json', 'content/site.json'];
const MAX_JSON_BYTES = 1024 * 1024;
const SESSION_COOKIE = 'adam_admin_session';
const SESSION_MAX_AGE = 12 * 60 * 60;

function send(res, status, body, extraHeaders = {}) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  for (const [key, value] of Object.entries(extraHeaders)) res.setHeader(key, value);
  res.end(JSON.stringify(body));
}
function method(req, res, expected) {
  if (req.method === expected) return true;
  send(res, 405, { error: 'Metode permintaan tidak didukung.' }, { Allow: expected });
  return false;
}
function env(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Pengaturan server ${name} belum diisi.`);
  return value;
}
function safeEqual(a, b) {
  const aa = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  return aa.length === bb.length && crypto.timingSafeEqual(aa, bb);
}
function parseCookies(req) {
  const out = {};
  for (const part of String(req.headers.cookie || '').split(';')) {
    const at = part.indexOf('=');
    if (at < 0) continue;
    const key = part.slice(0, at).trim();
    try { out[key] = decodeURIComponent(part.slice(at + 1).trim()); } catch (_) {}
  }
  return out;
}
function sign(value) {
  const secret = env('SESSION_SECRET');
  if (Buffer.byteLength(secret) < 32) throw new Error('SESSION_SECRET minimal 32 byte.');
  return crypto.createHmac('sha256', secret).update(value).digest('base64url');
}
function createSession() {
  const payload = Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE, nonce: crypto.randomBytes(16).toString('hex') })).toString('base64url');
  return `${payload}.${sign(payload)}`;
}
function validSession(req) {
  const token = parseCookies(req)[SESSION_COOKIE];
  if (!token || token.length > 2048) return false;
  const split = token.lastIndexOf('.');
  if (split < 1) return false;
  const payload = token.slice(0, split);
  if (!safeEqual(token.slice(split + 1), sign(payload))) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return Number.isInteger(data.exp) && data.exp > Math.floor(Date.now() / 1000) && data.exp <= Math.floor(Date.now() / 1000) + SESSION_MAX_AGE + 60;
  } catch (_) { return false; }
}
function cookie(value, maxAge) {
  return `${SESSION_COOKIE}=${value}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Strict`;
}
function requireSession(req, res) {
  let isValid = false;
  try { isValid = validSession(req); } catch (_) { isValid = false; }
  if (isValid) return true;
  send(res, 401, { error: 'Sesi berakhir atau belum masuk. Silakan masuk kembali.' });
  return false;
}
function checkOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return false;
  try {
    const parsed = new URL(origin);
    const host = req.headers.host;
    return parsed.origin === `${req.headers['x-forwarded-proto'] || 'https'}://${host}` || parsed.host === host;
  } catch (_) { return false; }
}
function requireOrigin(req, res) {
  if (checkOrigin(req)) return true;
  send(res, 403, { error: 'Asal permintaan tidak diizinkan. Buka panel dari alamat situs yang sama.' });
  return false;
}
function readJson(req, max = MAX_JSON_BYTES) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return Promise.resolve(req.body);
  return new Promise((resolve, reject) => {
    const chunks = []; let total = 0;
    req.on('data', chunk => {
      total += chunk.length;
      if (total > max) { reject(Object.assign(new Error('Ukuran data terlalu besar.'), { statusCode: 413 })); req.destroy(); return; }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); }
      catch (_) { reject(Object.assign(new Error('Isi permintaan bukan JSON yang valid.'), { statusCode: 400 })); }
    });
    req.on('error', reject);
  });
}
function validateText(value, name, max, required = true, singleLine = false) {
  if (typeof value !== 'string') throw new Error(`${name} harus berupa teks.`);
  if (required && !value.trim()) throw new Error(`${name} wajib diisi.`);
  if (value.length > max) throw new Error(`${name} maksimal ${max} karakter.`);
  if (singleLine && /[\r\n]/.test(value)) throw new Error(`${name} harus satu baris, tidak boleh menekan Enter.`);
}
function validateId(value, name) {
  if (typeof value !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) || value.length > 64) throw new Error(`${name} harus berupa ID huruf kecil, angka, dan tanda hubung.`);
}
function uniqueIds(list, name) {
  if (!Array.isArray(list)) throw new Error(`${name} harus berupa daftar.`);
  const seen = new Set();
  for (const item of list) {
    validateId(item && item.id, `${name}: ID`);
    if (seen.has(item.id)) throw new Error(`${name} memiliki ID ganda: ${item.id}.`);
    seen.add(item.id);
  }
  return seen;
}
function validateUrl(value, name, optional = false) {
  if (optional && (value === '' || value == null)) return;
  if (typeof value === 'string' && /^(?:\/?[A-Za-z0-9._~-]+\/)*[A-Za-z0-9._~-]+$/.test(value) && !value.split('/').some(part => part === '.' || part === '..')) return;
  if (typeof value !== 'string' || value.length > 2048) throw new Error(`${name} harus berupa tautan yang valid.`);
  let u;
  try { u = new URL(value); } catch (_) { throw new Error(`${name} harus memakai tautan lengkap, diawali https://.`); }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') throw new Error(`${name} hanya boleh memakai HTTP atau HTTPS.`);
  if (!u.hostname || u.username || u.password) throw new Error(`${name} tidak valid.`);
}
function videoPlatform(value) {
  const s = String(value || '').trim();
  if (!s) return '';
  let u; try { u = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`); } catch (_) { return ''; }
  const h = u.hostname.toLowerCase().replace(/^(www\.|m\.|web\.|mbasic\.)/, '');
  if (h === 'instagram.com' || h === 'instagr.am') {
    const p = u.pathname.split('/').filter(Boolean); return p.some((x, i) => /^(reel|reels|p|tv)$/.test(x) && /^[A-Za-z0-9_-]{5,}$/.test(p[i + 1] || '')) ? 'instagram' : '';
  }
  if (h === 'tiktok.com') return /\/(?:video|v1|v2)\/\d{8,25}/.test(u.pathname) ? 'tiktok' : '';
  if (['facebook.com', 'fb.com', 'fb.watch'].includes(h)) return h === 'fb.watch' ? (u.pathname.length > 1 ? 'facebook' : '') : (/^\/(reels?|share\/[rv]|watch|[^/]+\/videos|video\.php)(\/|$)/.test(u.pathname) || /\/videos\/\d+/.test(u.pathname) ? 'facebook' : '');
  if (h === 'youtu.be') return /^[A-Za-z0-9_-]{11}$/.test(u.pathname.split('/')[1] || '') ? 'youtube' : '';
  if (['youtube.com', 'youtube-nocookie.com', 'music.youtube.com'].includes(h)) {
    const p = u.pathname.split('/').filter(Boolean); const id = p[0] === 'watch' ? u.searchParams.get('v') : /^(shorts|embed|live|v)$/.test(p[0] || '') ? p[1] : '';
    return /^[A-Za-z0-9_-]{11}$/.test(id || '') ? 'youtube' : '';
  }
  return '';
}
function validateContent(content) {
  if (!content || typeof content !== 'object' || Array.isArray(content)) throw new Error('Data konten tidak lengkap.');
  const expected = ['content/layanan.json', 'content/blog.json', 'content/gallery.json', 'content/site.json'];
  for (const p of expected) if (!(p in content)) throw new Error(`Data ${p} belum dikirim.`);
  const layanan = content['content/layanan.json'];
  if (!layanan || !Array.isArray(layanan.categories)) throw new Error('Struktur layanan tidak valid.');
  uniqueIds(layanan.categories, 'Kategori layanan');
  const iconNames = new Set(['copy','idcard','banner','billboard','card','brochure','stamp','sticker','book','mug','letters','neon','signboard','bulb','car','build','clipboard','stage','sound','tent','mic','camera','food','users','heart','printer','calendar','cube']);
  layanan.categories.forEach((c, i) => {
    ['slug','title','icon','image','tagline','lead','sectionTitle','sectionLead','ctaLead'].forEach(k => validateText(c[k], `Layanan ${i + 1}: ${k}`, k === 'lead' || k === 'sectionLead' ? 2000 : 500, true, !['lead','sectionLead','ctaLead'].includes(k)));
    validateId(c.slug, `Layanan ${i + 1}: slug`);
    if (!iconNames.has(c.icon)) throw new Error(`Ikon layanan tidak dikenal: ${c.icon}.`);
    if (!Array.isArray(c.items)) throw new Error(`Daftar item layanan ${c.title} tidak valid.`);
    c.items.forEach((item, j) => { validateText(item.title, 'Nama item layanan', 120, true, true); validateText(item.icon, 'Ikon item layanan', 40, true, true); if (!iconNames.has(item.icon)) throw new Error(`Ikon item tidak dikenal: ${item.icon}.`); validateText(item.desc, 'Deskripsi item layanan', 1000, true, false); });
  });
  const blog = content['content/blog.json'];
  if (!blog || !Array.isArray(blog.categories) || !Array.isArray(blog.videos) || !Array.isArray(blog.articles)) throw new Error('Struktur blog tidak valid.');
  const blogCats = uniqueIds(blog.categories, 'Kategori blog');
  blog.categories.forEach(c => validateText(c.label, 'Nama kategori blog', 80, true, true));
  blog.videos.forEach((v, i) => { validateText(v.title, `Video ${i + 1}: judul`, 160, true, true); if (!blogCats.has(v.category)) throw new Error(`Kategori video "${v.title}" tidak tersedia.`); validateText(v.category, 'Kategori video', 64, true, true); validateText(v.url, 'Tautan video', 2048, true, true); if (!videoPlatform(v.url)) throw new Error(`Tautan video "${v.title}" tidak didukung. Gunakan YouTube, Instagram reel/post, TikTok video, atau Facebook reel/video.`); validateText(v.desc, 'Deskripsi video', 2000, true, false); if (v.thumb != null) validateUrl(v.thumb, 'Sampul video', true); if (v.format != null) validateText(v.format, 'Format video', 40, false, true); });
  blog.articles.forEach((a, i) => { validateText(a.title, `Artikel ${i + 1}: judul`, 180, true, true); if (!blogCats.has(a.category)) throw new Error(`Kategori artikel "${a.title}" tidak tersedia.`); validateText(a.category, 'Kategori artikel', 64, true, true); validateText(a.source, 'Sumber artikel', 160, true, true); validateUrl(a.url, 'Tautan artikel'); validateText(a.date, 'Tanggal artikel', 40, true, true); validateUrl(a.image, 'Gambar artikel', true); validateText(a.excerpt, 'Ringkasan artikel', 2000, true, false); });
  const gallery = content['content/gallery.json'];
  if (!gallery || !Array.isArray(gallery.groups) || !Array.isArray(gallery.categories) || !Array.isArray(gallery.albums)) throw new Error('Struktur galeri tidak valid.');
  const groupIds = uniqueIds(gallery.groups, 'Grup galeri'); gallery.groups.forEach(g => validateText(g.label, 'Nama grup galeri', 80, true, true));
  const catIds = uniqueIds(gallery.categories, 'Kategori galeri'); gallery.categories.forEach(c => { validateText(c.label, 'Nama kategori galeri', 100, true, true); if (!groupIds.has(c.group)) throw new Error(`Grup kategori galeri "${c.label}" tidak tersedia.`); });
  const albumIds = uniqueIds(gallery.albums, 'Album galeri');
  gallery.albums.forEach(a => { validateText(a.title, 'Judul album', 160, true, true); if (!catIds.has(a.category)) throw new Error(`Kategori album "${a.title}" tidak tersedia.`); if (typeof a.featured !== 'boolean') throw new Error('Status unggulan album harus true atau false.'); if (a.cover != null) validateUrl(a.cover, 'Sampul album', true); if (!Array.isArray(a.items)) throw new Error(`Isi album "${a.title}" harus berupa daftar.`); a.items.forEach(it => { if (it.type === 'photo') { validateUrl(it.src, 'Tautan foto'); validateText(it.alt || '', 'Teks alternatif foto', 250, false, true); } else if (it.type === 'video') { validateUrl(it.url, 'Tautan video galeri'); if (!videoPlatform(it.url) || videoPlatform(it.url) !== 'youtube') throw new Error('Video galeri hanya mendukung YouTube.'); validateText(it.title || '', 'Judul video galeri', 160, false, true); if (it.thumb) validateUrl(it.thumb, 'Gambar mini video'); } else throw new Error('Jenis item galeri harus foto atau video.'); }); });
  const site = content['content/site.json'];
  if (!site || typeof site !== 'object' || Array.isArray(site)) throw new Error('Struktur info situs tidak valid.');
  for (const key of ['whatsapp','whatsappMessage','address','openingHours','instagram','email']) if (!(key in site)) throw new Error(`Informasi situs ${key} belum ada.`);
  validateText(site.whatsapp, 'WhatsApp', 24, true, true); if (!/^\d{8,20}$/.test(site.whatsapp)) throw new Error('WhatsApp harus berupa angka dengan kode negara, tanpa tanda +.');
  validateText(site.whatsappMessage, 'Pesan WhatsApp', 500, true, false); validateText(site.address, 'Alamat', 500, true, false); validateText(site.openingHours, 'Jam buka', 120, true, true);
  if (site.instagram) validateUrl(site.instagram, 'Instagram'); if (site.email) { validateText(site.email, 'Email', 254, false, true); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(site.email)) throw new Error('Alamat email tidak valid.'); }
  const total = Buffer.byteLength(JSON.stringify(content)); if (total > MAX_JSON_BYTES) throw new Error('Total data konten maksimal 1 MB.');
  return content;
}
function githubConfig() {
  return { token: env('GITHUB_TOKEN'), owner: env('GITHUB_OWNER'), repo: env('GITHUB_REPO'), branch: process.env.GITHUB_BRANCH || 'main' };
}
async function github(path, options = {}) {
  const cfg = githubConfig();
  const response = await fetch(`https://api.github.com${path}`, { ...options, headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${cfg.token}`, 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'adam-xii-printing-admin', ...(options.headers || {}) } });
  const text = await response.text(); let data;
  try { data = text ? JSON.parse(text) : {}; } catch (_) { data = {}; }
  if (!response.ok) { const error = new Error(response.status === 401 || response.status === 403 ? 'GitHub menolak akses. Periksa token dan izin Contents.' : `GitHub gagal memproses permintaan (${response.status}).`); error.statusCode = response.status === 409 || response.status === 422 ? 409 : 502; throw error; }
  return data;
}
async function currentBranch() {
  const c = githubConfig();
  return github(`/repos/${encodeURIComponent(c.owner)}/${encodeURIComponent(c.repo)}/git/ref/heads/${encodeURIComponent(c.branch)}`);
}
module.exports = { ALLOWED_PATHS, MAX_JSON_BYTES, SESSION_MAX_AGE, send, method, env, safeEqual, createSession, cookie, requireSession, requireOrigin, readJson, validateContent, githubConfig, github, currentBranch, videoPlatform };
