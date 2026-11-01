# Slow-reference dance review

This revision replaces all multi-person tracking data with poses extracted from
one unobstructed performer in the lower panel of the new 576×1024 mirrored tutorial.

## Timing and data

The existing soundtrack is 00:00–00:28.444 of the original reference.
Audio chroma alignment against the slow tutorial gives:

    tutorialSeconds = 0.989405 + audioSeconds × 1.333821

The 95th percentile residual against the audio alignment is 0.058 seconds.
854 samples at 30 fps cover the selected choreography, corresponding to roughly
00:00.989–00:38.96 in the slow tutorial. No detections are missing in that interval.
The source ends with a later full-speed demonstration; it is not used here.

## Rig

The shoulder-line and hip-line roll are sampled separately from the same tutorial
landmarks as the limb tracks. Previously only the hip-to-shoulder center axis was
used, leaving the waist and skirt upright. The whole rig now rolls around the
pelvis; the upper body bends relative to it using the shoulder line. Arm/head
angles are converted into that local frame so their world directions are retained,
and legs are counter-rotated to preserve the source step directions.

Grounding includes the vertical offset of each hip under the new pelvis rotation.
The bridal upper-body pivot is at the waist; a fabric bridge keeps its bodice
connected to the skirt during relative side bending. The veil inherits the same
head/upper-body transforms and remains attached at the nape.

Shoulder/elbow and hip/knee child joints share the endpoints of their parent
segments. Projected bone lengths also come from the reference, so a forward-
pointing arm shortens instead of sticking out at its full length. The same
length drives both the drawn segment and child attachment. Rounded segments
close the joints; cuff and hand positions follow the forearm endpoint.

The dance rig retains the original head proportions and full-length bridal gown.
Bridal hair now forms a low nape bun with short face-framing locks, a swept part
and a small pearl-and-blossom pin against the hair. One translucent veil starts
at the nape and falls behind the body. It inherits the same upper-body and head
transforms as its attachment; its own sway pivots at the nape, not the crown.
The veil is rendered before the dress and limbs, with faint edges and folds.
Limbs use filled, tapered curves with thin outlines and soft joints; the hands
have a thumb contour and a subtle palm crease. Costume-specific widths keep
the bridal arms slender and the suit sleeves slightly fuller. The lower foot
anchors the stance to the ground while bending the knees. The longer dance
arms leave room for cross-body and overhead gestures.

Each limb is drawn as one tapered ribbon around a rounded elbow/knee, removing
the internal outline between two separately drawn segments. Joint tracks use
a symmetric five-sample filter and a cubic B-spline with continuous acceleration.
Positive spline weights prevent bone-length overshoot; the lower foot is grounded
again after interpolation. Ambiguous projected
rotations are velocity-limited to avoid full turns when the arm points toward
the camera. Nodes are cached once; the frame loop performs no DOM searches.

## Checks and limits

Checked cross-body arms, overhead gestures, hand at hip and stance changes
against the source. Tests cover media timestamps, finite values, interpolation,
positive bone lengths and ground contact. Chromium checks actual elbow endpoint
coincidence at eight timestamps, pause, reduced motion and page errors.

This is a 2D retarget onto illustrated characters, not a pixel-identical copy:
it does not reproduce finger articulation, body depth or clothing physics.
The source is mirrored and the displayed directions are preserved. The existing
28.444-second soundtrack loop boundary is retained.

Default music remains Forever in Love; only `?music=bangbangbang` enables dance.


Playback pauses freeze the current pose after the media fade-out finishes instead
of clearing the rig back to rest. A queued playing event from a seek or loop
cannot cancel a guest-requested fade-out. Reduced motion still resets to a static
pose. Tests check acceleration continuity, reduced joint acceleration variation,
source-gesture bounds and the late playing-event regression.
