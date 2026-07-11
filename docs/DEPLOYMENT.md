# Deployment and Launch Checklist

## Build output

The deployable site is `dist/`. Generate it with:

```bash
npm run rebuild
```

The site uses clean directory routes such as `/concerts/` and requires a host that serves each directory’s `index.html`. Most static hosts do this automatically.

## Safe preview mode

Keep `launchReady` set to `false` while the site contains demo images, bracketed identity copy, placeholder contact information, or an example domain. Preview mode provides:

- A visible development banner.
- Demo-image labels.
- `noindex,nofollow` metadata.
- A `robots.txt` rule that blocks crawling.
- No canonical, Open Graph, or structured business data derived from placeholders.

## Enabling launch mode

Before setting `launchReady` to `true`:

1. Replace all bracketed identity and biography copy.
2. Add the real email, Instagram, domain, region, and copyright name.
3. Replace every demo image or remove unused slots.
4. Set each real image’s `demo` field to `false`.
5. Confirm all artists, clients, venues, events, graduates, publications, testimonials, and metadata are approved.
6. Replace the social preview image.
7. Run `npm run rebuild` and resolve every audit error.
8. Test the direct email and inquiry draft on desktop and mobile.
9. Test keyboard navigation, reduced motion, menu behavior, Story/Index switching, and the lightbox.
10. Review page titles and descriptions for the real location and specialties.

Then set `launchReady` to `true`, rebuild, and inspect `dist/robots.txt`, `dist/sitemap.xml`, canonical tags, Open Graph metadata, and JSON-LD.

## Hosting notes

- Netlify: deploy `dist/`; the included `_headers` file adds long-lived image caching.
- Cloudflare Pages: build command `npm run rebuild`; output directory `dist`.
- Vercel: use a static deployment with build command `npm run rebuild` and output directory `dist`.
- GitHub Pages: relative page and asset paths are already used, but confirm the final project subpath and custom-domain behavior.
- Conventional server: serve `dist/` as the document root and configure directory index files plus a 404 fallback.

Use HTTPS in production. After launch, verify social previews, sitemap discovery, and representative image results in search tools.
