# Good morning! – Borno night summary (2026-10-18)

All 6 steps are written and committed in `D:\Projects\borno-game`. **Pushed** to the private repo
https://github.com/AbedRahmanBhuiyan02/borno-game (created after you said yes).
An hourly task commits + pushes new work automatically (see LOG.md).

## ✅ What works (tested on this PC)
- **Tracing check** (coverage % + precision % → 0–3 stars), **letter data**
  (10 letters in `letters.json`), **progress + stickers + crash-safe saving**,
  **weak letters + adaptive picker**.
  → **44 unit tests pass** (`Tools\run-core-tests.ps1`, no Unity needed).
- The real `letters.json` is valid, and tracing each letter exactly gives
  3 stars (tested).
- All scripts (Game, Editor, tests) **compile against fake Unity classes**,
  and every risky Unity API we call was checked against Unity 6's official
  C# source (table in LOG.md) – all found, no changes needed.
  (`Tools\compile-check-unity-scripts.ps1`).
- Letter shapes rendered and checked by eye (`Tools\make-letter-preview.ps1`).

## ⚠️ What is NOT tested
- **Nothing has run inside real Unity** – Unity is not installed. The Unity
  scripts (input, LineRenderer, UI screens, setup menu) may have small errors
  that only the real Unity compiler will show.
- Not tested on a phone (touch feel, speed on low-end phones, notch).
- The 3 Unity-only tests in `Assets/Tests/EditMode/Unity/` were not run.

## 📝 Your to-do list
1. ~~GitHub~~ – done: private repo created and pushed; hourly auto-push is on.
2. **Unity**: install Unity Hub + **Unity 6 LTS** with Android Build Support
   (install location can be on D:). Open the project (README §1).
3. In Unity: **Borno → Setup Project (run once)**, open
   `Assets/Scenes/Main.unity`, press **Play**, trace with the mouse.
   Fix/report any red Console errors (BLOCKERS.md has likely fixes).
4. Run the tests: Window → General → Test Runner → EditMode → Run All.
5. Commit the files Unity generated (`*.meta`, `Packages/`,
   `ProjectSettings/`, `Main.unity`) and push.
6. Content: add a free Bangla font (Noto Sans Bengali, OFL) as
   `Assets/Art/Resources/Fonts/BornoFont.ttf`; record letter + word sounds;
   add pictures; improve the rough shapes of ই ঈ উ খ in `letters.json`.
   Write every asset into ASSETS.md.
7. Build to an Android phone and try it with a child.

## ➡️ Next recommended step
Get the project running in real Unity (to-do 2–5) and fix any compile
errors **before** starting the "later" features. After that, the best next
feature is **real letter sounds + example-word pictures** (a 3–6 year old
learns more from hearing the letter than from stars), then the first
mini-game.

Read more: `LOG.md` (step by step), `DECISIONS.md` (why), `BLOCKERS.md`.
