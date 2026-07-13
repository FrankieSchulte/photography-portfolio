# Frankie Schulte Photography Portfolio

A dependency-free photography portfolio with a local visual editor. The public website is plain HTML, CSS, JavaScript, and images. Development and page generation use only Python's standard library, so there is no `npm install`, Node service, database, or framework build to maintain.

## What this revision changes

- A true one-screen landing page rather than a long homepage.
- A touch-, wheel-, keyboard-, and button-accessible horizontal sequence showing several highlighted photographs immediately.
- General positioning and a primary **See my work** action instead of graduation-first language.
- Oversized masthead typography, sharp print geometry, ASCII/registration details, subtle grain, and acid/cobalt interface accents.
- Responsive type that wraps instead of clipping in narrow browsers.
- A portfolio hierarchy modeled after Adobe Portfolio:
  - Work index
  - Photography category
  - Individual shoot
  - Full shoot gallery and lightbox
- Category and shoot covers are square; full shoot galleries retain **3:2 landscape** or **2:3 portrait** frames.
- A browser-based editor for copy, button names, navigation, colors, featured homepage frames, categories, shoots, covers, and gallery photographs.
- Reduced-motion behavior, keyboard navigation, accessible lightbox controls, and visible focus states.

## Start the editor

From the project directory:

```bash
./develop
```

The command prints two URLs:

```text
Preview: http://127.0.0.1:4173/
Editor:  http://127.0.0.1:4173/__editor__/?token=...
```

Open the complete **Editor** URL, including its temporary token. The editor is local-only by default and disappears as soon as you stop `./develop` with `Ctrl+C`.

There is nothing to install.

### What the editor can change

- Photographer name, role, location, email, and Instagram.
- Header button names and destinations.
- Landing-page headline, introduction, and both call-to-action buttons.
- Featured homepage photos, labels, alt text, focus position, shape, and ordering.
- Public theme colors.
- Work-page headline and introduction.
- Category names, descriptions, covers, ordering, and URL slugs.
- Individual shoot names, descriptions, locations, years, covers, and ordering.
- Gallery photos, captions, alt text, ordering, and 3:2/2:3 orientation.
- About-page copy and portrait.
- Inquiry-page copy, button name, and project-type choices.
- Demo mode and search-engine blocking.

Click **Save & rebuild**, or press `Ctrl+S`/`Command+S`, to write `content/site.json` and regenerate `dist/`.

## Build without opening the editor

```bash
./build
```

The generated production website is written to:

```text
dist/
```

Run the quality check with:

```bash
python3 tools/check_site.py
```

## Project structure

```text
content/site.json                All editable site content and portfolio data
public/assets/site.css           Public visual design and responsive behavior
public/assets/site.js            Horizontal sequence, menus, theme, lightbox, form
public/assets/images/            Demo images and editor uploads
tools/build_site.py              Static page generator
tools/dev_server.py              Local editor and preview server
editor/                          Local-only browser editor
build                            Build command
develop                          Development/editor command
publish                          Build and copy dist/ to Nginx's web root
dist/                            Generated production website
```

Do not hand-edit generated files in `dist/`; the next build will replace them. Edit through the browser editor, `content/site.json`, `public/assets/site.css`, or `public/assets/site.js`.

## Add real photographs

The editor's **Upload** buttons place files in:

```text
public/assets/images/uploads/
```

Use web-sized JPEG, WebP, PNG, or AVIF files. A practical starting point is 1600–2400 pixels on the long edge in sRGB. Do not publish original full-resolution client files.

The site constrains full-gallery display boxes to:

- `landscape` → 3:2
- `portrait` → 2:3

Category and shoot-cover indexes use square crops. Full-gallery images fill the 3:2 or 2:3 boxes with `object-fit: cover`, so select the correct orientation and export/crop important photographs thoughtfully. Homepage frames may crop differently at each browser size by design; use the editor's focus value, such as `50% 35%`, to protect the important part of the frame.

## Edit from the Proxmox server safely

The safest method keeps the editor bound to localhost and uses an SSH tunnel.

On your computer:

```bash
ssh -L 4173:127.0.0.1:4173 root@192.168.1.146
```

In that SSH session:

```bash
runuser -u deploy -- bash -lc 'cd /opt/frankie-portfolio-src && ./develop'
```

Copy the tokenized editor URL into your computer's browser. Because of the tunnel, `127.0.0.1:4173` reaches the development server inside the Proxmox container.

A trusted-LAN alternative is:

```bash
runuser -u deploy -- bash -lc 'cd /opt/frankie-portfolio-src && ./develop --host 0.0.0.0'
```

Then replace `127.0.0.1` in the printed editor URL with the container IP. Keep the token private, do not port-forward port 4173, and stop the development server when finished.

## Publish on the existing Nginx server

Your existing Nginx configuration can continue serving:

```text
/var/www/frankie-portfolio
```

After pulling changes as the repository owner, publish the current checkout as root:

```bash
cd /opt/frankie-portfolio-src
runuser -u deploy -- git pull --ff-only
./publish
```

`./publish` rebuilds the site as the repository owner, synchronizes `dist/` into `/var/www/frankie-portfolio`, restores `www-data` ownership, and runs `nginx -t`. Ordinary content changes do not require an Nginx restart.

When editing directly on the server through `./develop`, stop the development server and run:

```bash
cd /opt/frankie-portfolio-src
./publish
```

Commit and push the changed source afterward so GitHub remains the source of truth:

```bash
runuser -u deploy -- git -C /opt/frankie-portfolio-src add -A
runuser -u deploy -- git -C /opt/frankie-portfolio-src commit -m "Update portfolio content"
runuser -u deploy -- git -C /opt/frankie-portfolio-src push origin main
```

## Public-launch checklist

The included content is still a clearly marked demonstration. Before indexing the site publicly:

1. Replace every demo photograph with approved work.
2. Replace the placeholder location, email, and Instagram values.
3. Rewrite demo project names, descriptions, places, and years.
4. Add accurate alt text and captions.
5. In the editor, turn **Demo mode** off.
6. Turn **Block search engines** off.
7. Confirm the email draft opens with the correct recipient.
8. Add your real domain to Nginx and enable HTTPS through your reverse proxy or Certbot.

No clients, artists, venues, testimonials, prices, or credentials should be published unless they are real and approved.
