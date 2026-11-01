# Approved wedding character family

The owner approved the bright wedding couple concept on 2026-11-01, then asked
for the 2D illustrations to use the same design. That approved image is the visual
authority: fair pink-ivory skin, large brown eyes, softly detailed brown hair,
a light taupe groom suit and a white bridal gown/veil with a low bun and blossom pin.

## 2D

`ApprovedChibiFigure.tsx` splits the approved standing illustration at the original
SVG joint pivots using clip paths. Each arm, leg, head, torso, skirt, veil and hair
tuft reads the original CSS rig channels. Closed/happy eye overlays restore blinks
and expressions. Held envelopes/maps remain attached to the moving hands with
counter-rotation. Opening walk/push/welcome, idle greetings and the complete closing
story continue to use the unchanged scene timelines.

The previous static-pose implementation was a regression: retaining CSS variables
on a single image did not preserve the original joint motions. Browser checks must
measure actual child transforms/expressions changing, not just data attributes.

All 2D locations share two transparent standing WebPs (about 60 KB total). Repeated
SVG image references reuse the same browser resources; no atlas or video is shipped.
Original vector source remains available as legacy artwork.

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
