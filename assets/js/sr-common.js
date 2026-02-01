// assets/js/sr-common.js
(function () {
  async function includeHTML() {
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
        el.innerHTML =
          `<footer class="sr-footer"><p style="color:rgba(190,190,190,.9)">footer load failed.</p></footer>`;
      }
    }));
  }

  async function boot() {
    await includeHTML();
    if (typeof initLang === "function") initLang();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
