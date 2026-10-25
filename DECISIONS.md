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
