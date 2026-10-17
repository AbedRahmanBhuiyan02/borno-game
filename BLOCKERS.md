# Blockers – things only you can fix

## 1. Unity is not installed on this PC
- **Problem**: no Unity Editor or Unity Hub was found (checked
  `C:\Program Files\Unity*`, `D:\`, installed programs list). So Unity
  batchmode compile checks and the Unity Test Runner could not be run.
- **What I did instead**: the pure logic (`Assets/Scripts/Core`) and its
  tests are compiled and run with the C# compiler built into Windows
  (`Tools/run-core-tests.ps1`). The Unity scripts (`Game/`, `Editor/`) were
  written carefully but are **not compile-checked**.
- **Your fix**: install Unity Hub + Unity 6 LTS with Android Build Support
  (you may install to `D:\Unity` to keep C: free: Hub → Settings →
  Installs → location). Then follow README section 1, and fix any red
  errors in the Console (tell me the exact error text next session).

### If Unity shows errors on first open (likely fixes)
- `The type or namespace 'UI' does not exist in 'UnityEngine'` →
  Window → Package Manager → Unity Registry → install **Unity UI**.
- Test scripts can't find `NUnit` / `UnityEngine.TestRunner` →
  install **Test Framework** the same way.
- `InvalidOperationException: You are trying to read Input using the
  UnityEngine.Input class...` → run **Borno → Setup Project** (it switches
  Active Input Handling to *Both*) and restart Unity.
- Pink lines in a phone build → run **Borno → Setup Project** again
  (creates the line material so its shader is included).

## 2. GitHub repo – SOLVED (2026-10-18)
Created private repo https://github.com/AbedRahmanBhuiyan02/borno-game
and pushed `main`. An hourly scheduled task in the Claude app
("Borno: hourly commit & push") now commits new work and pushes it.
If it ever finds a secret-looking file or a merge conflict, it stops and
writes a note here instead of pushing.
