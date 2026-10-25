/**
 * Certificate logos — path references only. No inline base64.
 *
 * History, for anyone tempted to inline these again:
 *   This file was 17.60 MB of JavaScript: six `data:image/png;base64,...`
 *   constants downloaded, parsed and base64-decoded before the first frame. It
 *   held only TWO unique images, each repeated three times
 *   (CERT_LOGO_1 = _3 = _6, CERT_LOGO_2 = _4 = _5) — 11.74 MB of duplication.
 *
 *   cert-assets/cert_logo_1.png was then 2282x1856 / 4.33 MB — about one byte
 *   per pixel — and was only ever rendered by #cert-logo-1 at `height: 24px`
 *   (Driving.html challan footer). It has since been dropped in favour of the
 *   existing mumbai-police-logo.png, which is the SAME image:
 *
 *     LANCZOS downscale 2282x1856 -> 512x416 vs mumbai-police-logo.png
 *     mean absolute pixel difference: 0.46 / 255   (max 226, edge alpha only)
 *
 *   That also makes the challan footer and the certificate itself (#cert-logo-5,
 *   75px) render the same file, instead of two different encodings of one logo.
 *
 * CERT_LOGO_2 is NOT interchangeable with sneh-logo.png: they are different
 * images (mean abs pixel difference 17.85/255, aspect 1.39 vs 1.97), so it keeps
 * its own file, downscaled to 512px for a 24px render.
 *
 * All six constant names are preserved so no consumer needed editing:
 * start.js assigns CERT_LOGO_1 / CERT_LOGO_2 to <img>.src, and 3-6 alias 1-2.
 */
window.CERT_LOGO_1 = 'mumbai-police-logo.png';
window.CERT_LOGO_2 = 'cert-assets/cert_logo_2.png';

// Retained for backwards compatibility — these were byte-identical duplicates.
window.CERT_LOGO_3 = window.CERT_LOGO_1;
window.CERT_LOGO_4 = window.CERT_LOGO_2;
window.CERT_LOGO_5 = window.CERT_LOGO_2;
window.CERT_LOGO_6 = window.CERT_LOGO_1;
