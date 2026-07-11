(() => {
  "use strict";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  function setupYear() {
    document.querySelectorAll("[data-current-year]").forEach((node) => {
      node.textContent = String(new Date().getFullYear());
    });
  }

  function setupMenu() {
    const toggle = document.querySelector(".menu-toggle");
    const menu = document.querySelector("#mobile-menu");
    if (!toggle || !menu) return;

    const label = toggle.querySelector(".menu-toggle-label");
    let open = false;

    function setOpen(next) {
      open = next;
      toggle.setAttribute("aria-expanded", String(open));
      document.body.classList.toggle("menu-open", open);
      if (label) label.textContent = open ? "Close" : "Menu";
      if (open) {
        menu.hidden = false;
        requestAnimationFrame(() => menu.classList.add("is-open"));
        const firstLink = menu.querySelector("a");
        if (firstLink) firstLink.focus({ preventScroll: true });
      } else {
        menu.classList.remove("is-open");
        window.setTimeout(() => {
          if (!open) menu.hidden = true;
        }, reducedMotion.matches ? 0 : 180);
        toggle.focus({ preventScroll: true });
      }
    }

    toggle.addEventListener("click", () => setOpen(!open));
    menu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => setOpen(false));
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && open) setOpen(false);
    });
  }

  function setupReveal() {
    const elements = [...document.querySelectorAll(".reveal")];
    if (!elements.length) return;
    if (reducedMotion.matches || !("IntersectionObserver" in window)) {
      elements.forEach((element) => element.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    elements.forEach((element) => observer.observe(element));
  }

  function setupGalleryToggle() {
    const shell = document.querySelector("[data-gallery-shell]");
    if (!shell) return;
    const buttons = [...shell.querySelectorAll("[data-gallery-mode]")];
    const views = [...shell.querySelectorAll("[data-gallery-view]")];

    function setMode(mode) {
      buttons.forEach((button) => {
        const selected = button.dataset.galleryMode === mode;
        button.setAttribute("aria-pressed", String(selected));
      });
      views.forEach((view) => {
        view.hidden = view.dataset.galleryView !== mode;
      });
    }

    buttons.forEach((button) => {
      button.addEventListener("click", () => setMode(button.dataset.galleryMode));
    });
  }

  function setupLightbox() {
    const dialog = document.querySelector("[data-lightbox]");
    const allButtons = [...document.querySelectorAll("[data-lightbox-item]")];
    if (!dialog || !allButtons.length || typeof dialog.showModal !== "function") return;

    const image = dialog.querySelector("[data-lightbox-image]");
    const caption = dialog.querySelector("[data-lightbox-caption]");
    const meta = dialog.querySelector("[data-lightbox-meta]");
    const count = dialog.querySelector("[data-lightbox-count]");
    const close = dialog.querySelector("[data-lightbox-close]");
    const previous = dialog.querySelector("[data-lightbox-prev]");
    const next = dialog.querySelector("[data-lightbox-next]");
    const stage = dialog.querySelector(".lightbox-stage");

    const records = [];
    const bySource = new Map();
    allButtons.forEach((button) => {
      const source = button.dataset.full;
      if (!bySource.has(source)) {
        bySource.set(source, records.length);
        records.push({
          source,
          alt: button.dataset.alt || "",
          caption: button.dataset.caption || "",
          meta: button.dataset.meta || "",
          width: Number(button.dataset.width) || 1600,
          height: Number(button.dataset.height) || 1200,
        });
      }
      button.dataset.lightboxIndex = String(bySource.get(source));
    });

    let currentIndex = 0;
    let pointerStartX = null;

    function preload(index) {
      const candidate = records[(index + records.length) % records.length];
      const preloadImage = new Image();
      preloadImage.src = candidate.source;
    }

    function render(index) {
      currentIndex = (index + records.length) % records.length;
      const record = records[currentIndex];
      image.src = record.source;
      image.alt = record.alt;
      image.width = record.width;
      image.height = record.height;
      caption.textContent = record.caption;
      meta.textContent = record.meta;
      count.textContent = `${String(currentIndex + 1).padStart(2, "0")} / ${String(records.length).padStart(2, "0")}`;
      preload(currentIndex + 1);
    }

    function openAt(index) {
      render(index);
      dialog.showModal();
      document.body.classList.add("lightbox-open");
      close.focus({ preventScroll: true });
    }

    function closeDialog() {
      dialog.close();
      document.body.classList.remove("lightbox-open");
    }

    allButtons.forEach((button) => {
      button.addEventListener("click", () => openAt(Number(button.dataset.lightboxIndex)));
    });

    close.addEventListener("click", closeDialog);
    previous.addEventListener("click", () => render(currentIndex - 1));
    next.addEventListener("click", () => render(currentIndex + 1));
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) closeDialog();
    });
    dialog.addEventListener("close", () => document.body.classList.remove("lightbox-open"));
    dialog.addEventListener("cancel", () => document.body.classList.remove("lightbox-open"));

    document.addEventListener("keydown", (event) => {
      if (!dialog.open) return;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        render(currentIndex - 1);
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        render(currentIndex + 1);
      }
    });

    stage.addEventListener("pointerdown", (event) => {
      pointerStartX = event.clientX;
    });
    stage.addEventListener("pointerup", (event) => {
      if (pointerStartX === null) return;
      const delta = event.clientX - pointerStartX;
      pointerStartX = null;
      if (Math.abs(delta) < 55) return;
      render(currentIndex + (delta < 0 ? 1 : -1));
    });
  }

  function setupInquiryForm() {
    const form = document.querySelector("[data-inquiry-form]");
    if (!form) return;
    const status = form.querySelector("[data-form-status]");
    const projectSelect = form.querySelector("#project-type");
    const requestedProject = new URLSearchParams(window.location.search).get("project");
    if (requestedProject && projectSelect) {
      const match = [...projectSelect.options].find(
        (option) => option.value.toLowerCase() === requestedProject.toLowerCase(),
      );
      if (match) projectSelect.value = match.value;
    }

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;

      const recipient = form.dataset.recipient || "";
      const placeholderRecipient =
        !recipient ||
        recipient.includes("replace-me") ||
        recipient.includes("example.com") ||
        recipient.includes("[");

      if (placeholderRecipient) {
        status.textContent = "Add your real email address in src/site.json to enable the email-draft action.";
        status.dataset.state = "error";
        return;
      }

      const data = new FormData(form);
      const name = String(data.get("name") || "");
      const projectType = String(data.get("projectType") || "Photography project");
      const subject = `Photography inquiry: ${projectType} — ${name}`;
      const body = [
        `Name: ${name}`,
        `Email: ${data.get("email") || ""}`,
        `Project type: ${projectType}`,
        `Date / timeline: ${data.get("timeline") || "Not provided"}`,
        `City / venue / location: ${data.get("location") || "Not provided"}`,
        `Budget range: ${data.get("budget") || "Not provided"}`,
        "",
        "Usage / deliverables:",
        String(data.get("usage") || "Not provided"),
        "",
        "Project details:",
        String(data.get("details") || ""),
      ].join("\n");

      status.textContent = "Opening a draft in your default email application…";
      status.dataset.state = "success";
      window.location.href = `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    });
  }

  setupYear();
  setupMenu();
  setupReveal();
  setupGalleryToggle();
  setupLightbox();
  setupInquiryForm();
})();
