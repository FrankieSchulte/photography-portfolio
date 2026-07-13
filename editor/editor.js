(() => {
  "use strict";

  const tokenFromUrl = new URLSearchParams(location.search).get("token") || "";
  if (tokenFromUrl) sessionStorage.setItem("portfolio-editor-token", tokenFromUrl);
  const token = tokenFromUrl || sessionStorage.getItem("portfolio-editor-token") || "";
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
  const main = $("#editor-main");
  const status = $("#status");
  const preview = $("#preview");
  const uploadInput = $("#upload-input");
  let state = null;
  let imageLibrary = [];
  let activeTab = "basics";
  let selectedCategory = 0;
  let selectedProject = 0;
  let pendingUploadPath = null;

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  const slugify = (value) => String(value || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "new-item";

  async function api(path, options = {}) {
    const headers = { "X-Editor-Token": token, ...(options.headers || {}) };
    const response = await fetch(path, { ...options, headers });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || response.statusText);
    return payload;
  }

  function setStatus(message, kind = "") {
    status.textContent = message;
    status.dataset.kind = kind;
  }

  function pathParts(path) {
    return path.split(".").map((part) => /^\d+$/.test(part) ? Number(part) : part);
  }

  function getPath(path) {
    return pathParts(path).reduce((value, key) => value?.[key], state);
  }

  function setPath(path, value) {
    const parts = pathParts(path);
    let target = state;
    parts.slice(0, -1).forEach((key) => { target = target[key]; });
    target[parts.at(-1)] = value;
  }

  function input(label, path, options = {}) {
    const value = getPath(path) ?? "";
    const type = options.type || "text";
    const help = options.help ? `<small>${escapeHtml(options.help)}</small>` : "";
    const wide = options.wide ? " wide" : "";
    if (type === "textarea") {
      return `<label class="field${wide}"><span>${escapeHtml(label)}</span><textarea data-path="${escapeHtml(path)}">${escapeHtml(value)}</textarea>${help}</label>`;
    }
    if (type === "select") {
      const opts = options.options.map((item) => `<option value="${escapeHtml(item.value)}"${String(value) === String(item.value) ? " selected" : ""}>${escapeHtml(item.label)}</option>`).join("");
      return `<label class="field${wide}"><span>${escapeHtml(label)}</span><select data-path="${escapeHtml(path)}">${opts}</select>${help}</label>`;
    }
    if (type === "checkbox") {
      return `<label class="field${wide}"><span>${escapeHtml(label)}</span><select data-path="${escapeHtml(path)}" data-value-type="boolean"><option value="true"${value ? " selected" : ""}>Yes</option><option value="false"${!value ? " selected" : ""}>No</option></select>${help}</label>`;
    }
    return `<label class="field${wide}"><span>${escapeHtml(label)}</span><input data-path="${escapeHtml(path)}" type="${escapeHtml(type)}" value="${escapeHtml(value)}"${options.min ? ` min="${options.min}"` : ""}${options.step ? ` step="${options.step}"` : ""}>${help}</label>`;
  }

  function imageField(label, path, orientationPath = null) {
    const src = getPath(path) || "";
    const orient = orientationPath ? getPath(orientationPath) : "landscape";
    return `<div class="field wide"><span>${escapeHtml(label)}</span><div class="image-field">
      <div class="image-preview ${orient === "portrait" ? "portrait" : ""}">${src ? `<img src="${escapeHtml(src)}" alt="">` : ""}</div>
      <div class="image-controls"><input data-path="${escapeHtml(path)}" list="image-library" value="${escapeHtml(src)}" placeholder="/assets/images/uploads/photo.jpg"></div>
      <button class="button small secondary" type="button" data-upload-for="${escapeHtml(path)}">Upload</button>
    </div></div>`;
  }

  function panel(title, body, actions = "") {
    return `<section class="panel"><div class="panel-head"><h3>${escapeHtml(title)}</h3>${actions}</div>${body}</section>`;
  }

  function sectionHead(title, description, action = "") {
    return `<div class="section-head"><div><h2>${escapeHtml(title)}</h2><p>${escapeHtml(description)}</p></div>${action}</div>`;
  }

  function renderBasics() {
    const navRows = state.navigation.map((item, index) => `<div class="list-row"><div class="row-fields">${input("Button name", `navigation.${index}.label`)}${input("Destination", `navigation.${index}.href`)}</div><button class="button small danger" type="button" data-action="remove-nav" data-index="${index}">Remove</button></div>`).join("");
    main.innerHTML = sectionHead("Site basics", "Change your name, contact details, navigation labels, theme, and development safety settings.") +
      panel("Identity & contact", `<div class="grid">${input("Name", "meta.name")}${input("Short mark", "meta.shortName")}${input("Role", "meta.role")}${input("Location", "meta.location")}${input("Email", "meta.email", { type: "email" })}${input("Instagram label", "meta.instagramLabel")}${input("Instagram URL", "meta.instagramUrl", { wide: true })}${input("Site description", "meta.siteDescription", { type: "textarea", wide: true })}</div>`) +
      panel("Navigation", `<div class="row-list">${navRows}</div>`, '<button class="button small secondary" type="button" data-action="add-nav">+ Add button</button>') +
      panel("Accent colors", `<div class="grid">${input("Default color one", "meta.themeColorA", { type: "color" })}${input("Default color two", "meta.themeColorB", { type: "color" })}</div>`) +
      panel("Publishing state", `<div class="grid">${input("Demo mode", "meta.demoMode", { type: "checkbox", help: "Keep this on while placeholder work or contact details remain." })}${input("Block search engines", "meta.noIndex", { type: "checkbox", help: "Turn this off only when the site is ready for public indexing." })}</div>`);
  }

  function renderHome() {
    const slides = state.home.heroSlides.map((slide, index) => `<div class="list-row"><div class="row-fields">
      ${imageField(`Featured frame ${index + 1}`, `home.heroSlides.${index}.src`)}
      ${input("Alt text", `home.heroSlides.${index}.alt`, { wide: true })}
      ${input("Image focus", `home.heroSlides.${index}.position`, { help: "CSS position such as 50% 40%." })}
      ${input("Frame label", `home.heroSlides.${index}.label`, { wide: true })}
      ${input("Frame shape", `home.heroSlides.${index}.orientation`, { type: "select", options: [{value:"portrait",label:"Portrait"},{value:"landscape",label:"Landscape"},{value:"square",label:"Square"}] })}
    </div><div class="inline-actions"><button class="button small secondary" type="button" data-action="move-slide-up" data-index="${index}">↑</button><button class="button small secondary" type="button" data-action="move-slide-down" data-index="${index}">↓</button><button class="button small danger" type="button" data-action="remove-slide" data-index="${index}">Remove</button></div></div>`).join("");
    main.innerHTML = sectionHead("Landing page", "The homepage stays to one full-screen editorial scene with a horizontally scrollable sequence, your introduction, and two clear actions.") +
      panel("Opening copy", `<div class="grid">${input("Small label", "home.eyebrow", { wide: true })}${input("Main headline (metadata fallback)", "home.headline", { wide: true, help: "The visible masthead uses your name from Site basics." })}${input("Short introduction", "home.intro", { type: "textarea", wide: true })}${input("Primary button name", "home.primaryCta.label")}${input("Primary button link", "home.primaryCta.href")}${input("Secondary button name", "home.secondaryCta.label")}${input("Secondary button link", "home.secondaryCta.href")}${input("Sequence instruction", "home.exploreLabel", { wide: true })}</div>`) +
      panel("Featured horizontal sequence", `<div class="notice">Use three to six strong images. The first three are prepared for the opening viewport; the remaining frames load as visitors move through the sequence. Set a truthful label, useful alt text, source shape, and crop focus for each frame.</div><div class="row-list" style="margin-top:.8rem">${slides}</div>`, '<button class="button small secondary" type="button" data-action="add-slide">+ Add frame</button>');
  }

  function renderWork() {
    const categories = state.categories.map((category, index) => `<section class="panel"><div class="panel-head"><h3>${String(index + 1).padStart(2, "0")} · ${escapeHtml(category.title)}</h3><div class="inline-actions"><button class="button small secondary" data-action="move-category-up" data-index="${index}">↑</button><button class="button small secondary" data-action="move-category-down" data-index="${index}">↓</button><button class="button small danger" data-action="remove-category" data-index="${index}">Remove</button></div></div><div class="grid">${input("Page title", `categories.${index}.title`)}${input("Short menu title", `categories.${index}.shortTitle`)}${input("URL slug", `categories.${index}.slug`)}${input("Small label", `categories.${index}.eyebrow`)}${input("Introduction", `categories.${index}.intro`, { type: "textarea", wide: true })}${imageField("Category cover", `categories.${index}.cover.src`, `categories.${index}.cover.orientation`)}${input("Cover alt text", `categories.${index}.cover.alt`, { wide: true })}${input("Cover shape", `categories.${index}.cover.orientation`, { type: "select", options: [{value:"landscape",label:"3:2 landscape"},{value:"portrait",label:"2:3 portrait"}] })}</div></section>`).join("");
    main.innerHTML = sectionHead("Work & categories", "This is the portfolio index. Categories are equal entry points instead of making the whole site look focused on one niche.", '<button class="button secondary" type="button" data-action="add-category">+ Add category</button>') +
      panel("Work page introduction", `<div class="grid">${input("Small label", "work.eyebrow", { wide: true })}${input("Large headline", "work.headline", { wide: true })}${input("Introduction", "work.intro", { type: "textarea", wide: true })}</div>`) + categories;
  }

  function renderProjects() {
    if (!state.categories.length) {
      main.innerHTML = sectionHead("Shoots & photos", "Add a category before adding shoots.") + '<div class="empty">No categories yet.</div>';
      return;
    }
    selectedCategory = Math.min(selectedCategory, state.categories.length - 1);
    const category = state.categories[selectedCategory];
    const projects = category.projects || (category.projects = []);
    selectedProject = Math.min(selectedProject, Math.max(0, projects.length - 1));
    const categoryOptions = state.categories.map((cat, index) => `<option value="${index}"${index === selectedCategory ? " selected" : ""}>${escapeHtml(cat.title)}</option>`).join("");
    const projectCards = projects.map((project, index) => `<button class="select-card ${index === selectedProject ? "active" : ""}" type="button" data-action="select-project" data-index="${index}"><img src="${escapeHtml(project.cover?.src || "")}" alt=""><span><strong>${escapeHtml(project.title)}</strong><small>${escapeHtml(project.slug)}</small></span><span>›</span></button>`).join("");
    let editor = '<div class="empty">Add the first shoot in this category.</div>';
    if (projects.length) {
      const p = selectedProject;
      const photos = projects[p].photos || (projects[p].photos = []);
      const photoRows = photos.map((photo, index) => `<div class="photo-row"><div class="image-preview ${photo.orientation === "portrait" ? "portrait" : ""}">${photo.src ? `<img src="${escapeHtml(photo.src)}" alt="">` : ""}</div><div class="photo-fields">${input("Image", `categories.${selectedCategory}.projects.${p}.photos.${index}.src`)}${input("Shape", `categories.${selectedCategory}.projects.${p}.photos.${index}.orientation`, { type: "select", options: [{value:"landscape",label:"3:2 landscape"},{value:"portrait",label:"2:3 portrait"}] })}${input("Alt text", `categories.${selectedCategory}.projects.${p}.photos.${index}.alt`, { wide: true })}${input("Optional caption", `categories.${selectedCategory}.projects.${p}.photos.${index}.caption`, { wide: true })}<div class="inline-actions wide"><button class="button small secondary" type="button" data-upload-for="categories.${selectedCategory}.projects.${p}.photos.${index}.src">Upload replacement</button><button class="button small secondary" type="button" data-action="move-photo-up" data-index="${index}">↑</button><button class="button small secondary" type="button" data-action="move-photo-down" data-index="${index}">↓</button><button class="button small danger" type="button" data-action="remove-photo" data-index="${index}">Remove</button></div></div></div>`).join("");
      editor = panel("Shoot details", `<div class="grid">${input("Shoot title", `categories.${selectedCategory}.projects.${p}.title`)}${input("URL slug", `categories.${selectedCategory}.projects.${p}.slug`)}${input("Small label", `categories.${selectedCategory}.projects.${p}.kicker`)}${input("Location or venue", `categories.${selectedCategory}.projects.${p}.location`)}${input("Year", `categories.${selectedCategory}.projects.${p}.year`)}${input("Description", `categories.${selectedCategory}.projects.${p}.description`, { type: "textarea", wide: true })}${imageField("Shoot cover", `categories.${selectedCategory}.projects.${p}.cover.src`, `categories.${selectedCategory}.projects.${p}.cover.orientation`)}${input("Cover alt text", `categories.${selectedCategory}.projects.${p}.cover.alt`, { wide: true })}${input("Cover shape", `categories.${selectedCategory}.projects.${p}.cover.orientation`, { type: "select", options: [{value:"landscape",label:"3:2 landscape"},{value:"portrait",label:"2:3 portrait"}] })}</div>`, '<button class="button small danger" type="button" data-action="remove-project">Delete shoot</button>') + panel("Gallery photographs", `<div class="row-list">${photoRows || '<div class="empty">No gallery photos yet.</div>'}</div>`, '<button class="button small secondary" type="button" data-action="add-photo">+ Add photo</button>');
    }
    main.innerHTML = sectionHead("Shoots & photos", "Each category page is a grid of shoots. Clicking a shoot opens its own page with a complete photo sequence.", '<button class="button secondary" type="button" data-action="add-project">+ Add shoot</button>') + `<section class="panel"><label class="field"><span>Editing category</span><select id="project-category">${categoryOptions}</select></label></section><div class="project-layout"><aside class="project-list"><div class="card-list">${projectCards || '<div class="empty">No shoots</div>'}</div></aside><div>${editor}</div></div>`;
  }

  function renderAbout() {
    const bodyRows = state.about.body.map((paragraph, index) => `<div class="list-row"><div class="row-fields">${input(`Paragraph ${index + 1}`, `about.body.${index}`, { type: "textarea", wide: true })}</div><button class="button small danger" type="button" data-action="remove-about-paragraph" data-index="${index}">Remove</button></div>`).join("");
    const typeRows = state.inquire.projectTypes.map((type, index) => `<div class="list-row"><div class="row-fields">${input("Project type", `inquire.projectTypes.${index}`, { wide: true })}</div><button class="button small danger" type="button" data-action="remove-project-type" data-index="${index}">Remove</button></div>`).join("");
    main.innerHTML = sectionHead("About & inquiry", "Keep the writing first-person and specific. The form creates a real email draft instead of pretending it sent anything.") +
      panel("About page", `<div class="grid">${input("Small label", "about.eyebrow", { wide: true })}${input("Headline", "about.headline", { type: "textarea", wide: true })}${imageField("Your portrait", "about.portrait")}${input("Portrait alt text", "about.portraitAlt", { wide: true })}${input("Availability line", "about.availability", { type: "textarea", wide: true })}</div><div class="row-list" style="margin-top:.8rem">${bodyRows}</div>`, '<button class="button small secondary" type="button" data-action="add-about-paragraph">+ Add paragraph</button>') +
      panel("Inquiry page", `<div class="grid">${input("Small label", "inquire.eyebrow", { wide: true })}${input("Headline", "inquire.headline", { wide: true })}${input("Introduction", "inquire.intro", { type: "textarea", wide: true })}${input("Submit button name", "inquire.buttonLabel", { wide: true })}</div><div class="row-list" style="margin-top:.8rem">${typeRows}</div>`, '<button class="button small secondary" type="button" data-action="add-project-type">+ Add project type</button>');
  }

  function renderAdvanced() {
    main.innerHTML = sectionHead("Advanced JSON", "Every editable part of the site lives in this one data file. Use this only when the structured editor does not expose something you need.", '<button class="button secondary" type="button" data-action="apply-json">Apply JSON to editor</button>') + `<div class="notice">Applying JSON updates the in-memory editor. Use “Save & rebuild” afterward to write it to disk and regenerate the website.</div><textarea class="raw-json" id="raw-json">${escapeHtml(JSON.stringify(state, null, 2))}</textarea>`;
  }

  function render() {
    if (!state) return;
    $$('.tab').forEach((button) => button.classList.toggle("active", button.dataset.tab === activeTab));
    ({ basics: renderBasics, home: renderHome, work: renderWork, projects: renderProjects, about: renderAbout, advanced: renderAdvanced }[activeTab] || renderBasics)();
    main.focus({ preventScroll: true });
  }

  function refreshPreview() {
    preview.src = `/?editorRefresh=${Date.now()}`;
  }

  function move(array, index, direction) {
    const target = index + direction;
    if (target < 0 || target >= array.length) return;
    [array[index], array[target]] = [array[target], array[index]];
  }

  function handleAction(action, element) {
    const index = Number(element.dataset.index || 0);
    if (action === "add-nav") state.navigation.push({ label: "New link", href: "/" });
    if (action === "remove-nav") state.navigation.splice(index, 1);
    if (action === "add-slide") state.home.heroSlides.push({ src: "", alt: "", position: "50% 50%", orientation: "portrait", label: "Selected frame" });
    if (action === "remove-slide") state.home.heroSlides.splice(index, 1);
    if (action === "move-slide-up") move(state.home.heroSlides, index, -1);
    if (action === "move-slide-down") move(state.home.heroSlides, index, 1);
    if (action === "add-category") state.categories.push({ slug: `category-${state.categories.length + 1}`, title: "New category", shortTitle: "New", eyebrow: "Photography", intro: "Add a short introduction.", cover: { src: "", alt: "", orientation: "landscape" }, projects: [] });
    if (action === "remove-category" && confirm("Remove this category and all of its shoots?")) state.categories.splice(index, 1);
    if (action === "move-category-up") move(state.categories, index, -1);
    if (action === "move-category-down") move(state.categories, index, 1);
    if (action === "select-project") selectedProject = index;
    if (action === "add-project") {
      const projects = state.categories[selectedCategory].projects;
      const title = "New shoot";
      projects.push({ slug: `${slugify(title)}-${projects.length + 1}`, title, kicker: "Add a short label", location: "Add location", year: String(new Date().getFullYear()), description: "Describe this shoot.", cover: { src: "", alt: "", orientation: "landscape" }, photos: [] });
      selectedProject = projects.length - 1;
    }
    if (action === "remove-project" && confirm("Delete this shoot and its gallery from the site?")) {
      state.categories[selectedCategory].projects.splice(selectedProject, 1);
      selectedProject = Math.max(0, selectedProject - 1);
    }
    if (action === "add-photo") state.categories[selectedCategory].projects[selectedProject].photos.push({ src: "", alt: "", orientation: "landscape", caption: "" });
    if (action === "remove-photo") state.categories[selectedCategory].projects[selectedProject].photos.splice(index, 1);
    if (action === "move-photo-up") move(state.categories[selectedCategory].projects[selectedProject].photos, index, -1);
    if (action === "move-photo-down") move(state.categories[selectedCategory].projects[selectedProject].photos, index, 1);
    if (action === "add-about-paragraph") state.about.body.push("Add another paragraph in your own voice.");
    if (action === "remove-about-paragraph") state.about.body.splice(index, 1);
    if (action === "add-project-type") state.inquire.projectTypes.push("New project type");
    if (action === "remove-project-type") state.inquire.projectTypes.splice(index, 1);
    if (action === "apply-json") {
      try { state = JSON.parse($("#raw-json").value); setStatus("JSON applied. Save to rebuild."); }
      catch (error) { alert(`The JSON is not valid: ${error.message}`); return; }
    }
    render();
  }

  async function upload(path) {
    pendingUploadPath = path;
    uploadInput.value = "";
    uploadInput.click();
  }

  async function save() {
    setStatus("Saving and rebuilding…");
    try {
      const result = await api("/api/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(state) });
      setStatus(result.output || "Saved.", "ok");
      refreshPreview();
    } catch (error) {
      setStatus(error.message, "error");
      alert(error.message);
    }
  }

  async function initialize() {
    if (!token) {
      setStatus("Open the editor using the tokenized URL printed by ./develop.", "error");
      main.innerHTML = '<div class="empty">Missing editor token. Stop and restart <code>./develop</code>, then copy the complete editor URL it prints.</div>';
      return;
    }
    try {
      const [content, library] = await Promise.all([api("/api/content"), api("/api/images")]);
      state = content;
      imageLibrary = library.images || [];
      $("#image-library").innerHTML = imageLibrary.map((image) => `<option value="${escapeHtml(image.src)}">${escapeHtml(image.name)}</option>`).join("");
      setStatus("Ready. Changes stay local until Save & rebuild.");
      render();
    } catch (error) {
      setStatus(error.message, "error");
      main.innerHTML = `<div class="empty">${escapeHtml(error.message)}</div>`;
    }
  }

  document.addEventListener("input", (event) => {
    const target = event.target.closest?.("[data-path]");
    if (!target || !state) return;
    let value = target.value;
    if (target.dataset.valueType === "boolean") value = value === "true";
    if (target.type === "number") value = Number(value);
    setPath(target.dataset.path, value);
  });

  document.addEventListener("change", (event) => {
    if (event.target.id === "project-category") {
      selectedCategory = Number(event.target.value);
      selectedProject = 0;
      render();
    }
  });

  document.addEventListener("click", (event) => {
    const tab = event.target.closest?.("[data-tab]");
    if (tab) { activeTab = tab.dataset.tab; render(); return; }
    const uploadButton = event.target.closest?.("[data-upload-for]");
    if (uploadButton) { upload(uploadButton.dataset.uploadFor); return; }
    const actionButton = event.target.closest?.("[data-action]");
    if (actionButton) { handleAction(actionButton.dataset.action, actionButton); }
  });

  uploadInput.addEventListener("change", async () => {
    const file = uploadInput.files?.[0];
    if (!file || !pendingUploadPath) return;
    setStatus(`Uploading ${file.name}…`);
    const form = new FormData();
    form.append("file", file);
    try {
      const result = await api("/api/upload", { method: "POST", body: form });
      setPath(pendingUploadPath, result.src);
      const library = await api("/api/images");
      imageLibrary = library.images || [];
      $("#image-library").innerHTML = imageLibrary.map((image) => `<option value="${escapeHtml(image.src)}">${escapeHtml(image.name)}</option>`).join("");
      setStatus(`${result.name} uploaded. Save to use it in the site.`);
      render();
    } catch (error) {
      setStatus(error.message, "error");
      alert(error.message);
    }
  });

  $("#save").addEventListener("click", save);
  $("#refresh-preview").addEventListener("click", refreshPreview);
  $("#open-preview").addEventListener("click", () => window.open("/", "_blank", "noopener"));
  window.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") { event.preventDefault(); save(); }
  });

  initialize();
})();
