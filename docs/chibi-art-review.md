# Chibi likeness and animation review

The opening was restored to the original `Chibi` SVG components, including their
existing host animation hooks. It never replaces them with a 3D stage, regardless
of soundtrack. The original cover and closing illustrations are also retained
unless a dance is selected on the cover. No original SVG artwork was redrawn.

The cover’s 3D dancers use the original head/body proportions: a large round face,
small torso, short arms and legs, warm brown suit/hair, ivory bridal dress and
soft brown facial lines. Front hair, jacket, bow tie and bodice contours come
from `chibiArt.ts`. Rounded geometry adds depth; it does not replace the hairstyle
with the prior generic clay head. The bride has a low nape bun, side blossom pin
and full-length gown, matching the original design rather than a crown.

Visual checks include the original opening, front and side views, bent postures,
raised arms and stance changes on both tracks at 1, 5, 10, 15, 18, 22 and 26 seconds.
Both tracks are also run in real time, with video captured, through the loop
boundary. Browser checks verify media synchronization, pause/resume, switching
songs, reduced motion, WebGL fallback and no mobile overflow. Unit checks cover
original hair silhouette bounds, chibi proportions, fixed bone lengths, contact
with the ground and rotation limits throughout the BAD recording.
