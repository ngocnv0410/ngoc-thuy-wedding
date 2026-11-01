# Approved wedding character family

The owner approved the bright wedding couple concept on 2026-11-01, then asked
for the 2D illustrations to use the same design. That approved image is the visual
authority: fair pink-ivory skin, large brown eyes, softly detailed brown hair,
a light taupe groom suit and a white bridal gown/veil with a low bun and blossom pin.

## 2D

`ApprovedChibiFigure.tsx` splits the approved standing illustration at the original
SVG joint pivots using clip paths. Each arm, leg, head, torso, skirt, veil and hair
tuft reads the original CSS rig channels. Matched open/closed/happy painted face assets restore blinks and expressions;
the entire face state switches at the midpoint, avoiding opaque eye-cover patches
and ghost irises. The bride uses a skin-only arm contour sampled from the source
art, corrected shoulder/palm pivots, and arms drawn above the head so waving hands
remain visible. Her high wave angles are softened to keep the hand beside her face. Held envelopes/maps remain attached to the moving hands with
counter-rotation. Opening walk/push/welcome, idle greetings and the complete closing
story continue to use the unchanged scene timelines.

The previous static-pose implementation was a regression: retaining CSS variables
on a single image did not preserve the original joint motions. Browser checks must
measure actual child transforms/expressions changing, not just data attributes.

All 2D locations share two transparent standing WebPs (about 60 KB total)
and six 240px face-state WebPs (about 95 KB total), plus about 40 KB for
the clean dress/veil layers. Repeated
SVG image references reuse the same browser resources; no atlas or video is shipped.
Original vector source remains available as legacy artwork.

Static bridal clothing now uses separate arm-free dress and veil assets. The standing
portrait is referenced only by the two animated arm groups; it must never be reused
inside the torso/skirt/veil layers, where baked-in skin would create extra arms.
The dress is split at the waist for upper-body/skirt motion and its hem is mapped
to the visible shoe edge at y=195 (the legacy SVG ground is y=196, including
its transparent fringe). A skin neck layer overlaps the
chin and collar during head tilts and bows. Bridal upper-body/skirt pivots use the
actual waist at y=125.

Regression review checks paired rest/hold/wave/tilt/bow/heart poses: rasterized foot
baselines agree within two pixels at 2x scale, the bride's crown stays lower, and
the groom's neck has continuous opaque coverage. Hiding the two arms, head and
shoulders must leave zero skin pixels in the static clothing. Asset tests also
reject strong skin-colored pixels in both fabric layers.

## 3D

The approved portraits are mapped onto closed front/back head volumes whose row
profiles follow each portrait's alpha silhouette. Both surfaces meet at a common
seam; an inner visible hair surface prevents transparent gaps. The old open plane
and separate backing sphere caused distorted, disconnected profiles during bows
and have been removed. Head pitch/yaw are intentionally limited to a gentle
forward-facing range; the torso, hips and limbs keep the full tracked choreography.
The jacket has geometric collar/lapels/bowtie/buttons; the white gown has a curved,
pleated volume with fold detail from the approved artwork.

This is stylized geometry reconstructed from a single view, not a recovered
production character mesh. Hidden profiles remain an approximation, so visual
review must include moving views on the deployed website.

The white gown/bodice and fair hands use stable bright materials; neutral studio
lighting avoids yellow cast. Textures are cached with the existing idle preload.
The original MP3 behavior, real media-clock choreography, rotation limits, reduced
motion and offscreen/paused rendering limits are retained.

## Review

Browser review covers the opening, normal cover, gift cards, QR dialog and closing,
including white artwork against dark backgrounds. All rendered Chibi instances are
checked for approved artwork and loaded assets. Both dance tracks are played in real
time through their loop boundary, with screenshots at 1/5/10/15/18/22/26 seconds.
Unit checks cover independent 2D joints/expressions, SVG-map embedding, held-object compatibility, portrait depth and
texture identity, bone lengths, grounding, rotation limits and media behavior.

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
