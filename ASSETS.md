# Assets and licences

Rule: only original work or clearly free assets (CC0, SIL OFL, ...). Every
file in `assets/` must be listed here with its source and licence.

| File(s) | Source | Licence |
|---------|--------|---------|
| `assets/fonts/BalooDa2.ttf` | **Baloo Da 2** by Ek Type, from Google Fonts' official repository (github.com/google/fonts, `ofl/balooda2`), downloaded 2026-10-25 | **SIL Open Font License 1.1** – free to use, embed and share; licence text in `assets/fonts/OFL.txt` (must stay next to the font) |
| `assets/images/icon.png` | Drawn from basic shapes (stars, line) by a script made for this project | Original, CC0 |
| Word pictures | **Emoji** – drawn by the device's own emoji font (Windows, Android, iPhone). No picture files are shipped | System emoji, used as text characters |
| Sound effects (pop, chime, …) | Generated in the browser with the Web Audio API (`js/sound.js`) | Original |
| Letter list, numbers, words, texts (`letters.js`, `reading.js`, `strings.js`) | Written for this project (example words follow the classic Bangla primer tradition) | Original |
| `assets/voice-computer.js`, `assets/voice-computer-kar.js` | Speech **generated** on 2026-10-26 with **eSpeak NG 1.52.0** (github.com/espeak-ng/espeak-ng, official release `espeak-ng.msi`, unpacked, not installed), Bangla voice `bn` with the soft voice style `anika`, speed 115, 16 kHz, by `tools/make-computer-voice.ps1`. 430 clips: 60 letters/numbers, their 60 words, 20 game words, 290 কার syllables | eSpeak NG itself is GPL-3.0; it is **not** shipped. Its generated sound output is not covered by the GPL – the clips are free to ship with the game |
| `assets/voices.js` | Empty for now. Filled by the in-game recording session (a parent's own voice) – when filled, note here who recorded it and that they agreed to share it | Own work of the person recording |
| `assets/strokes.js` | Empty for now. Filled by teacher mode (a teacher's own drawing of the stroke order) – note here who made it | Own work of the teacher |

**Not included (on purpose):**
- **Voice recordings** – parents record their own voice in the game (stored
  only in the browser), or add files to `assets/sounds/` (list them here,
  e.g. "recorded by … for this project – own work").
- Earlier placeholder pictures (CC0, drawn by script) were replaced by emoji;
  they are still in the git history.
