# Borno (বর্ণ) – Bangla alphabet game for kids

Borno is an **offline Android game** (Unity 2D, C#) that helps children aged
3–6 learn the Bangla alphabet. The child **traces a letter with a finger**,
hears its sound, sees an example word and gets **1 to 3 stars**. Letters the
child finds hard come back more often.

- No ads, no analytics, no tracking, no internet, no personal data
  (follows the Google Play Families Policy).
- Made for **low and mid-range Android phones**: tiny textures, few draw
  calls, no heavy packages.

---

## 1. How to open the project (first time)

1. Install **Unity Hub** and the **Unity 6 LTS** editor (Personal licence is
   free). In Hub, add the **Android Build Support** module (with OpenJDK and
   Android SDK & NDK).
2. In Unity Hub: **Add → Add project from disk** → choose
   `D:\Projects\borno-game`.
3. Unity will create the missing `Library`, `Packages` and `ProjectSettings`
   files on first open. This takes a few minutes. That is normal.
4. In the Unity menu bar click **Borno → Setup Project (run once)**.
   This creates `Assets/Scenes/Main.unity`, adds it to Build Settings,
   makes the line material, and sets portrait mode + Android settings.
5. Open `Assets/Scenes/Main.unity` and press **Play**. Use the mouse to trace.
6. Commit the new files Unity created (`*.meta`, `Packages/`,
   `ProjectSettings/`) so the project is complete in git.

## 2. How the code is organised

```
Assets/
  Scripts/
    Core/      Pure C# logic, NO Unity code. Easy to unit-test.
               (tracing score, stars, progress, weak letters, picker)
    Game/      Unity MonoBehaviours: input, drawing, saving, screens.
    Editor/    The "Borno → Setup Project" menu.
  Tests/EditMode/   Unit tests (run in Unity: Window → General → Test Runner)
  Data/Resources/Letters/letters.json   <- ALL letter content lives here
  Art/Resources/Pictures/   picture for each example word (optional)
  Art/Resources/Fonts/      put a Bangla font here (see ASSETS.md)
  Audio/Resources/Sounds/   letter + word sounds (optional)
  Scenes/  Prefabs/
Tools/run-core-tests.ps1    Runs the Core unit tests WITHOUT Unity
```

**Why split Core and Game?** The Core folder has no `using UnityEngine`, so
we can compile and test it even on a PC without Unity (see section 5).
Game code only *uses* Core: it reads touches, draws lines and shows buttons.

## 3. How tracing is checked (the idea from the web prototype)

Every letter is stored as a few **strokes** (lists of points in a 0..1 box).
When the child presses **Done**:

1. We put little sample dots every 2% along the letter, and also along the
   child's drawing.
2. **Coverage %** = how many letter dots have the child's line near them.
   ("Did you trace the *whole* letter?")
3. **Precision %** = how many of the child's dots are near the letter.
   ("Did you stay *on* the letter, or scribble everywhere?")
4. Stars:
   - ⭐⭐⭐ coverage ≥ 85% **and** precision ≥ 80%
   - ⭐⭐ coverage ≥ 60% **and** precision ≥ 60%
   - ⭐ coverage ≥ 25% (a real try)
   - 0 → "Try again" (not a failure screen, just a gentle retry)

You need *both* numbers: scribbling over the whole screen gives high
coverage but low precision; tracing only one small piece gives high
precision but low coverage.

The code is in `Assets/Scripts/Core/TracingScorer.cs`.

## 4. Adding a new letter (no code change!)

Open `Assets/Data/Resources/Letters/letters.json` and add one more block:

```json
{
  "id": "ja",
  "letter": "জ",
  "romanized": "ja",
  "exampleWord": "জবা",
  "exampleWordEnglish": "hibiscus",
  "pictureKey": "Pictures/joba",
  "letterAudioKey": "Sounds/Letters/ja",
  "wordAudioKey": "Sounds/Words/joba",
  "strokes": [ { "points": [0.1, 0.9, 0.9, 0.9] } ]
}
```

- `points` is a flat list: `x1, y1, x2, y2, ...`, values 0..1, (0,0) is
  bottom-left. Each `{ "points": [...] }` is one finger stroke.
- Picture file: `Assets/Art/Resources/Pictures/joba.png`
- Sounds: `Assets/Audio/Resources/Sounds/Letters/ja.wav` (or .ogg/.mp3)
- Missing picture/audio is fine: the game shows a coloured card instead and
  stays silent.

## 5. Running the tests

**In Unity:** Window → General → Test Runner → EditMode → Run All.

**Without Unity (Windows):** the Core logic can be compiled with the C#
compiler that ships with Windows:

```powershell
powershell -ExecutionPolicy Bypass -File Tools\run-core-tests.ps1
```

Two more helper scripts (no Unity needed):

| Script | What it does |
|--------|--------------|
| `Tools\compile-check-unity-scripts.ps1` | Rough compile check of ALL scripts against fake Unity classes (`Tools/UnityStubs`). Finds typos in our code; the real check is still Unity. |
| `Tools\make-letter-preview.ps1` | Draws all letter shapes from letters.json into `Tools\.build\letters-preview.html` – open it in a browser. |

## 7. How the screens work (Step 6)

`BornoApp` (one GameObject in `Main.unity`) builds everything at start:

```
Home ──Play──────────────► Tracing (letter chosen by AdaptiveLetterPicker)
  └──Letters──► Letter Select ──tap──► Tracing
Tracing ──Done──► result card ──Again / Next / Home
Android back button = go back one screen
```

- The UI is a Screen-Space-Overlay Canvas made in code (`Game/UI/*`).
- The letter guide and the child's line are LineRenderers in the world
  (`TracingBoard`), visible through the empty middle of the tracing screen.
- After every try the progress is saved immediately.

## 6. Plan / roadmap

| Step | What | Status |
|------|------|--------|
| 1 | Project setup, folders, .gitignore, README | done |
| 2 | Tracing: input, LineRenderer, coverage/precision, stars, tests | done (logic tested, Unity part untested) |
| 3 | Letter content for অ আ ই ঈ উ ক খ গ ঘ চ | done (placeholder shapes, no art/audio yet) |
| 4 | Stars, rewards (stickers), offline progress (JSON) | done |
| 5 | Weak-letter tracking + adaptive repeat | done |
| 6 | Home, letter-select and tracing screens wired together | done (not yet run in Unity) |
| later | 2 mini-games, parent view, speech check, Play Store prep | not started |

Other files: `LOG.md` (diary of each step), `DECISIONS.md` (why things are
the way they are), `BLOCKERS.md` (problems that need you),
`ASSETS.md` (licence of every asset), `MORNING_SUMMARY.md`.
