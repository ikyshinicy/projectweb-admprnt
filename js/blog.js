/* ==========================================================
   blog.js — halaman Blog: video (atas) + artikel web (bawah)
   Video: YouTube (landscape), Instagram & TikTok (portrait).
   Data dari js/blog-data.js. Tombol filter kategori berlaku untuk keduanya.
   Bisa dibuka langsung lewat  blog/#reklame  (id = id kategori).
   ========================================================== */
(function () {
  "use strict";

  var VIDEOS = window.BLOG_VIDEOS || [];
  var ARTICLES = window.BLOG_ARTICLES || [];
  var CATS = window.BLOG_CATEGORIES || [];

  var bar = document.querySelector("[data-blog-filters]");
  var vGrid = document.querySelector("[data-blog-videos]");
  var aGrid = document.querySelector("[data-blog-articles]");
  if (!vGrid && !aGrid) return;

  /* ---------- Util ---------- */
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function isAbs(u) { return /^(https?:)?\/\//i.test(u) || /^data:/i.test(u); }
  // Halaman ini ada di /blog/, jadi path file lokal (assets/...) harus naik satu folder
  function asset(u) { return (isAbs(u) || u.charAt(0) === "/") ? u : "../" + u; }
  function catLabel(id) {
    for (var i = 0; i < CATS.length; i++) if (CATS[i].id === id) return CATS[i].label;
    return "";
  }
  function host(u) {
    try { return new URL(u).hostname.replace(/^www\./, ""); } catch (e) { return ""; }
  }
  var PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"/></svg>';
  var IMG = '<svg class="post-ph" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10.5" r="1.8"/><path d="m21 16-5-5-8 8"/></svg>';

  /* ---------- YouTube ---------- */
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
    var h = u.hostname.replace(/^www\.|^m\./, "");
    var id = "", short = false;
    if (h === "youtu.be") id = u.pathname.split("/")[1] || "";
    else if (h === "youtube.com" || h === "youtube-nocookie.com" || h === "music.youtube.com") {
      var parts = u.pathname.split("/").filter(Boolean);
      if (parts[0] === "watch") id = u.searchParams.get("v") || "";
      else if (/^(shorts|embed|live|v)$/.test(parts[0])) { id = parts[1] || ""; short = parts[0] === "shorts"; }
    }
    if (!/^[A-Za-z0-9_-]{11}$/.test(id)) return null;
    return { kind: "youtube", label: "YouTube", id: id, portrait: short,
             start: parseTime(u.searchParams.get("t") || u.searchParams.get("start")) };
  }

  /* ---------- Instagram (reel / post / tv) ---------- */
  function parseInstagram(input) {
    var s = String(input || "").trim();
    if (!/^https?:\/\//i.test(s)) s = "https://" + s;
    var u;
    try { u = new URL(s); } catch (e) { return null; }
    var h = u.hostname.replace(/^www\.|^m\./, "");
    if (h !== "instagram.com" && h !== "instagr.am") return null;
    var parts = u.pathname.split("/").filter(Boolean);
    for (var i = 0; i < parts.length - 1; i++) {
      if (/^(reel|reels|p|tv)$/.test(parts[i])) {
        var code = parts[i + 1];
        if (!/^[A-Za-z0-9_-]{5,}$/.test(code)) return null;
        var path = /^(reel|reels|tv)$/.test(parts[i]) ? "reel" : "p";
        return { kind: "instagram", label: "Instagram", id: code, path: path, portrait: true };
      }
    }
    return null;   // mis. link profil (instagram.com/akun) tidak bisa di-embed
  }

  /* ---------- TikTok ---------- */
  function parseTikTok(input) {
    var s = String(input || "").trim();
    if (!/^https?:\/\//i.test(s)) s = "https://" + s;
    var u;
    try { u = new URL(s); } catch (e) { return null; }
    var h = u.hostname.replace(/^www\.|^m\./, "");
    if (h !== "tiktok.com") return null;   // vm.tiktok.com / vt.tiktok.com (link pendek) tidak didukung
    var m = /\/(?:video|v1|v2)\/(\d{8,25})/.exec(u.pathname);
    return m ? { kind: "tiktok", label: "TikTok", id: m[1], portrait: true } : null;
  }

  /* Deteksi platform dari link */
  function parseVideo(input) {
    var s = String(input || "").trim();
    if (!s) return null;
    if (/instagram\.com|instagr\.am/i.test(s)) return parseInstagram(s);
    if (/tiktok\.com/i.test(s)) return parseTikTok(s);
    return parseYouTube(s);
  }

  /* ---------- Gambar dengan cadangan ---------- */
  function loadImg(img, list) {
    var k = 0;
    img.onerror = function () {
      k++;
      if (k < list.length) { img.src = list[k]; return; }
      img.onerror = null;
      img.classList.add("is-broken");   // tampilkan ikon placeholder
    };
    img.src = list[0];
  }

  /* ---------- Kartu video ---------- */
  var playing = null;   // { media, build }

  function buildVideoMedia(media, v, yt) {
    media.textContent = "";
    media.classList.remove("is-playing");
    var img = el("img");
    img.width = 800; img.height = 450; img.loading = "lazy"; img.decoding = "async";
    img.alt = "";
    media.appendChild(img);
    media.insertAdjacentHTML("beforeend", IMG);

    if (!yt) {                         // belum ada link: kotak "Segera hadir"
      img.classList.add("is-broken");
      media.appendChild(el("span", "post-soon", "Segera hadir"));
      return;
    }
    var thumbs = [];
    if (v.thumb) thumbs = [asset(v.thumb)];
    else if (yt.kind === "youtube") thumbs = ["https://i.ytimg.com/vi/" + yt.id + "/maxresdefault.jpg", "https://i.ytimg.com/vi/" + yt.id + "/hqdefault.jpg"];
    if (thumbs.length) {
      loadImg(img, thumbs);
      // YouTube membalas gambar kecil abu-abu (bukan 404) kalau maxres tidak ada
      img.onload = function () {
        if (!v.thumb && img.naturalWidth && img.naturalWidth <= 120 && thumbs.length > 1 && img.src.indexOf("maxres") > -1) img.src = thumbs[1];
      };
    } else img.classList.add("is-broken");   // Instagram/TikTok tanpa thumb: ikon placeholder

    var btn = el("button", "video-play");
    btn.type = "button";
    btn.setAttribute("aria-label", "Putar video: " + v.title);
    btn.innerHTML = PLAY;
    btn.addEventListener("click", function () { play(media, v, yt); });
    media.appendChild(btn);
  }

  function play(media, v, yt) {
    if (playing && playing.media !== media) playing.build();   // kembalikan video sebelumnya ke sampul
    media.textContent = "";
    media.classList.add("is-playing");
    var f = document.createElement("iframe");
    if (yt.kind === "instagram") {
      f.src = "https://www.instagram.com/" + yt.path + "/" + encodeURIComponent(yt.id) + "/embed/";
      f.setAttribute("scrolling", "no");
      f.allow = "encrypted-media; fullscreen; clipboard-write";
    } else if (yt.kind === "tiktok") {
      f.src = "https://www.tiktok.com/embed/v2/" + encodeURIComponent(yt.id);
      f.setAttribute("scrolling", "no");
      f.allow = "autoplay; encrypted-media; fullscreen";
    } else {
      f.src = "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(yt.id) +
        "?autoplay=1&rel=0&playsinline=1&modestbranding=1" + (yt.start ? "&start=" + yt.start : "");
      f.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
    }
    f.title = v.title;
    f.allowFullscreen = true;
    f.referrerPolicy = "strict-origin-when-cross-origin";
    media.appendChild(f);
    f.focus();
    playing = { media: media, build: function () { buildVideoMedia(media, v, yt); } };
  }

  function isPortrait(v, vid) {
    if (v.format) return v.format === "portrait";     // pilihan manual: "portrait" / "landscape"
    return vid ? !!vid.portrait : false;
  }

  function videoCard(v) {
    var vid = parseVideo(v.url);
    if (v.url && !vid && window.console) {
      console.warn("[blog] Link video tidak valid / tidak didukung:", v.url, "di video", v.title,
        "(didukung: YouTube, Instagram reel/post, TikTok link lengkap .../video/angka)");
    }
    var portrait = isPortrait(v, vid);
    var card = el("article", "card post video-card" + (portrait ? " video-card--portrait" : ""));
    var media = el("div", "post-media video-media img-slot" +
      (portrait ? " video-media--portrait" : "") + (vid && vid.kind === "instagram" ? " is-ig" : ""));
    buildVideoMedia(media, v, vid);
    card.appendChild(media);

    var body = el("div", "post-body");
    var meta = el("div", "post-meta");
    if (catLabel(v.category)) meta.appendChild(el("span", "post-cat", catLabel(v.category)));
    if (vid && vid.kind !== "youtube") meta.appendChild(el("span", "", vid.label));
    if (v.date) meta.appendChild(el("span", "", v.date));
    body.appendChild(meta);
    body.appendChild(el("h3", "", v.title));
    if (v.desc) body.appendChild(el("p", "", v.desc));
    card.appendChild(body);
    return { card: card, portrait: portrait };
  }

  /* ---------- Kartu artikel ---------- */
  function articleCard(a) {
    var live = !!a.url;
    var source = a.source || host(a.url);
    var card = el("article", "card post");

    var media = el(live ? "a" : "div", "post-media img-slot");
    if (live) {
      media.href = a.url; media.target = "_blank"; media.rel = "noopener noreferrer";
      media.tabIndex = -1; media.setAttribute("aria-hidden", "true");
    }
    var img = el("img");
    img.width = 800; img.height = 500; img.loading = "lazy"; img.decoding = "async"; img.alt = "";
    media.appendChild(img);
    media.insertAdjacentHTML("beforeend", IMG);
    if (a.image) loadImg(img, [asset(a.image)]); else img.classList.add("is-broken");
    if (!live) media.appendChild(el("span", "post-soon", "Segera hadir"));
    card.appendChild(media);

    var body = el("div", "post-body");
    var meta = el("div", "post-meta");
    if (catLabel(a.category)) meta.appendChild(el("span", "post-cat", catLabel(a.category)));
    if (source) meta.appendChild(el("span", "", source));
    if (a.date) meta.appendChild(el("span", "", a.date));
    body.appendChild(meta);

    var h = el("h3");
    if (live) {
      var link = el("a", "", a.title);
      link.href = a.url; link.target = "_blank"; link.rel = "noopener noreferrer";
      h.appendChild(link);
    } else h.textContent = a.title;
    body.appendChild(h);
    if (a.excerpt) body.appendChild(el("p", "", a.excerpt));
    if (live) {
      var more = el("a", "detail", "Baca di " + (source || "situs asli") + " ↗");
      more.href = a.url; more.target = "_blank"; more.rel = "noopener noreferrer";
      body.appendChild(more);
    }
    card.appendChild(body);
    return card;
  }

  /* ---------- Render + filter ---------- */
  var state = "all";

  function fill(grid, list, build, emptyText) {
    if (!grid) return;
    grid.textContent = "";
    var items = list.filter(function (x) { return state === "all" || x.category === state; });
    if (!items.length) { grid.appendChild(el("p", "blog-empty", emptyText)); return; }
    items.forEach(function (x) { grid.appendChild(build(x)); });
  }

  // Video landscape (YouTube) di grid utama; video portrait (IG/TikTok/Shorts) di grid sendiri di bawahnya
  var pGrid = null;
  if (vGrid) {
    pGrid = el("div", "blog-grid blog-grid--portrait");
    pGrid.hidden = true;
    vGrid.parentNode.insertBefore(pGrid, vGrid.nextSibling);
  }

  function renderVideos() {
    if (!vGrid) return;
    vGrid.textContent = ""; pGrid.textContent = "";
    var items = VIDEOS.filter(function (x) { return state === "all" || x.category === state; });
    var land = [], port = [];
    items.forEach(function (x) { var c = videoCard(x); (c.portrait ? port : land).push(c.card); });

    if (!items.length) {
      vGrid.hidden = false; pGrid.hidden = true;
      vGrid.appendChild(el("p", "blog-empty", state === "all" ? "Video segera hadir." : "Belum ada video di kategori ini."));
      return;
    }
    land.forEach(function (c) { vGrid.appendChild(c); });
    port.forEach(function (c) { pGrid.appendChild(c); });
    vGrid.hidden = !land.length;
    pGrid.hidden = !port.length;
  }

  function render() {
    playing = null;
    renderVideos();
    fill(aGrid, ARTICLES, articleCard, state === "all" ? "Artikel segera hadir." : "Belum ada artikel di kategori ini.");
    if (bar) bar.querySelectorAll("[data-filter]").forEach(function (c) {
      c.setAttribute("aria-pressed", c.getAttribute("data-filter") === state ? "true" : "false");
    });
  }

  function select(id, fromHash) {
    state = id;
    render();
    if (!fromHash && window.history && history.replaceState) {
      try { history.replaceState(null, "", id === "all" ? location.pathname + location.search : "#" + id); } catch (e) {}
    }
  }

  if (bar) {
    bar.textContent = "";
    [{ id: "all", label: "Semua" }].concat(CATS).forEach(function (c) {
      var chip = el("button", "chip", c.label);
      chip.type = "button";
      chip.setAttribute("data-filter", c.id);
      chip.setAttribute("aria-pressed", "false");
      chip.addEventListener("click", function () { select(c.id, false); });
      bar.appendChild(chip);
    });
  }

  function fromHash() {
    var h = decodeURIComponent((location.hash || "").replace(/^#/, ""));
    var ok = CATS.some(function (c) { return c.id === h; });
    // #video / #artikel hanya lompat ke bagiannya, filter tidak diubah
    if (!ok && (h === "video" || h === "artikel")) { render(); return; }
    select(ok ? h : "all", true);
  }
  window.addEventListener("hashchange", fromHash);
  fromHash();
})();
