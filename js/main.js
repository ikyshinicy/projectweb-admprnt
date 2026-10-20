/* ==========================================================
   main.js — menu mobile, nav aktif saat scroll, animasi muncul,
   link WhatsApp otomatis dari config.js, fallback gambar.
   ========================================================== */
(function () {
  "use strict";

  var cfg = window.SITE_CONFIG || {};
  document.documentElement.classList.remove("no-js");

  /* ---------- Link WhatsApp ----------
     Semua elemen dengan data-wa diarahkan ke wa.me.
     data-wa-text="..." mengganti pesan bawaan (dipakai tiap layanan). */
  function waLink(text) {
    var msg = text || cfg.whatsappMessage || "";
    return "https://wa.me/" + cfg.whatsapp + (msg ? "?text=" + encodeURIComponent(msg) : "");
  }
  document.querySelectorAll("[data-wa]").forEach(function (el) {
    if (!cfg.whatsapp) return;
    el.setAttribute("href", waLink(el.getAttribute("data-wa-text")));
    el.setAttribute("target", "_blank");
    el.setAttribute("rel", "noopener");
  });

  /* ---------- Data kontak di footer (hanya yang diisi) ---------- */
  document.querySelectorAll("[data-config]").forEach(function (el) {
    var key = el.getAttribute("data-config");
    var val = cfg[key];
    if (!val) { el.hidden = true; return; }
    if (key === "instagram") {
      el.setAttribute("href", "https://instagram.com/" + String(val).replace(/^@/, ""));
      el.setAttribute("target", "_blank");
      el.setAttribute("rel", "noopener");
    } else if (key === "email") {
      el.setAttribute("href", "mailto:" + val);
    }
    var label = el.querySelector("[data-label]") || el;
    if (key !== "instagram") label.textContent = val;
  });

  /* ---------- Menu mobile ---------- */
  var drawer = document.getElementById("drawer");
  var backdrop = document.getElementById("backdrop");
  var toggle = document.getElementById("menuToggle");
  var closeBtn = document.getElementById("drawerClose");

  function setDrawer(open) {
    if (!drawer) return;
    drawer.classList.toggle("open", open);
    backdrop.classList.toggle("show", open);
    drawer.setAttribute("aria-hidden", open ? "false" : "true");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    document.body.style.overflow = open ? "hidden" : "";
    if (open) closeBtn.focus(); else toggle.focus();
  }
  if (toggle) toggle.addEventListener("click", function () { setDrawer(true); });
  if (closeBtn) closeBtn.addEventListener("click", function () { setDrawer(false); });
  if (backdrop) backdrop.addEventListener("click", function () { setDrawer(false); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && drawer && drawer.classList.contains("open")) setDrawer(false);
  });
  if (drawer) drawer.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", function () { setDrawer(false); });
  });

  /* ---------- Nav aktif saat scroll ---------- */
  var navLinks = document.querySelectorAll(".nav-links a[href^='#'], .drawer a[href^='#']");
  var sections = [];
  navLinks.forEach(function (a) {
    var id = a.getAttribute("href").slice(1);
    var sec = id && document.getElementById(id);
    if (sec && sections.indexOf(sec) === -1) sections.push(sec);
  });
  if ("IntersectionObserver" in window && sections.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = entry.target.id;
        navLinks.forEach(function (a) {
          a.classList.toggle("active", a.getAttribute("href") === "#" + id);
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ---------- Animasi muncul ---------- */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("visible"); });
  }

  /* ---------- Fallback gambar belum ada ---------- */
  document.querySelectorAll(".img-slot img").forEach(function (img) {
    function mark() { img.classList.add("is-broken"); }
    if (img.complete && img.naturalWidth === 0) mark();
    img.addEventListener("error", mark);
  });
})();
