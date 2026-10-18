# Assets and licences

Rule: only original work or clearly free assets (CC0, SIL OFL, etc.).
Every file under `Assets/Art` and `Assets/Audio` must be listed here with
its source and licence **before** it is committed.

## Assets currently in the project

| File(s) | Source | Licence |
|---------|--------|---------|
| `Art/Resources/Pictures/*.png` (ojogor, aam, it, igol, ut, kola, khata, gach, ghor, choshma) | Drawn from basic shapes by `Tools/make-placeholder-art.ps1`, made for this project | Original, CC0 (free for any use) |
| `Art/Icon/borno_icon.png` | Drawn by `Tools/make-placeholder-art.ps1` (shapes only, no font) | Original, CC0 |
| Letter stroke shapes in `Data/Resources/Letters/letters.json` | Written by hand for this project | Original, CC0 |
| Letter pictures on buttons/tiles/balloons | Drawn at runtime from the stroke data (`LetterSprites.cs`) | Original |
| Stars, circles, rounded boxes | Generated at runtime (`SpriteFactory.cs`) | Original |
| Sound effects (pop, chime, bonk, hooray, tap) | Synthesised at runtime from sine waves (`SoundFx.cs`) | Original |

**No fonts and no voice recordings are included yet.** The game works
without them: letters are drawn from their strokes, labels use Unity's
built-in font, and missing voices are simply silent.

## To add (by you)

| What | Where | Recommended source | Licence |
|------|-------|--------------------|---------|
| Bangla font | `Art/Resources/Fonts/BornoFont.ttf` | **Noto Sans Bengali** – fonts.google.com/noto/specimen/Noto+Sans+Bengali | SIL Open Font License 1.1 |
| Letter + word voices | `Audio/Resources/Sounds/Letters/`, `.../Words/` | Record your own (see `RECORDING_GUIDE.md`) | Own work |
| Nicer pictures | same names in `Art/Resources/Pictures/` | Your own drawings, or Kenney.nl (CC0) | CC0 / own |

When you add a file, add a row to the first table.
