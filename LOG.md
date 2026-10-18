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

---

## GitHub + hourly auto-push (2026-10-18)
- Created private repo https://github.com/AbedRahmanBhuiyan02/borno-game
  (`gh repo create`, your existing login) and pushed all commits.
- Added a scheduled task in the Claude desktop app: **"Borno: hourly
  commit & push"** (every hour at about :14). It runs `git add -A`, refuses to
  commit secret-looking files (.keystore, .jks, .env, ...) or files over
  50 MB, commits as "Auto-save: hourly backup <time>", and pushes. It never
  force-pushes; on a conflict it writes a note in BLOCKERS.md.
- It only runs while the Claude app is open (a missed run happens on the
  next launch). Change or stop it in the app's sidebar → Scheduled.
- Nothing was installed and drive C: was not used, except that the Claude app
  keeps the task file in its own folder
  (`C:\Users\...\.claude\scheduled-tasks\borno-hourly-push`).

---

## Extra verification without installing Unity (2026-10-18)
You chose not to install Unity, so instead every risky Unity API call in
`Game/` and `Editor/` was checked against **Unity's official C# source**
(github.com/Unity-Technologies/UnityCsReference, branch `6000.0` = Unity 6
LTS) and the official package docs. Read-only, nothing downloaded/installed.

| API we use | Result |
|------------|--------|
| `Object.FindAnyObjectByType<T>()`, `Resources.GetBuiltinResource<T>` | ✅ found |
| `Sprite.Create(tex, rect, pivot, ppu, extrude, meshType, border)` | ✅ exact overload |
| `Texture2D.SetPixels32`, `Apply(bool, bool)` | ✅ |
| `Input.simulateMouseWithTouches`, `GetTouch`, `GetMouseButton(Down)`, `GetKeyDown`, `mousePosition` | ✅ |
| `LineRenderer.positionCount {get;set;}`, `SetPosition`, `GetPosition`, widths, colours, cap/corner vertices, `useWorldSpace` | ✅ |
| `Renderer.enabled/sortingOrder/shadowCastingMode/receiveShadows/sharedMaterial` | ✅ |
| `PlayerSettings.SetApplicationIdentifier/SetScriptingBackend(NamedBuildTarget, …)`, `companyName`, `productName`, `defaultInterfaceOrientation` | ✅ (old BuildTargetGroup versions are obsolete – we use the new ones) |
| `PlayerSettings.Android.forceInternetPermission`, `targetArchitectures` | ✅ |
| `EditorSettings.defaultBehaviorMode = Mode2D` | ✅ |
| Serialized setting name `activeInputHandler` (0 = Old, 1 = New, 2 = Both) | ✅ matches Unity's Player Settings code |
| `EditorSceneManager.SaveCurrentModifiedScenesIfUserWantsTo()`, `NewScene`, `SaveScene(scene, path)` | ✅ |
| `EditorBuildSettings.scenes`, `EditorBuildSettingsScene(path, enabled)` | ✅ |
| `AssetDatabase.LoadAllAssetsAtPath/LoadAssetAtPath/CreateAsset/SaveAssets/IsValidFolder/CreateFolder` | ✅ |
| `EditorUtility.DisplayDialog`, `RevealInFinder`, `SerializedObject.FindProperty/ApplyModifiedProperties` | ✅ |
| uGUI `Image.pixelsPerUnitMultiplier/preserveAspect/type/sprite` | ✅ (package docs 2.0) |
| `EventSystem.current`, `IsPointerOverGameObject(int pointerId)` | ✅ |
| Test Framework `LogAssert.ignoreFailingMessages` | ✅ |
| Built-in font `"LegacyRuntime.ttf"` | ✅ used the same way in many Unity 6 projects on GitHub |

Re-ran: Core tests **44 passed**, stub compile check **OK**. No code
changes were needed.

**Still unverified (needs real Unity):** that the project opens and imports
cleanly, that the auto-generated package list contains Unity UI + Test
Framework (if not: BLOCKERS.md has the fix), how the screens actually look,
touch feel, and phone performance.

---

## Steps 7–13 – "Complete the whole project" (2026-10-18)
You asked to finish everything, but chose **no font download** and **no
Unity install**. So everything that does not need Unity was built:

**Done**
- **Core rules** (`Core/Games/*`, `ParentGate`, save format v2): Letter
  Match quiz, Balloon Pop round, game stars, parent gate, settings, mini-game
  answers count towards weak letters, v1 → v2 save upgrade.
- **Bangla letters without a font**: `StrokeRasterizer` + `LetterSprites`
  draw each letter from its strokes; `LetterView` uses the font instead if
  you add one.
- **Mini-game 1 – Letter Match** (`LetterMatchScreen`), **mini-game 2 –
  Balloon Pop** (`BalloonPopScreen`, pooled balloons), **Games menu**.
- **Parent gate + parent page** (stats per letter, sound, say-it, reset).
- **"Say it!"** (`VoiceListener`): voice detection only, behind the
  `BORNO_SPEECH` define, off by default, nothing stored.
- **Sound effects** synthesised in code (`SoundFx`); `SoundPlayer` mute.
- **Shared UI**: `ResultPopup`, `UiTimer`, `UpdateHook`; Home now has Trace /
  Letters / Games / Parents.
- **Placeholder art + icon** (`Tools/make-placeholder-art.ps1`, CC0).
- **Open-and-play**: `BornoAutoSetup` (auto setup on first open),
  `BornoTextureImport` (pictures → sprites), icon + version in setup,
  **Build APK / AAB** menu (`BornoBuild`).
- **Play Store prep**: `PLAY_STORE.md`, `PRIVACY_POLICY.md`,
  `RECORDING_GUIDE.md`; README, ASSETS, DECISIONS updated.

**Tested**
- `Tools/run-core-tests.ps1` → **62 passed, 0 failed** (adds quiz, balloon,
  parent gate, settings upgrade, rasterizer tests, and a check that every
  pictureKey has a PNG).
- `Tools/compile-check-unity-scripts.ps1` → **OK for both** the normal build
  and the `BORNO_SPEECH` + Android build (54 files).
- Every new Unity API (AudioClip.Create/SetData/GetData, Microphone,
  Android Permission, SetIcons, TextureImporter, AssetPostprocessor,
  BuildPipeline/BuildReport, EditorApplication.delayCall, OpenScene,
  isBatchMode, FindAssets...) was checked in UnityCsReference 6000.0.
- Placeholder pictures and icon looked at in a contact sheet.
- **Still not run in real Unity or on a phone.**

**You must do by hand**
1. Install Unity 6 LTS, open the project – it sets itself up – press Play.
2. Record the 20 voice files (`RECORDING_GUIDE.md`).
3. Optional: add the Noto Sans Bengali font; improve the ই ঈ উ খ shapes.
4. Before publishing: package name, keystore, privacy-policy URL and
   contact email (`PLAY_STORE.md`).

---

## Installing Unity (2026-10-18, in progress)
- You asked me to install Unity. Downloads come only from Unity's official
  servers into `D:\Unity\_downloads\` (new folder):
  - Unity Hub 3.22.3 (184 MB, signature checked: Unity Technologies SF),
    installed silently to `D:\Unity\Hub`.
  - Unity Editor **6000.0.85f1** (Unity 6.0 LTS, 4.03 GB) – downloading.
    (6.0 LTS = the version all API checks were done against.)
  - Android Build Support – later, only needed for the APK.
- **Drive C:** the Hub installer adds its usual Start-menu shortcut and
  registry entries on C:, and Hub keeps its settings in
  `%APPDATA%\UnityHub`. The Unity programs themselves are on D:.
- A `winget show` query auto-accepted the Microsoft Store *source*
  terms (needed just to look up the Hub package); nothing was installed
  through winget.
- Your connection is ~265 KB/s, so the editor download takes ~4 hours.

**New while waiting:** `Tests/PlayMode/BornoPlayTests.cs` – an automatic
"play the whole game" test (trace, scribble, Letter Match, Balloon Pop,
parent gate, settings) that also saves screenshots to
`Builds/TestScreenshots/`. Small test hooks were added (read-only screen
accessors on BornoApp, `TracingBoard.AddTestStroke`, `TapOption`,
`TapBalloon`, `TapChoice`, `ProgressStore.OverrideFilePath` so tests
never touch the real save). Compile check OK, 62 Core tests pass.

---

## Unity installed and the game checked in REAL Unity (2026-10-18, evening)
**Done**
- Editor download finished (4.03 GB, ~10 h at ~100 KB/s; Unity signature
  valid). Installed **Unity 6000.0.85f1** to
  `D:\Unity\Editors\6000.0.85f1\Editor\Editor\Unity.exe` (the double
  "Editor" is only a folder-name side effect; it works fine).
- First import: compile errors because no Unity UI package was installed
  (no `manifest.json`). Fixed with a slim `Packages/manifest.json`
  (14 packages; Unity's default 51-package list with Analytics/Purchasing
  was removed).
- `BornoSetup.RunBatch` ran: portrait, `com.borno.alphabet`, version 0.2.0
  (code 2), IL2CPP, ARMv7+ARM64, no internet permission, icon, `Main.unity`
  in Build Settings. All Unity cloud services/analytics are **off**.
- PlayMode test hung in batch mode (WaitForEndOfFrame) → fixed; screenshots
  only in the editor window, which now uses a 540x960 portrait screen.
- Added `Open-Borno-in-Unity.bat` (double-click to open the project).
- Removed a leftover test scene and `borno-game.slnx` from git; ignored now.

**Tested (real Unity 6000.0.85f1)**
- Import + compile: **0 errors, 0 warnings**.
- EditMode tests: **65 / 65 passed**.
- PlayMode tests: **6 / 6 passed** (app starts on Home with 10 letters;
  perfect trace = 3 stars + saved; scribble < 3 stars; Letter Match round =
  3 stars; Balloon Pop round won; parent gate wrong/right answer; sound
  toggle). No errors logged.
- 12 portrait screenshots looked at (`Builds/TestScreenshots/`, not in git):
  all screens lay out correctly.
- Not tested: phone build (needs Android module), the `BORNO_SPEECH` build in
  real Unity, real touch on a phone.

**You must do by hand**
- Play it: double-click `Open-Borno-in-Unity.bat`, press Play.
- For the phone: add Android Build Support in Unity Hub (Google licence).

---

## First real play by you (2026-10-19)
- Problem: Unity opened an empty "Untitled" scene the first time, so Play
  showed nothing. Fixed: `BornoAutoSetup` now opens `Main.unity` when Unity
  starts with an empty scene, and the new menu **Borno → Play Game** opens
  the game scene and starts it.
- You tested it: **Borno → Play Game started the game.** Unity's log showed
  no errors.
- Added `HOW_TO_PLAY.md` (simple steps).
