/* ==========================================================
   gallery.js — kartu album + tampilan besar (lightbox)

   Pasang di halaman dengan:
     <div class="album-grid" data-gallery data-base="../"></div>
   Atribut opsional:
     data-base      awalan path gambar ("" di beranda, "../" di /galeri/)
     data-featured  "true" = hanya album yang featured
   Filter kategori (opsional):
     <div class="filters" data-gallery-filters></div>
   ========================================================== */
(function () {
  "use strict";

  var ALBUMS = window.GALLERY || [];
  var CATS = window.GALLERY_CATEGORIES || [];
  var cfg = window.SITE_CONFIG || {};
  var mounts = document.querySelectorAll("[data-gallery]");
  if (!mounts.length) return;

  /* ---------- Util ---------- */
  function catLabel(id) {
    for (var i = 0; i < CATS.length; i++) if (CATS[i].id === id) return CATS[i].label;
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

  /* ---------- Placeholder otomatis ----------
     Dipakai kalau file foto belum ada. Warna diambil dari base.css. */
  function placeholder(album, index) {
    var blue = cssVar("--primary-blue", "#087FA8");
    var cyan = cssVar("--primary-cyan", "#12B6CA");
    var orange = cssVar("--accent-orange", "#FF7600");
    var gold = cssVar("--accent-gold", "#FF9C20");
    var warm = index % 2 === 1;
    var a = warm ? orange : blue;
    var b = warm ? gold : cyan;
    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900">' +
      '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="' + a + '"/><stop offset="1" stop-color="' + b + '"/></linearGradient></defs>' +
      '<rect width="1200" height="900" fill="url(#g)"/>' +
      '<circle cx="1020" cy="120" r="300" fill="#fff" fill-opacity=".12"/>' +
      '<circle cx="140" cy="820" r="220" fill="#fff" fill-opacity=".10"/>' +
      '<g fill="#fff" font-family="Arial,Helvetica,sans-serif" text-anchor="middle">' +
      '<text x="600" y="430" font-size="64" font-weight="800">' + xml(album.title) + '</text>' +
      '<text x="600" y="510" font-size="36" opacity=".85">Foto ' + (index + 1) + ' dari ' + album.photos.length + '</text>' +
      "</g></svg>";
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }

  function setImg(img, album, index, base) {
    var photo = album.photos[index] || {};
    var src = index === -1 ? album.cover : photo.src;
    img.alt = photo.alt || album.title + " — foto " + (index + 1);
    img.onerror = function () {
      img.onerror = null;
      img.src = placeholder(album, Math.max(index, 0));
      img.classList.add("is-placeholder");
    };
    img.classList.remove("is-placeholder");
    img.src = src ? base + src : placeholder(album, Math.max(index, 0));
  }

  /* ---------- Kartu album ---------- */
  function buildCard(album, base) {
    var n = album.photos.length;
    var btn = el("button", "album-card");
    btn.type = "button";
    btn.setAttribute("aria-haspopup", "dialog");
    btn.setAttribute("aria-label", "Buka album " + album.title + ", " + n + " foto");

    var stack = el("span", "album-stack" + (n < 2 ? " is-single" : ""));
    var media = el("span", "album-media");
    var img = el("img");
    img.width = 800; img.height = 600; img.loading = "lazy"; img.decoding = "async";
    if (album.cover) {
      album.photos.length && (album.photos[0].src !== album.cover) && (function () {})();
    }
    setImg(img, album, 0, base);
    if (album.cover) {
      img.onerror = function () { img.onerror = null; img.src = placeholder(album, 0); img.classList.add("is-placeholder"); };
      img.src = base + album.cover;
    }
    media.appendChild(img);
    if (n > 1) media.appendChild(el("span", "album-count", n + " foto"));
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

  /* ---------- Render + filter ---------- */
  function render(mount, category) {
    var base = mount.getAttribute("data-base") || "";
    var onlyFeatured = mount.getAttribute("data-featured") === "true";
    var list = ALBUMS.filter(function (a) {
      if (onlyFeatured && !a.featured) return false;
      return !category || category === "all" || a.category === category;
    });
    mount.textContent = "";
    if (!list.length) {
      mount.appendChild(el("p", "gallery-empty", "Belum ada album di kategori ini."));
      return;
    }
    list.forEach(function (a) { mount.appendChild(buildCard(a, base)); });
  }

  function buildFilters(bar, mount) {
    var used = {};
    ALBUMS.forEach(function (a) { used[a.category] = (used[a.category] || 0) + 1; });
    var items = [{ id: "all", label: "Semua", count: ALBUMS.length }];
    CATS.forEach(function (c) { if (used[c.id]) items.push({ id: c.id, label: c.label, count: used[c.id] }); });

    items.forEach(function (it, i) {
      var chip = el("button", "chip", it.label);
      chip.type = "button";
      chip.setAttribute("aria-pressed", i === 0 ? "true" : "false");
      chip.addEventListener("click", function () {
        bar.querySelectorAll(".chip").forEach(function (c) { c.setAttribute("aria-pressed", "false"); });
        chip.setAttribute("aria-pressed", "true");
        render(mount, it.id);
      });
      bar.appendChild(chip);
    });
  }

  /* ---------- Lightbox ---------- */
  var lb = null, S = { album: null, i: 0, base: "", opener: null };

  function buildLightbox() {
    lb = el("div", "lb");
    lb.hidden = true;
    lb.setAttribute("role", "dialog");
    lb.setAttribute("aria-modal", "true");
    lb.setAttribute("aria-label", "Album foto");
    lb.innerHTML =
      '<div class="lb-backdrop" data-close></div>' +
      '<div class="lb-panel">' +
        '<div class="lb-stage">' +
          '<button class="lb-close" type="button" aria-label="Tutup" data-close>' +
            '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button>' +
          '<button class="lb-nav lb-prev" type="button" aria-label="Foto sebelumnya">' +
            '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5-7 7 7 7"/></svg></button>' +
          '<img class="lb-img" alt="">' +
          '<button class="lb-nav lb-next" type="button" aria-label="Foto berikutnya">' +
            '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg></button>' +
        '</div>' +
        '<div class="lb-meta">' +
          '<div><p class="lb-cat"></p><h2 class="lb-title"></h2></div>' +
          '<span class="lb-count" aria-live="polite"></span>' +
        '</div>' +
        '<div class="lb-thumbs" role="group" aria-label="Pilih foto"></div>' +
        '<a class="btn btn-primary btn-sm lb-wa" rel="noopener" target="_blank">Pesan yang seperti ini</a>' +
      '</div>';
    document.body.appendChild(lb);

    lb.addEventListener("click", function (e) {
      if (e.target.closest("[data-close]")) close();
    });
    lb.querySelector(".lb-prev").addEventListener("click", function () { go(-1); });
    lb.querySelector(".lb-next").addEventListener("click", function () { go(1); });

    // Geser di layar sentuh
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
      lb.querySelectorAll("button, a[href]"),
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

    var multi = album.photos.length > 1;
    lb.querySelector(".lb-prev").hidden = !multi;
    lb.querySelector(".lb-next").hidden = !multi;
    lb.querySelector(".lb-title").textContent = album.title;
    lb.querySelector(".lb-cat").textContent = catLabel(album.category);

    var thumbs = lb.querySelector(".lb-thumbs");
    thumbs.textContent = "";
    thumbs.hidden = !multi;
    album.photos.forEach(function (p, i) {
      var t = el("button", "lb-thumb");
      t.type = "button";
      t.setAttribute("aria-label", "Lihat foto " + (i + 1));
      var im = el("img");
      im.width = 72; im.height = 54; im.loading = "lazy";
      setImg(im, album, i, base);
      im.alt = "";
      t.appendChild(im);
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

  function show(i) {
    var n = S.album.photos.length;
    S.i = (i + n) % n;
    var img = lb.querySelector(".lb-img");
    setImg(img, S.album, S.i, S.base);
    lb.querySelector(".lb-count").textContent = n > 1 ? (S.i + 1) + " / " + n : "";

    lb.querySelectorAll(".lb-thumb").forEach(function (t, k) {
      var on = k === S.i;
      t.classList.toggle("active", on);
      if (on) { t.setAttribute("aria-current", "true"); t.scrollIntoView({ block: "nearest", inline: "center" }); }
      else t.removeAttribute("aria-current");
    });

    // Muat foto tetangga lebih dulu supaya geser terasa cepat
    [S.i - 1, S.i + 1].forEach(function (k) {
      var p = S.album.photos[(k + n) % n];
      if (p && p.src) { var pre = new Image(); pre.src = S.base + p.src; }
    });
  }

  function go(d) { if (S.album && S.album.photos.length > 1) show(S.i + d); }

  function close() {
    lb.hidden = true;
    document.body.style.overflow = "";
    if (S.opener) S.opener.focus();
  }

  /* ---------- Mulai ---------- */
  mounts.forEach(function (m) {
    render(m, "all");
    var bar = document.querySelector("[data-gallery-filters]");
    if (bar && m.hasAttribute("data-filterable")) buildFilters(bar, m);
  });
})();
