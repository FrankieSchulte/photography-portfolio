(() => {
  "use strict";

  const body = document.body;
  const config = window.PORTFOLIO_CONFIG || {};
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let menuReturnFocus = null;

  function focusable(scope) {
    return $$('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])', scope)
      .filter((node) => node.getAttribute("aria-hidden") !== "true");
  }

  function initializeYear() {
    $$('[data-year]').forEach((node) => {
      node.textContent = String(new Date().getFullYear());
    });
  }

  function setMenu(open) {
    const wasOpen = body.classList.contains("menu-open");
    body.classList.toggle("menu-open", open);
    const button = $('[data-menu-button]');
    button?.setAttribute("aria-expanded", String(open));
    button?.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
    $('[data-mobile-menu]')?.setAttribute("aria-hidden", String(!open));
    if (open && !wasOpen) {
      menuReturnFocus = document.activeElement;
      window.setTimeout(() => $('[data-mobile-menu] a')?.focus(), 40);
    } else if (!open && wasOpen && menuReturnFocus instanceof HTMLElement) {
      menuReturnFocus.focus();
    }
  }

  function initializeMenu() {
    const button = $('[data-menu-button]');
    button?.addEventListener("click", () => setMenu(!body.classList.contains("menu-open")));
    $$('[data-mobile-menu] a').forEach((link) => link.addEventListener("click", () => setMenu(false)));
  }

  function initializeAsciiField() {
    const outputs = $$('[data-ascii-output], [data-ascii-mirror]');
    if (!outputs.length) return;
    const glyphSets = [];
    outputs.forEach((output) => {
      const fragment = document.createDocumentFragment();
      const glyphs = [];
      Array.from(output.textContent || "").forEach((character) => {
        if (/\s/.test(character)) {
          fragment.append(document.createTextNode(character));
          return;
        }
        const codePoint = character.codePointAt(0);
        if (codePoint >= 0x2800 && codePoint <= 0x28ff) {
          const cell = document.createElement("span");
          cell.className = "ascii-glyph braille-cell";
          cell.setAttribute("aria-hidden", "true");
          const mask = codePoint - 0x2800;
          for (let dot = 1; dot <= 8; dot += 1) {
            if (!(mask & (1 << (dot - 1)))) continue;
            const mark = document.createElement("i");
            mark.className = `braille-dot braille-dot-${dot}`;
            cell.append(mark);
          }
          fragment.append(cell);
          glyphs.push(cell);
          return;
        }
        const glyph = document.createElement("span");
        glyph.className = "ascii-glyph";
        glyph.textContent = character;
        fragment.append(glyph);
        glyphs.push(glyph);
      });
      output.replaceChildren(fragment);
      glyphSets.push(glyphs);
    });
    const glyphCount = Math.max(0, ...glyphSets.map((glyphs) => glyphs.length));
    const glyphGroups = Array.from({ length: glyphCount }, (_, index) => glyphSets.map((glyphs) => glyphs[index]).filter(Boolean));
    const frequency = Math.max(1, Math.min(30, Number(config.twinkleFrequency) || 8));
    const amount = Math.max(1, Math.min(80, Number(config.twinkleAmount) || 16));
    const duration = Math.max(100, Math.min(5000, Number(config.twinkleDuration) || 4800));
    const brightness = Math.max(.2, Math.min(1, (Number(config.twinkleBrightness) || 60) / 100));
    document.documentElement.style.setProperty("--twinkle-brightness", brightness.toFixed(2));
    if (reducedMotion.matches || !glyphGroups.length) return;
    const order = glyphGroups.map((_, index) => index);
    let seed = 19790423;
    for (let index = order.length - 1; index > 0; index -= 1) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      const target = seed % (index + 1);
      [order[index], order[target]] = [order[target], order[index]];
    }
    const active = new Map();
    let cursor = 0;
    let timer = 0;
    const twinkle = () => {
      const now = performance.now();
      active.forEach((expiresAt, glyphIndex) => {
        if (expiresAt > now) return;
        glyphGroups[glyphIndex].forEach((glyph) => glyph.classList.remove("is-twinkling"));
        active.delete(glyphIndex);
      });
      const count = Math.min(amount, order.length);
      for (let index = 0; index < count; index += 1) {
        const glyphIndex = order[cursor];
        cursor = (cursor + 1) % order.length;
        active.set(glyphIndex, now + duration);
        glyphGroups[glyphIndex].forEach((glyph) => glyph.classList.add("is-twinkling"));
      }
    };
    const start = () => {
      if (!timer) timer = window.setInterval(twinkle, Math.round(1000 / frequency));
    };
    const stop = () => {
      window.clearInterval(timer);
      timer = 0;
    };
    document.addEventListener("visibilitychange", () => document.hidden ? stop() : start());
    start();
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

  function initializeHomeRail() {
    const rail = $('[data-home-rail]');
    if (!rail) return;
    const spread = $('[data-home-spread]', rail);
    const group = $('[data-home-loop-group]', rail);
    if (!spread || !group) return;
    const before = group.cloneNode(true);
    const after = group.cloneNode(true);
    [before, after].forEach((clone) => {
      clone.removeAttribute("data-home-loop-group");
      clone.classList.add("is-loop-clone");
      clone.setAttribute("aria-hidden", "true");
      $$('a', clone).forEach((link) => link.setAttribute("tabindex", "-1"));
    });
    spread.prepend(before);
    spread.append(after);
    const behavior = reducedMotion.matches ? "auto" : "smooth";
    let autoFrame = 0;
    let lastAutoTime = 0;
    let pausedUntil = performance.now() + 1800;
    let cycleStart = 0;
    let cycleWidth = 0;
    let resizeFrame = 0;
    let scrollFrame = 0;

    const pauseAuto = (duration = 4500) => {
      pausedUntil = Math.max(pausedUntil, performance.now() + duration);
    };

    const normalize = () => {
      if (cycleWidth <= 1) return;
      const relative = rail.scrollLeft - cycleStart;
      if (relative < 0) rail.scrollLeft += cycleWidth;
      else if (relative >= cycleWidth) rail.scrollLeft -= cycleWidth;
    };

    const measure = () => {
      const previousWidth = cycleWidth;
      const previousProgress = previousWidth > 1 ? (rail.scrollLeft - cycleStart) / previousWidth : 0;
      cycleStart = group.offsetLeft;
      cycleWidth = after.offsetLeft - group.offsetLeft;
      rail.scrollLeft = cycleStart + Math.max(0, Math.min(1, previousProgress)) * cycleWidth;
    };

    const move = (amount) => {
      pauseAuto();
      rail.scrollBy({ left: amount * Math.max(240, rail.clientWidth * .72), behavior });
    };

    const autoScroll = (time) => {
      if (!lastAutoTime) lastAutoTime = time;
      const elapsed = Math.min(time - lastAutoTime, 40);
      lastAutoTime = time;
      const focusPaused = rail.matches(":focus-within");
      if (!document.hidden && !focusPaused && time >= pausedUntil && cycleWidth > 1) {
        rail.scrollLeft += elapsed * .012;
        normalize();
      }
      autoFrame = window.requestAnimationFrame(autoScroll);
    };

    rail.addEventListener("scroll", () => {
      if (scrollFrame) return;
      scrollFrame = window.requestAnimationFrame(() => {
        scrollFrame = 0;
        normalize();
      });
    }, { passive: true });
    rail.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        move(event.key === "ArrowLeft" ? -1 : 1);
      }
    });
    rail.addEventListener("wheel", (event) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      event.preventDefault();
      pauseAuto();
      rail.scrollLeft += event.deltaY;
    }, { passive: false });
    window.addEventListener("resize", () => {
      window.cancelAnimationFrame(resizeFrame);
      resizeFrame = window.requestAnimationFrame(measure);
    });
    window.requestAnimationFrame(measure);
    document.fonts?.ready.then(measure);
    if (!reducedMotion.matches) autoFrame = window.requestAnimationFrame(autoScroll);
    window.addEventListener("pagehide", () => window.cancelAnimationFrame(autoFrame), { once: true });
  }

  function initializeCardMotion() {
    if (reducedMotion.matches || !window.matchMedia("(pointer: fine)").matches) return;
    $$('[data-tilt]').forEach((card) => {
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
    const button = $('button[type="submit"]', form);
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const endpoint = String(form.dataset.formEndpoint || "").trim();
      if (!endpoint) {
        if (status) status.textContent = "Direct delivery still needs a Formspree endpoint. Add it in the local editor under About & inquiry.";
        return;
      }
      const values = Object.fromEntries(new FormData(form).entries());
      values.subject = `Photography inquiry — ${values.projectType || "New project"}`;
      form.setAttribute("aria-busy", "true");
      if (button) button.disabled = true;
      if (status) status.textContent = "Sending your inquiry…";
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Accept": "application/json" },
          body: JSON.stringify(values)
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || result.success === false || result.success === "false") throw new Error(result.message || "The message could not be sent.");
        form.reset();
        if (status) status.textContent = "Your inquiry is on its way. Thank you — I’ll be in touch soon.";
      } catch (error) {
        if (status) status.textContent = `Something interrupted the send. Please email ${config.email || "me"} directly.`;
      } finally {
        form.removeAttribute("aria-busy");
        if (button) button.disabled = false;
      }
    });
  }

  function initializeGlobalKeyboard() {
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        setMenu(false);
        return;
      }
      if (event.key !== "Tab") return;
      const openSurface = body.classList.contains("menu-open") ? $('[data-mobile-menu]') : null;
      if (!openSurface) return;
      const nodes = focusable(openSurface);
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  }

  initializeYear();
  initializeMenu();
  initializeAsciiField();
  initializeReveals();
  initializeHomeRail();
  initializeCardMotion();
  initializeLightbox();
  initializeInquiryForm();
  initializeGlobalKeyboard();
})();
