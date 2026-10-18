# Blockers – things only you can fix

## Open

### Android Build Support (for the phone APK)
- **Problem**: building the APK needs the Android module, and installing it
  means accepting **Google's Android SDK licence** – that is your decision,
  so I did not install it.
- **Your fix**: Unity Hub → Installs → gear next to **6000.0.85f1** → Add
  modules → **Android Build Support** (keep OpenJDK and Android SDK & NDK
  Tools ticked) → accept the licence. About 1.9 GB download.
  Then in Unity: Borno → Build Android APK (test).
- (Unity Hub may not list the editor yet because I installed it directly:
  Installs → **Locate** → `D:\Unity\Editors\6000.0.85f1\Editor\Editor\Unity.exe`.)

## Solved

### 1. Unity was not installed – SOLVED (2026-10-18)
Installed Unity Hub 3.22.3 (`D:\Unity\Hub`) and Unity **6000.0.85f1**
(`D:\Unity\Editors\6000.0.85f1\Editor\Editor\Unity.exe`, 7.3 GB). You signed
in and added the free Personal licence. The project now compiles in real
Unity with **0 errors and 0 warnings**, and all **65 EditMode + 6 PlayMode**
tests pass (`Tools\unity-check.ps1`).

Problems found and fixed on the way:
- Without `Packages/manifest.json` the first import had **no Unity UI
  package** → compile errors. Unity then wrote its default list of 51
  packages (incl. Analytics, Purchasing, Services). Replaced with a slim
  list of 14 (UI, Test Framework, needed modules – no analytics, no
  networking).
- The PlayMode test hung in batch mode (`WaitForEndOfFrame` never fires
  without a window) → screenshots are now taken only in the editor window.
- A temporary test scene and the `.slnx` file got into git through the
  hourly auto-save → removed and added to `.gitignore`.

### If Unity shows errors (still useful)
- `The type or namespace 'UI' does not exist` → Package Manager → install
  **Unity UI** (or restore `Packages/manifest.json` from git).
- `InvalidOperationException: You are trying to read Input using the
  UnityEngine.Input class...` → run **Borno → Setup Project** and restart.
- Pink lines in a phone build → run **Borno → Setup Project** again.

### 2. GitHub repo – SOLVED (2026-10-18)
Created private repo https://github.com/AbedRahmanBhuiyan02/borno-game
and pushed `main`. An hourly scheduled task in the Claude app
("Borno: hourly commit & push") commits new work and pushes it.
If it ever finds a secret-looking file or a merge conflict, it stops and
writes a note here instead of pushing.
