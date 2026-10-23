'use strict';
(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const state = { content: null, baseSha: '', dirty: false, busy: false, activeTab: 'layanan', open: new Set(), closedSections: new Set(), sub: { blog: 'videos', galeri: 'albums' }, query: {}, edit: null, newItem: null, uploadNote: {} };
  const PATHS = { layanan: 'content/layanan.json', blog: 'content/blog.json', galeri: 'content/gallery.json', kontak: 'content/site.json' };
  const ICONS = ['copy','idcard','banner','billboard','card','brochure','stamp','sticker','book','mug','letters','neon','signboard','bulb','car','build','clipboard','stage','sound','tent','mic','camera','food','users','heart','printer','calendar','cube'];
  const ICON_GLYPHS = {copy:'▣',idcard:'▤',banner:'▰',billboard:'▱',card:'▭',brochure:'▥',stamp:'▣',sticker:'◇',book:'▤',mug:'☕',letters:'Aa',neon:'▣',signboard:'▰',bulb:'◉',car:'▰',build:'⚒',clipboard:'▤',stage:'▱',sound:'♫',tent:'⌂',mic:'♩',camera:'◎',food:'♨',users:'♙',heart:'♡',printer:'▣',calendar:'▦',cube:'◇'};
  const LABELS = {id:'ID unik',slug:'Slug URL',title:'Judul',icon:'Ikon',image:'Gambar',tagline:'Tagline',lead:'Pengantar',sectionTitle:'Judul bagian',sectionLead:'Deskripsi bagian',ctaLead:'Ajakan kontak',items:'Daftar item',desc:'Deskripsi',categories:'Kategori',label:'Nama kategori',videos:'Video',url:'Tautan',thumb:'Sampul video',format:'Format',articles:'Artikel',source:'Sumber',date:'Tanggal',excerpt:'Ringkasan',groups:'Grup galeri',group:'Grup',albums:'Album',category:'Kategori',featured:'Tampilkan sebagai unggulan',cover:'Sampul album',alt:'Teks alternatif gambar',src:'URL foto',type:'Jenis media',whatsapp:'Nomor WhatsApp (kode negara, tanpa +)',whatsappMessage:'Pesan WhatsApp awal',address:'Alamat',openingHours:'Jam buka',instagram:'Tautan Instagram',email:'Email',image:'Gambar',sectionTitle:'Judul bagian',format:'Format video',featured:'Album unggulan'};
  const PLACEHOLDERS = {id:'contoh: kartu-nama',slug:'contoh: percetakan',whatsapp:'6281234567890',url:'https://…',image:'URL gambar atau unggah gambar',src:'URL foto atau unggah gambar',thumb:'URL sampul atau unggah gambar',cover:'URL sampul atau unggah gambar',date:'YYYY-MM-DD'};
  const SAFE_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  const GAL = 'content/gallery.json';
  const GAL_ITEMS_RE = /^content\/gallery\.json\.albums\.\d+\.items$/;
  const GAL_ITEM_PATH_RE = /^content\/gallery\.json\.albums\.\d+\.items\.\d+\./;
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function el(tag, cls, text) { const node = document.createElement(tag); if (cls) node.className = cls; if (text !== undefined && text !== null) node.textContent = String(text); return node; }
  function button(text, cls, action, title) { const node = el('button', cls, text); node.type = 'button'; node.dataset.action = action; if (title) node.title = title; return node; }
  function setMessage(node, text, type = '') { node.textContent = text || ''; node.className = `message${type ? ` ${type}` : ''}`; }
  async function api(url, options = {}) {
    const response = await fetch(url, { credentials: 'same-origin', ...options, headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) } });
    let data = {}; try { data = await response.json(); } catch (_) {}
    if (!response.ok) { const error = new Error(data.error || `Permintaan gagal (${response.status}).`); error.status = response.status; throw error; }
    return data;
  }
  function showApp(yes) { $('#login-view').hidden = yes; $('#app-view').hidden = !yes; }
  function dirty() { state.dirty = true; $('#dirty-banner').hidden = false; $('#publish-button').disabled = state.busy; $('#publish-status').textContent = 'Ada perubahan belum diterbitkan'; $('#publish-detail').textContent = 'Periksa kembali, lalu terbitkan semua perubahan sekaligus.'; }
  // Nama file seperti "content/blog.json" memuat titik, jadi tidak boleh dipotong per titik.
  function splitPath(path) {
    const file = Object.values(PATHS).find(f => path === f || path.startsWith(f + '.'));
    if (!file) return path.split('.');
    const rest = path.slice(file.length + 1);
    return rest ? [file, ...rest.split('.')] : [file];
  }
  function pathGet(path) { return splitPath(path).reduce((v, k) => v == null ? undefined : v[k], state.content); }
  function pathSet(path, value) { const parts = splitPath(path); const key = parts.pop(); const parent = parts.reduce((v, k) => v[k], state.content); parent[key] = value; }
  function escId(value) { return String(value || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'item-baru'; }
  function sectionConfig(key, path = '') {
    if (key === 'categories' && path.includes('blog.json')) return { title:'Kategori blog', singular:'kategori', defaults:{id:'kategori-baru',label:'Kategori Baru'} };
    if (key === 'categories' && path.includes('gallery.json')) return { title:'Kategori galeri', singular:'kategori', defaults:{id:'kategori-baru',label:'Kategori Baru',group:'percetakan'} };
    if (key === 'groups') return { title:'Grup galeri', singular:'grup', defaults:{id:'grup-baru',label:'Grup Baru'} };
    if (key === 'videos') return { title:'Video blog', singular:'video', defaults:{title:'Video baru',category:'event-organizer',url:'',desc:'',thumb:'',format:''} };
    if (key === 'articles') return { title:'Artikel blog', singular:'artikel', defaults:{title:'Artikel baru',category:'tips-cetak',source:'',url:'',date:'',image:'',excerpt:''} };
    if (key === 'albums') return { title:'Album galeri', singular:'album', defaults:{id:'album-baru',title:'Album baru',category:'kartu-nama',featured:false,items:[]} };
    if (key === 'categories' && path.includes('layanan.json')) return { title:'Kategori layanan', singular:'kategori', defaults:{id:'layanan-baru',slug:'layanan-baru',title:'Layanan baru',icon:'printer',image:'',tagline:'',lead:'',sectionTitle:'',sectionLead:'',ctaLead:'',items:[]} };
    if (key === 'items' && path.includes('layanan.json')) return { title:'Item layanan', singular:'item', defaults:{title:'Layanan baru',icon:'copy',desc:''} };
    if (key === 'items' && path.includes('gallery.json')) return { title:'Foto & video', singular:'foto', defaults:{type:'photo',src:'',alt:''} };
    return { title:key, singular:'item', defaults:{} };
  }
  function optionsFor(key, path = '') {
    if (key === 'category') {
      if (path.includes('blog.json')) return (state.content['content/blog.json'].categories || []).map(x => ({value:x.id,label:x.label}));
      if (path.includes('gallery.json')) return (state.content['content/gallery.json'].categories || []).map(x => ({value:x.id,label:x.label}));
    }
    if (key === 'group') return (state.content['content/gallery.json'].groups || []).map(x => ({value:x.id,label:x.label}));
    return null;
  }
  // Judul bagian layanan: data tersimpan sebagai HTML (<span class="accent">), tapi di panel dipecah jadi dua isian biasa.
  const ACCENT_RE = /^([\s\S]*?)<span class="accent">([\s\S]*?)<\/span>([\s\S]*)$/;
  function escapeHtml(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function decodeEntities(s) { return String(s).replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&amp;/g,'&'); }
  function splitAccent(v) {
    const m = ACCENT_RE.exec(v || '');
    return m ? { before: decodeEntities(m[1]).replace(/\s+$/,''), accent: decodeEntities(m[2]), after: m[3] } : { before: decodeEntities(v || ''), accent: '', after: '' };
  }
  function composeAccent(before, accent, after) {
    const b = escapeHtml(String(before).trim()); const a = escapeHtml(String(accent).trim());
    let out = b; if (a) out += (b ? ' ' : '') + `<span class="accent">${a}</span>`;
    return out + (after || '');
  }
  function updateAccentPreview(wrap) {
    const [i1, i2] = wrap.querySelectorAll('input'); const box = wrap.querySelector('.accent-preview');
    box.replaceChildren(document.createTextNode('Tampilan di situs: '));
    const strong = el('strong'); strong.append(document.createTextNode((i1.value.trim() + (i2.value.trim() ? ' ' : ''))));
    if (i2.value.trim()) strong.append(el('mark','',i2.value.trim()));
    box.append(strong);
  }
  function accentTitleNode(wrap, path, value) {
    const parts = splitAccent(value); wrap.classList.add('accent-field'); wrap.dataset.path = path; wrap.dataset.after = parts.after;
    const row = el('div','accent-row');
    const make = (label, hint, val, part) => { const box = el('div','field'); box.append(el('small','',label)); const input = el('input'); input.type = 'text'; input.maxLength = 200; input.value = val; input.placeholder = hint; input.dataset.accentPart = part; box.append(input); return box; };
    row.append(make('Teks judul','contoh: Yang Bisa Kami',parts.before,'before'), make('Kata berwarna (boleh kosong)','contoh: Cetak',parts.accent,'accent'));
    wrap.append(row, el('div','accent-preview')); updateAccentPreview(wrap);
    return wrap;
  }
  function fieldLabel(key) { return LABELS[key] || key.replace(/([A-Z])/g,' $1').replace(/^./, c => c.toUpperCase()); }
  function fieldNode(key, value, path, obj) {
    const wrap = el('div', `field${['lead','sectionLead','ctaLead','sectionTitle','whatsappMessage','address','desc','excerpt','icon','image','thumb','cover','src','url','tagline'].includes(key) ? ' full-width' : ''}`);
    const label = el('label', '', fieldLabel(key)); wrap.append(label);
    if (key === 'thumb' && path.startsWith(GAL)) label.append(el('small','label-hint','YouTube otomatis; Instagram/TikTok/Facebook sebaiknya diisi'));
    if (key === 'items' || key === 'categories' || key === 'videos' || key === 'articles' || key === 'groups' || key === 'albums') return null;
    if (key === 'icon') {
      const ikey = 'icon:' + path; const open = state.open.has(ikey);
      const cur = button('', `icon-current${open ? ' open' : ''}`, 'toggle'); cur.dataset.key = ikey;
      cur.append(el('span','glyph',ICON_GLYPHS[value] || '◇'), el('span','icon-name',value || 'pilih ikon'), el('span','icon-hint',open ? 'Tutup ▴' : 'Ganti ikon ▾'));
      wrap.append(cur);
      if (open) {
        const grid = el('div','icon-grid'); grid.dataset.iconPath = path;
        ICONS.forEach(icon => { const b = button('', `icon-option${value === icon ? ' selected' : ''}`, 'icon-pick'); b.dataset.path = path; b.dataset.value = icon; b.append(el('span','glyph',ICON_GLYPHS[icon] || '◇'),el('span','',icon)); grid.append(b); });
        wrap.append(grid);
      }
      return wrap;
    }
    if (key === 'sectionTitle' && path.startsWith(PATHS.layanan + '.')) return accentTitleNode(wrap, path, value);
    if (key === 'type' && GAL_ITEM_PATH_RE.test(path)) return null;
    if (key === 'type') { const input=el('select'); [['photo','Foto'],['video','Video YouTube']].forEach(([v,l])=>{const o=el('option','',l);o.value=v;input.append(o);}); input.value=value || 'photo'; input.dataset.path=path;input.dataset.fieldInput='true';wrap.append(input);return wrap; }
    if (typeof value === 'boolean') {
      const line = el('label','inline-check'); const input = el('input'); input.type='checkbox'; input.checked=value; input.dataset.path=path; input.dataset.fieldInput='true'; line.append(input, document.createTextNode(value ? 'Ya, tampilkan sebagai unggulan' : 'Tidak')); wrap.append(line); return wrap;
    }
    if (['image','thumb','cover','src'].includes(key)) {
      const holder = el('div','image-field'); const u = imgUrl(value);
      if (u) { const img = el('img','image-preview'); img.src = u; img.alt = fieldLabel(key); img.loading = 'lazy'; img.onerror = () => { img.remove(); }; holder.append(img); }
      const folder = path.startsWith(GAL) ? 'galeri' : (key === 'image' ? 'layanan' : (key === 'src' || key === 'cover' ? 'galeri' : 'blog'));
      const zone = el('label','dropzone'); zone.dataset.dropPath = path; zone.dataset.dropFolder = folder;
      const file = el('input'); file.type = 'file'; file.accept = 'image/png,image/jpeg,image/webp'; file.dataset.uploadPath = path; file.dataset.uploadFolder = folder; file.style.display = 'none';
      const text = el('span','dz-text'); text.append(el('strong','','Klik pilih'), document.createTextNode(' atau drag & drop'));
      zone.append(el('span','dz-icon','🖼️'), text, file); holder.append(zone);
      holder.append(el('small','progress', state.uploadNote[path] || (value ? '✓ Sudah ada gambar' : 'Belum ada gambar · otomatis diubah ke WebP dan disimpan di Cloudflare R2')));
      holder.append(el('label','sub-label','Atau isi URL manual'));
      const input = el('input'); input.type = 'url'; input.value = value || ''; input.placeholder = PLACEHOLDERS[key] || 'https://…'; input.dataset.path = path; input.dataset.fieldInput = 'true'; holder.append(input);
      wrap.append(holder); return wrap;
    }
    const options = optionsFor(key, path); let input;
    if (options) { input=el('select'); options.forEach(opt=>{const o=el('option','',opt.label);o.value=opt.value;input.append(o);}); if (value && !options.some(o=>o.value===value)) { const o=el('option','',`Nilai lama: ${value}`);o.value=value;input.prepend(o); } input.value=value || (options[0] ? options[0].value : ''); }
    else if (['desc','excerpt','lead','tagline','sectionTitle','sectionLead','ctaLead','whatsappMessage','address'].includes(key)) { input=el('textarea'); input.value=value || ''; input.rows= key==='desc'||key==='excerpt'?3:2; }
    else { input=el('input'); input.type=key==='email'?'email':(key==='date'?'date':(key==='url'||key==='instagram'?'url':'text')); input.value=value == null ? '' : String(value); input.placeholder=PLACEHOLDERS[key] || ''; if (key==='id'||key==='slug') input.autocomplete='off'; }
    input.dataset.path=path; input.dataset.fieldInput='true';
    if (['id','slug'].includes(key)) label.append(el('small','label-hint','huruf kecil, angka, tanda hubung')); wrap.append(input);
    if (key==='url' && ((state.activeTab==='blog' && path.includes('.videos.')) || (state.activeTab==='galeri' && GAL_ITEM_PATH_RE.test(path)))) { const note=el('small','preview-platform',value?`Platform terdeteksi: ${detectPlatform(value)}`:'Didukung: YouTube, Instagram, TikTok, Facebook'); note.dataset.platformFor=path; wrap.append(note); }
    return wrap;
  }
  function renderObject(obj, path, omitArrays=true) {
    const grid=el('div','field-grid');
    Object.keys(obj).forEach(key=>{
      if (omitArrays && Array.isArray(obj[key])) return;
      if (key.startsWith('_')) return;
      const node=fieldNode(key,obj[key],`${path}.${key}`,obj); if(node) grid.append(node);
    });
    return grid;
  }
  function imgUrl(v) { v = String(v || '').trim(); if (!v) return ''; return /^(https?:)?\/\/|^\/|^data:/.test(v) ? v : '/' + v; }
  function thumbOf(obj) { return imgUrl(obj.thumb || obj.image || obj.cover || (Array.isArray(obj.items) && obj.items[0] && obj.items[0].src) || obj.src || ''); }
  function titleOf(obj, config, index) { return obj.title || obj.label || obj.id || obj.alt || `${config.singular} ${index + 1}`; }
  function snippetOf(obj) { const s = String(obj.desc || obj.excerpt || obj.lead || obj.tagline || obj.alt || (Array.isArray(obj.items) && obj.items[0] && obj.items[0].alt) || obj.url || obj.source || '').replace(/\s+/g, ' ').trim(); return s.length > 90 ? s.slice(0, 90) + '…' : s; }
  function metaFor(obj) {
    const parts = [];
    for (const k of Object.keys(obj)) if (Array.isArray(obj[k])) parts.push(`${obj[k].length} ${k === 'items' ? 'item' : k}`);
    if (obj.type) parts.push(obj.type === 'video' ? 'Video' : 'Foto');
    if (obj.icon) parts.push(`ikon ${obj.icon}`);
    if (obj.category) parts.push(obj.category);
    if (obj.group) parts.push(obj.group);
    return parts.join(' · ');
  }
  function arrayParent(arrPath) { const p = splitPath(arrPath); return p.length >= 4 ? p.slice(0, 3).join('.') : null; }
  function thumbNode(obj, title) {
    const box = el('div','row-thumb'); const u = thumbOf(obj);
    const glyph = obj.icon ? (ICON_GLYPHS[obj.icon] || '◇') : ((obj.type === 'video' || /youtu|instagram|tiktok|facebook|fb\.watch/.test(obj.url || '')) ? '▶' : (String(title).trim()[0] || '•').toUpperCase());
    if (u) { const img = el('img'); img.src = u; img.alt = ''; img.loading = 'lazy'; img.onerror = () => { img.remove(); box.append(el('span','row-glyph',glyph)); }; box.append(img); }
    else box.append(el('span','row-glyph',glyph));
    return box;
  }
  function listRow(path, index, len, obj, config) {
    const ipath = `${path}.${index}`; const title = titleOf(obj, config, index); const meta = metaFor(obj); const snip = snippetOf(obj);
    const row = el('div','list-row'); row.dataset.search = `${title} ${meta} ${snip}`.toLowerCase();
    const main = button('','row-main','edit'); main.dataset.path = ipath; main.append(thumbNode(obj, title), el('span','row-title',title));
    row.append(main, el('span','row-info',meta), el('span','row-snippet',snip));
    const actions = el('div','row-actions');
    if (index > 0) { const b = button('↑','icon-btn','move-up','Pindah ke atas'); b.dataset.path = path; b.dataset.index = index; actions.append(b); }
    if (index < len - 1) { const b = button('↓','icon-btn','move-down','Pindah ke bawah'); b.dataset.path = path; b.dataset.index = index; actions.append(b); }
    const e = button('Edit','mini-button','edit'); e.dataset.path = ipath; actions.append(e);
    const d = button('Hapus','mini-button danger','delete-item'); d.dataset.path = path; d.dataset.index = index; d.dataset.title = title; actions.append(d);
    row.append(actions); return row;
  }
  function renderList(arr, path, key, compact) {
    const config = sectionConfig(key, path); const list = el('div', `list${compact ? ' compact' : ''}`);
    const head = el('div','list-head'); ['Judul','Info','Ringkasan','Aksi'].forEach(t => head.append(el('span','',t))); list.append(head);
    if (!arr.length) list.append(el('div','empty',`Belum ada ${config.singular}. Gunakan tombol tambah untuk membuat.`));
    arr.forEach((obj, index) => list.append(listRow(path, index, arr.length, obj, config)));
    return list;
  }
  function applyFilter(section, query) {
    const q = String(query || '').trim().toLowerCase(); let shown = 0;
    section.querySelectorAll('.list-row').forEach(row => { const ok = !q || row.dataset.search.includes(q); row.hidden = !ok; if (ok) shown++; });
    const note = section.querySelector('.no-result'); if (note) note.hidden = !(q && shown === 0);
  }
  function renderEntityArray(path, key, title, description) {
    const arr = pathGet(path); const config = sectionConfig(key, path);
    const section = el('div','entity-section'); const head = el('div','section-head');
    const texts = el('div','section-text'); texts.append(el('h2','',title), el('p','',description));
    const tools = el('div','section-tools');
    if (arr.length > 5) { const s = el('input','list-search'); s.type = 'search'; s.placeholder = `Cari ${config.singular}…`; s.value = state.query[path] || ''; s.dataset.searchPath = path; tools.append(s); }
    const add = button(`+ Tambah ${config.singular}`,'button primary','add-item'); add.dataset.path = path; add.dataset.key = key; tools.append(add);
    head.append(texts, tools); section.append(head);
    section.append(renderList(arr, path, key, false));
    const none = el('div','empty no-result','Tidak ada yang cocok dengan pencarian.'); none.hidden = true; section.append(none);
    applyFilter(section, state.query[path]);
    return section;
  }
  function renderSections(tabKey, defs) {
    const wrap = el('div','sections'); const cur = defs.some(d => d.id === state.sub[tabKey]) ? state.sub[tabKey] : defs[0].id;
    const nav = el('div','subtabs');
    defs.forEach(d => { const b = button('', `subtab${d.id === cur ? ' active' : ''}`, 'subtab'); b.dataset.tab = tabKey; b.dataset.sub = d.id; b.append(document.createTextNode(d.label), el('span','count',String(pathGet(d.path).length))); nav.append(b); });
    wrap.append(nav); const d = defs.find(x => x.id === cur); wrap.append(renderEntityArray(d.path, d.key, d.title, d.desc)); return wrap;
  }
  // Daftar anak (mis. foto di dalam album, item di dalam kategori) ditampilkan di dalam popup.
  function renderChildList(arr, path, key) {
    const config = sectionConfig(key, path); const box = el('div','child-block'); const head = el('div','child-head');
    head.append(el('h3','',`${config.title} (${arr.length})`));
    const add = button(`+ Tambah ${config.singular}`,'button secondary','add-item'); add.dataset.path = path; add.dataset.key = key; head.append(add);
    box.append(head, renderList(arr, path, key, true)); return box;
  }
  function discardEmptyNew() {
    const p = state.newItem; state.newItem = null; if (!p) return;
    try { const it = pathGet(p); if (it && ((it.type === 'photo' && !String(it.src || '').trim()) || (it.type === 'video' && !String(it.url || '').trim()))) { const parts = splitPath(p); const idx = Number(parts.pop()); pathGet(parts.join('.')).splice(idx, 1); } } catch (_) {}
  }
  function closeModal() { discardEmptyNew(); state.edit = null; render(); }
  function renderModal() {
    const root = $('#modal-root'); const prev = root.querySelector('.modal-body'); const sameScroll = prev && root.dataset.path === state.edit; const sc = sameScroll ? prev.scrollTop : 0;
    root.replaceChildren(); document.body.classList.toggle('modal-open', !!state.edit); root.dataset.path = state.edit || '';
    if (!state.edit) return;
    let obj; try { obj = pathGet(state.edit); } catch (_) {}
    if (!obj) { state.edit = null; document.body.classList.remove('modal-open'); return; }
    const parts = splitPath(state.edit); const arrKey = parts[parts.length - 2]; const arrPath = parts.slice(0, -1).join('.'); const index = Number(parts[parts.length - 1]);
    const config = sectionConfig(arrKey, arrPath); const parent = GAL_ITEMS_RE.test(arrPath) ? null : arrayParent(arrPath);
    const overlay = el('div','modal-overlay'); const dlg = el('div','modal'); dlg.setAttribute('role','dialog'); dlg.setAttribute('aria-modal','true');
    const head = el('div','modal-head'); const left = el('div','modal-title');
    if (parent) { const back = button('‹ Kembali','mini-button','edit'); back.dataset.path = parent; left.append(back); }
    const tt = el('div'); tt.append(el('strong','',`Edit ${config.singular}`), el('span','modal-sub',titleOf(obj, config, index))); left.append(tt);
    const x = button('×','icon-btn close','close-modal','Tutup'); head.append(left, x);
    const body = el('div','modal-body'); body.append(renderObject(obj, state.edit));
    Object.keys(obj).filter(k => Array.isArray(obj[k])).forEach(k => body.append(renderChildList(obj[k], `${state.edit}.${k}`, k)));
    const foot = el('div','modal-foot');
    const del = button('Hapus ' + config.singular,'mini-button danger','delete-item'); del.dataset.path = arrPath; del.dataset.index = index; del.dataset.title = titleOf(obj, config, index);
    const done = parent ? button('Selesai','button primary','edit') : button('Selesai','button primary','close-modal'); if (parent) done.dataset.path = parent;
    const hint = el('span','modal-hint','Perubahan langsung tercatat. Klik “Terbitkan perubahan” untuk memasang ke situs.');
    foot.append(del, hint, done);
    dlg.append(head, body, foot); overlay.append(dlg); root.append(overlay); body.scrollTop = sc;
  }
  function showToast(text, type = 'success') {
    const t = el('div', `toast ${type}`, text); document.body.append(t); setTimeout(() => t.remove(), 4200);
  }
  function renderLayanan() {
    return renderEntityArray('content/layanan.json.categories', 'categories', 'Kategori layanan', 'Halaman Percetakan, Reklame, Event Organizer, dan item layanan di dalamnya.');
  }
  function renderBlog() { return renderSections('blog',[{id:'videos',label:'Video',path:'content/blog.json.videos',key:'videos',title:'Video',desc:'Video ditampilkan sebagai tautan (YouTube, Instagram, TikTok, Facebook); file video tidak diunggah.'},{id:'articles',label:'Artikel',path:'content/blog.json.articles',key:'articles',title:'Artikel',desc:'Artikel rujukan di bagian blog. Tanggal dan tautan wajib diisi sebelum diterbitkan.'},{id:'categories',label:'Kategori',path:'content/blog.json.categories',key:'categories',title:'Kategori blog',desc:'Kategori yang tersedia untuk video dan artikel.'}]); }
  function galAlbumIdx(catId) { const out = []; state.content[GAL].albums.forEach((a, i) => { if (a.category === catId) out.push(i); }); return out; }
  function galImages(catId) { const res = []; galAlbumIdx(catId).forEach(ai => { const album = state.content[GAL].albums[ai]; (album.items || []).forEach((it, ii) => res.push({ ai, ii, it, album })); }); return res; }
  function imageName(it) { if (it.type === 'video') return it.title || it.url || '(belum ada link video)'; if (it.alt) return it.alt; const src = String(it.src || it.url || ''); return src ? src.split('/').pop() : '(belum ada gambar)'; }
  function galImageRow(item, multiAlbum) {
    const path = `${GAL}.albums.${item.ai}.items.${item.ii}`; const itemsPath = `${GAL}.albums.${item.ai}.items`; const len = item.album.items.length;
    const row = el('div', 'gal-row'); const main = button('', 'row-main', 'edit', 'Edit gambar'); main.dataset.path = path; main.append(thumbNode(item.it, imageName(item.it)));
    const name = el('div', 'gal-row-name'); name.append(el('strong', '', imageName(item.it)));
    { const bits = []; if (item.it.type === 'video') bits.push('Video · ' + detectPlatform(item.it.url || '')); if (multiAlbum) bits.push(item.album.title); if (bits.length) name.append(el('small', '', bits.join(' · '))); }
    const actions = el('div', 'gal-actions');
    if (item.ii > 0) { const b = button('↑', 'icon-btn', 'move-up', 'Pindah ke atas'); b.dataset.path = itemsPath; b.dataset.index = item.ii; actions.append(b); }
    if (item.ii < len - 1) { const b = button('↓', 'icon-btn', 'move-down', 'Pindah ke bawah'); b.dataset.path = itemsPath; b.dataset.index = item.ii; actions.append(b); }
    const e = button('Edit', 'mini-button', 'edit'); e.dataset.path = path;
    const d = button('Hapus', 'mini-button danger', 'delete-item'); d.dataset.path = itemsPath; d.dataset.index = item.ii; d.dataset.title = imageName(item.it);
    actions.append(e, d); row.append(main, name, actions); return row;
  }
  function galCategoryBlock(cat) {
    const imgs = galImages(cat.id); const albums = galAlbumIdx(cat.id); const key = 'cat:' + cat.id; const closed = state.closedSections.has(key);
    const box = el('div', `gal-cat${closed ? ' closed' : ''}`); const head = el('div', 'gal-cat-head');
    const tog = button('', 'gal-toggle', 'toggle-sec'); tog.dataset.key = key;
    tog.append(el('span', 'tri small', closed ? '▶' : '▼'), el('span', 'gal-cat-title', cat.label), el('span', 'gal-count', `${imgs.filter(x => x.it.type !== 'video').length} gambar${imgs.some(x => x.it.type === 'video') ? ` · ${imgs.filter(x => x.it.type === 'video').length} video` : ''}`));
    const tools = el('div', 'gal-cat-tools');
    if (imgs.length) { const lab = el('label', 'inline-check feat'); const cb = el('input'); cb.type = 'checkbox'; cb.dataset.featCat = cat.id; cb.checked = albums.every(i => state.content[GAL].albums[i].featured); lab.append(cb, document.createTextNode('Tampil di beranda')); tools.append(lab); }
    const add = button('+ Tambah gambar', 'button primary small-btn', 'img-add'); add.dataset.cat = cat.id;
    const ren = button('Ganti nama', 'mini-button', 'cat-rename'); ren.dataset.cat = cat.id;
    const del = button('Hapus', 'mini-button danger', 'cat-delete'); del.dataset.cat = cat.id;
    tools.append(add);
    if (cat.group === 'event-organizer') { const vid = button('+ Tambah video', 'button secondary small-btn', 'vid-add'); vid.dataset.cat = cat.id; tools.append(vid); }
    tools.append(ren, del); head.append(tog, tools); box.append(head);
    if (!closed) {
      const rows = el('div', 'gal-rows');
      if (!imgs.length) rows.append(el('div', 'empty', 'Belum ada gambar. Klik “+ Tambah gambar”.'));
      imgs.forEach(item => rows.append(galImageRow(item, albums.length > 1)));
      box.append(rows);
    }
    return box;
  }
  function renderGaleri() {
    const g = state.content[GAL]; const wrap = el('div', 'gal-tree');
    g.groups.forEach(group => {
      const cats = g.categories.filter(c => c.group === group.id); const key = 'grp:' + group.id; const closed = state.closedSections.has(key);
      const sec = el('section', `gal-group${closed ? ' closed' : ''}`); const head = el('div', 'gal-group-head');
      const tog = button('', 'gal-toggle', 'toggle-sec'); tog.dataset.key = key;
      tog.append(el('span', 'tri', closed ? '▶' : '▼'), el('span', 'gal-group-title', group.label), el('span', 'gal-count light', `${cats.length} type orderan`));
      const add = button('+ Tambah type orderan', 'button primary small-btn', 'cat-add'); add.dataset.group = group.id;
      head.append(tog, add); sec.append(head);
      if (!closed) { const body = el('div', 'gal-body'); if (!cats.length) body.append(el('div', 'empty', 'Belum ada type orderan. Klik “+ Tambah type orderan”.')); cats.forEach(c => body.append(galCategoryBlock(c))); sec.append(body); }
      wrap.append(sec);
    });
    return wrap;
  }
  function addGalleryCategory(groupId) {
    const name = String(prompt('Nama type orderan baru (contoh: Spanduk, ID Card, Kartu Nama):') || '').trim().slice(0, 100); if (!name) return;
    const g = state.content[GAL]; const base = escId(name); let id = base, n = 1; while (g.categories.some(c => c.id === id)) id = `${base}-${++n}`;
    g.categories.push({ id, label: name, group: groupId }); state.closedSections.delete('cat:' + id); state.closedSections.delete('grp:' + groupId); dirty(); render();
  }
  function renameGalleryCategory(catId) {
    const cat = state.content[GAL].categories.find(c => c.id === catId); if (!cat) return;
    const name = String(prompt('Ganti nama type orderan:', cat.label) || '').trim().slice(0, 100); if (!name || name === cat.label) return;
    cat.label = name; dirty(); render();
  }
  function deleteGalleryCategory(catId) {
    const g = state.content[GAL]; const cat = g.categories.find(c => c.id === catId); if (!cat) return;
    const n = galImages(catId).length;
    if (!confirm(`Hapus type orderan "${cat.label}"${n ? ` beserta ${n} gambar di dalamnya` : ''}? Tindakan ini baru berlaku di situs setelah diterbitkan.`)) return;
    g.albums = g.albums.filter(a => a.category !== catId); g.categories = g.categories.filter(c => c.id !== catId); dirty(); render();
  }
  function addGalleryImage(catId, kind) {
    const g = state.content[GAL]; const cat = g.categories.find(c => c.id === catId); if (!cat) return;
    let ai = galAlbumIdx(catId)[0];
    if (ai === undefined) { let id = `${catId}-01`, n = 1; while (g.albums.some(a => a.id === id)) id = `${catId}-${String(++n).padStart(2, '0')}`; g.albums.push({ id, title: cat.label, category: catId, featured: false, items: [] }); ai = g.albums.length - 1; }
    const album = g.albums[ai]; album.items.push(kind === 'video' ? { type: 'video', url: '', title: '', thumb: '' } : { type: 'photo', src: '', alt: `${cat.label} ADAM XII PRINTING` });
    const p = `${GAL}.albums.${ai}.items.${album.items.length - 1}`; state.edit = p; state.newItem = p; state.closedSections.delete('cat:' + catId); dirty(); render();
  }
  function renderKontak() { const obj=state.content[PATHS.kontak];const section=el('div','');const head=el('div','section-head');head.append(el('div','', ''));head.firstChild.append(el('h2','','Kontak & informasi'),el('p','','Informasi ini digunakan oleh bagian kontak situs. Nomor WhatsApp wajib memakai kode negara tanpa tanda plus.'));const card=el('div','entity-card');const body=el('div','entity-body');body.append(renderObject(obj,'content/site.json',false));card.append(body);section.append(card);return section; }
  const PAGE = { layanan: ['Layanan','Kategori layanan dan item di dalamnya.'], blog: ['Blog & Video','Video, artikel, dan kategori blog.'], galeri: ['Galeri','Pilih bidang, lalu atur type orderan dan gambar di dalamnya.'], kontak: ['Kontak & Info','Nomor WhatsApp, alamat, dan info kontak situs.'] };
  function render() {
    const pg = PAGE[state.activeTab] || PAGE.layanan; $('#page-title').textContent = pg[0]; $('#page-sub').textContent = pg[1];
    $('#section-layanan').replaceChildren(renderLayanan());$('#section-blog').replaceChildren(renderBlog());$('#section-galeri').replaceChildren(renderGaleri());$('#section-kontak').replaceChildren(renderKontak());
    $$('.tab').forEach(tab=>tab.classList.toggle('active',tab.dataset.tab===state.activeTab));['layanan','blog','galeri','kontak'].forEach(key=>$('#section-'+key).hidden=key!==state.activeTab);renderModal();
  }
  function addDefault(path,key) {
    const arr=pathGet(path);const config=sectionConfig(key, path);const item=clone(config.defaults);
    if(key==='albums' && state.content['content/gallery.json'].categories.length) item.category=state.content['content/gallery.json'].categories[0].id;
    if(key==='categories' && path.includes('gallery.json') && state.content['content/gallery.json'].groups.length) item.group=state.content['content/gallery.json'].groups[0].id;
    if(key==='categories' && path.includes('blog.json') && state.content['content/blog.json'].categories.some(x=>x.id===item.id)) item.id='kategori-baru-'+(arr.length+1);
    if(key==='categories' && path.includes('layanan.json') && state.content['content/layanan.json'].categories.some(x=>x.id===item.id)) {item.id='layanan-baru-'+(arr.length+1);item.slug=item.id;}
    arr.push(item);state.edit=`${path}.${arr.length - 1}`;dirty();render();
  }
  function detectPlatform(url) { try {const u=new URL(url);const h=u.hostname.replace(/^www\./,'').toLowerCase();if(h==='youtube.com'||h==='youtu.be'||h.endsWith('.youtube.com'))return 'YouTube';if(h==='instagram.com'||h.endsWith('.instagram.com'))return 'Instagram';if(h==='tiktok.com'||h.endsWith('.tiktok.com'))return 'TikTok';if(h==='facebook.com'||h.endsWith('.facebook.com')||h==='fb.watch')return 'Facebook';return 'tidak didukung';}catch(_){return 'tautan belum valid';} }
  function validateBeforePublish() {
    const errors=[];const all=state.content;
    for(const [file,obj] of Object.entries(all)) { if(!obj||typeof obj!=='object')errors.push(`${file}: data tidak valid.`); }
    const services=all[PATHS.layanan].categories;const serviceIds=new Set();services.forEach(c=>{if(!SAFE_ID.test(c.id||''))errors.push(`ID kategori layanan "${c.title}" tidak aman.`);if(serviceIds.has(c.id))errors.push(`ID layanan "${c.id}" duplikat.`);serviceIds.add(c.id);if(!c.title.trim())errors.push('Judul kategori layanan wajib diisi.');const itemIds=new Set();(c.items||[]).forEach(i=>{if(!i.title||!i.title.trim())errors.push(`Judul item di ${c.title} wajib diisi.`);if(!ICONS.includes(i.icon))errors.push(`Ikon ${i.icon} tidak tersedia.`);if(itemIds.has(i.title)){}itemIds.add(i.title);});});
    const blog=all[PATHS.blog];const blogCats=new Set((blog.categories||[]).map(c=>c.id));(blog.categories||[]).forEach(c=>{if(!SAFE_ID.test(c.id||''))errors.push(`ID kategori blog "${c.label}" tidak aman.`);});(blog.videos||[]).forEach(v=>{if(!v.title||!v.title.trim())errors.push('Judul video wajib diisi.');if(!blogCats.has(v.category))errors.push(`Kategori video "${v.title}" belum tersedia.`);if(!v.url||detectPlatform(v.url)==='tidak didukung'||detectPlatform(v.url)==='tautan belum valid')errors.push(`Tautan video "${v.title}" tidak didukung.`);});(blog.articles||[]).forEach(a=>{if(!a.title||!a.title.trim())errors.push('Judul artikel wajib diisi.');if(!blogCats.has(a.category))errors.push(`Kategori artikel "${a.title}" belum tersedia.`);if(!a.url||!/^https?:\/\//i.test(a.url))errors.push(`Tautan artikel "${a.title}" wajib diisi.`);if(!a.date||!a.date.trim())errors.push(`Tanggal artikel "${a.title}" wajib diisi.`);if(!a.source||!a.source.trim())errors.push(`Sumber artikel "${a.title}" wajib diisi.`);});
    const gallery=all[PATHS.galeri];const galCatSeen=new Set();(gallery.categories||[]).forEach(c=>{if(!SAFE_ID.test(c.id||''))errors.push(`ID type orderan "${c.label}" tidak aman.`);if(galCatSeen.has(c.id))errors.push(`Type orderan "${c.label}" duplikat.`);galCatSeen.add(c.id);});const groups=new Set((gallery.groups||[]).map(g=>g.id));const cats=new Set((gallery.categories||[]).map(c=>c.id));(gallery.categories||[]).forEach(c=>{if(!groups.has(c.group))errors.push(`Grup kategori galeri "${c.label}" tidak tersedia.`);});(gallery.albums||[]).forEach(a=>{if(!SAFE_ID.test(a.id||''))errors.push(`ID album "${a.title}" tidak aman.`);if(!cats.has(a.category))errors.push(`Kategori album "${a.title}" tidak tersedia.`);(a.items||[]).forEach(it=>{if(it.type==='video'&&['tidak didukung','tautan belum valid'].includes(detectPlatform(it.url)))errors.push(`Tautan video di album "${a.title}" tidak didukung (pakai YouTube, Instagram, TikTok, atau Facebook).`);if(it.type==='photo'&&!it.src)errors.push(`URL foto di album "${a.title}" wajib diisi.`);});});
    const site=all[PATHS.kontak];if(!/^\d{8,20}$/.test(site.whatsapp||''))errors.push('Nomor WhatsApp harus berupa angka dengan kode negara, tanpa tanda +.');
    return errors;
  }
  function slugify(text, max = 60) { return String(text || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, max).replace(/-+$/g, ''); }
  // Tentukan folder dan nama file di R2 dari lokasi kolom gambar: judul + kategori.
  function uploadTarget(path, baseFolder) {
    const fallback = { folder: baseFolder === 'galeri' ? 'gallery' : baseFolder, subfolders: [], name: '' };
    try {
      const parts = splitPath(path); const file = parts[0]; const field = parts[parts.length - 1];
      const root = state.content[file];
      if (file === PATHS.layanan && parts[1] === 'categories') {
        const cat = root.categories[Number(parts[2])];
        return { folder: 'layanan', subfolders: [cat.slug || cat.id], name: slugify(cat.title) };
      }
      if (file === PATHS.blog) {
        const item = root[parts[1]][Number(parts[2])];
        return { folder: 'blog', subfolders: [item.category], name: slugify([item.category, item.title].join('-')) };
      }
      if (file === PATHS.galeri && parts[1] === 'albums') {
        const album = root.albums[Number(parts[2])];
        const category = (root.categories || []).find(c => c.id === album.category);
        const group = category && category.group ? category.group : 'umum';
        const cat = slugify(album.category); const title = slugify(album.title);
        let name = title.startsWith(cat) ? title : [cat, title].filter(Boolean).join('-');
        if (field === 'cover') name += '-sampul';
        else if (parts[3] === 'items') name += `-${Number(parts[4]) + 1}`;
        return { folder: 'gallery', subfolders: [group], name };
      }
    } catch (_) {}
    return fallback;
  }
  async function uploadImage(file,path,folder,input) {
    if(!file)return;const progress=input.closest('.image-field')?input.closest('.image-field').querySelector('.progress'):null;if(progress)progress.textContent='Menyiapkan gambar…';
    try { const bitmap=await createImageBitmap(file);const scale=Math.min(1,1600/Math.max(bitmap.width,bitmap.height));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));const ctx=canvas.getContext('2d');ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',0.82));if(!blob)throw new Error('Browser tidak bisa mengubah gambar ke WebP.');if(blob.size>2*1024*1024)throw new Error('Ukuran gambar setelah diperkecil masih lebih dari 2 MB. Pilih gambar yang lebih kecil.');const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('Gambar gagal dibaca.'));reader.readAsDataURL(blob);});if(progress)progress.textContent='Mengunggah gambar…';const result=await api('/api/upload',{method:'POST',body:JSON.stringify({...uploadTarget(path,folder),mimeType:'image/webp',data})});pathSet(path,result.url);state.uploadNote[path]='✓ Berhasil diunggah sebagai WebP';dirty();render();showToast('Gambar berhasil diunggah dan tautannya sudah dimasukkan.','success');}catch(error){if(progress)progress.textContent='';showToast(error.message,'error');}finally{input.value='';}
  }
  async function loadContent() { $('#reload-button').disabled=true;setMessage($('#global-message'),'Memuat konten dari GitHub…');try{const result=await api('/api/content');state.content=result.content;state.baseSha=result.baseSha;state.dirty=false;$('#dirty-banner').hidden=true;$('#publish-button').disabled=true;$('#publish-status').textContent='Belum ada perubahan';$('#publish-detail').textContent='Konten akan diperiksa sebelum dikirim ke GitHub.';$('#connection-state').textContent='Sesi aktif';render();setMessage($('#global-message'),'Konten berhasil dimuat.','success');}catch(error){setMessage($('#global-message'),error.message,'error');if(error.status===401){showApp(false);}}finally{$('#reload-button').disabled=false;} }
  async function login(event) {event.preventDefault();const input=$('#password');const message=$('#login-message');setMessage(message,'Memeriksa kata sandi…');try{await api('/api/login',{method:'POST',body:JSON.stringify({password:input.value})});input.value='';showApp(true);await loadContent();}catch(error){setMessage(message,error.message,'error');}}
  async function logout() {try{await api('/api/logout',{method:'POST',body:JSON.stringify({})});}catch(_){}state.content=null;state.baseSha='';state.dirty=false;showApp(false);}
  async function publish() {const errors=validateBeforePublish();if(errors.length){setMessage($('#global-message'),`Belum bisa diterbitkan: ${errors.slice(0,5).join(' ')}${errors.length>5?` Dan ${errors.length-5} masalah lainnya.`:''}`,'error');$('#global-message').scrollIntoView({behavior:'smooth',block:'center'});return;}if(!confirm('Terbitkan semua perubahan ke situs? Perubahan akan dikirim sebagai satu commit.'))return;state.busy=true;$('#publish-button').disabled=true;$('#publish-button').textContent='Sedang menerbitkan…';$('#publish-status').textContent='Sedang menerbitkan';$('#publish-detail').textContent='Mengirim satu commit ke GitHub. Jangan tutup panel dulu.';setMessage($('#global-message'),'Sedang menerbitkan konten…');try{const result=await api('/api/publish',{method:'POST',body:JSON.stringify({baseSha:state.baseSha,content:state.content})});state.dirty=false;$('#dirty-banner').hidden=true;state.baseSha=result.commit||state.baseSha;$('#publish-status').textContent='Konten berhasil dikirim';$('#publish-detail').textContent='Situs biasanya tayang sekitar 1–2 menit setelah build Vercel selesai.';setMessage($('#global-message'),result.message||'Konten berhasil diterbitkan. Situs biasanya tayang sekitar 1–2 menit.','success');}catch(error){setMessage($('#global-message'),error.message,'error');if(error.status===409)$('#publish-detail').textContent='Ada konflik versi. Muat ulang data dan periksa perubahan terbaru sebelum menerbitkan.';}finally{state.busy=false;$('#publish-button').disabled=!state.dirty;$('#publish-button').textContent='Terbitkan perubahan';}}
  document.addEventListener('input',event=>{const target=event.target;if(target.dataset.fieldInput==='true'){const old=pathGet(target.dataset.path);pathSet(target.dataset.path,target.type==='checkbox'?target.checked:target.value);if(old!==target.value||target.type==='checkbox')dirty();const note=$(`[data-platform-for="${CSS.escape(target.dataset.path)}"]`);if(note)note.textContent=`Platform terdeteksi: ${detectPlatform(target.value)}`;}});
  document.addEventListener('input',event=>{const s=event.target;if(s.dataset&&s.dataset.searchPath!==undefined){state.query[s.dataset.searchPath]=s.value;applyFilter(s.closest('.entity-section'),s.value);return;}});
  document.addEventListener('input',event=>{const target=event.target;if(!target.dataset||!target.dataset.accentPart)return;const wrap=target.closest('.accent-field');const [i1,i2]=wrap.querySelectorAll('input');pathSet(wrap.dataset.path,composeAccent(i1.value,i2.value,wrap.dataset.after));updateAccentPreview(wrap);dirty();});
  let overlayDown=false;
  document.addEventListener('mousedown',event=>{overlayDown=!!(event.target.classList&&event.target.classList.contains('modal-overlay'));});
  document.addEventListener('click',event=>{const hit=event.target.classList&&event.target.classList.contains('modal-overlay');if(hit&&overlayDown)closeModal();overlayDown=false;});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&state.edit)closeModal();});
  document.addEventListener('dragover',event=>{event.preventDefault();const z=event.target.closest&&event.target.closest('.dropzone');if(z)z.classList.add('drag');});
  document.addEventListener('dragleave',event=>{const z=event.target.closest&&event.target.closest('.dropzone');if(z&&!z.contains(event.relatedTarget))z.classList.remove('drag');});
  document.addEventListener('drop',event=>{event.preventDefault();const z=event.target.closest&&event.target.closest('.dropzone');if(!z)return;z.classList.remove('drag');const f=event.dataTransfer&&event.dataTransfer.files&&event.dataTransfer.files[0];if(!f)return;if(!/^image\//.test(f.type)){showToast('File harus berupa gambar (JPG, PNG, atau WebP).','error');return;}uploadImage(f,z.dataset.dropPath,z.dataset.dropFolder,z.querySelector('input[type=file]'));});
  document.addEventListener('change',event=>{const t=event.target;if(t.dataset&&t.dataset.featCat!==undefined){galAlbumIdx(t.dataset.featCat).forEach(i=>{state.content[GAL].albums[i].featured=t.checked;});dirty();render();}});
  document.addEventListener('change',event=>{const target=event.target;if(target.dataset.uploadPath){uploadImage(target.files[0],target.dataset.uploadPath,target.dataset.uploadFolder,target);}});
  document.addEventListener('click',event=>{const target=event.target.closest('button[data-action]');if(!target)return;const action=target.dataset.action; if(action==='toggle'||action==='toggle-sec'){const k=target.dataset.key;const set=action==='toggle'?state.open:state.closedSections;set.has(k)?set.delete(k):set.add(k);const y=window.scrollY;render();window.scrollTo(0,y);return;}
    if(action==='edit'){state.edit=target.dataset.path;render();return;}
    if(action==='cat-add'){addGalleryCategory(target.dataset.group);return;}
    if(action==='cat-rename'){renameGalleryCategory(target.dataset.cat);return;}
    if(action==='cat-delete'){deleteGalleryCategory(target.dataset.cat);return;}
    if(action==='img-add'){addGalleryImage(target.dataset.cat);return;}
    if(action==='vid-add'){addGalleryImage(target.dataset.cat,'video');return;}
    if(action==='close-modal'){closeModal();return;}
    if(action==='subtab'){state.sub[target.dataset.tab]=target.dataset.sub;const y=window.scrollY;render();window.scrollTo(0,y);return;}
    if(action==='icon-pick'){pathSet(target.dataset.path,target.dataset.value);state.open.delete('icon:'+target.dataset.path);dirty();const y=window.scrollY;render();window.scrollTo(0,y);return;}if(action==='add-item'){addDefault(target.dataset.path,target.dataset.key);return;}if(action==='delete-item'){const title=target.dataset.title||'item ini';if(!confirm(`Hapus "${title}"? Tindakan ini baru berlaku di situs setelah diterbitkan.`))return;pathGet(target.dataset.path).splice(Number(target.dataset.index),1);{const gone=`${target.dataset.path}.${target.dataset.index}`;if(state.edit&&(state.edit===gone||state.edit.startsWith(gone+'.')))state.edit=GAL_ITEMS_RE.test(target.dataset.path)?null:arrayParent(target.dataset.path);}dirty();render();return;}if(action==='move-up'||action==='move-down'){const arr=pathGet(target.dataset.path);const index=Number(target.dataset.index);const next=index+(action==='move-up'?-1:1);if(next<0||next>=arr.length)return;[arr[index],arr[next]]=[arr[next],arr[index]];const ka=`${target.dataset.path}.${index}`,kb=`${target.dataset.path}.${next}`;const wa=state.open.has(ka),wb=state.open.has(kb);state.open.delete(ka);state.open.delete(kb);if(wa)state.open.add(kb);if(wb)state.open.add(ka);dirty();render();}});
  $$('.tab').forEach(tab=>tab.addEventListener('click',()=>{state.activeTab=tab.dataset.tab;render();}));$('#login-form').addEventListener('submit',login);$('#logout-button').addEventListener('click',logout);$('#reload-button').addEventListener('click',async()=>{if(state.dirty&&!confirm('Ada perubahan yang belum diterbitkan. Muat ulang akan membuang perubahan itu. Lanjutkan?'))return;await loadContent();});$('#publish-button').addEventListener('click',publish);
  (async()=>{try{await api('/api/session');showApp(true);await loadContent();}catch(_){showApp(false);}})();
})();
