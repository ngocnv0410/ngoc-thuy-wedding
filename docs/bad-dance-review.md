# BAD · ATEEZ challenge

The owner supplied a 720×1280, 30 fps single-performer MP4, 27.421315 seconds long.
SHA-256: `43ccdf9d997774a6c18ea028f20cdcf1b5de7c67d202210d91108e85db50db5b`.

The soundtrack is 0–27.4 seconds of that clip, extracted to mono 96 kbps MP3
with 15 ms / 30 ms edge fades. The source video is not shipped to browsers.
An online replacement can be configured through `VITE_MUSIC_BAD_URL`; it must
use the same excerpt at its original speed to retain synchronization.

822 pose samples were extracted with MediaPipe Pose Landmarker Full at 30 fps.
Shoulder/elbow/wrist and hip/knee/ankle tracks are projected onto the existing
illustrated rig, preserving the displayed screen directions. Segment lengths
retain projected shortening, normalized to the character proportions. Median
filtering and capped angular steps limit tracking jitter and ambiguous turns.
The initial screen-plane-only torso track has been replaced with depth-aware
posture channels: world-coordinate torso pitch, shoulder yaw, projected trunk
length and independent pelvis roll. The rig now shows forward folds, backward
leans, shoulder turns and hip sway. The torso uses horizontal/vertical projection
and shear; the head compensates for that projection to retain its proportions.
Arm vectors are inverse-projected into the torso's local coordinates, so a body
turn does not arbitrarily stretch the hands. Thigh rotations compensate for the
pelvis angle, and foot grounding includes the rotated hip attachment offsets.
The final six source frames (about 0.2 seconds) had no pose detection and hold
the last detected pose; low-confidence individual landmarks are interpolated.

BAD and BANG BANG BANG share only interpolation and grounded-foot calculations.
They have separate data modules, loaded on selection and sampled from the
persistent audio element’s media time. Pause freezes the pose; reduced motion
clears the dance, and switching modes cancels the prior sampler. The original
BANG BANG BANG pose data and smoothing math are unchanged.

This is 2D retargeting onto wedding illustrations: it cannot reproduce finger
articulation, depth, camera movement or clothing physics exactly.
