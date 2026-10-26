# Changelog

What changed in each version of Borno. The newest version is at the top.
The version number is also shown on the parent page and lives in
`js/core.js` (`B.VERSION`).

Numbers mean: **0.x** = still being tested; the middle number goes up for
new features, the last number for small fixes.

## 0.7.1 – 2026-10-27
- Clearer pictures: একতারা 🎸 → 🪕 (folk string instrument), ঋষি 🧘 → 👴
  (wise old man), যমজ 👬 → 👦👦 (two boys), শরৎ 🍂 → 🌤️ (Bangladesh's clear
  শরৎ sky; ☁️ is already মেঘ). Kept: ওল 🍠 (no closer picture), মিঞা 👨.
- 1–3 counting pictures (১ ২ ৩, যমজ) are shown bigger.
- Test: no two letters share a picture.

## 0.7.0 – 2026-10-26
**For real families**
- **Several children on one phone:** up to 4 children, each shown as an
  animal (🐯 🐘 🦋 🐟) – no names. Each has their own stars, levels, medals
  and play time. Tap the animal on the home screen to switch; parents can
  delete a child on the parent page (two taps). Settings stay the same for
  all. Old progress becomes child 🐯 – nothing is lost.
- **Printable worksheets** (parent page): the letters being learned, the hard
  ones, all vowels, consonants or numbers – each row with the picture and
  word, a dark example, 4 hollow letters to trace with a pencil and an empty
  box. Print or save as PDF (A4).
- **Break reminder:** after 15 minutes of active play a friendly break card
  appears (the OK button works after 10 seconds). Leaving the game for 5+
  minutes counts as a break. Parents can switch it off.
- **This week vs last week** (minutes, tracings, games) on the parent page.

## 0.6.1 – 2026-10-26
- **Smoother computer voice:** softer eSpeak voice style ("anika": no
  roughness, gentler treble), spoken slower, 16 kHz with a proper smoothing
  filter (before: a crude 11 kHz cut that sounded rough), soft fade in/out
  (no clicks), even and louder volume, a short silence first so phones do
  not swallow the start.
- **Fixed: ং ঃ ঁ ৎ said nonsense** – their names reached eSpeak garbled.
- **Fixed: broken Bangla words on iPhone** – the coloured first letter split
  a syllable in two (ম + াছ), which iPhones draw wrongly (19 of 50 words).
  Now the whole first syllable is coloured (মা + ছ).
- The big বর্ণ title no longer uses gradient text (iPhones cut off the top of র্).

## 0.6.0 – 2026-10-26
**New look** – a modern kids-app design:
- Soft sky background, white cards, big "pressable" buttons with a coloured
  3D edge, round icon buttons (back arrow, speaker) instead of text pills.
- Home: owl mascot, a progress card (stars, letters learned, a bar to the
  next sticker, sticker shelf) and menu buttons with icons and short hints.
- Letter grid: white tiles with coloured letters and a coloured edge.
- Tracing: dotted-paper board, cleaner header and word card.
- Result card: big stars, the new sticker / level / medal / letter as badges,
  "Next" as the main button.
- Games: 4 icon cards; answer choices as white cards with coloured letters
  (green when right, shake when wrong); progress as bars.
- Parent page, recording session and teacher mode tidied to match.

## 0.5.1 – 2026-10-26
- Fixed: after an update, a phone could run new and old game files mixed
  together for up to 10 minutes (the browser's own cache), so fixes did not
  arrive. The offline helper now always checks the server for changed files,
  and when a new version takes over the game reloads once on the home screen.

## 0.5.0 – 2026-10-26
- **A voice on every phone:** a computer voice (made with the free program
  eSpeak NG) now comes with the game – all 50 letters, ০–৯, their words, the
  20 words of শব্দ বানাও and all 290 syllables of the কার game. It sounds
  robotic, so it is used only when there is no recorded voice and no Bangla
  voice on the device. Works offline and on iPhones.
- The কার syllables (3.3 MB) load only when that game opens.
- Sound test says which voice was used.
- Fixed: a sound that failed to load could still count as "played".
- `tools/make-computer-voice.ps1` rebuilds the voice files.

## 0.4.2 – 2026-10-26
- Voice: the game now uses any Bangla voice of the phone or browser
  (before: only "offline" ones – so almost every phone stayed silent).
  Offline voices are still preferred; parents can switch the device voice off.
- Works around Android Chrome giving an empty voice list, and Chrome
  dropping speech that starts right after a stop.
- The game now knows when a sound really played, so the "no voice" hint and
  the Sound test tell the truth. ং ঃ ঁ ৎ are read by their names.

## 0.4.1 – 2026-10-26
- Sound on phones: the sound is now "woken up" properly on the first touch
  (effects, voice player and device voice); iPhones play sound even with the
  silent switch on (Safari 17+); recorded voices use one shared player that
  phones allow to play later.
- Parent page: **🔊 Sound test** – plays a tune and «অ», shows which voices
  this device has and explains how to add one (record, or install the
  Android Bangla voice).
- The game is online at https://abedrahmanbhuiyan02.github.io/borno-game/

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
