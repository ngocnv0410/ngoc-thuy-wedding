# Background music

## Optional track (`?music=bad`): BAD · ATEEZ dance challenge

- Audio extracted from the MP4 supplied by the invitation owner.
- Source: `snapvideo--😎#ateez #bad #dancechallenge #kpop #dance -3797843.mp4`.
- Excerpt: 00:00–00:27.400 of the supplied challenge, with no speed change.
- Local file: `ateez-bad-chorus.mp3`, mono MP3 at 96 kbps (329,750 bytes).
- 15 ms / 30 ms edge fades soften the loop boundary.
- Pose data follows this recording at 30 fps; it is not the BANG BANG BANG dance.
- The label identifies the supplied ATEEZ challenge, not a verified song-artist credit.
- Optional direct HTTPS replacement: `VITE_MUSIC_BAD_URL`, using the same excerpt.

## Optional track (`?music=bangbangbang`): BANG BANG BANG — BIGBANG

- Audio extracted from the dance-reference MP4 supplied by the invitation owner.
- Local file: `bang-bang-bang-chorus.mp3`, MP3 128 kbps (~456 KB).
- Excerpt: 00:00–00:28.444 of the supplied clip (64 beats at 135 BPM).
- Tiny 15 ms / 30 ms edge fades avoid clicks on the loop boundary.
- Choreography uses the new single-performer slow tutorial, sampled at 30 fps
  and aligned to this recording (tutorial time = 0.989405 + audio time × 1.333821).
  The rig retains the displayed mirrored directions and projected limb lengths.
  No missing detections occur in the used tutorial interval. This is 2D retargeting,
  not an exact reproduction of finger articulation or clothing movement.
- Only `?music=bangbangbang` selects this excerpt and dance. Ordinary links and
  `?music=original` use Kenny G. The former `?music=youtube` mode has been removed.

## Default track: Forever in Love — Kenny G

- Recording selected by the invitation owner.
- Source: https://www.nhaccuatui.com/song/0zgSpVtFWT
- Local file: `forever-in-love-kenny-g.mp3`.
- Format: MP3, 128 kbps; approximately 5 minutes.
- The public MP3 download was saved without conversion, trimming or rearrangement.
- The invitation links to Kenny G's official website and the supplied recording page.

Optional online MP3 URLs can replace these recordings at build time; see
`docs/invitation-modes.md`. The unused Canon in D recording and the removed
Nhạc cưới recording are no longer distributed in the current deployment.
