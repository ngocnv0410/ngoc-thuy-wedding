# Reference dance — draft review

This branch repairs limb articulation and replaces the procedural beat loop with
854 pose samples extracted from 00:00–00:28.444 of the supplied video.

## Verified

- Nested upper-arm/forearm and thigh/shin chains share endpoints, with rounded
  overlapping geometry at each joint. The measured elbow gap in Chromium is
  below 0.01 CSS pixels at eight sampled timestamps.
- Cubic interpolation samples the persistent audio clock; pause, seeks and
  reduced-motion preferences retain their existing behavior.
- The default soundtrack remains Forever in Love. Dance is opt-in through
  `?music=bangbangbang`.

## Not accepted as a faithful reproduction

The source has five overlapping dancers. A single-view pose detector sometimes
switches from the front-center performer to the dancer behind, including around
4, 8, 12 and 20 seconds. Missing detections are interpolated, with median filtering,
anatomical angle bounds and smoothing. This avoids disconnected limbs, but does
not recover the true hidden movement. Depth, body turns, hand/finger poses and
foot contact are not reconstructed. The clip repeats at its existing 28.444s
boundary, which does not establish a seamless motion loop.

Keep this PR as a draft. Meeting the exact-choreography request requires manual
frame-by-frame correction against the reference, including the occluded joints,
and visual acceptance of the full sequence. Passing code tests is not evidence
that those movements match.

## Extraction provenance

MediaPipe Pose Landmarker Full, float16 model; CPU video mode, one pose.
The detector sees a crop x=180..405, y=395..750 of the 576×1024 source at 30 fps.
Landmarks are mapped to 2D joint angles and local torso coordinates; missing
samples are interpolated. The output is `referenceDance.json`. No pose-detection
runtime, model downloads or webcam permissions are added to the website.
