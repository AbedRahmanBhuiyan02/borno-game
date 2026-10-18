# Recording guide – letter and word sounds

The game already plays sounds when they exist; until then it is silent.
Recording your own voice is the best option: it is free, has no licence
problems, and a familiar Bangladeshi voice is great for kids.

## Files to record (20 files)

Save them exactly with these names (WAV or OGG, mono). Unity finds them by
name – no code changes needed.

| Letter | Say | File | Word | File |
|--------|-----|------|------|------|
| অ | "অ" (o) | `Assets/Audio/Resources/Sounds/Letters/o.wav` | অজগর | `Assets/Audio/Resources/Sounds/Words/ojogor.wav` |
| আ | "আ" (aa) | `.../Letters/aa.wav` | আম | `.../Words/aam.wav` |
| ই | "ই" (i) | `.../Letters/i.wav` | ইট | `.../Words/it.wav` |
| ঈ | "ঈ" (dirgho i) | `.../Letters/ii.wav` | ঈগল | `.../Words/igol.wav` |
| উ | "উ" (u) | `.../Letters/u.wav` | উট | `.../Words/ut.wav` |
| ক | "ক" (ko) | `.../Letters/ka.wav` | কলা | `.../Words/kola.wav` |
| খ | "খ" (kho) | `.../Letters/kha.wav` | খাতা | `.../Words/khata.wav` |
| গ | "গ" (go) | `.../Letters/ga.wav` | গাছ | `.../Words/gach.wav` |
| ঘ | "ঘ" (gho) | `.../Letters/gha.wav` | ঘর | `.../Words/ghor.wav` |
| চ | "চ" (cho) | `.../Letters/cha.wav` | চশমা | `.../Words/choshma.wav` |

(`...` = `Assets/Audio/Resources/Sounds`)

Tip: for the word files you can say "অ – অজগর" (letter, then word).

## How to record (free tools)
1. Use a phone voice recorder or **Audacity** (free) in a quiet room.
2. Speak clearly and a bit slowly, like a teacher. 0.5–1.5 seconds each.
3. In Audacity: cut the silence before/after, Effect → Normalize (-1 dB),
   File → Export → WAV (mono, 22050 or 44100 Hz).
4. Drop the files into the folders above. In Unity, select all of them and
   set **Load Type: Decompress On Load**, **Compression: Vorbis, Quality 50**
   (small and fast on cheap phones).
5. Add one line to `ASSETS.md`: "Sounds/Letters + Sounds/Words – recorded
   by <name> for this project – own work".
