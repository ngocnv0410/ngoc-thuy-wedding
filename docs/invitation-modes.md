# Invitation modes

The invitation keeps its existing layout and animations. Its compact mode
choices are **Nguyên bản** (Forever in Love, the default), **BANG BANG**
(the existing excerpt and couple dance), and **BAD** (the supplied ATEEZ dance
challenge, with its own recording and choreography). The same radio picker appears
before opening and in the floating **Chế độ** panel; keyboard arrow keys work.

The removed **Nhạc cưới** mode is no longer offered. Old `?music=youtube` links
open the original mode. Sharing keeps `?music=bangbangbang` or `?music=bad` when selected and
does not forward guest parameters or the current section.

Changing mode reuses one audio element and preserves playback intent. Music has
`preload="none"`; native controls mount when the panel is opened. Selecting
“Mở kèm nhạc” requests metadata only. Actual playback starts in the guest's click
handler, including on iPhone.

## Optional online MP3 sources

The invitation paints first, then idle tasks warm the 3D renderer and both dance
tracks in the background. The MP3 recordings are not prefetched. Slow 2G and
Save-Data connections load 3D only when a dance is selected. See
[3D dance](3d-dance.md) for model, animation and loading details.

Set these build variables (locally in `.env.local`, or as GitHub Actions
repository variables for the Pages workflow):

- `VITE_MUSIC_ORIGINAL_URL`: a direct HTTPS URL for the Forever in Love recording.
- `VITE_MUSIC_BAD_URL`: a direct HTTPS URL for the **same 27.4-second BAD
  challenge excerpt**, starting at the beginning of the supplied video.
- `VITE_MUSIC_BANGBANGBANG_URL`: a direct HTTPS URL for the **same 28.444-second
  dance excerpt**; replacing it with the full song would misalign choreography.

Use stable MP3 URLs that allow browser playback and seeking (range requests).
YouTube watch pages and music-service HTML pages are not MP3 URLs. No external
host is configured by default. Empty or invalid settings use the existing local
recordings. Runtime playback errors remain visible in the music panel for retry.

The unused Canon in D and removed Nhạc cưới MP3 files are deleted from the
current tree and deployment, saving 6,331,480 bytes (~6.04 MiB). The active
local files remain available until stable online recordings are supplied and
verified. Deleting current files does not rewrite Git history.
