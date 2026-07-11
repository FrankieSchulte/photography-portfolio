# Customization checklist

## Before launch

1. Replace `Your city / region`, the placeholder email, and Instagram in `assets/js/site-config.js`.
2. Set `demoMode: false` after every visible placeholder has been replaced.
3. Replace all photographs in `assets/images/` and update the alt text/credits in `scripts/generate_pages.py`.
4. Add a real portrait to the About page in place of the `FS` gradient slot.
5. Rewrite any sentence that does not sound natural when Frankie reads it aloud.
6. Replace `noindex,nofollow` with the desired production robots setting.
7. Add the real domain, canonical URLs, Open Graph image, sitemap, and analytics only after approval.
8. Test the inquiry form with the final email address.

## Hero tuning

The hero effect is controlled in `assets/css/styles.css`:

- `.hero-picture img` controls image opacity, grayscale, contrast, and brightness.
- `.ambient::before` and `.ambient::after` control the two moving gradient fields.
- `.wash` controls how strongly the two colors tint the black-and-white image.
- `body::before` controls page-wide film grain.

A useful production starting point is image opacity around `0.72–0.82` and wash opacity around `0.25–0.42`, depending on the photograph.
