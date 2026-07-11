(() => {
  "use strict";

  const documentElement = document.documentElement;
  const body = document.body;
  const config = window.PORTFOLIO_CONFIG || {};
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const themeKey = "frankie-portfolio-theme-v2";

  function initializeYear() {
    $$('[data-year]').forEach((node) => {
      node.textContent = String(new Date().getFullYear());
    });
  }

  function setMenu(open) {
    body.classList.toggle("menu-open", open);
    $('[data-menu-button]')?.setAttribute("aria-expanded", String(open));
    $('[data-mobile-menu]')?.setAttribute("aria-hidden", String(!open));
  }

  function initializeMenu() {
    const button = $('[data-menu-button]');
    button?.addEventListener("click", () => setMenu(!body.classList.contains("menu-open")));
    $$('[data-mobile-menu] a').forEach((link) => link.addEventListener("click", () => setMenu(false)));
  }

  function applyTheme(a, b, save = true) {
    if (!a || !b) return;
    documentElement.style.setProperty("--theme-a", a);
    documentElement.style.setProperty("--theme-b", b);
    const inputA = $('[data-color-a]');
    const inputB = $('[data-color-b]');
    if (inputA) inputA.value = a;
    if (inputB) inputB.value = b;
    if (save) {
      try { localStorage.setItem(themeKey, JSON.stringify({ a, b })); } catch (_) { /* private mode */ }
    }
  }

  function setThemePanel(open) {
    body.classList.toggle("theme-open", open);
    $('[data-theme-panel]')?.setAttribute("aria-hidden", String(!open));
  }

  function initializeTheme() {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(themeKey) || "null"); } catch (_) { saved = null; }
    applyTheme(saved?.a || config.themeColorA || "#ff7448", saved?.b || config.themeColorB || "#745cff", false);

    $$('[data-theme-open]').forEach((button) => button.addEventListener("click", () => setThemePanel(true)));
    $('[data-theme-close]')?.addEventListener("click", () => setThemePanel(false));
    $('[data-theme-scrim]')?.addEventListener("click", () => setThemePanel(false));
    $$('[data-theme-preset]').forEach((button) => {
      button.addEventListener("click", () => applyTheme(button.dataset.a, button.dataset.b));
    });
    const custom = () => applyTheme($('[data-color-a]')?.value, $('[data-color-b]')?.value);
    $('[data-color-a]')?.addEventListener("input", custom);
    $('[data-color-b]')?.addEventListener("input", custom);
  }

  function initializeReveals() {
    const items = $$('[data-reveal]');
    if (!items.length) return;
    if (reducedMotion.matches || !("IntersectionObserver" in window)) {
      items.forEach((item) => item.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -5%" });
    items.forEach((item) => observer.observe(item));
  }

  function initializeHeroSlideshow() {
    const slides = $$('[data-hero-slide]');
    if (slides.length < 2) return;
    const counter = $('[data-hero-counter]');
    let index = 0;
    let timer = 0;
    const interval = Math.max(2800, Number(config.heroIntervalMs) || 6500);

    const show = (next) => {
      index = (next + slides.length) % slides.length;
      slides.forEach((slide, slideIndex) => {
        const active = slideIndex === index;
        slide.classList.toggle("is-active", active);
        slide.setAttribute("aria-hidden", String(!active));
      });
      if (counter) counter.textContent = `${String(index + 1).padStart(2, "0")} / ${String(slides.length).padStart(2, "0")}`;
    };

    const stop = () => window.clearInterval(timer);
    const start = () => {
      stop();
      if (!reducedMotion.matches && !document.hidden) timer = window.setInterval(() => show(index + 1), interval);
    };

    document.addEventListener("visibilitychange", start);
    reducedMotion.addEventListener?.("change", start);
    start();
  }

  function initializeCardMotion() {
    if (reducedMotion.matches || !window.matchMedia("(pointer: fine)").matches) return;
    $$('[data-tilt], .category-card, .project-card').forEach((card) => {
      card.addEventListener("pointermove", (event) => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `perspective(900px) rotateX(${(-y * 2.2).toFixed(2)}deg) rotateY(${(x * 2.2).toFixed(2)}deg) translateY(-2px)`;
      });
      card.addEventListener("pointerleave", () => { card.style.transform = ""; });
    });
  }

  function initializeLightbox() {
    const items = $$('[data-lightbox]');
    if (!items.length) return;
    let current = 0;
    let lastFocused = null;

    const overlay = document.createElement("div");
    overlay.className = "lightbox";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Photograph viewer");
    overlay.innerHTML = `
      <div class="lightbox-bar"><span class="lightbox-count"></span><button type="button" data-lightbox-close>Close</button></div>
      <div class="lightbox-stage">
        <button class="lightbox-nav" type="button" data-lightbox-prev aria-label="Previous photograph">←</button>
        <div class="lightbox-image-wrap"><img class="lightbox-image" alt=""></div>
        <button class="lightbox-nav" type="button" data-lightbox-next aria-label="Next photograph">→</button>
      </div>
      <p class="lightbox-caption"></p>`;
    body.appendChild(overlay);

    const image = $('.lightbox-image', overlay);
    const count = $('.lightbox-count', overlay);
    const caption = $('.lightbox-caption', overlay);

    const render = () => {
      const item = items[current];
      image.src = item.dataset.lightbox || item.querySelector("img")?.src || "";
      image.alt = item.dataset.alt || item.querySelector("img")?.alt || "Portfolio photograph";
      caption.textContent = item.dataset.caption || "";
      count.textContent = `${String(current + 1).padStart(2, "0")} / ${String(items.length).padStart(2, "0")}`;
    };
    const open = (index, trigger) => {
      current = index;
      lastFocused = trigger;
      render();
      overlay.classList.add("is-open");
      body.classList.add("lightbox-open");
      $('[data-lightbox-close]', overlay)?.focus();
    };
    const close = () => {
      overlay.classList.remove("is-open");
      body.classList.remove("lightbox-open");
      lastFocused?.focus();
    };
    const move = (amount) => {
      current = (current + amount + items.length) % items.length;
      render();
    };

    items.forEach((item, index) => {
      item.addEventListener("click", () => open(index, item));
      item.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          open(index, item);
        }
      });
    });
    $('[data-lightbox-close]', overlay)?.addEventListener("click", close);
    $('[data-lightbox-prev]', overlay)?.addEventListener("click", () => move(-1));
    $('[data-lightbox-next]', overlay)?.addEventListener("click", () => move(1));
    overlay.addEventListener("click", (event) => { if (event.target === overlay) close(); });
    document.addEventListener("keydown", (event) => {
      if (!overlay.classList.contains("is-open")) return;
      if (event.key === "Escape") close();
      if (event.key === "ArrowLeft") move(-1);
      if (event.key === "ArrowRight") move(1);
    });
  }

  function initializeInquiryForm() {
    const form = $('[data-inquiry-form]');
    if (!form) return;
    const status = $('[data-form-status]', form);
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const values = new FormData(form);
      const lines = [
        `Name: ${values.get("name")}`,
        `Email: ${values.get("email")}`,
        `Project type: ${values.get("projectType")}`,
        `Date / timeline: ${values.get("timeline") || "Not provided"}`,
        `Location: ${values.get("location") || "Not provided"}`,
        "",
        "Project details:",
        String(values.get("details") || "")
      ];
      const subject = `Photography inquiry — ${values.get("projectType")}`;
      window.location.href = `mailto:${config.email || ""}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`;
      if (status) status.textContent = "Your email app should open with these details filled in. Review the draft, then send it when you’re ready.";
    });
  }

  function initializeGlobalKeyboard() {
    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      setMenu(false);
      setThemePanel(false);
    });
  }

  initializeYear();
  initializeMenu();
  initializeTheme();
  initializeReveals();
  initializeHeroSlideshow();
  initializeCardMotion();
  initializeLightbox();
  initializeInquiryForm();
  initializeGlobalKeyboard();
})();
