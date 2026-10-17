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

## 2. GitHub repo `borno-game` does not exist
- **Problem**: `gh repo view AbedRahmanBhuiyan02/borno-game` →
  "Could not resolve to a Repository". Your account has no repo with that
  name, so `git push` fails. I did **not** create a repo on your account
  without asking.
- **What I did instead**: every step is committed **locally** in
  `D:\Projects\borno-game` (remote `origin` is already set).
- **Your fix** (one time, in `D:\Projects\borno-game`):
  ```
  gh repo create AbedRahmanBhuiyan02/borno-game --private
  git push -u origin main
  ```
  (Use `--public` instead of `--private` if you want it public. If your repo
  has another name: `git remote set-url origin <url>` and push.)
