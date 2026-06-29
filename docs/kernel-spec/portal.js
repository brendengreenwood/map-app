/* Kernel portal — behavior */
(function () {
  "use strict";

  /* ---------- Theme toggle ---------- */
  var root = document.documentElement;
  var stored = null;
  try { stored = localStorage.getItem("kernel-theme"); } catch (e) {}
  if (stored === "dark") root.classList.add("dark");
  if (stored === "light") root.classList.remove("dark");

  function toggleTheme() {
    var dark = root.classList.toggle("dark");
    try { localStorage.setItem("kernel-theme", dark ? "dark" : "light"); } catch (e) {}
  }
  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-theme-toggle]");
    if (t) { toggleTheme(); }
  });

  /* ---------- Toast ---------- */
  var toast = document.getElementById("toast");
  var toastTimer = null;
  function showToast(msg) {
    if (!toast) return;
    toast.querySelector(".toast-msg").textContent = msg;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove("show"); }, 1600);
  }

  function copyText(text, label) {
    var done = function () { showToast((label || "Copied") + " — " + text); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, fallback);
    } else { fallback(); }
    function fallback() {
      var ta = document.createElement("textarea");
      ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); } catch (e) {}
      document.body.removeChild(ta); done();
    }
  }

  /* ---------- Click-to-copy (swatches, tokens) ---------- */
  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-copy]");
    if (!el) return;
    copyText(el.getAttribute("data-copy"), el.getAttribute("data-copy-label") || "Copied");
  });

  /* ---------- Copy buttons (code blocks) ---------- */
  document.addEventListener("click", function (e) {
    var btn = e.target.closest(".copy-btn");
    if (!btn) return;
    var sel = btn.getAttribute("data-copy-target");
    var text = "";
    if (sel) {
      var src = document.querySelector(sel);
      if (src) text = src.textContent;
    } else if (btn.getAttribute("data-copy")) {
      text = btn.getAttribute("data-copy");
    }
    copyText(text.trim(), "Copied");
    var labelEl = btn.querySelector(".copy-btn-label");
    var prev = labelEl ? labelEl.textContent : null;
    btn.classList.add("copied");
    if (labelEl) labelEl.textContent = "Copied";
    setTimeout(function () {
      btn.classList.remove("copied");
      if (labelEl && prev !== null) labelEl.textContent = prev;
    }, 1400);
  });

  /* ---------- Tabs ---------- */
  document.addEventListener("click", function (e) {
    var tab = e.target.closest(".tab");
    if (!tab) return;
    var list = tab.closest(".tabs");
    if (!list) return;
    list.querySelectorAll(".tab").forEach(function (t) { t.classList.remove("active"); });
    tab.classList.add("active");
    var panelId = tab.getAttribute("data-tab");
    list.querySelectorAll(".tab-panel").forEach(function (p) {
      p.hidden = p.getAttribute("data-panel") !== panelId;
    });
  });

  /* ---------- Accordion ---------- */
  document.addEventListener("click", function (e) {
    var head = e.target.closest(".acc-head");
    if (!head) return;
    var item = head.closest(".acc-item");
    var acc = item.closest(".accordion");
    var wasOpen = item.classList.contains("open");
    acc.querySelectorAll(".acc-item").forEach(function (i) { i.classList.remove("open"); });
    if (!wasOpen) item.classList.add("open");
  });

  /* ---------- Collapsible ---------- */
  document.addEventListener("click", function (e) {
    var head = e.target.closest(".collapsible-head");
    if (!head) return;
    var body = head.parentElement.querySelector(".collapsible-body");
    if (body) body.hidden = !body.hidden;
  });

  /* ---------- Table playground (density / style) ---------- */
  document.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-dt-set]");
    if (!btn) return;
    var group = btn.closest("[data-dt-group]");
    var targetSel = group.getAttribute("data-dt-target");
    var table = document.querySelector(targetSel);
    if (!table) return;
    var kind = group.getAttribute("data-dt-group"); // "density" | "style"
    var value = btn.getAttribute("data-dt-set");
    group.querySelectorAll("[data-dt-set]").forEach(function (b) { b.classList.remove("on"); });
    btn.classList.add("on");
    if (kind === "density") {
      table.classList.remove("density-compact", "density-comfortable");
      if (value !== "default") table.classList.add("density-" + value);
    } else {
      table.classList.remove("striped", "bordered", "borderless");
      if (value !== "default") table.classList.add(value);
    }
  });

  /* ---------- Expandable table rows ---------- */
  document.addEventListener("click", function (e) {
    var caret = e.target.closest(".dt-caret");
    if (!caret) return;
    var row = caret.closest("tr");
    var panel = row.nextElementSibling;
    if (!panel || !panel.classList.contains("dt-expand-row")) return;
    var open = caret.classList.toggle("open");
    row.classList.toggle("expanded", open);
    panel.hidden = !open;
  });

  /* ---------- Scrollspy ---------- */
  var links = Array.prototype.slice.call(document.querySelectorAll(".nav-link[data-section]"));
  var sections = links.map(function (l) { return document.getElementById(l.getAttribute("data-section")); }).filter(Boolean);
  function onScroll() {
    var pos = window.scrollY + 120;
    var current = sections[0];
    for (var i = 0; i < sections.length; i++) {
      if (sections[i].offsetTop <= pos) current = sections[i];
    }
    links.forEach(function (l) {
      l.classList.toggle("active", current && l.getAttribute("data-section") === current.id);
    });
    var crumb = document.getElementById("crumb-section");
    if (crumb && current) {
      var link = links.find(function (l) { return l.getAttribute("data-section") === current.id; });
      if (link) crumb.textContent = link.getAttribute("data-title") || link.textContent.trim();
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
})();
