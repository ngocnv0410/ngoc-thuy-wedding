# Approved wedding character family

The owner approved the bright wedding couple concept on 2026-11-01, then asked
for the 2D illustrations to use the same design. That approved image is the visual
authority: fair pink-ivory skin, large brown eyes, softly detailed brown hair,
a light taupe groom suit and a white bridal gown/veil with a low bun and blossom pin.

## 2D

`approvedArt.ts` supplies transparent WebP illustrations for both characters:
standing, carrying an invitation envelope and making a heart. The opening, normal
cover, location-map figures, gift cards, QR dialogs, guestbook hostess and closing
all use this family. The public Chibi props and existing layout/scene hooks remain
available. Whole-illustration greetings/bobbing remain CSS/GSAP transforms; detailed
joint choreography is rendered in the 3D dance stage.

Body illustrations are 25–31 KB each, 300×500, with lazy loading outside the opening.
The opening eagerly loads the two standing illustrations (about 60 KB total).
No PNG atlas or video reference is shipped to the browser. Original vector source
is retained as legacy artwork, but is not used by the active 2D components.

## 3D

The same approved head artwork is painted onto rounded, depth-bearing head meshes,
with additional nose curvature and a volumetric hair/bun backing. Head materials
preserve the approved portrait colors independently of lighting/tone mapping.
The suit front and gown folds use detail maps from the same 2D artwork. Actual
3D bones and geometry still drive body, hands, legs, turning, bending and depth.
This is textured stylized geometry reconstructed from a single approved view,
not a recovered original production mesh or a claim of exact unseen profile geometry.

The white gown/bodice and fair hands use stable bright materials; neutral studio
lighting avoids yellow cast. Textures are cached with the existing idle preload.
The original MP3 behavior, real media-clock choreography, rotation limits, reduced
motion and offscreen/paused rendering limits are retained.

## Review

Browser review covers the opening, normal cover, gift cards, QR dialog and closing,
including white artwork against dark backgrounds. All rendered Chibi instances are
checked for approved artwork and loaded assets. Both dance tracks are played in real
time through their loop boundary, with screenshots at 1/5/10/15/18/22/26 seconds.
Unit checks cover SVG-map embedding, held-object compatibility, portrait depth and
texture identity, bone lengths, grounding, rotation limits and media behavior.
