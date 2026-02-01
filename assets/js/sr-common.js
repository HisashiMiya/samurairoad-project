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

  function applyI18nFooter(lang) {
    const dict = I18N_FOOTER[lang] || I18N_FOOTER.en;
    document.documentElement.lang = lang;

    // data-i18n のうち、辞書にあるキーだけ置換（他ページを壊さない）
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (dict[key] != null) el.textContent = dict[key];
    });

    // 任意：ボタンの表示更新（あれば）
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

    btn.addEventListener("click", () => {
      const cur = getLang();
      const next = (cur === "ja") ? "en" : "ja";
      setLang(next);
      applyI18nFooter(next);
    });
  }

  async function boot() {
    // 1) include注入 → 2) 翻訳適用 → 3) ボタン紐付け
    await applyIncludes();
    applyI18nFooter(getLang());
    bindLangButton();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();

// --- GA4 init (safe) ---
window.initGA4 = function () {
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };

  window.gtag('js', new Date());
  window.gtag('config', 'G-XPMXMPVEKV');
};