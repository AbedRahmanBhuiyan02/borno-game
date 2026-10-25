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
- **Letters are drawn with the device's own Bangla font** (Nirmala UI /
  Noto Sans Bengali / Kohinoor Bangla). Browsers shape Bangla correctly, so
  words like গাছ show properly. No font file is bundled (you chose not to
  download one; system fonts are local and need no licence handling).
- **Tracing is checked against the real font letter** (the original web
  prototype idea): letter and drawing are rendered into 224×224 masks (a
  160×160 letter box plus margin, so lines outside the box count too).
  - coverage = letter pixels within 7.5% of the drawing
  - precision = drawing pixels within 7.5% of the letter
  - ⭐⭐⭐ ≥ 80/80 %, ⭐⭐ ≥ 60/60 %, ⭐ coverage ≥ 25 %, else "try again"
  - **scribble rule:** drawing longer than 2.5× the letter's centre line
    (found with Zhang-Suen thinning) → at most ⭐. Measured: perfect trace
    ≈ 1.35×, scribbling 6–8×.
  - drawings shorter than 15% of the box are "too short" and not saved.
- **No stroke order / start dots** for font letters (the font has no stroke
  data). Devices without a Bangla font use the hand-made backup strokes,
  with green start dots (`?strokes=1` to test).

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
- `tests/unit.html` – 42 checks of the rules, run in a real browser.
- `tests/e2e.html` – plays the whole game in a frame (39 checks), also
  `?size=desktop` and `?strokes=1`; `?stop=<screen>` for screenshots.
- The balloon animation uses requestAnimationFrame **plus a timer backup**,
  because some browsers pause animation frames in hidden/embedded frames.
