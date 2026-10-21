'use strict';
(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const state = { content: null, baseSha: '', dirty: false, busy: false, activeTab: 'layanan', open: new Set(), closedSections: new Set() };
  const PATHS = { layanan: 'content/layanan.json', blog: 'content/blog.json', galeri: 'content/gallery.json', kontak: 'content/site.json' };
  const ICONS = ['copy','idcard','banner','billboard','card','brochure','stamp','sticker','book','mug','letters','neon','signboard','bulb','car','build','clipboard','stage','sound','tent','mic','camera','food','users','heart','printer','calendar','cube'];
  const ICON_GLYPHS = {copy:'▣',idcard:'▤',banner:'▰',billboard:'▱',card:'▭',brochure:'▥',stamp:'▣',sticker:'◇',book:'▤',mug:'☕',letters:'Aa',neon:'▣',signboard:'▰',bulb:'◉',car:'▰',build:'⚒',clipboard:'▤',stage:'▱',sound:'♫',tent:'⌂',mic:'♩',camera:'◎',food:'♨',users:'♙',heart:'♡',printer:'▣',calendar:'▦',cube:'◇'};
  const LABELS = {id:'ID unik',slug:'Slug URL',title:'Judul',icon:'Ikon',image:'Gambar',tagline:'Tagline',lead:'Pengantar',sectionTitle:'Judul bagian',sectionLead:'Deskripsi bagian',ctaLead:'Ajakan kontak',items:'Daftar item',desc:'Deskripsi',categories:'Kategori',label:'Nama kategori',videos:'Video',url:'Tautan',thumb:'Sampul video',format:'Format',articles:'Artikel',source:'Sumber',date:'Tanggal',excerpt:'Ringkasan',groups:'Grup galeri',group:'Grup',albums:'Album',category:'Kategori',featured:'Tampilkan sebagai unggulan',cover:'Sampul album',alt:'Teks alternatif gambar',src:'URL foto',type:'Jenis media',whatsapp:'Nomor WhatsApp (kode negara, tanpa +)',whatsappMessage:'Pesan WhatsApp awal',address:'Alamat',openingHours:'Jam buka',instagram:'Tautan Instagram',email:'Email',image:'Gambar',sectionTitle:'Judul bagian',format:'Format video',featured:'Album unggulan'};
  const PLACEHOLDERS = {id:'contoh: kartu-nama',slug:'contoh: percetakan',whatsapp:'6281234567890',url:'https://…',image:'URL gambar atau unggah gambar',src:'URL foto atau unggah gambar',thumb:'URL sampul atau unggah gambar',cover:'URL sampul atau unggah gambar',date:'YYYY-MM-DD'};
  const SAFE_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
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
    const wrap = el('div', `field${['lead','sectionLead','ctaLead','sectionTitle','whatsappMessage','address','desc','excerpt','icon','image','thumb','cover','src'].includes(key) ? ' full-width' : ''}`);
    const label = el('label', '', fieldLabel(key)); wrap.append(label);
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
    if (key === 'type') { const input=el('select'); [['photo','Foto'],['video','Video YouTube']].forEach(([v,l])=>{const o=el('option','',l);o.value=v;input.append(o);}); input.value=value || 'photo'; input.dataset.path=path;input.dataset.fieldInput='true';wrap.append(input);return wrap; }
    if (typeof value === 'boolean') {
      const line = el('label','inline-check'); const input = el('input'); input.type='checkbox'; input.checked=value; input.dataset.path=path; input.dataset.fieldInput='true'; line.append(input, document.createTextNode(value ? 'Ya, tampilkan sebagai unggulan' : 'Tidak')); wrap.append(line); return wrap;
    }
    if (['image','thumb','cover','src'].includes(key)) {
      const holder = el('div','image-field');
      if (value) { const img=el('img','image-preview'); img.src=value; img.alt=fieldLabel(key); img.loading='lazy'; img.onerror=()=>{img.hidden=true;}; holder.append(img); }
      const input = el('input'); input.type='url'; input.value=value || ''; input.placeholder=PLACEHOLDERS[key] || 'https://…'; input.dataset.path=path; input.dataset.fieldInput='true'; holder.append(input);
      const row=el('div','upload-row'); const file=el('input'); file.type='file'; file.accept='image/png,image/jpeg,image/webp'; file.dataset.uploadPath=path; file.dataset.uploadFolder=key==='image'?'layanan':(key==='src'||key==='cover'?'galeri':'blog'); row.append(file); holder.append(row);
      const help=el('small','progress','Gambar akan diperkecil dan dikonversi ke WebP sebelum diunggah.'); holder.append(help); wrap.append(holder); return wrap;
    }
    const options = optionsFor(key, path); let input;
    if (options) { input=el('select'); options.forEach(opt=>{const o=el('option','',opt.label);o.value=opt.value;input.append(o);}); if (value && !options.some(o=>o.value===value)) { const o=el('option','',`Nilai lama: ${value}`);o.value=value;input.prepend(o); } input.value=value || (options[0] ? options[0].value : ''); }
    else if (['desc','excerpt','lead','tagline','sectionTitle','sectionLead','ctaLead','whatsappMessage','address'].includes(key)) { input=el('textarea'); input.value=value || ''; input.rows= key==='desc'||key==='excerpt'?3:2; }
    else { input=el('input'); input.type=key==='email'?'email':(key==='date'?'date':(key==='url'||key==='instagram'?'url':'text')); input.value=value == null ? '' : String(value); input.placeholder=PLACEHOLDERS[key] || ''; if (key==='id'||key==='slug') input.autocomplete='off'; }
    input.dataset.path=path; input.dataset.fieldInput='true';
    if (['id','slug'].includes(key)) { const help=el('small','','Gunakan huruf kecil, angka, dan tanda hubung.'); wrap.append(input,help); } else wrap.append(input);
    if (key==='url' && state.activeTab==='blog' && path.includes('.videos.')) { const note=el('small','preview-platform',value?`Platform terdeteksi: ${detectPlatform(value)}`:'Didukung: YouTube, Instagram, TikTok, Facebook'); note.dataset.platformFor=path; wrap.append(note); }
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
  function metaFor(obj) {
    const parts = [];
    for (const k of Object.keys(obj)) if (Array.isArray(obj[k])) parts.push(`${obj[k].length} ${k === 'items' ? 'item' : k}`);
    if (obj.type) parts.push(obj.type === 'video' ? 'Video' : 'Foto');
    if (obj.icon) parts.push(`ikon ${obj.icon}`);
    if (obj.category) parts.push(obj.category);
    if (obj.group) parts.push(obj.group);
    return parts.join(' · ');
  }
  function itemActions(path, index, len, title) {
    const actions = el('div','entity-actions');
    if (index > 0) { const b = button('↑','mini-button','move-up','Pindah ke atas'); b.dataset.path = path; b.dataset.index = index; actions.append(b); }
    if (index < len - 1) { const b = button('↓','mini-button','move-down','Pindah ke bawah'); b.dataset.path = path; b.dataset.index = index; actions.append(b); }
    const d = button('Hapus','mini-button danger','delete-item'); d.dataset.path = path; d.dataset.index = index; d.dataset.title = title; actions.append(d);
    return actions;
  }
  // Satu kartu dropdown: judul + ringkasan selalu terlihat, isi baru dibuat saat dibuka.
  function accordion(key, cls, title, meta, actions, build) {
    const open = state.open.has(key);
    const card = el('article', `${cls}${open ? ' open' : ''}`);
    const head = el('div','acc-head');
    const toggle = button('','acc-toggle','toggle'); toggle.dataset.key = key; toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    const info = el('span','acc-info'); info.append(el('span','acc-title',title)); if (meta) info.append(el('span','acc-meta',meta));
    toggle.append(el('span','chev','▸'), info);
    head.append(toggle); if (actions) head.append(actions);
    card.append(head);
    if (open) { const body = el('div','acc-body'); build(body); card.append(body); }
    return card;
  }
  function buildEntityBody(body, obj, path) {
    body.append(renderObject(obj, path));
    Object.keys(obj).filter(k => Array.isArray(obj[k])).forEach(childKey => body.append(renderArray(obj[childKey], `${path}.${childKey}`, childKey)));
  }
  function renderArray(arr, path, key) {
    const config = sectionConfig(key, path); const lkey = 'list:' + path; const open = state.open.has(lkey);
    const wrap = el('div', `sublist${open ? ' open' : ''}`); const head = el('div','sublist-head');
    const t = button('','acc-toggle sub','toggle'); t.dataset.key = lkey; t.setAttribute('aria-expanded', open ? 'true' : 'false');
    t.append(el('span','chev','▸'), el('span','acc-title',`${config.title} (${arr.length})`));
    const add = button(`+ Tambah ${config.singular}`,'mini-button','add-item'); add.dataset.path = path; add.dataset.key = key;
    head.append(t, add); wrap.append(head);
    if (!open) return wrap;
    if (!arr.length) wrap.append(el('div','empty',`Belum ada ${config.singular}. Gunakan tombol tambah untuk membuat.`));
    arr.forEach((obj, index) => {
      const ipath = `${path}.${index}`; const title = obj.title || obj.label || obj.id || `${config.singular} ${index + 1}`;
      wrap.append(accordion(ipath, 'nested-item', title, metaFor(obj), itemActions(path, index, arr.length, title), body => buildEntityBody(body, obj, ipath)));
    });
    return wrap;
  }
  function renderEntityArray(path, key, title, description) {
    const arr = pathGet(path); const config = sectionConfig(key, path); const skey = 'sec:' + path; const open = !state.closedSections.has(skey);
    const section = el('div', `entity-section${open ? ' open' : ''}`); const head = el('div','section-head');
    const t = button('','acc-toggle section','toggle-sec'); t.dataset.key = skey; t.setAttribute('aria-expanded', open ? 'true' : 'false');
    const texts = el('span','acc-info'); texts.append(el('span','acc-title big',`${title} (${arr.length})`), el('span','acc-meta',description));
    t.append(el('span','chev','▸'), texts);
    const add = button(`+ Tambah ${config.singular}`,'button secondary','add-item'); add.dataset.path = path; add.dataset.key = key;
    head.append(t, add); section.append(head);
    if (!open) return section;
    if (!arr.length) section.append(el('div','empty','Belum ada data. Tambahkan item untuk mulai mengelola bagian ini.'));
    const stack = el('div','stack');
    arr.forEach((obj, index) => {
      const cpath = `${path}.${index}`; const name = obj.title || obj.label || obj.id || `${config.singular} ${index + 1}`;
      stack.append(accordion(cpath, 'entity-card', name, metaFor(obj), itemActions(path, index, arr.length, name), body => buildEntityBody(body, obj, cpath)));
    });
    section.append(stack); return section;
  }
  function renderLayanan() {
    return renderEntityArray('content/layanan.json.categories', 'categories', 'Kategori layanan', 'Halaman Percetakan, Reklame, Event Organizer, dan item layanan di dalamnya.');
  }
  function renderBlog() { const section=el('div','stack');section.append(renderEntityArray('content/blog.json.categories','categories','Kategori blog','Kategori yang tersedia untuk video dan artikel.'),renderEntityArray('content/blog.json.videos','videos','Video','Video ditampilkan sebagai tautan; file video tidak diunggah. Tautan yang didukung: YouTube, Instagram, TikTok, Facebook.'),renderEntityArray('content/blog.json.articles','articles','Artikel','Artikel rujukan yang ditampilkan di bagian blog. Tanggal dan tautan wajib sebelum diterbitkan.'));return section; }
  function renderGaleri() { const section=el('div','stack');section.append(renderEntityArray('content/gallery.json.groups','groups','Grup galeri','Grup utama untuk mengelompokkan kategori galeri.'),renderEntityArray('content/gallery.json.categories','categories','Kategori galeri','Setiap kategori harus terhubung ke satu grup.'),renderEntityArray('content/gallery.json.albums','albums','Album galeri','Kelola sampul, unggulan, foto, dan video YouTube di setiap album.'));return section; }
  function renderKontak() { const obj=state.content[PATHS.kontak];const section=el('div','');const head=el('div','section-head');head.append(el('div','', ''));head.firstChild.append(el('h2','','Kontak & informasi'),el('p','','Informasi ini digunakan oleh bagian kontak situs. Nomor WhatsApp wajib memakai kode negara tanpa tanda plus.'));section.append(head);const card=el('div','entity-card');const body=el('div','entity-body');body.append(renderObject(obj,'content/site.json',false));card.append(body);section.append(card);return section; }
  function render() {
    $('#section-layanan').replaceChildren(renderLayanan());$('#section-blog').replaceChildren(renderBlog());$('#section-galeri').replaceChildren(renderGaleri());$('#section-kontak').replaceChildren(renderKontak());
    $$('.tab').forEach(tab=>tab.classList.toggle('active',tab.dataset.tab===state.activeTab));['layanan','blog','galeri','kontak'].forEach(key=>$('#section-'+key).hidden=key!==state.activeTab);
  }
  function addDefault(path,key) {
    const arr=pathGet(path);const config=sectionConfig(key, path);const item=clone(config.defaults);
    if(key==='albums' && state.content['content/gallery.json'].categories.length) item.category=state.content['content/gallery.json'].categories[0].id;
    if(key==='categories' && path.includes('gallery.json') && state.content['content/gallery.json'].groups.length) item.group=state.content['content/gallery.json'].groups[0].id;
    if(key==='categories' && path.includes('blog.json') && state.content['content/blog.json'].categories.some(x=>x.id===item.id)) item.id='kategori-baru-'+(arr.length+1);
    if(key==='categories' && path.includes('layanan.json') && state.content['content/layanan.json'].categories.some(x=>x.id===item.id)) {item.id='layanan-baru-'+(arr.length+1);item.slug=item.id;}
    arr.push(item);state.open.add(`${path}.${arr.length - 1}`);state.open.add('list:' + path);state.closedSections.delete('sec:' + path);dirty();render();
  }
  function detectPlatform(url) { try {const u=new URL(url);const h=u.hostname.replace(/^www\./,'').toLowerCase();if(h==='youtube.com'||h==='youtu.be'||h.endsWith('.youtube.com'))return 'YouTube';if(h==='instagram.com'||h.endsWith('.instagram.com'))return 'Instagram';if(h==='tiktok.com'||h.endsWith('.tiktok.com'))return 'TikTok';if(h==='facebook.com'||h.endsWith('.facebook.com')||h==='fb.watch')return 'Facebook';return 'tidak didukung';}catch(_){return 'tautan belum valid';} }
  function validateBeforePublish() {
    const errors=[];const all=state.content;
    for(const [file,obj] of Object.entries(all)) { if(!obj||typeof obj!=='object')errors.push(`${file}: data tidak valid.`); }
    const services=all[PATHS.layanan].categories;const serviceIds=new Set();services.forEach(c=>{if(!SAFE_ID.test(c.id||''))errors.push(`ID kategori layanan "${c.title}" tidak aman.`);if(serviceIds.has(c.id))errors.push(`ID layanan "${c.id}" duplikat.`);serviceIds.add(c.id);if(!c.title.trim())errors.push('Judul kategori layanan wajib diisi.');const itemIds=new Set();(c.items||[]).forEach(i=>{if(!i.title||!i.title.trim())errors.push(`Judul item di ${c.title} wajib diisi.`);if(!ICONS.includes(i.icon))errors.push(`Ikon ${i.icon} tidak tersedia.`);if(itemIds.has(i.title)){}itemIds.add(i.title);});});
    const blog=all[PATHS.blog];const blogCats=new Set((blog.categories||[]).map(c=>c.id));(blog.categories||[]).forEach(c=>{if(!SAFE_ID.test(c.id||''))errors.push(`ID kategori blog "${c.label}" tidak aman.`);});(blog.videos||[]).forEach(v=>{if(!v.title||!v.title.trim())errors.push('Judul video wajib diisi.');if(!blogCats.has(v.category))errors.push(`Kategori video "${v.title}" belum tersedia.`);if(!v.url||detectPlatform(v.url)==='tidak didukung'||detectPlatform(v.url)==='tautan belum valid')errors.push(`Tautan video "${v.title}" tidak didukung.`);});(blog.articles||[]).forEach(a=>{if(!a.title||!a.title.trim())errors.push('Judul artikel wajib diisi.');if(!blogCats.has(a.category))errors.push(`Kategori artikel "${a.title}" belum tersedia.`);if(!a.url||!/^https?:\/\//i.test(a.url))errors.push(`Tautan artikel "${a.title}" wajib diisi.`);if(!a.date||!a.date.trim())errors.push(`Tanggal artikel "${a.title}" wajib diisi.`);if(!a.source||!a.source.trim())errors.push(`Sumber artikel "${a.title}" wajib diisi.`);});
    const gallery=all[PATHS.galeri];const groups=new Set((gallery.groups||[]).map(g=>g.id));const cats=new Set((gallery.categories||[]).map(c=>c.id));(gallery.categories||[]).forEach(c=>{if(!groups.has(c.group))errors.push(`Grup kategori galeri "${c.label}" tidak tersedia.`);});(gallery.albums||[]).forEach(a=>{if(!SAFE_ID.test(a.id||''))errors.push(`ID album "${a.title}" tidak aman.`);if(!cats.has(a.category))errors.push(`Kategori album "${a.title}" tidak tersedia.`);(a.items||[]).forEach(it=>{if(it.type==='video'&&detectPlatform(it.url)!=='YouTube')errors.push(`Video di album "${a.title}" harus memakai tautan YouTube.`);if(it.type==='photo'&&!it.src)errors.push(`URL foto di album "${a.title}" wajib diisi.`);});});
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
    if(!file)return;const progress=input.parentElement.parentElement.querySelector('.progress');if(progress)progress.textContent='Menyiapkan gambar…';
    try { const bitmap=await createImageBitmap(file);const scale=Math.min(1,1600/Math.max(bitmap.width,bitmap.height));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));const ctx=canvas.getContext('2d');ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',0.82));if(!blob)throw new Error('Browser tidak bisa mengubah gambar ke WebP.');if(blob.size>2*1024*1024)throw new Error('Ukuran gambar setelah diperkecil masih lebih dari 2 MB. Pilih gambar yang lebih kecil.');const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('Gambar gagal dibaca.'));reader.readAsDataURL(blob);});if(progress)progress.textContent='Mengunggah gambar…';const result=await api('/api/upload',{method:'POST',body:JSON.stringify({...uploadTarget(path,folder),mimeType:'image/webp',data})});pathSet(path,result.url);dirty();render();setMessage($('#global-message'), 'Gambar berhasil diunggah dan tautannya sudah dimasukkan.','success');}catch(error){if(progress)progress.textContent='';setMessage($('#global-message'),error.message,'error');}finally{input.value='';}
  }
  async function loadContent() { $('#reload-button').disabled=true;setMessage($('#global-message'),'Memuat konten dari GitHub…');try{const result=await api('/api/content');state.content=result.content;state.baseSha=result.baseSha;state.dirty=false;$('#dirty-banner').hidden=true;$('#publish-button').disabled=true;$('#publish-status').textContent='Belum ada perubahan';$('#publish-detail').textContent='Konten akan diperiksa sebelum dikirim ke GitHub.';$('#connection-state').textContent='Sesi aktif';render();setMessage($('#global-message'),'Konten berhasil dimuat.','success');}catch(error){setMessage($('#global-message'),error.message,'error');if(error.status===401){showApp(false);}}finally{$('#reload-button').disabled=false;} }
  async function login(event) {event.preventDefault();const input=$('#password');const message=$('#login-message');setMessage(message,'Memeriksa kata sandi…');try{await api('/api/login',{method:'POST',body:JSON.stringify({password:input.value})});input.value='';showApp(true);await loadContent();}catch(error){setMessage(message,error.message,'error');}}
  async function logout() {try{await api('/api/logout',{method:'POST',body:JSON.stringify({})});}catch(_){}state.content=null;state.baseSha='';state.dirty=false;showApp(false);}
  async function publish() {const errors=validateBeforePublish();if(errors.length){setMessage($('#global-message'),`Belum bisa diterbitkan: ${errors.slice(0,5).join(' ')}${errors.length>5?` Dan ${errors.length-5} masalah lainnya.`:''}`,'error');$('#global-message').scrollIntoView({behavior:'smooth',block:'center'});return;}if(!confirm('Terbitkan semua perubahan ke situs? Perubahan akan dikirim sebagai satu commit.'))return;state.busy=true;$('#publish-button').disabled=true;$('#publish-button').textContent='Sedang menerbitkan…';$('#publish-status').textContent='Sedang menerbitkan';$('#publish-detail').textContent='Mengirim satu commit ke GitHub. Jangan tutup panel dulu.';setMessage($('#global-message'),'Sedang menerbitkan konten…');try{const result=await api('/api/publish',{method:'POST',body:JSON.stringify({baseSha:state.baseSha,content:state.content})});state.dirty=false;$('#dirty-banner').hidden=true;state.baseSha=result.commit||state.baseSha;$('#publish-status').textContent='Konten berhasil dikirim';$('#publish-detail').textContent='Situs biasanya tayang sekitar 1–2 menit setelah build Vercel selesai.';setMessage($('#global-message'),result.message||'Konten berhasil diterbitkan. Situs biasanya tayang sekitar 1–2 menit.','success');}catch(error){setMessage($('#global-message'),error.message,'error');if(error.status===409)$('#publish-detail').textContent='Ada konflik versi. Muat ulang data dan periksa perubahan terbaru sebelum menerbitkan.';}finally{state.busy=false;$('#publish-button').disabled=!state.dirty;$('#publish-button').textContent='Terbitkan perubahan';}}
  document.addEventListener('input',event=>{const target=event.target;if(target.dataset.fieldInput==='true'){const old=pathGet(target.dataset.path);pathSet(target.dataset.path,target.type==='checkbox'?target.checked:target.value);if(old!==target.value||target.type==='checkbox')dirty();const note=$(`[data-platform-for="${CSS.escape(target.dataset.path)}"]`);if(note)note.textContent=`Platform terdeteksi: ${detectPlatform(target.value)}`;}});
  document.addEventListener('input',event=>{const target=event.target;if(!target.dataset||!target.dataset.accentPart)return;const wrap=target.closest('.accent-field');const [i1,i2]=wrap.querySelectorAll('input');pathSet(wrap.dataset.path,composeAccent(i1.value,i2.value,wrap.dataset.after));updateAccentPreview(wrap);dirty();});
  document.addEventListener('change',event=>{const target=event.target;if(target.dataset.uploadPath){uploadImage(target.files[0],target.dataset.uploadPath,target.dataset.uploadFolder,target);}});
  document.addEventListener('click',event=>{const target=event.target.closest('button[data-action]');if(!target)return;const action=target.dataset.action; if(action==='toggle'||action==='toggle-sec'){const k=target.dataset.key;const set=action==='toggle'?state.open:state.closedSections;set.has(k)?set.delete(k):set.add(k);const y=window.scrollY;render();window.scrollTo(0,y);return;}
    if(action==='icon-pick'){pathSet(target.dataset.path,target.dataset.value);state.open.delete('icon:'+target.dataset.path);dirty();const y=window.scrollY;render();window.scrollTo(0,y);return;}if(action==='add-item'){addDefault(target.dataset.path,target.dataset.key);return;}if(action==='delete-item'){const title=target.dataset.title||'item ini';if(!confirm(`Hapus "${title}"? Tindakan ini baru berlaku di situs setelah diterbitkan.`))return;pathGet(target.dataset.path).splice(Number(target.dataset.index),1);for(const k of [...state.open])if(k.includes(target.dataset.path+'.'))state.open.delete(k);dirty();render();return;}if(action==='move-up'||action==='move-down'){const arr=pathGet(target.dataset.path);const index=Number(target.dataset.index);const next=index+(action==='move-up'?-1:1);if(next<0||next>=arr.length)return;[arr[index],arr[next]]=[arr[next],arr[index]];const ka=`${target.dataset.path}.${index}`,kb=`${target.dataset.path}.${next}`;const wa=state.open.has(ka),wb=state.open.has(kb);state.open.delete(ka);state.open.delete(kb);if(wa)state.open.add(kb);if(wb)state.open.add(ka);dirty();render();}});
  $$('.tab').forEach(tab=>tab.addEventListener('click',()=>{state.activeTab=tab.dataset.tab;render();}));$('#login-form').addEventListener('submit',login);$('#logout-button').addEventListener('click',logout);$('#reload-button').addEventListener('click',async()=>{if(state.dirty&&!confirm('Ada perubahan yang belum diterbitkan. Muat ulang akan membuang perubahan itu. Lanjutkan?'))return;await loadContent();});$('#publish-button').addEventListener('click',publish);
  (async()=>{try{await api('/api/session');showApp(true);await loadContent();}catch(_){showApp(false);}})();
})();
