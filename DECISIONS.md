# Decisions

Things that were unclear, and the simple default I chose. Change any of
these if you disagree.

## Setup
- **Project folder**: `D:\Projects\borno-game` (as asked). The session's
  start folder `D:\Borno Project` was empty, so the web prototype code was
  **not available**; the tracing check was rebuilt from your description
  (coverage % + precision % → stars).
- **Unity version**: Unity 6 LTS recommended. Unity is not installed on this
  PC, so the project was written by hand. `Packages/manifest.json` and
  `ProjectSettings/` are **not** included on purpose: Unity creates correct,
  version-matching defaults on first open (hand-written package versions
  could be wrong for your editor version and break the import).
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
- No Bangla font is included (licence rule). Until you add
  `Assets/Art/Resources/Fonts/BornoFont.ttf` the game shows romanized labels
  (e.g. "ka") next to the drawn letter guide.
- UI button labels are short English words + icons for now (kids 3–6 don't
  read; parents do). Bangla voice-over is the real teacher.

## Android
- Package name placeholder: `com.borno.alphabet` – change it before
  publishing (must be unique on Play Store).
- Portrait only, IL2CPP + ARM64/ARMv7 (Play Store needs 64-bit).
- No INTERNET permission is requested (we never use networking).
