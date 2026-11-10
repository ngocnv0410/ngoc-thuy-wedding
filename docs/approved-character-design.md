# Approved wedding character family

The owner approved the bright wedding couple concept on 2026-11-01, then asked
for the 2D illustrations to use the same design. That approved image is the visual
authority: fair pink-ivory skin, large brown eyes, softly detailed brown hair,
a light taupe groom suit and a white bridal gown/veil with a low bun and blossom pin.

## 2D

`ApprovedChibiFigure.tsx` retains the approved painted faces, jacket, legs,
gown and veil. `SeamlessArms.tsx` draws each limb as a continuous deforming contour,
with a single skin surface through the bride's elbow, wrist and hand. Sleeves use
soft shading and subtle fabric grain. Shoulder roots blend beneath the original
clothing; no circular joint patches or cut image edges are exposed. The jacket
also masks out the lowered-arm shadows baked into the original portrait.

`armGeometry.ts` owns the joint geometry. The heart transition uses two-bone
inverse kinematics with a fixed elbow branch and constant bone lengths. The palm
stays anchored to its wrist while it curls; the wrist base keeps its width instead
of pinching. The index fingers and thumbs meet to frame a small rose heart before
it pulses and releases three light particles. The cover clasp keeps the couple
closer, with a relaxed bent elbow rather than a long horizontal reach.

The existing CSS rig variables still drive the poses and scene timelines. A
MutationObserver batches host style changes before paint, updates SVG path geometry,
and skips arm recomputation when only a heart pulse or particle changes. There is
no second animation loop or per-frame React rendering. Held envelopes and maps
stay upright at the moving palm. Reduced motion uses the final rendered pose;
scene loops continue to pause offscreen and when the document is hidden.

Matched open/closed/happy painted face assets preserve blinks and expressions.
The entire expression switches at the midpoint, avoiding opaque eye covers and
ghost irises. Head tilts and bows retain a neck layer overlapping chin and collar.
The bridal bodice blends into an overlapping skirt layer to soften the waist
transition during bows, while the hem stays at the groom's visible foot baseline.

Browser review must check actual changing SVG path geometry and expressions,
including complete raise/wave/lower and heart/hold/lower sequences. The unit suite
checks bone lengths, elbow continuity, wrist anchoring, finger contact, rasterized
surface connectivity and the cleaned jacket edges. Hiding all `[data-arm]` paths,
head, neck, shoulders and heart must leave no skin in the static bridal clothing.
The original vector rig remains available as legacy artwork; no animation video
or extra raster arm assets are shipped.

## Dance sprites

The dance stage uses offline-rendered transparent 15 fps atlases; see [sprite pipeline](2.5d-dance.md). The opening doors retain Three.js.

## Review

Browser review covers the opening, normal cover, gift cards, QR dialog and closing,
including white artwork against dark backgrounds. All rendered Chibi instances are
checked for approved artwork and loaded assets. Both dance tracks are played in real
time through their loop boundary, with screenshots at 1/5/10/15/18/22/26 seconds.
Unit checks cover independent 2D joints/expressions, SVG-map embedding, held-object compatibility, sprite timestamps, atlas boundaries and media behavior.

## Repeat the browser review

The optional `scripts/review-chibi.mjs` requires Playwright in addition to the
project's existing Sharp dependency. It leaves recordings and paired-pose PNGs
outside the site, and can run against either a local production preview or the
deployed website. It does not send guestbook messages or change wedding data.

```sh
npm install --no-save --package-lock=false playwright
npx playwright install chromium
npm run build
npm run preview
# In another terminal; omit WEDDING_BASE to use the local preview:
WEDDING_BASE=https://ngocthuywedding.io.vn node scripts/review-chibi.mjs
```

Use `CHROMIUM_PATH` for an existing Chromium executable, `REVIEW_DIR` to choose
the artifact directory, and `CHROMIUM_NO_SANDBOX=1` only for a container that needs it.
