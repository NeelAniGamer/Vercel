/**
 * Certificate logos — binary sources instead of inline base64.
 *
 * This file used to be 17.60 MB of JavaScript: six `data:image/png;base64,...`
 * constants that the browser had to download, parse and base64-decode before
 * the first frame. It held only TWO unique images, each repeated three times
 * (CERT_LOGO_1 = _3 = _6, CERT_LOGO_2 = _4 = _5) — 11.74 MB of pure
 * duplication.
 *
 * The images now live in cert-assets/ and are referenced by path. All six
 * constant names are preserved so any consumer keeps working unchanged:
 * start.js assigns CERT_LOGO_1 / CERT_LOGO_2 to <img>.src, and the duplicates
 * resolve to the same files, exactly as before.
 *
 * cert_logo_1.png  2282x1856 RGBA   sha256 7434d783a1907cba...
 * cert_logo_2.png  2321x1668 RGBA   sha256 9a2358545bd2a24a...
 *
 * KNOWN INEFFICIENCY: cert_logo_1.png is 4.33 MB at 2282x1856 — roughly one
 * byte per pixel, i.e. almost no PNG compression. Rendered into a certificate
 * badge it is far larger than needed. Recompressing (or downscaling to the
 * ~1200px actually displayed) would cut it to a fraction of that, but that
 * changes rendered pixels, so it is left alone pending a visual decision.
 */
window.CERT_LOGO_1 = 'cert-assets/cert_logo_1.png';
window.CERT_LOGO_2 = 'cert-assets/cert_logo_2.png';

// Retained for backwards compatibility — these were byte-identical duplicates.
window.CERT_LOGO_3 = window.CERT_LOGO_1;
window.CERT_LOGO_4 = window.CERT_LOGO_2;
window.CERT_LOGO_5 = window.CERT_LOGO_2;
window.CERT_LOGO_6 = window.CERT_LOGO_1;