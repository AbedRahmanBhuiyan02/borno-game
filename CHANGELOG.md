# Changelog

What changed in each version of Borno. The newest version is at the top.
The version number is also shown on the parent page and lives in
`js/core.js` (`B.VERSION`).

Numbers mean: **0.x** = still being tested; the middle number goes up for
new features, the last number for small fixes.

## 0.4.0 – 2026-10-25
**Learning**
- Three tracing levels per letter: thick guide → faint guide → from memory
  (the letter is shown for 1.8 seconds, then hidden).
- "👀 Watch" button: the letter is written slowly; plays automatically the
  first time a letter is traced.
- Teacher mode (parent page): record the right stroke order; the game then
  shows numbered start dots and checks the order (wrong order = max ⭐⭐).
  Export as `assets/strokes.js` for all devices.
- Review timing with medals: 🥉 come back in 1 day, 🥈 in 3 days, 🥇 in 1 week.
- Numbers ০–৯ with counting pictures.
- New game **কার**: letter + vowel sign = syllable (ক + া = কা).
- New game **শব্দ বানাও**: build 20 simple words (মা, কলা, বাড়ি …) from pieces.
- Recording session: walks through all 120 voice clips; export as
  `assets/voices.js` so every device plays the recorded voice.
- Parent page: play time per day, level and medal per letter, device check,
  version number.

**Engineering**
- `script.js` split into 8 files in `js/`.
- Tests run automatically on GitHub on every push (`.github/workflows/tests.yml`);
  local runners `tests/run-tests.ps1` (Windows) and `tests/run-tests.sh`.
- Offline cache (`sw.js`) now loads new files first when online, so updates
  arrive without changing a number by hand. The tests check that its file
  list is complete.
- Fixed: automatic stroke paths lost closed loops (০, the loop of ক);
  "Watch" during the level-3 pause could leave the board locked; the voice
  store could wait forever in some browsers.
- Tests: 106 unit checks, 86 checks that play the whole game (phone and desktop size).

## 0.3.0 – 2026-10-25
- Bundled child-friendly font Baloo Da 2 (SIL OFL).
- All 50 letters with words and emoji pictures; letters open step by step.
- Bangla interface with Bangla digits; 🌐 switch to English.
- Tracing check re-tuned for the new font (`tests/calibrate.html`).

## 0.2.0 – 2026-10-25
- Rewritten as a plain web game (HTML, CSS, JavaScript) – no Unity, works offline
  by opening `index.html`.
- Tracing with stars, Letter Match, Balloon Pop, stickers, parent page with
  voice recording.

## 0.1.0 – 2026-10-18
- First version made with Unity (kept in git as the tag `unity-version`).
