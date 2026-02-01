/* assets/js/sr-i18n.js */

/* ===== i18n dictionary ===== */
export const I18N = {
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
  }
};

/* ===== language helpers ===== */
export function getLang() {
  return (
    localStorage.getItem("sr_lang") ||
    (navigator.language?.startsWith("ja") ? "ja" : "en")
  );
}

export function setLang(lang) {
  localStorage.setItem("sr_lang", lang);
}

export function applyI18n(lang = getLang()) {
  const dict = I18N[lang] || I18N.en;
  document.documentElement.lang = lang;

  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (dict[key]) el.textContent = dict[key];
  });
}
