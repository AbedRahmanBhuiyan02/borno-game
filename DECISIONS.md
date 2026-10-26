# Decisions (web version)

Why things are the way they are. (The decisions of the old Unity version are
in git under the tag `unity-version`.)

## Technology
- **Plain HTML + CSS + JavaScript, no libraries, no build step.** Three main
  files (`index.html`, `style.css`, `script.js`) plus `assets/`.
- **Works from `file://`** (double-click `index.html`). That is why the letter
  data is `assets/letters.js` (a script) and not JSON – browsers block reading
  JSON files from disk.
- **JavaScript style:** ES5-style `var`/functions so it also runs on older
  phone browsers; modern APIs (canvas, pointer events, Web Audio) are used
  only where every current browser has them.
- **Service worker (`sw.js`) is optional:** it only runs on https/localhost
  and makes a hosted copy work offline. Opened from disk the game is offline
  anyway.

## Letters and tracing
- **Bundled font: Baloo Da 2** (SIL OFL 1.1, Google Fonts, 441 KB, weight
  500 for letters). Round and child-friendly, and every device shows the same
  letter shapes, so tracing is checked the same way everywhere. It loads fine
  from `file://` in Chromium browsers (tested) and Firefox (font in a
  sub-folder). The old hand-made backup strokes were removed.
- **Tracing is checked against the real font letter** (the original web
  prototype idea): letter and drawing are rendered into 224×224 masks (a
  160×160 letter box plus margin, so lines outside the box count too).
  - coverage = letter pixels within 5% of the drawing
  - precision = drawing pixels within 5% of the letter
  - ⭐⭐⭐ ≥ 80/80 %, ⭐⭐ ≥ 60/60 %, ⭐ coverage ≥ 25 %, else "try again"
  - **scribble rule:** drawing longer than 2.5× the letter's centre line
    (found with Zhang-Suen thinning) → at most ⭐. Measured: perfect trace
    ≈ 1.5×, scribbling ≈ 8×.
  - drawings shorter than 15% of the box are "too short" and not saved.
  - **Why 5% and weight 500** (`tests/calibrate.html`): with the thicker
    Baloo letters the old 7.5% let a perfect trace of a DIFFERENT letter get
    3★ in 80 of 380 letter pairs. At 5%: perfect traces 50/50 = 3★, traces
    3.5% off to the side 49/50 = 3★, wrong letter 3★ only 18/380 – all
    true look-alikes (উ/ঊ, ঐ/ঔ, জ/ঝ, খ/ঘ, ...).
  - Small marks (ঁ ং ঃ) are never scaled bigger than ক, otherwise their
    lines become too thick to trace.
- **No stroke order** yet (the font has no stroke data) – planned
  improvement #4 ("watch how to write it").

## Letters, words, language (added 2026-10-25)
- **All 50 letters** in `assets/letters.js` in alphabet order. Example words
  follow the classic primer (অ-অজগর, আ-আম, ই-ইঁদুর, ...). Letters that never
  start a word use the classic primer word that contains them (ঙ-ব্যাঙ,
  ঞ-মিঞা, ণ-হরিণ, ড়-গাড়ি, ঢ়-আষাঢ়, য়-ময়ূর, ৎ-শরৎ, ং-রং, ঃ-দুঃখ, ঁ-চাঁদ);
  these are left out of "প্রথম বর্ণ" (first letter) automatically.
- **Pictures are emoji** (built into every phone, no files, no licences). If
  a very old phone cannot show an emoji, the English word is shown instead.
- **ঁ ং ঃ are shown with a no-break space in front**, otherwise fonts draw a
  dotted circle (◌ঁ). ঁ is moved down a little where it is shown as text.
- **Learning order:** a new child practises অ আ ই ঈ উ ঊ; each letter with 2+
  stars opens the next letter (open = learned + 6). Weak letters always stay
  in practice. The letter grid always shows all 50 for free choice.
- **Bangla is the default interface** (with Bangla digits ০১২…); 🌐 on the
  home and parent page switches to English. All texts are in
  `assets/strings.js` so they are easy to change.
- Ids of the first 10 letters were kept, so old progress still counts. (The
  words of ই খ গ ঘ changed – a word recording made before for those may not
  match the new word.)

## Sounds
- No Bangla voice is installed on this PC and none may be downloaded, so
  voices come from (1) **recordings made in the game** by a parent
  (MediaRecorder → IndexedDB, 2 s each, never leave the device), (2) optional
  files in `assets/sounds/`, (3) a device Bangla voice **only if
  `localService`** (works offline – online voices would be an external service).
- Sound effects are synthesised with the Web Audio API.
- **"Say it!" microphone check of the Unity version was dropped**: recording
  for parents is more useful, and a child-facing microphone feature adds
  permission prompts for little benefit.

## Game rules (same as before)
- Weak letter = last 5 tracing results average < 2 ⭐, or < 60% right in the
  last game answers (at least 3). Weak letters get 4 "lottery tickets", new
  letters 2, others 1, the letter just played ¼.
- Letter Match: 5 questions, 4 choices; Balloon Pop: 6 right pops, the target
  appears at least every 4th balloon. Stars: 0–1 mistakes 3, 2–3 → 2, else 1.
- Stickers at 3, 10, 20, 35, 50, 75, 100 total stars.
- Parent gate: sum of two numbers 4–9 with 4 answer buttons; wrong = closed.
- Progress in `localStorage` (`borno.progress.v1`); broken data is repaired
  or replaced, never crashes. If storage is blocked, the game still runs
  (progress is then only kept until the page closes).

## Testing
- `tests/unit.html` – 54 checks of the rules, run in a real browser.
- `tests/e2e.html` – plays the whole game in a frame (42 checks), also
  `?size=desktop`; `?stop=<screen>` for screenshots.
- The balloon animation uses requestAnimationFrame **plus a timer backup**,
  because some browsers pause animation frames in hidden/embedded frames.

---

## Version 0.4.0 – learning features and engineering (2026-10-25)

**Code split (C13).** `script.js` became 8 files in `js/`. They are classic
scripts sharing one object `window.Borno`, loaded in a fixed order by
`index.html`. *Why not JavaScript modules (`import`)?* Browsers block modules
when `index.html` is opened directly from the disk, and "double-click to
play" must keep working.

**Data as .js, not .json** (`reading.js`, `voices.js`, `strokes.js`): browsers
also block reading .json files from the disk.

**Tracing levels.** 1 thick guide → 2 faint guide → 3 from memory. A try with
2+ stars at the current level opens the next one; the level never goes down
(a bad day should not take away progress). Level 3 shows the letter for
1.8 s, then hides it on the board, in the top bar and in the word.

**Review timing (medals).** Boxes 0–3 with waits of 1, 3 and 7 days
(🥉🥈🥇). A good try moves a letter up only when it is due, so ten tries in
one afternoon do not skip the waiting. A weak try (0–1 ★) moves it one box
down and makes it due now. Letters that are learned and not due get few
"lottery tickets" (0.3), due letters 3, weak letters 4, new letters 2.

**Stroke order.** Three sources: teacher recording on this device → shipped
`assets/strokes.js` → automatic strokes from the letter's centre line. The
automatic strokes are good enough to *show* how to write a letter but are
not the real Bangla stroke order, so the order is **only checked for
teacher strokes**. Wrong order or direction lowers ⭐⭐⭐ to ⭐⭐, never more –
small children should not lose stars for a wrong start.

**Voice pack.** Recordings stay in IndexedDB; "Download voices.js" puts
them (as data URLs) into one .js file that can be added to `assets/` and
works from the disk. 120 clips × 2 s is roughly 2–4 MB – acceptable.

**কার game.** Four choices with the **same consonant** and different signs,
so the child must look at the sign. Consonants that join irregularly
(ঙ ঞ ণ ড় ঢ় য় ৎ ং ঃ ঁ) are left out. **শব্দ বানাও:** 20 words of 1–3 pieces
plus 2 extra pieces; the pieces must join to the word (tested).

**Numbers ০–৯** are in `letters.js` with `group: 'number'` and a `count`
for the counting pictures, but are **not** part of the letter learning
order (`B.ALPHABET` excludes them). "Next" goes ০ → ১ → … in order.

**Offline cache (C15).** `sw.js` is now "network first, cache as backup
after 3 s". Before, a new version needed a hand-changed cache number;
forgetting it meant phones kept the old game. The e2e test checks that the
cache list contains every file `index.html` loads.

**CI (C14).** GitHub Actions on ubuntu: syntax check with `node --check`,
then the same test pages in headless Chrome (`tests/run-tests.sh`). The
colour emoji font is installed because the tests check emoji pictures.

**Device check (C16)** measures inside the game (tracing check time,
animation frames per second, memory, features) – a real phone is still
needed for touch feel, heat and battery (see `TESTING_ON_PHONE.md`).

## 0.4.2 – why the voice was silent, and the fix (2026-10-26)
**Analysis.** The game ships no voice yet (`voices.js` empty, no files), so
it depended on a device voice – and accepted only Bangla voices marked
"offline". iPhones have no Bangla voice at all; Android Chrome often marks
Google's Bangla voice as online or gives an empty list at first; desktop
browsers here have 0 Bangla voices. Result: silence almost everywhere.
Also the game reported "played" even when nothing played, so the hint and
the sound test could be wrong, and Chrome can drop speech that starts
right after a stop.

**Changes.**
- Any Bangla device voice is used (offline first, then Bangladesh accent).
  This can mean the phone's online speech service reads the letter or word;
  only that text is sent. Parents can switch it off (🗣️). This relaxes the
  earlier "offline voices only" rule, because otherwise the voice is silent
  for nearly every child; recordings remain the recommended way.
- An empty voice list (Android bug) still tries `bn-BD`; a list with only
  other languages does NOT (no English voice reading Bangla wrongly).
- Playback resolves true only when sound really starts; speech waits 80 ms
  after a stop; marks (ং ঃ ঁ ৎ) are read by name; numbers by their word.
- A real fix for every device still needs a shipped voice pack
  (`assets/voices.js`), made from a person's recording.

## 0.5.0 – computer voice with eSpeak NG (2026-10-26)
You chose a computer voice for every phone, "even if it sounds robotic".
- **eSpeak NG 1.52.0**, official GitHub release, unpacked with `msiexec /a`
  into a temporary folder (nothing installed, no system change). Its Bangla
  voice `bn` gives correct-looking sounds: অ "ô", ক "kô", কলা "kôla",
  অজগর "ôjôgôr" (checked from its phoneme output – a person should still
  listen and report any wrong word).
- **Order of voices:** recording → shipped recording → sound file → the
  device's Bangla voice → computer voice. A good phone voice (Google) sounds
  better than eSpeak, so the computer voice is the last fallback.
- **Size:** silence trimmed, volume evened, 11 kHz 16-bit WAV (WAV plays on
  every browser incl. iPhone; no compressing tool needed). Letters + words
  2.3 MB (cached for offline); the 290 কার syllables 3.3 MB in a second file,
  loaded only when that game opens (and then cached), so the first visit
  stays smaller.
- **Licence:** eSpeak NG is GPL-3.0 but is not shipped; its generated audio
  is not covered by the GPL.
- **Testing limit:** the headless test browser fast-forwards timers but
  plays sound in real time, so "did it play?" is tested with a fake player;
  the real clips are checked by decoding them (length, loudness).

## 0.6.0 – new look (2026-10-26)
You asked for a more standard, modern design. Style chosen: what popular
kids' learning apps use today – soft background, white rounded cards,
"pressable" buttons with a darker 3D bottom edge (feels tappable for small
fingers), round icon buttons, emoji icons in rounded squares, progress bars.
All colours are tokens at the top of `style.css` (each colour has a darker
"edge" shade). Icons are a tiny inline SVG set in `index.html` (back,
speaker) – no icon files or fonts downloaded. No game logic changed; the
tests still click the same buttons.

## 0.6.1 – smoother voice, iPhone Bangla (2026-10-26)
- **Voice quality.** The rough sound came from my own processing, not only
  from eSpeak: halving 22 kHz to 11 kHz by averaging sample pairs lets harsh
  "aliasing" noise through, and cutting silence without a fade makes clicks.
  Now: windowed-sinc resampling to 16 kHz, 12 ms fade in / 40 ms fade out,
  loudness evened by speech level (never clipping), 80 ms silence first
  (phones often swallow the start while the speaker wakes up), eSpeak voice
  style `anika` (roughness 0, softer treble), speed 115. Cost: files grew
  from 2.3/3.3 MB to 3.5/5.6 MB – accepted, the কার file loads only when
  that game opens.
- **Sign names were garbled:** the Edit tool turned `\u` codes into Bangla
  letters, which Windows PowerShell 5.1 misreads; they are now built from
  character numbers. Tests check that ং ঃ ঁ ৎ clips are real speech.
- **iPhone Bangla:** WebKit shapes each differently-coloured piece of text
  separately, so colouring "ম" in "মাছ" left "া" alone (dotted circle, or ে
  on the wrong side). `B.firstCluster` colours the whole first syllable.
  Gradient text (background-clip) also cut the top of র্ on iPhones → solid
  colour. Tested on Edge/Chrome only – no iPhone here.

## 0.7.0 – children, worksheets, breaks (2026-10-26)
- **Profiles without names:** a child is just an animal (🐯 🐘 🦋 🐟), max 4
  – enough for siblings, nothing personal stored. Child 1 keeps the old
  storage key `borno.progress.v1`, so updating loses nothing; others use
  `borno.progress.v1.p2` …; the list is in `borno.profiles.v1`. Settings
  belong to the phone and are carried over when switching. Children can add
  a profile (harmless); only parents can delete one (parent page, two taps).
  Voice recordings and teacher strokes are shared by all children.
- **Worksheets** use the browser's print (A4 via `@page`, hollow letters with
  `-webkit-text-stroke`) – no PDF library, works offline. The sheet lives
  outside `#app` and only shows in print. Checked by printing to PDF.
- **Break reminder:** counts only active play (same 15 s heartbeat as play
  time). After 15 min a card blocks play; its button unlocks after 10 s so a
  child cannot tap it away at once. Never on the parent pages. 5+ minutes
  away from the game resets the count.
