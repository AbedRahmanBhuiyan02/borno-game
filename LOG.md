# Work log

Drive C: usage: **none**. Nothing was installed. (The Windows built-in C#
compiler at `C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe` is
*used* to run tests, but nothing was written to C: except git's normal
temp files.)

---

## Step 1 – Project setup (2026-10-18)
**Done**
- Created `D:\Projects\borno-game` with folders: `Assets/Scripts`,
  `Scenes`, `Art`, `Audio`, `Data`, `Prefabs`, `Tests`, plus `Tools`.
- Unity `.gitignore` (Library, Temp, Obj, Builds, Logs, UserSettings,
  `*.csproj`, `*.sln`, keystores) and `.gitattributes`.
- README with the plan, DECISIONS, BLOCKERS, ASSETS.
- `git init`, branch `main`, remote `origin` set.

**Tested**
- Nothing to run yet (no code).

**Problems**
- Unity not installed, GitHub repo missing → see BLOCKERS.md.

**You must do by hand**
- Install Unity, create the GitHub repo (BLOCKERS.md).

---

## Step 2 – Tracing mechanic (2026-10-18)
**Done**
- `Core/StrokeSet.cs` – fixed-size point buffer (no garbage while drawing).
- `Core/Geometry.cs` – point-to-segment distance, even re-sampling.
- `Core/TracingScorer.cs` – coverage % and precision % (port of the web
  prototype idea), `ScoringSettings` with all thresholds.
- `Core/StarRating.cs` – 0..3 stars (0 = "try again").
- `Game/TracingBoard.cs` – touch + mouse input, LineRenderer guide/ink,
  green start dots, ignores touches on buttons and extra fingers.
- `Game/SpriteFactory.cs` – circle/star/rounded-box sprites made by code.
- Tests: `Tests/EditMode/Core/TracingScorerTests.cs` (16 tests) and a
  no-Unity test runner `Tools/run-core-tests.ps1` (+ `Tools/MiniNUnit`).

**Tested**
- `Tools/run-core-tests.ps1` → **16 passed, 0 failed** (Core compiled with
  the Windows C# 5 compiler).
- `Game/` scripts: **NOT compiled** (no Unity on this PC). Written against
  the standard Unity 6 API; please check the Console after first open.

**You must do by hand**
- Nothing extra yet (the board is used by the screens in Step 6).
