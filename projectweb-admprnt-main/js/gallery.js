/* ==========================================================
   gallery.js — kartu album + tampilan besar (lightbox)
   Mendukung FOTO dan VIDEO YouTube dalam satu album.

   Pasang di halaman dengan:
     <div class="album-grid" data-gallery data-base="../"></div>
   Atribut opsional:
     data-base      awalan path gambar ("" di beranda, "../" di /galeri/)
     data-featured  "true" = hanya album yang featured
   Filter bidang + kategori (opsional, di halaman /galeri/):
     <div class="filters" data-gallery-filters></div>
   Tab bidang (Percetakan / Reklame / Event Organizer) bisa dibuka langsung
   lewat alamat  galeri/#reklame  (id = id di GALLERY_GROUPS).

   Bentuk data (lihat js/gallery-data.js):
     album.items = [
       { type: "photo", src: "...", alt: "..." },
       { type: "video", url: "https://youtu.be/XXXX", title: "..." }
     ]
   (`photos` masih dikenali sebagai nama lama untuk `items`.)
   ========================================================== */
(function () {
  "use strict";

  var ALBUMS = window.GALLERY || [];
  var CATS = window.GALLERY_CATEGORIES || [];
  var GROUPS = window.GALLERY_GROUPS || [];
  var cfg = window.SITE_CONFIG || {};
  var mounts = document.querySelectorAll("[data-gallery]");
  if (!mounts.length) return;

  /* ---------- Util ---------- */
  function catLabel(id) {
    for (var i = 0; i < CATS.length; i++) if (CATS[i].id === id) return CATS[i].label;
    return "";
  }
  function catGroup(id) {
    for (var i = 0; i < CATS.length; i++) if (CATS[i].id === id) return CATS[i].group || "";
    return "";
  }
  function xml(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function cssVar(name, fallback) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function isAbs(u) { return /^(https?:)?\/\//i.test(u) || /^data:/i.test(u); }

  var PLAY_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"/></svg>';

  /* ---------- YouTube ----------
     Terima: youtu.be/ID, youtube.com/watch?v=ID, /shorts/ID, /embed/ID,
     /live/ID, m.youtube.com, atau ID polos (11 karakter).
     Parameter waktu mulai (?t=90 atau ?t=1m30s) ikut dibaca. */
  function parseTime(t) {
    if (!t) return 0;
    if (/^\d+$/.test(t)) return parseInt(t, 10);
    var m = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/.exec(t);
    return m ? (+m[1] || 0) * 3600 + (+m[2] || 0) * 60 + (+m[3] || 0) : 0;
  }
  function parseYouTube(input) {
    var s = String(input || "").trim();
    if (!s) return null;
    if (/^[A-Za-z0-9_-]{11}$/.test(s)) return { id: s, start: 0 };
    if (!/^https?:\/\//i.test(s)) s = "https://" + s;
    var u;
    try { u = new URL(s); } catch (e) { return null; }
    var host = u.hostname.replace(/^www\.|^m\./, "");
    var id = "";
    if (host === "youtu.be") id = u.pathname.split("/")[1] || "";
    else if (host === "youtube.com" || host === "youtube-nocookie.com" || host === "music.youtube.com") {
      var parts = u.pathname.split("/").filter(Boolean);
      if (parts[0] === "watch") id = u.searchParams.get("v") || "";
      else if (/^(shorts|embed|live|v)$/.test(parts[0])) id = parts[1] || "";
    }
    if (!/^[A-Za-z0-9_-]{11}$/.test(id)) return null;
    return { id: id, start: parseTime(u.searchParams.get("t") || u.searchParams.get("start")) };
  }

  /* ---------- Normalisasi data ----------
     Semua album dijadikan { items: [ {type, ...} ] } supaya sisa kode
     tidak perlu peduli bentuk aslinya. Video yang linknya salah dibuang
     (dan dicatat di console) agar satu salah ketik tidak merusak galeri. */
  function normalize() {
    ALBUMS.forEach(function (a) {
      var raw = a.items || a.photos || [];
      a.group = catGroup(a.category);
      a.items = [];
      raw.forEach(function (it) {
        var wantsVideo = it.type === "video" || it.url || it.youtube;
        if (wantsVideo) {
          var yt = parseYouTube(it.url || it.youtube);
          if (!yt) {
            if (window.console) console.warn("[galeri] Link YouTube tidak valid, dilewati:", it.url || it.youtube, "di album", a.id);
            return;
          }
          a.items.push({
            type: "video", id: yt.id, start: yt.start, thumb: it.thumb || "",
            title: it.title || "", alt: it.alt || (it.title ? "Video: " + it.title : "Video " + a.title)
          });
        } else {
          a.items.push({ type: "photo", src: it.src || "", alt: it.alt || "" });
        }
      });
    });
  }
  normalize();

  function counts(album) {
    var v = 0;
    album.items.forEach(function (it) { if (it.type === "video") v++; });
    return { photos: album.items.length - v, videos: v };
  }
  function countText(album) {
    var c = counts(album), out = [];
    if (c.photos) out.push(c.photos + " foto");
    if (c.videos) out.push(c.videos + " video");
    return out.join(" · ");
  }

  /* ---------- Gambar + placeholder otomatis ----------
     Setiap item punya daftar sumber gambar yang dicoba berurutan; kalau
     semuanya gagal, tampil placeholder berwarna. Warna dari base.css. */
  function placeholder(album, item, index) {
    var blue = cssVar("--primary-blue", "#087FA8");
    var cyan = cssVar("--primary-cyan", "#12B6CA");
    var orange = cssVar("--accent-orange", "#FF7600");
    var gold = cssVar("--accent-gold", "#FF9C20");
    var warm = index % 2 === 1;
    var a = warm ? orange : blue;
    var b = warm ? gold : cyan;
    var kind = item && item.type === "video" ? "Video" : "Foto";
    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900">' +
      '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="' + a + '"/><stop offset="1" stop-color="' + b + '"/></linearGradient></defs>' +
      '<rect width="1200" height="900" fill="url(#g)"/>' +
      '<circle cx="1020" cy="120" r="300" fill="#fff" fill-opacity=".12"/>' +
      '<circle cx="140" cy="820" r="220" fill="#fff" fill-opacity=".10"/>' +
      '<g fill="#fff" font-family="Arial,Helvetica,sans-serif" text-anchor="middle">' +
      '<text x="600" y="430" font-size="64" font-weight="800">' + xml(album.title) + '</text>' +
      '<text x="600" y="510" font-size="36" opacity=".85">' + kind + ' ' + (index + 1) + ' dari ' + album.items.length + '</text>' +
      "</g></svg>";
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }

  function sources(item, base) {
    if (!item) return [];
    if (item.type === "video") {
      if (item.thumb) return [isAbs(item.thumb) ? item.thumb : base + item.thumb];
      return [
        "https://i.ytimg.com/vi/" + item.id + "/maxresdefault.jpg",
        "https://i.ytimg.com/vi/" + item.id + "/mqdefault.jpg"
      ];
    }
    return item.src ? [isAbs(item.src) ? item.src : base + item.src] : [];
  }

  // coverPath (opsional) = album.cover, dipakai hanya untuk sampul kartu
  function setImg(img, album, index, base, coverPath) {
    var item = album.items[index];
    var list = coverPath ? [isAbs(coverPath) ? coverPath : base + coverPath] : sources(item, base);
    var k = 0;
    img.alt = (item && item.alt) || album.title + " — item " + (index + 1);
    img.classList.remove("is-placeholder");
    img.onerror = function () {
      k++;
      if (k < list.length) { img.src = list[k]; return; }
      img.onerror = null;
      img.src = placeholder(album, item, Math.max(index, 0));
      img.classList.add("is-placeholder");
    };
    // YouTube mengembalikan gambar 120x90 abu-abu (bukan 404) kalau maxres tidak ada
    img.onload = function () {
      if (item && item.type === "video" && !item.thumb && k === 0 && img.naturalWidth && img.naturalWidth <= 120 && list.length > 1) {
        k = 1; img.src = list[1];
      }
    };
    img.src = list.length ? list[0] : placeholder(album, item, Math.max(index, 0));
  }

  /* ---------- Kartu album ---------- */
  function buildCard(album, base) {
    var n = album.items.length;
    var cover = album.items[0];
    var btn = el("button", "album-card");
    btn.type = "button";
    btn.setAttribute("aria-haspopup", "dialog");
    btn.setAttribute("aria-label", "Buka album " + album.title + (n ? ", " + countText(album) : ""));

    var stack = el("span", "album-stack" + (n < 2 ? " is-single" : ""));
    var media = el("span", "album-media");
    var img = el("img");
    img.width = 800; img.height = 600; img.loading = "lazy"; img.decoding = "async";
    setImg(img, album, 0, base, album.cover || "");
    media.appendChild(img);

    if (cover && cover.type === "video" && !album.cover) {
      var pb = el("span", "album-play");
      pb.innerHTML = PLAY_SVG;
      media.appendChild(pb);
    }
    if (n > 1 || (cover && cover.type === "video")) media.appendChild(el("span", "album-count", countText(album)));
    media.appendChild(el("span", "album-open", "Buka album"));
    stack.appendChild(media);
    btn.appendChild(stack);

    var info = el("span", "album-info");
    info.appendChild(el("span", "album-cat", catLabel(album.category)));
    info.appendChild(el("span", "album-title", album.title));
    btn.appendChild(info);

    btn.addEventListener("click", function () { open(album, 0, base, btn); });
    return btn;
  }

  /* ---------- Render + filter ----------
     f = { group: "all" | id bidang, category: "all" | id kategori } */
  function render(mount, f) {
    f = f || { group: "all", category: "all" };
    var base = mount.getAttribute("data-base") || "";
    var onlyFeatured = mount.getAttribute("data-featured") === "true";
    var list = ALBUMS.filter(function (a) {
      if (!a.items.length) return false;
      if (onlyFeatured && !a.featured) return false;
      if (f.group !== "all" && a.group !== f.group) return false;
      return f.category === "all" || a.category === f.category;
    });
    mount.textContent = "";
    if (!list.length) {
      mount.appendChild(el("p", "gallery-empty",
        f.group !== "all" && f.category === "all"
          ? "Album untuk bidang ini segera hadir."
          : "Belum ada album di kategori ini."));
      return;
    }
    list.forEach(function (a) { mount.appendChild(buildCard(a, base)); });
  }

  function albumsIn(group, category) {
    return ALBUMS.filter(function (a) {
      return a.items.length && (group === "all" || a.group === group) && (!category || a.category === category);
    }).length;
  }

  // Dua baris: tab bidang (Percetakan / Reklame / Event Organizer) dan
  // chip kategori milik bidang yang dipilih.
  function buildFilters(bar, mount) {
    var state = { group: "all", category: "all" };
    var tabs = el("div", "gtabs");
    tabs.setAttribute("role", "group");
    tabs.setAttribute("aria-label", "Bidang");
    var subs = el("div", "filters-sub");
    subs.setAttribute("role", "group");
    subs.setAttribute("aria-label", "Kategori");
    bar.textContent = "";
    bar.appendChild(tabs);
    bar.appendChild(subs);

    var groups = [{ id: "all", label: "Semua" }].concat(GROUPS);

    function paintSubs() {
      subs.textContent = "";
      if (state.group === "all") { subs.hidden = true; return; }
      var cats = CATS.filter(function (c) { return c.group === state.group && albumsIn(state.group, c.id); });
      if (cats.length < 2) { subs.hidden = true; return; }
      subs.hidden = false;
      [{ id: "all", label: "Semua" }].concat(cats).forEach(function (c) {
        var chip = el("button", "chip", c.label);
        chip.type = "button";
        chip.setAttribute("aria-pressed", c.id === state.category ? "true" : "false");
        chip.addEventListener("click", function () {
          state.category = c.id;
          render(mount, state);
          paintSubs();
        });
        subs.appendChild(chip);
      });
    }

    function selectGroup(id, fromHash) {
      state.group = id; state.category = "all";
      tabs.querySelectorAll(".chip").forEach(function (c) {
        c.setAttribute("aria-pressed", c.getAttribute("data-group") === id ? "true" : "false");
      });
      render(mount, state);
      paintSubs();
      if (!fromHash && window.history && history.replaceState) {
        try { history.replaceState(null, "", id === "all" ? location.pathname + location.search : "#" + id); } catch (e) {}
      }
    }

    groups.forEach(function (g) {
      var n = albumsIn(g.id);
      var chip = el("button", "chip gtab", g.label);
      chip.type = "button";
      chip.setAttribute("data-group", g.id);
      chip.setAttribute("aria-pressed", g.id === "all" ? "true" : "false");
      if (g.id !== "all") chip.appendChild(el("span", "gtab-n", String(n)));
      chip.addEventListener("click", function () { selectGroup(g.id, false); });
      tabs.appendChild(chip);
    });

    function fromHash() {
      var h = decodeURIComponent((location.hash || "").replace(/^#/, ""));
      var ok = groups.some(function (g) { return g.id === h; });
      selectGroup(ok ? h : "all", true);
    }
    window.addEventListener("hashchange", fromHash);
    fromHash();
  }

  /* ---------- Lightbox ---------- */
  var lb = null, S = { album: null, i: 0, base: "", opener: null };

  function buildLightbox() {
    lb = el("div", "lb");
    lb.hidden = true;
    lb.setAttribute("role", "dialog");
    lb.setAttribute("aria-modal", "true");
    lb.setAttribute("aria-label", "Album foto dan video");
    lb.innerHTML =
      '<div class="lb-backdrop" data-close></div>' +
      '<div class="lb-panel">' +
        '<div class="lb-stage">' +
          '<button class="lb-close" type="button" aria-label="Tutup" data-close>' +
            '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button>' +
          '<button class="lb-nav lb-prev" type="button" aria-label="Sebelumnya">' +
            '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5-7 7 7 7"/></svg></button>' +
          '<img class="lb-img" alt="">' +
          '<button class="lb-play" type="button" aria-label="Putar video" hidden>' + PLAY_SVG + '</button>' +
          '<div class="lb-video" hidden></div>' +
          '<button class="lb-nav lb-next" type="button" aria-label="Berikutnya">' +
            '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg></button>' +
        '</div>' +
        '<div class="lb-meta">' +
          '<div><p class="lb-cat"></p><h2 class="lb-title"></h2></div>' +
          '<span class="lb-count" aria-live="polite"></span>' +
        '</div>' +
        '<div class="lb-thumbs" role="group" aria-label="Pilih foto atau video"></div>' +
        '<a class="btn btn-primary btn-sm lb-wa" rel="noopener" target="_blank">Pesan yang seperti ini</a>' +
      '</div>';
    document.body.appendChild(lb);

    lb.addEventListener("click", function (e) {
      if (e.target.closest("[data-close]")) close();
    });
    lb.querySelector(".lb-prev").addEventListener("click", function () { go(-1); });
    lb.querySelector(".lb-next").addEventListener("click", function () { go(1); });
    lb.querySelector(".lb-play").addEventListener("click", playVideo);

    // Geser di layar sentuh (pada foto / sampul video; pemutar YouTube menangani sentuhannya sendiri)
    var stage = lb.querySelector(".lb-stage"), x0 = null, y0 = null;
    stage.addEventListener("touchstart", function (e) {
      x0 = e.changedTouches[0].clientX; y0 = e.changedTouches[0].clientY;
    }, { passive: true });
    stage.addEventListener("touchend", function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
      x0 = null;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
    }, { passive: true });

    document.addEventListener("keydown", function (e) {
      if (lb.hidden) return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "Tab") trapFocus(e);
    });
  }

  function trapFocus(e) {
    var f = Array.prototype.filter.call(
      lb.querySelectorAll("button, a[href], iframe"),
      function (n) { return !n.hidden && n.offsetParent !== null; }
    );
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function open(album, index, base, opener) {
    if (!lb) buildLightbox();
    S.album = album; S.base = base; S.opener = opener;

    var items = album.items;
    var multi = items.length > 1;
    lb.querySelector(".lb-prev").hidden = !multi;
    lb.querySelector(".lb-next").hidden = !multi;
    lb.querySelector(".lb-title").textContent = album.title;
    lb.querySelector(".lb-cat").textContent = catLabel(album.category);

    var thumbs = lb.querySelector(".lb-thumbs");
    thumbs.textContent = "";
    thumbs.hidden = !multi;
    items.forEach(function (it, i) {
      var t = el("button", "lb-thumb" + (it.type === "video" ? " is-video" : ""));
      t.type = "button";
      t.setAttribute("aria-label", (it.type === "video" ? "Lihat video " : "Lihat foto ") + (i + 1));
      var im = el("img");
      im.width = 72; im.height = 54; im.loading = "lazy";
      setImg(im, album, i, base);
      im.alt = "";
      t.appendChild(im);
      if (it.type === "video") {
        var tp = el("span", "lb-thumb-play");
        tp.innerHTML = PLAY_SVG;
        t.appendChild(tp);
      }
      t.addEventListener("click", function () { show(i); });
      thumbs.appendChild(t);
    });

    var wa = lb.querySelector(".lb-wa");
    if (cfg.whatsapp) {
      var msg = "Halo ADAM XII PRINTING, saya tertarik dengan karya \"" + album.title +
        "\" (" + catLabel(album.category) + "). Bisa dibuatkan yang seperti ini?";
      wa.href = "https://wa.me/" + cfg.whatsapp + "?text=" + encodeURIComponent(msg);
      wa.hidden = false;
    } else {
      wa.hidden = true;
    }

    lb.hidden = false;
    document.body.style.overflow = "hidden";
    show(index);
    lb.querySelector(".lb-close").focus();
  }

  // Hentikan & lepas pemutar YouTube (menghapus iframe = video berhenti)
  function stopVideo() {
    if (!lb) return;
    var box = lb.querySelector(".lb-video");
    box.textContent = "";
    box.hidden = true;
    lb.querySelector(".lb-img").hidden = false;
  }

  function playVideo() {
    var item = S.album && S.album.items[S.i];
    if (!item || item.type !== "video") return;
    var box = lb.querySelector(".lb-video");
    var f = document.createElement("iframe");
    f.src = "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(item.id) +
      "?autoplay=1&rel=0&playsinline=1&modestbranding=1" + (item.start ? "&start=" + item.start : "");
    f.title = item.title || "Video " + S.album.title;
    f.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
    f.referrerPolicy = "strict-origin-when-cross-origin";
    box.textContent = "";
    box.appendChild(f);
    box.hidden = false;
    lb.querySelector(".lb-img").hidden = true;
    lb.querySelector(".lb-play").hidden = true;
    f.focus();
  }

  function show(i) {
    var items = S.album.items, n = items.length;
    stopVideo();
    S.i = (i + n) % n;
    var item = items[S.i];
    var img = lb.querySelector(".lb-img");
    setImg(img, S.album, S.i, S.base);
    lb.querySelector(".lb-play").hidden = item.type !== "video";
    lb.querySelector(".lb-stage").classList.toggle("is-video", item.type === "video");
    lb.querySelector(".lb-count").textContent = n > 1 ? (S.i + 1) + " / " + n : "";

    lb.querySelectorAll(".lb-thumb").forEach(function (t, k) {
      var on = k === S.i;
      t.classList.toggle("active", on);
      if (on) { t.setAttribute("aria-current", "true"); t.scrollIntoView({ block: "nearest", inline: "center" }); }
      else t.removeAttribute("aria-current");
    });

    // Muat foto tetangga lebih dulu supaya geser terasa cepat
    [S.i - 1, S.i + 1].forEach(function (k) {
      var p = items[(k + n) % n];
      if (p && p.type === "photo" && p.src) { var pre = new Image(); pre.src = isAbs(p.src) ? p.src : S.base + p.src; }
    });
  }

  function go(d) { if (S.album && S.album.items.length > 1) show(S.i + d); }

  function close() {
    stopVideo();
    lb.hidden = true;
    document.body.style.overflow = "";
    if (S.opener) S.opener.focus();
  }

  /* ---------- Mulai ---------- */
  mounts.forEach(function (m) {
    var bar = document.querySelector("[data-gallery-filters]");
    if (bar && m.hasAttribute("data-filterable")) buildFilters(bar, m);   // juga merender
    else render(m);
  });
})();
