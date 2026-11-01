# Invitation modes

Guests can choose a mode before opening the invitation or from **Chế độ** beside
the floating music button. Current options are Original (default), BANG BANG BANG
(with the couple dancing), and Nhạc cưới (the existing alternate soundtrack).

Changing mode reuses one audio element. If music was playing, the selected track
starts at its configured beginning; if paused, it stays quiet. Selection updates
the `music` query parameter without reloading and preserves other parameters and
the hash. Reloading uses that link's mode but does not autoplay. Original removes
the mode parameter so ordinary links continue to use the original soundtrack.

To add a soundtrack mode, add its ID to `MusicModeId` and its label, description
and track to `getMusicModes` in `src/lib/music-source.ts`. Both pickers read that
registry. Use a local audio asset and optional start offset. Choreography must
have an implemented renderer and data before assigning a new dance identifier;
adding a song alone does not invent a corresponding dance.
