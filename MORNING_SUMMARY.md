# Borno – status summary (2026-10-18)

**The code for the whole planned project is written and pushed** to
https://github.com/AbedRahmanBhuiyan02/borno-game (private). An hourly task
commits + pushes new work.

## ✅ What is in the game
- Trace letters → 1–3 stars (coverage + precision), green start dots
- 10 letters অ আ ই ঈ উ ক খ গ ঘ চ with example words + pictures
- Mini-games: **Letter Match** and **Balloon Pop**
- Weak letters (from tracing *and* games) come back more often
- Stars + 7 stickers, saved offline (crash-safe)
- Parent page behind a "grown-ups only" question (stats, sound, reset)
- Optional "Say it!" voice check (off by default, no mic permission)
- Sound effects, app icon, placeholder pictures – all original
- Opens and sets itself up in Unity; one-click APK / AAB build menu
- Play Store docs: listing, Families checklist, data-safety answers,
  privacy policy

## ✅ What is checked (on this PC, without Unity)
- **62 unit tests pass** (`Tools\run-core-tests.ps1`)
- All 54 scripts compile against fake Unity classes, in both build variants
- Every Unity API we call was looked up in Unity 6's official C# source

## ⚠️ What is NOT checked
- **It has never run in real Unity or on a phone** (Unity not installed).
  Expect possibly a few small fixes on first open; `BLOCKERS.md` has the
  likely ones.
- Look and feel (layout on real screens, balloon speed, touch feel).

## 📝 Your to-do list
1. Install Unity 6 LTS (+ Android Build Support), add the project in Hub,
   wait for the auto-setup, press **Play**. Send me any red Console errors.
2. Window → General → Test Runner → EditMode → Run All.
3. Borno → Build Android APK (test) → try it on a cheap phone.
4. Record the 20 voice files (`RECORDING_GUIDE.md`).
5. Optional: Bangla font (Noto Sans Bengali, OFL); nicer ই ঈ উ খ shapes.
6. Publishing: `PLAY_STORE.md` (package name, keystore, privacy URL).

## ➡️ Next recommended step
Run it in Unity (to-do 1–3). After that: record the voices – sound is what
makes a 3-year-old learn the letter.
