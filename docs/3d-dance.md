# Wedding dance in 3D

BAD and BANG BANG now render actual volumetric bride/groom meshes with a Three.js
humanoid bone hierarchy in the selected dance on the invitation cover.
The opening and closing keep the original SVG chibi illustrations. The model
uses the original chibi head/body proportions and exact front hair/jacket
Bezier silhouettes, with rounded 3D heads, expressive brown eyes, ivory clothing,
a low bridal bun and a small side blossom pin. Hair is beveled and wrapped
around the head; limbs and the full-length skirt remain volumetric. It is generated in code: no remote model service, texture pack or video is
needed. The ordinary invitation and other illustrations retain their existing layout.

## Animation source

- BAD: the existing user-supplied MP4, using MediaPipe **world landmarks** in 3D.
  The track contains root travel, pelvis/spine/head world quaternions and eight
  limb directions, sampled at 30 fps. Estimator axis flips are resolved, head/body
  articulation is bounded and bidirectional geodesic filtering limits isolated
  joint snaps without changing the audio timestamps. Missing final frames hold the last pose.
- BANG BANG: the existing choreography is retargeted to the 3D rig. Source data is
  2D, so depth is inferred from segment shortening; this is not a recovered 3D
  motion capture of the original performer.

Tracks are smoothed, quantized to 1/1000 and loaded as separate cached modules.
The rig has fixed bone lengths. Joint directions are solved relative to their
parent's world rotation; the lowest ankle is grounded after each pose. The dress
follows the waist and hip yaw while hanging vertically. The camera sees real
geometry with lighting and occlusion, rather than a transformed SVG surface.
Playback, looping, buffering, fades and seeking all use the persistent audio
media clock. A paused seek redraws the pose without starting audio.

This is stylized retargeting from estimated human poses. It does not reproduce
finger movement, face expressions or cloth physics exactly.

## Loading and rendering

1. Render the invitation first. Existing SVG characters remain visible during loading.
2. After 1.8 seconds, idle tasks sequentially warm the shared Three.js renderer,
   BAD animation and BANG BANG animation. Module promises are reused by both scenes.
3. Choosing a dance immediately requests any outstanding resources. A WebGL scene
   is created only for a selected dance; switching songs reuses the scene.
4. MP3 recordings are not prefetched. Slow 2G / Save-Data connections skip automatic
   background warming; selecting a dance still loads it explicitly.

Production build: the shared Three.js module is about 187 KB gzip; the renderer
and procedural models about 5 KB; both motion tracks together about 98 KB gzip.
That is approximately **290 KB of background downloads after the first paint**.
The first-page JS grows by only a few KB and no large model/video asset is added.
Existing 3D doors share the Three.js chunk.

Each scene renders at most 30 fps with DPR capped at 1.25, without shadow maps or
post-processing. It sleeps when paused, offscreen, behind the opening, or in a
hidden tab. Reduced motion shows a static 3D pose. A failed/lost WebGL context
restores SVG illustrations while audio and the invitation keep working. Unmounting
a scene removes observers, subscriptions, GPU resources and its canvas.

## Verification

Unit tests cover sampled tracks, unit rotations, fixed bone lengths, actual
world-space depth, ground contact, cached loads, network hints and paused seeks.
Browser checks cover after-paint background warming, no MP3 preload, mobile layout,
WebGL rendering, both dance modes, media seeks, pause/offscreen/reduced-motion sleep,
context loss, absent WebGL and Save-Data fallback.
