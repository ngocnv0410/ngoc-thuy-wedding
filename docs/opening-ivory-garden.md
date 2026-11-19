# Ivory Garden opening

Approved opening design: bright pearl-paper gates, botanical relief and a champagne-light reveal.

## Visual direction

Bright pearl paper, blind-embossed peonies, pale olive foliage and fine champagne foil. The portrait and landscape gate artwork was generated specifically for this composition and optimized as WebP. Each leaf crops the same artwork, preserving a continuous center seam while CSS perspective opens it. Separate portrait and landscape assets prevent stretched flowers. The full artwork is contained inside the viewport, with matching ivory paper filling extra space, so floral corners remain visible on short, tall and wide screens. Sparkle streams follow that same fitted artwork area.

The hierarchy is: invitation, couple names, date, seal, primary action. Music mode options live in native details rather than a permanent strip. Small characters welcome the guest without competing with the stationery artwork.

## Motion

Two layered streams of fine foil light follow the botanical corners, with a denser field, soft foreground halos and more tapered glints. A curved comet arrives at the seal; the leaves then accelerate gently into a perspective opening. The cover illustration begins behind the widening gate. The opening characters leave the aperture before the invitation content is clear, avoiding duplicate figures over the page.

All devices use the same CSS perspective version for this art direction. The older procedural WebGL door textures remain in the repository but automatic enhancement is disabled for this design so it cannot switch back to the previous artwork.

Skip, Escape, replay and reduced motion retain their exits. The mode popup closes after selection and restores focus to its summary. The focus trap includes the selected native radio while the picker is expanded.

## Validation and capture

- 170 unit tests and production build passed.
- Production-preview browser checks passed at 320×568, 390×844, 430×932, 768×1024, 1024×768, 1440×900, 1920×1080 and 568×320.
- Checked composition, complete artwork visibility, sparkle/artwork dimension alignment, mode selection/focus, opening, replay, Escape, reduced motion and skip during animation.
- Video captures the production build with native-resolution 780×1688 browser frames; controlled animation time gives a consistent 60-frame-per-second design preview. This is a presentation render, not a device performance benchmark.
- The preview soundtrack uses the invitation's existing music, starting at the tap with the same fade-in. The live site still starts music only through its existing user action.

Review artifacts and the reproducible capture scripts are in `/workspace/artifacts/ivory-garden-opening/`. Generated artwork originals are retained in `/workspace/generated_images/`.

Run `scripts/review-ivory-opening.mjs` with Playwright available, setting `WEDDING_BASE`, `CHROMIUM_PATH`, `CHROMIUM_NO_SANDBOX` and `REVIEW_DIR` when needed, as with the existing browser review scripts.
