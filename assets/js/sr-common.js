// assets/js/sr-common.js
(() => {
  // --- footer dictionary (EN/JA) ---
  const I18N_FOOTER = {
    ja: {
      footer_tagline: "街道を、みんなでつないで育てる。",
      footer_map: "地図",
      footer_github: "GitHub",
      footer_support: "Support",
      footer_license: "ライセンス",
      footer_report: "修正提案（フォーム）",
    },
    en: {
      footer_tagline: "Connecting historic roads, together.",
      footer_map: "Map",
      footer_github: "GitHub",
      footer_support: "Support",
      footer_license: "License",
      footer_report: "Report an issue",
    },
  };

  function getLang() {
    return (
      localStorage.getItem("sr_lang") ||
      (navigator.language && navigator.language.startsWith("ja") ? "ja" : "en")
    );
  }

  function setLang(lang) {
    localStorage.setItem("sr_lang", lang);
  }

  function getDict(lang) {
    // Page-level dictionary (optional): define as window.SR_I18N in each page
    const page = window.SR_I18N;
    if (page && (page[lang] || page.en)) return page[lang] || page.en;
    return I18N_FOOTER[lang] || I18N_FOOTER.en;
  }

  function applyI18n(lang) {
    const dict = getDict(lang);
    document.documentElement.lang = lang;

    // Replace only keys that exist in the dictionary (do not break other pages)
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (dict[key] == null) return;

      // Allow <br> etc. for rich strings (hero_title). If you want strict safety, change to textContent.
      el.innerHTML = dict[key];
    });

    // Update label if exists (label shows "the other language" to switch to)
    const label = document.getElementById("langLabel");
    if (label) label.textContent = (lang === "ja") ? "EN" : "JP";
  }

  async function applyIncludes() {
    const nodes = document.querySelectorAll("[data-include]");
    await Promise.all([...nodes].map(async (el) => {
      const url = el.getAttribute("data-include");
      if (!url) return;

      try {
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        el.innerHTML = await res.text();
      } catch (e) {
        console.warn("include failed:", url, e);
        el.innerHTML = `<footer class="sr-footer"><p style="color:rgba(190,190,190,.9)">footer load failed.</p></footer>`;
      }
    }));
  }

  function bindLangButton() {
    const btn = document.getElementById("langBtn");
    if (!btn) return;

    // Prevent double-binding (when multiple scripts try to bind)
    if (btn.dataset.srBound === "1") return;
    btn.dataset.srBound = "1";

    btn.addEventListener("click", () => {
      const cur = getLang();
      const next = (cur === "ja") ? "en" : "ja";
      setLang(next);
      applyI18n(next);
    });
  }

  async function boot() {
    // 1) include injection → 2) i18n apply → 3) bind button
    await applyIncludes();
    applyI18n(getLang());
    bindLangButton();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();


// --- GA4 init (safe): define and auto-run once ---
(function () {
  window.initGA4 = window.initGA4 || function () {
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };

    window.gtag("js", new Date());
    window.gtag("config", "G-XPMXMPVEKV");
  };

  if (window.__srGA4Inited) return;
  window.__srGA4Inited = true;

  // If gtag.js hasn't loaded yet, this still queues into dataLayer.
  try { window.initGA4(); } catch (e) { console.warn("GA4 init skipped:", e); }
})();
