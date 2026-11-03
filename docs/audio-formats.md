# WAV to MP3: scope (3 November 2026)

This is a proposal, not yet built.

## Why convert

Gemini, Pindo, IjwiLab and batched Proto all return WAV. WAV is uncompressed, and the size matters once phones save every clip for offline use.

| Format | Per second | The course (~7,000 clips, ~2.5 hours) | A 90-second story |
|---|---|---|---|
| WAV, 24 kHz (Gemini) | 48 KB | ~440 MB | 4.3 MB |
| WAV, 16 kHz (Pindo, IjwiLab) | 32 KB | ~290 MB | 2.9 MB |
| MP3, 128 kbps (ElevenLabs today) | 16 KB | ~150 MB | 1.4 MB |
| **MP3, 48 kbps mono (proposed)** | **6 KB** | **~55 MB** | **0.5 MB** |

48 kbps mono is plenty for one voice. Storage and bandwidth costs drop by the same factor of 5 to 8.

## Options

1. **Convert on a schedule with ffmpeg (recommended).**
   - A GitHub Actions job, run hourly like the reminders or started by hand, lists WAV clips in the `audio` bucket. It converts each to 48 kbps mono MP3 with ffmpeg, which GitHub's runners already have, then uploads it and points `item_forms`, `number_phrases` and `stories` at the MP3. The WAV is kept until the MP3 is in place.
   - There's no new library in the app or the server functions, no CPU limit, and ffmpeg's encoder is the best available.
   - New clips and stories play as WAV for up to an hour, then as MP3. Devices that saved the WAV keep it until they save the new file.
   - About half a day of work, mostly the script and its tests.
2. **Convert in the audio function with a JavaScript MP3 encoder.**
   - This needs a new library (for example `@breezystack/lamejs`) and your approval.
   - Clips would be small from the start. But server functions have a short CPU-time limit (about 2 seconds a request), and encoding a batch of 25 clips, or a 90-second story, could go over it.
   - So stories would stay WAV, or be split into pieces to encode.
3. **Ask each provider for MP3 where it can give one.**
   - ElevenLabs can switch from `mp3_44100_128` to a smaller MP3 (`mp3_22050_32`) today.
   - Proto offers MP3, but a batch must be WAV to be cut, so batched Proto clips would still need option 1.
   - Gemini, Pindo and IjwiLab offer no compressed format.

## Recommendation

Option 1, plus switching ElevenLabs to the smaller MP3. Build it once a voice is chosen and before Remake all audio is run on the full course, so that run makes the small files from the start.
