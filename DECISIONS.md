# Decisions

Things that were unclear, and the simple default I chose. Change any of
these if you disagree.

## Setup
- **Project folder**: `D:\Projects\borno-game` (as asked). The session's
  start folder `D:\Borno Project` was empty, so the web prototype code was
  **not available**; the tracing check was rebuilt from your description
  (coverage % + precision % → stars).
- **Unity version**: **6000.0.85f1 (Unity 6.0 LTS)** - installed on this PC
  and used for all checks. `Packages/manifest.json` lists only 14 packages
  (Unity UI 2.0.0, Test Framework 1.6.0, needed engine modules, Visual
  Studio integration, 2D Sprite). Unity's default list was removed because
  it adds Analytics, Purchasing and Services (not allowed in a kids app).
- **GitHub repo name**: `https://github.com/AbedRahmanBhuiyan02/borno-game`
  (your account name from `gh auth status`). See BLOCKERS.md.
- **Render pipeline**: Built-in (no URP package = smaller, simpler).
- **Input**: old Input Manager (`Input.GetTouch`, mouse). No extra package.
  The setup menu switches "Active Input Handling" to *Both* if needed.

## Architecture
- **Core vs Game**: all logic that can be tested lives in
  `Assets/Scripts/Core` with **no UnityEngine reference** (asmdef
  `noEngineReferences: true`). It is written in **C# 5 style** (no `$""`,
  no `=>` members, no `?.`) so the old compiler built into Windows can check
  it while Unity is not installed. Unity itself supports newer C#; you can
  use it in `Game/`.
- **One scene, three screens**: Home, Letter Select and Tracing are panels in
  one scene (`Main.unity`), switched on/off. Loading scenes is slow on cheap
  phones, and one scene is easier for a beginner to follow.
- **UI is built from code** (`UiFactory`) instead of hand-made prefabs. This
  way the project works right after "Borno → Setup Project" with no manual
  scene assembly. You can later replace parts with prefabs made in the editor.
- **No art files needed**: stars/circles are generated textures (64×64) at
  start-up.
- **Letter shape = stroke points in JSON**, not a font or picture. This is
  original data (no copyright problem), tiny, and the same data draws the
  guide and is used for checking. The 10 shapes are **rough placeholders**
  drawn by hand – please improve them (see README section 4).
- **Letter data = JSON** (`Assets/Data/Resources/Letters/letters.json`)
  read with `JsonUtility`. JSON is easier to edit and review in git than a
  ScriptableObject. Each stroke is a flat `float[]` because `JsonUtility`
  cannot read nested arrays.

- **Compile check without Unity**: `Tools/UnityStubs/UnityStubs.cs` is a
  fake, empty copy of only the Unity classes we use, so the Windows compiler
  can check our Game/Editor scripts. It is outside `Assets/` so Unity never
  sees it. It can't prove the real Unity API matches.
- **"Too short" drawings** (less than 15% of the box) are not saved as a
  try – the child just gets "Trace the letter!" again.
- **Next button** always uses the adaptive picker (also when the child came
  from Letter Select), so weak letters keep coming back.

## Tracing rules
- Sample spacing 0.02 of the box, tolerance radius 0.09 of the box (kids'
  fingers are big and small screens are small).
- Stars: 3★ = coverage ≥ 85% & precision ≥ 80%; 2★ = ≥ 60% & ≥ 60%;
  1★ = coverage ≥ 25%; otherwise **0 = "Try again"**. You asked for 1–3
  stars; the extra 0 case stops random taps from getting a star. A 0 result
  is still saved as an attempt (it marks the letter as weak).
- Stroke order and direction are **not** checked yet (kids 3–6; keep it
  forgiving). Could be added later.
- The child can lift the finger and draw several strokes, then press Done.
  Clear erases everything.

## Progress, rewards, weak letters
- Save file: `Application.persistentDataPath/borno_progress.json`. Written
  to a `.tmp` file first, then swapped in, so a crash cannot corrupt it.
  If the file is broken it is renamed `.bad` and a fresh one is started.
- **Every star counts**: total stars = all stars ever earned (replaying
  gives more stars – motivating for small kids). Per letter we also keep the
  best result.
- **Stickers**: unlocked at 3, 10, 20, 35, 50, 75, 100 total stars.
  Shown as coloured badges (placeholder art).
- **Weak letter**: average of the last 5 results is below 2 stars.
- **Adaptive pick weights**: weak = 4, never played = 2, normal = 1, and
  the letter just played ×0.25 (so it does not repeat right away).

## Text / Bangla font
- Unity's built-in text (and TextMeshPro) do **not** do Bangla "shaping"
  (vowel signs like ি ে ো are drawn in the wrong place). Single letters are
  fine. So the example words were chosen without such signs:
  অজগর, আম, ইট, ঈগল, উট, কলা, খাতা, গাছ, ঘর, চশমা.
- No Bangla font is included (you chose not to download one). Instead every
  letter on buttons, tiles and balloons is **drawn from its stroke data**
  (`StrokeRasterizer` + `LetterSprites`, 128×128 per letter, made once). So
  kids see the same shape they trace. Example words then show in English
  until you add `Assets/Art/Resources/Fonts/BornoFont.ttf`; with a font the
  game switches to real Bangla text automatically.
- UI button labels are short English words + icons for now (kids 3–6 don't
  read; parents do). Bangla voice-over is the real teacher.

## Android
- Package name placeholder: `com.borno.alphabet` – change it before
  publishing (must be unique on Play Store).
- Portrait only, IL2CPP + ARM64/ARMv7 (Play Store needs 64-bit).
- No INTERNET permission is requested (we never use networking).

## Later features (added 2026-10-18 after "complete the whole project")
- **Two mini-games**:
  - *Letter Match*: picture + word card, choose the first letter out of 4.
    5 questions per round. Wrong taps grey out that button (no harsh
    "fail"), the child tries again.
  - *Balloon Pop*: pop the balloons showing the target letter; 6 right pops
    win. At most 3 other balloons in a row, so the target always comes.
    Balloons are slow (170–260 units/s) for small fingers.
  - Stars: 0–1 mistakes = 3★, 2–3 = 2★, more = 1★ (finishing always earns
    at least 1 star). Game stars add to the same total as tracing.
- **Weak letters now also come from the games**: a letter is weak if its
  last tracing tries average < 2★ **or** fewer than 60% of its last 5 game
  answers (min. 3) were right.
- **Parent gate**: addition with numbers 4–9 (answer 8–18) and 4 choices; a
  wrong answer closes the gate. Simple and common in kids' apps.
- **Parent page**: totals, per-letter stats, "practise" badge, Sound on/off,
  Say it on/off, Reset progress (needs two taps within 4 s).
- **Speech check = "Say it!" voice detection only**. Real offline Bangla
  speech recognition (e.g. Vosk/Whisper models) is 50–1500 MB and slow on
  low-end phones, and would break the "no heavy packages" rule. So we only
  detect that the child spoke ≥ 0.25 s within 2 s. Audio is never stored.
  It is behind the `BORNO_SPEECH` define (off by default) so normal builds
  have **no microphone permission**; when on, a parent must enable it.
- **Sound effects are synthesised** at start-up (sine waves), no files.
- **Placeholder pictures and icon** are drawn by a script from basic shapes
  (original, CC0) so the game looks complete; replace any time.
- **Open-and-play**: `BornoAutoSetup` runs the setup automatically the first
  time the project is opened (only if `Main.unity` doesn't exist yet).
- **Save format v2** (settings + game stats). v1 saves are upgraded.
- **Version** 0.2.0, version code 2.
