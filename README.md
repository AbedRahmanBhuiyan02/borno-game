# Borno (বর্ণ) – Bangla alphabet game for kids

Borno is an **offline Android game** (Unity 2D, C#) that helps children aged
3–6 learn the Bangla alphabet:

- ✏️ **Trace** a letter with a finger → 1 to 3 stars (coverage + precision check)
- 🔤 **Letter Match** mini-game – which letter does the word start with?
- 🎈 **Balloon Pop** mini-game – pop the balloons with the right letter
- 🧠 **Weak letters come back more often** (tracing and mini-game mistakes)
- ⭐ Stars and 7 stickers to collect, saved offline
- 👪 **Parent page** behind a "grown-ups only" question: progress per letter,
  sound on/off, reset
- 🗣️ Optional **"Say it!"** (microphone, off by default – see below)

No ads, no analytics, no tracking, no internet, no personal data
(Google Play Families Policy). Made for low and mid-range phones.

---

## 1. Run it (3 steps)

1. Install **Unity Hub** + **Unity 6 LTS** (free Personal licence). For phone
   builds also tick **Android Build Support** (with OpenJDK, SDK & NDK).
   You can install to D: (Hub → Settings → Installs).
2. Unity Hub → **Add → Add project from disk** → `D:\Projects\borno-game`.
   The first import takes a few minutes. **The project sets itself up
   automatically** (scene, settings, icon) and opens `Assets/Scenes/Main.unity`.
   If Unity asks to restart because of "Active Input Handling", do it.
3. Press **▶ Play**. Use the mouse like a finger.

Then commit the files Unity created (`*.meta`, `Packages/`,
`ProjectSettings/`, `Main.unity`) – the hourly auto-push does this too.

**Phone:** Borno → **Build Android APK (test)** → `Builds/Borno.apk`, copy it
to the phone and install (allow "unknown apps"), or connect the phone with
USB debugging and use File → Build And Run.

If something goes wrong, see `BLOCKERS.md` ("If Unity shows errors").

## 2. Menu "Borno" in Unity

| Menu | What it does |
|------|--------------|
| Setup Project (run once) | Portrait, Android IL2CPP/64-bit, no internet, icon, version, line material, `Main.unity`, Build Settings. Runs automatically the first time. |
| Open Save Folder | Shows where progress is saved on the PC |
| Delete Saved Progress | Start from zero (for testing) |
| Build Android APK (test) | `Builds/Borno.apk` for your own phone |
| Build Android App Bundle (Play Store) | `Builds/Borno.aab`, needs your keystore – see `PLAY_STORE.md` |

## 3. How the code is organised

```
Assets/
  Scripts/
    Core/      Pure C#, NO Unity code -> unit-tested without Unity
               TracingScorer, StarRating, StrokeSet, Geometry, LetterData,
               ProgressData/Tracker, RewardRules, SafeFile,
               AdaptiveLetterPicker, ParentGate, StrokeRasterizer,
               Games/LetterQuiz, Games/BalloonRound, Games/GameStars
    Game/      Unity scripts: BornoApp (the boss), TracingBoard (finger +
               lines), LetterDatabase, ProgressStore, SoundPlayer, SoundFx,
               LetterSprites, VoiceListener, SpriteFactory
    Game/UI/   Screens built from code: Home, LetterSelect, Tracing,
               GamesMenu, LetterMatch, BalloonPop, ParentGate, Parent,
               + ResultPopup, LetterView, UiFactory, SafeArea, PopIn, ...
    Editor/    Borno menu: setup, auto-setup, builds, picture import
  Tests/EditMode/Core    unit tests (also run without Unity)
  Tests/EditMode/Unity   tests that need Unity (JsonUtility, Resources)
  Data/Resources/Letters/letters.json   <- ALL letter content
  Art/Resources/Pictures/   word pictures (placeholders included)
  Art/Icon/                 app icon
  Audio/Resources/Sounds/   letter + word voices (you record them)
Tools/        helper scripts that work WITHOUT Unity (see section 7)
```

**Why Core and Game?** Core has no `using UnityEngine`, so the rules can be
compiled and tested on any PC. Game only *uses* Core: it reads touches,
draws and shows buttons.

**Screens flow** (all in one scene, switched on/off by `BornoApp`):

```
Home ──Trace──────────► Tracing (letter chosen by AdaptiveLetterPicker)
  ├──Letters──► Letter Select ──tap──► Tracing
  ├──Games────► Games ──► Letter Match / Balloon Pop
  └──Parents──► "7 + 8 = ?" ──► Parent page
Tracing ──Done──► result card ──Again / Next / Home
Android back button = one screen back
```

## 4. How tracing is checked

Every letter is a few **strokes** (lists of points in a 0..1 box). On
**Done**:

1. Sample dots are placed every 2% along the letter and along the drawing.
2. **Coverage %** = letter dots that have the child's line near them.
3. **Precision %** = the child's dots that are near the letter.
4. Stars: ⭐⭐⭐ coverage ≥ 85% and precision ≥ 80%; ⭐⭐ ≥ 60% and ≥ 60%;
   ⭐ coverage ≥ 25%; otherwise "Try again".

Scribbling everywhere → high coverage, low precision. Tracing a tiny piece →
high precision, low coverage. You need both.

## 5. Adding a letter (no code change)

Add a block to `Assets/Data/Resources/Letters/letters.json`:

```json
{
  "id": "ja", "letter": "জ", "romanized": "ja",
  "exampleWord": "জবা", "exampleWordEnglish": "hibiscus",
  "pictureKey": "Pictures/joba",
  "letterAudioKey": "Sounds/Letters/ja", "wordAudioKey": "Sounds/Words/joba",
  "strokes": [ { "points": [0.1, 0.85, 0.9, 0.85] } ]
}
```

`points` = `x1, y1, x2, y2, ...` (0..1, (0,0) bottom-left), one block per
finger stroke. Then add `Pictures/joba.png` and the two sounds. Run
`Tools\make-letter-preview.ps1` to see the shape. The letter appears in
the Letters grid, both mini-games and the parent page automatically.

## 6. Bangla text, voices and the microphone

- **No font is included** (licence rule). Letters are drawn from their
  stroke data instead, so they always show. Add Noto Sans Bengali (SIL OFL)
  as `Assets/Art/Resources/Fonts/BornoFont.ttf` to also show Bangla words.
- **Voices:** record them yourself – `RECORDING_GUIDE.md` lists the 20 files.
- **"Say it!"** checks only *that* the child spoke (no word recognition –
  offline Bangla speech recognition is too big for cheap phones). It is
  compiled in only when you add the scripting define **`BORNO_SPEECH`**
  (Project Settings → Player → Other Settings → Scripting Define Symbols).
  Without it the app never asks for the microphone. With it, a parent must
  switch it on in the parent page.

## 7. Checks you can run without Unity (Windows)

```powershell
powershell -ExecutionPolicy Bypass -File Tools\run-core-tests.ps1              # 62 unit tests
powershell -ExecutionPolicy Bypass -File Tools\compile-check-unity-scripts.ps1 # rough compile check
powershell -ExecutionPolicy Bypass -File Tools\make-letter-preview.ps1         # letter shapes -> HTML
powershell -ExecutionPolicy Bypass -File Tools\make-placeholder-art.ps1        # re-draw pictures/icon
```

In Unity: Window → General → Test Runner → EditMode → Run All (all tests,
including the Unity-only ones).

## 8. Status

| Part | Status |
|------|--------|
| Steps 1–6 (setup, tracing, letters, stars/saving, weak letters, screens) | done |
| 2 mini-games, parent page, Say it!, Play Store prep | done |
| Placeholder pictures + icon | done (original, CC0) |
| Voices, Bangla font, nicer letter shapes | **your part** – see guides |
| Run in real Unity / on a phone | **not done yet** – Unity is not installed on the dev PC |

Other docs: `LOG.md` (diary), `DECISIONS.md` (why), `BLOCKERS.md`
(problems + fixes), `ASSETS.md` (licences), `PLAY_STORE.md`,
`PRIVACY_POLICY.md`, `RECORDING_GUIDE.md`, `MORNING_SUMMARY.md`.
