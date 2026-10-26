# বর্ণ Borno – Bangla alphabet game for kids (web version)

A small, offline web game that helps children aged 3–6 learn the Bangla
alphabet. Plain **HTML + CSS + JavaScript** – no game engine, no build
tools, no internet, no external services.

**Version 0.6.1** – see [CHANGELOG.md](CHANGELOG.md) for what changed.

### For the child
- 🔤 **All 50 letters** (11 স্বরবর্ণ + 39 ব্যঞ্জনবর্ণ) and the **numbers ০–৯**,
  each with a word and a picture (অ – অজগর 🐍, ক – কলা 🍌, ৩ – তিন 🍎🍎🍎)
- ✏️ **লিখি / Trace** with a finger in **3 levels** per letter:
  1. thick grey letter (+ green numbered start dots when a teacher recorded the order)
  2. faint letter
  3. from memory – the letter is shown for a moment, then hidden
- 👀 **দেখো / Watch**: the letter is written slowly in front of the child
  (automatically the very first time a letter is traced)
- 🥉🥈🥇 **Medals** with review timing: a letter comes back after 1 day,
  then 3 days, then 1 week
- 📚 Letters open **step by step** (start with অ আ ই ঈ উ ঊ); hard letters come back more often
- 4 mini-games: 🖼️ **প্রথম বর্ণ** (first letter), 🎈 **বেলুন ফাটাও** (balloon pop),
  ➕ **কার** (ক + া = কা), 🧩 **শব্দ বানাও** (build মা, কলা, বাড়ি … from pieces)
- ⭐ Stars and 7 stickers · 🇧🇩 Bangla interface (🌐 switches to English)

### For parents and teachers (behind a "৭ + ৮ = ?" question)
- Progress per letter (level, medal, stars), weak letters, **play time per day**
- 🎤 **Recording session**: walks through all 120 clips (60 letters + 60 words),
  then **download `voices.js`** so every device has your voice
- ✍️ **Teacher mode**: write each letter in the correct stroke order once,
  then **download `strokes.js`** – the game then checks the order
- 📱 **Device check**: is this phone fast enough?
- Sound / voice / language switches, reset, version number

No ads, no tracking, no accounts, no data leaves the device.

---

## How to run (pick one)

### ⭐ Play online – any phone or computer
**<https://abedrahmanbhuiyan02.github.io/borno-game/>**

Open the link in Chrome on the phone → menu ⋮ → **Add to Home screen**.
After the first visit it also works **without internet**. Every push to
GitHub updates this page automatically (takes 1–2 minutes).

### A. Easiest offline – just open the file (computer)
1. Open the folder `D:\Projects\borno-game`.
2. Double-click **`index.html`**. It opens in your browser (Chrome, Edge or
   Firefox). That's it – play!

### B. With a tiny web server (needed for the phone)
If Python is installed, in the project folder run:

```bash
python -m http.server 8000
```

- On the same computer open <http://localhost:8000>.
- On a **phone in the same Wi-Fi**: open `http://<computer-IP>:8000`
  (find the IP with `ipconfig`, e.g. `http://192.168.0.105:8000`).
  Tip: in the phone browser menu choose **"Add to Home screen"**.
- When the game is opened from a web server it also keeps a copy for offline
  use (`sw.js`). New versions arrive automatically the next time it is opened
  with internet – nothing to change by hand.

## How to play
| Screen | What to do |
|--------|-----------|
| Home | **লিখি** = the game picks a letter · **বর্ণমালা** = choose any letter or number · **খেলা** = games · **👪 অভিভাবক** = parents · **🌐** = Bangla/English |
| Tracing | Trace the letter, press **✔ হয়েছে** → stars. **🧽 মুছি** erases, **👀 দেখো** shows how to write it. The badge at the top shows the level (স্তর ১/২/৩) and medal |
| প্রথম বর্ণ | Tap the letter the word starts with |
| বেলুন ফাটাও | Pop only the balloons with the letter shown at the top |
| কার | Which syllable do the letter and the sign make? (ক + ি = কি) |
| শব্দ বানাও | Tap the pieces in the right order to build the word in the picture |
| অভিভাবক | Answer the sum → progress, recording session, teacher mode, device check, settings, reset |

## Voices (letters and words)
The pop / chime sound effects are made by code and always work. For the
**letter and word voices** the game uses, in this order:
1. **Recordings made on this device** – Parents → *Recording session*.
2. **`assets/voices.js`** – recordings shipped with the game. Make it with the
   recording session → **Download voices.js** → put the file into `assets/`
   (replace the old one). Then every device plays your voice.
3. **Sound files** in `assets/sounds/` named in `assets/letters.js`
   (`letterSound: "assets/sounds/letters/ka.mp3"`).
4. The **Bangla voice of the phone or browser** (Android: Google Bangla voice; offline ones are preferred).
5. The **computer voice** that comes with the game (`assets/voice-computer.js`,
   made with the free program eSpeak NG). It sounds robotic, but it is always
   there – on every phone, also iPhones, also without internet. The কার game's
   syllables are in `assets/voice-computer-kar.js` (loaded when that game opens).

To make the computer voice again (e.g. after adding words):
```bash
powershell -ExecutionPolicy Bypass -File tools\make-computer-voice.ps1 -EspeakDir "C:\path\to\eSpeak NG"
```

## Stroke order (teacher mode)
Parents → **Teacher mode** → choose a letter → write it with the right
strokes in the right order → **Save**. On this device the game now shows
green numbered start dots (level 1) and gives ⭐⭐ instead of ⭐⭐⭐ when the
order is wrong. **Download strokes.js** and put it into `assets/` to ship the
order to every device. Letters without a teacher recording use an automatic
"watch" animation, but their order is not checked.

## Project files
```
index.html          the page: all screens
style.css           the look: colours, big buttons, phone + computer layout
sw.js               optional offline copy when opened from a web server
js/                 the game code, one file per part (loaded in this order):
  core.js           shared helpers, letter drawing, tracing score, stroke order
  progress.js       what is saved; levels, medals, review timing, next letter
  games.js          rules of the 4 mini-games and the parent question
  sound.js          sound effects, voices, recording, voices.js export
  board.js          the drawing board (tracing + teacher mode, watch animation)
  ui.js             the child's screens (home, letters, tracing, games)
  parent.js         parent page, recording session, teacher mode, device check
  main.js           start-up: connects every button to its action
assets/
  letters.js        the 50 letters + 10 numbers (word, emoji, sounds)
  reading.js        the 10 vowel signs (কার) and the 20 words for শব্দ বানাও
  strings.js        ALL texts in Bangla and English
  voices.js         recorded voices shipped with the game (empty for now)
  voice-computer.js       computer voice: letters, numbers, words (3.5 MB)
  voice-computer-kar.js   computer voice: কার syllables (5.6 MB, loaded only by that game)
  strokes.js        teacher stroke order shipped with the game (empty for now)
  fonts/            Baloo Da 2 font + its licence (OFL.txt)
  images/icon.png   app icon
tests/
  unit.html         automatic checks of the rules – open in a browser
  e2e.html          plays the whole game automatically (see notes in file)
  calibrate.html    helps choose the tracing settings (see DECISIONS.md)
  run-tests.ps1     runs all tests on Windows (Edge)
  run-tests.sh      runs all tests on Linux/macOS (Chrome) – also used on GitHub
tools/make-computer-voice.ps1 builds the computer voice files with eSpeak NG
.github/workflows/tests.yml   GitHub runs all tests on every push
CHANGELOG.md                  what changed in each version
TESTING_WITH_CHILDREN.md      how to test with 3–5 children + observation sheet
TESTING_ON_PHONE.md           checklist for a cheap phone
```

**How the tracing check works** (`js/core.js`, "tracing score" part): the
letter and the child's line are drawn into small black-and-white pictures.
- **coverage %** = how much of the letter the child's line covers
- **precision %** = how much of the child's line is on the letter
- ⭐⭐⭐ = both ≥ 80% · ⭐⭐ = both ≥ 60% · ⭐ = coverage ≥ 25% · otherwise "try again"
- a drawing more than 2.5× longer than the letter counts as scribbling → max ⭐
- with a teacher's stroke order: wrong order or direction → max ⭐⭐

## Changing letters, words or texts
- **Letters / numbers:** edit one line in `assets/letters.js`.
- **Words for শব্দ বানাও:** edit `assets/reading.js` – the pieces must join
  to the word (the tests check this).
- **Texts:** edit `assets/strings.js` (Bangla `bn` and English `en`).

## Checking for errors
- Quick: open **`tests/unit.html`** in your browser → **✅ ALL PASSED**.
- Everything (Windows):
  ```bash
  powershell -ExecutionPolicy Bypass -File tests\run-tests.ps1
  ```
- **Automatically on GitHub:** every push runs all tests. On the project's
  GitHub page a green ✔ next to the commit means all passed; a red ✘ means
  something broke (click it to see which check failed).
- If something looks wrong in the game, press **F12** (Console tab) and look
  for red messages.

## Releasing a new version
1. Change `B.VERSION` in `js/core.js` (e.g. `0.4.0` → `0.5.0`).
2. Add a section at the top of `CHANGELOG.md`.
3. Run the tests, commit, push. Phones pick up the new files automatically.

Things that are normal / not errors:
- No voice when you tap 🔊 → record one on the Parents page (see above).
- Recording says "not possible here" → open the game on that device itself
  (option A or `localhost`). Browsers only allow the microphone there.
- Progress is per browser: Chrome and Edge each keep their own stars.

The old Unity version is kept in git as the tag `unity-version`.
