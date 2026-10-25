# বর্ণ Borno – Bangla alphabet game for kids (web version)

A small, offline web game that helps children aged 3–6 learn the Bangla
alphabet. Plain **HTML + CSS + JavaScript** – no game engine, no build
tools, no internet, no external services.

- 🔤 **All 50 letters**: 11 স্বরবর্ণ (vowels) + 39 ব্যঞ্জনবর্ণ (consonants),
  each with an example word and picture (অ – অজগর 🐍, ক – কলা 🍌, …)
- ✏️ **লিখি / Trace** a letter with a finger (or mouse) → 1 to 3 stars
- 📚 Letters open **step by step**: a child starts with অ আ ই ঈ উ ঊ; every
  letter learned (2+ stars) opens the next one
- 🖼️ **প্রথম বর্ণ / Letter Match** – which letter does the word start with?
- 🎈 **বেলুন ফাটাও / Balloon Pop** – pop the balloons with the right letter
- 🧠 Letters the child finds hard come back more often
- ⭐ Stars and 7 stickers, saved in the browser
- 🇧🇩 **Bangla interface** (with Bangla numbers ০১২…) – 🌐 button switches to English
- 🔠 Round, child-friendly font **Baloo Da 2** included – same letters on every device
- 👪 **Parent page** (behind a "৭ + ৮ = ?" question): progress, sound on/off,
  language, **record your own voice** for every letter and word, reset

No ads, no tracking, no accounts, no data leaves the device.

---

## How to run (pick one)

### A. Easiest – just open the file (computer)
1. Open the folder `D:\Projects\borno-game`.
2. Double-click **`index.html`**. It opens in your browser (Chrome, Edge or
   Firefox). That's it – play!

Everything works this way, without internet.

### B. With a tiny web server (needed for the phone)
If Python is installed, in the project folder run:

```bash
python -m http.server 8000
```

- On the same computer open <http://localhost:8000>.
- On a **phone in the same Wi-Fi**: open `http://<computer-IP>:8000`
  (find the IP with `ipconfig`, e.g. `http://192.168.0.105:8000`).
  Tip: in the phone browser menu choose **"Add to Home screen"**.

(No Python? Install it from python.org, or use option A on the computer.)

## How to play
| Screen | What to do |
|--------|-----------|
| Home | **লিখি** = the game picks a letter to trace · **বর্ণমালা** = choose any of the 50 letters · **খেলা** = games · **👪 অভিভাবক** = parents · **🌐** = Bangla/English |
| Tracing | Trace the grey letter, then press **✔ হয়েছে (Done)** → stars. **🧽 মুছি (Clear)** erases. Tap the letter or 🔊 to hear it, tap the picture to hear the word |
| প্রথম বর্ণ | Tap the letter the word starts with |
| বেলুন ফাটাও | Pop only the balloons with the letter shown at the top |
| অভিভাবক | Answer the sum, see progress, record voices, sound/language, reset |

## Sounds (letters and words)
The pop / chime sound effects are made by code and always work. For the
**letter and word voices** the game uses, in this order:
1. **Your own recordings** – Parents page → *Record letter sounds* → tap 🎤
   and speak (2 seconds). Saved only in this browser on this device.
2. **Sound files** you put in `assets/sounds/` and name in `assets/letters.js`
   (`letterSound: "assets/sounds/letters/ka.mp3"`).
3. A **Bangla voice built into the device** (many Android phones have one) –
   only if it works offline.

If none of these exists the game is silent and shows a small hint once.

## Project files
```
index.html          the page: all screens (home, tracing, games, parents...)
style.css           the look: colours, big buttons, phone + computer layout
script.js           all game logic (tracing check, stars, games, sounds...)
sw.js               optional: keeps the game working offline when it is
                    opened from a web server (option B / a website)
assets/
  letters.js        ALL 50 letters (letter, word, emoji picture, sounds)
  strings.js        ALL texts of the game in Bangla and English
  fonts/            Baloo Da 2 font + its licence (OFL.txt)
  images/icon.png   app icon
  sounds/letters/   optional voice files for letters   (empty for now)
  sounds/words/     optional voice files for words      (empty for now)
tests/
  unit.html         automatic checks of the game rules – open in a browser
  e2e.html          plays the whole game automatically (see notes in file)
  calibrate.html    helps choose the tracing settings (see DECISIONS.md)
  helpers.js        shared code for the test pages
```

**How the tracing check works** (in `script.js`, section 3): the letter and
the child's line are drawn into small black-and-white pictures.
- **coverage %** = how much of the letter the child's line covers
- **precision %** = how much of the child's line is on the letter
- ⭐⭐⭐ = both ≥ 80% · ⭐⭐ = both ≥ 60% · ⭐ = coverage ≥ 25% · otherwise "try again"
- a drawing more than 2.5× longer than the letter counts as scribbling → max ⭐

## Changing letters or texts
- **Letters:** edit one line in `assets/letters.js` (word, English, emoji).
  To add a picture file instead of the emoji, put it in `assets/images/` and
  add `picture: "assets/images/name.png"` to that letter.
- **Texts:** edit `assets/strings.js` (Bangla `bn` and English `en`).
- No other change needed – everything appears in tracing, the letter grid,
  both games and the parent page.

## Checking for errors
- Open **`tests/unit.html`** in your browser → it must say **✅ ALL PASSED**.
- If something looks wrong in the game, press **F12** (Console tab) and look
  for red messages – send them to me.

Things that are normal / not errors:
- No voice when you tap 🔊 → record one on the Parents page (see above).
- Recording says "not possible here" → use Chrome/Edge/Firefox and open the
  game on that device itself (option A or `localhost`). Browsers only allow
  the microphone there, not over `http://192.168…`.
- Progress is per browser: Chrome and Edge each keep their own stars.

The old Unity version is kept in git as the tag `unity-version`.
