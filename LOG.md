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

---

## Step 3 – Letter content system (2026-10-18)
**Done**
- `Core/LetterData.cs` – `LetterData` (letter, romanized, example word,
  picture key, letter/word audio keys, strokes), `LetterCatalog` with
  `FindById`, `IndexOf` and `Validate()` (finds typos in the data).
- `Data/Resources/Letters/letters.json` – 10 letters অ আ ই ঈ উ ক খ গ ঘ চ
  with example words অজগর, আম, ইট, ঈগল, উট, কলা, খাতা, গাছ, ঘর, চশমা and
  hand-drawn placeholder stroke shapes.
- `Game/LetterDatabase.cs` – loads the JSON (JsonUtility), caches shapes,
  loads pictures (Sprite or Texture2D) – missing files are OK.
- `Game/SoundPlayer.cs` – plays letter/word audio by key, silent if missing.
- `Tools/make-letter-preview.ps1` – draws all letter shapes into
  `Tools/.build/letters-preview.html` so you can check them in a browser.

**Tested**
- `Tools/run-core-tests.ps1` → **24 passed, 0 failed**, including checks on
  the REAL letters.json (valid, 10 letters in order, all slots filled, a
  perfect trace of every letter gives 3 stars).
- Rendered the preview page with headless Edge and looked at it: shapes are
  recognisable placeholders (অ আ ক গ ঘ চ good; ই ঈ উ খ rough).
- Unity-only test `Tests/EditMode/Unity/LetterJsonTests.cs` not run (no Unity).

**You must do by hand**
- Improve the stroke shapes (open the preview, edit points in letters.json).
- Add pictures `Assets/Art/Resources/Pictures/<pictureKey>.png` and
  recordings `Assets/Audio/Resources/Sounds/Letters/<id>.wav` /
  `Sounds/Words/<word>.wav` (record your own voice = no licence problem).
  List each file in ASSETS.md.

---

## Step 4 – Stars, rewards, offline progress saving (2026-10-18)
**Done**
- `Core/ProgressData.cs` – what is saved: total stars, attempts, and per
  letter: attempts, best stars, stars earned, last 5 results. No personal
  data. `EnsureValid()` repairs old/hand-edited saves.
- `Core/ProgressTracker.cs` – `RecordAttempt(letterId, stars)` updates
  everything and reports new best / sticker unlocked.
- `Core/RewardRules.cs` – stickers at 3, 10, 20, 35, 50, 75, 100 stars.
- `Core/SafeFile.cs` – crash-safe save (write .tmp, keep .bak, rename).
- `Game/ProgressStore.cs` – JSON in `Application.persistentDataPath/
  borno_progress.json`; broken file → renamed `.bad`, backup used, never
  crashes.

**Tested**
- `Tools/run-core-tests.ps1` → **36 passed, 0 failed** (tracker rules,
  sticker unlock, clamping, repair of broken data, safe file write/backup
  using a temp folder inside `Tools/.build`).
- Unity-only `Tests/EditMode/Unity/ProgressStoreTests.cs` (JsonUtility round
  trip) not run – needs Unity.

**You must do by hand**
- Nothing for this step.

---

## Step 5 – Weak-letter tracking + adaptive repeat (2026-10-18)
**Done**
- `ProgressTracker.IsWeak / RecentAverage / GetWeakLetterIds` – a letter is
  weak when the average of its last 5 tries is below 2 stars. Practising
  removes the mark automatically (old tries drop out of the window).
- `Core/AdaptiveLetterPicker.cs` – "lottery tickets": weak 4, new 2,
  normal 1, just-played ×0.25. Random source is swappable (`IRandomSource`)
  so tests are repeatable. No memory allocated per pick.

**Tested**
- `Tools/run-core-tests.ps1` → **44 passed, 0 failed** (weak rules, exact
  ticket order with fake random numbers, 20 000-pick distribution: weak
  letter ≈57%, just-played letter ≈20%).

**You must do by hand**
- Nothing for this step. (Tune the weights in `AdaptiveLetterPicker` /
  `ProgressTracker.WeakAverageBelow` after watching real kids play.)

---

## Step 6 – Screens wired together (2026-10-18)
**Done**
- `Game/BornoApp.cs` – the main script: loads data + progress, builds the
  board and the screens, handles all buttons, scores, saves after every
  try, Android back button, saves on pause/quit.
- `Game/UI/UiFactory.cs` – builds Canvas/Text/Image/Button from code;
  loads a Bangla font from `Resources/Fonts/BornoFont` if you add one.
- `Game/UI/HomeScreen.cs` – title, total stars, 7 sticker badges, Play
  (adaptive letter) and Letters buttons.
- `Game/UI/LetterSelectScreen.cs` – scrollable 3-column grid made from
  letters.json, best stars per letter, orange "!" badge on weak letters.
- `Game/UI/TracingScreen.cs` – Back / letter / Sound, picture card (tap =
  word sound), Clear / Done, result card with popping stars, Again / Home /
  Next, "New sticker!" / "New best!".
- `Game/UI/SafeArea.cs` (notch-safe), `Game/UI/PopIn.cs` (star animation).
- `Editor/BornoSetup.cs` – menu **Borno → Setup Project (run once)**:
  portrait, Android IL2CPP + ARM64, no internet permission, 2D mode, line
  material, `Assets/Scenes/Main.unity`, Build Settings. Also
  **Borno → Open Save Folder** and **Borno → Delete Saved Progress**.
- `Tools/compile-check-unity-scripts.ps1` + `Tools/UnityStubs/` – rough
  compile check of all scripts without Unity.

**Tested**
- `Tools/run-core-tests.ps1` → **44 passed, 0 failed**.
- `Tools/compile-check-unity-scripts.ps1` → **OK** (32 files incl. Game,
  Editor and Unity tests, against fake Unity classes). This catches mistakes
  in our code but NOT wrong Unity API names – needs a real Unity check.
- **Not run in Unity, not run on a phone** (Unity not installed).

**You must do by hand**
1. Install Unity 6 LTS (+ Android Build Support), open the project
   (README §1), run **Borno → Setup Project**, press Play.
2. Look at the Console. Red errors = tell me the exact text.
3. Commit the generated `.meta` files, `Packages/`, `ProjectSettings/` and
   `Assets/Scenes/Main.unity`.
4. Optional: add `Assets/Art/Resources/Fonts/BornoFont.ttf` (Noto Sans
   Bengali, OFL) to see Bangla letters instead of "ka", "kha"...
5. Phone test: File → Build Settings → Android → Switch Platform → Build And
   Run (USB debugging on). Try a cheap phone if you can.
