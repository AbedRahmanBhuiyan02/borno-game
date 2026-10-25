# বর্ণ Borno – Bangla alphabet game for kids (web version)

A small, offline web game that helps children aged 3–6 learn the Bangla
alphabet. Plain **HTML + CSS + JavaScript** – no game engine, no build
tools, no internet, no external services.

- ✏️ **Trace** a letter with a finger (or mouse) → 1 to 3 stars
- 🔤 **Letters** – pick any of the 10 letters: অ আ ই ঈ উ ক খ গ ঘ চ
- 🖼️ **Letter Match** – which letter does the word start with?
- 🎈 **Balloon Pop** – pop the balloons with the right letter
- 🧠 Letters the child finds hard come back more often
- ⭐ Stars and 7 stickers, saved in the browser
- 👪 **Parent page** (behind a "7 + 8 = ?" question): progress, sound on/off,
  **record your own voice** for every letter and word, reset

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
| Home | **লিখি / Trace** = trace a letter · **অ আ / Letters** = choose a letter · **🎈 Games** · small **👪 Parents** button |
| Tracing | Trace the grey letter, then press **✔ Done** → stars. **🧽 Clear** erases. Tap the letter or 🔊 to hear it, tap the picture to hear the word |
| Letter Match | Tap the letter the word starts with |
| Balloon Pop | Pop only the balloons with the letter shown at the top |
| Parents | Answer the sum, see progress, record voices, switch sound off, reset |

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
  letters.js        ALL letter content (letter, word, picture, sounds)
  images/           pictures for the words + app icon (icon.png)
  sounds/letters/   optional voice files for letters   (empty for now)
  sounds/words/     optional voice files for words      (empty for now)
tests/
  unit.html         automatic checks of the game rules – open in a browser
  e2e.html          plays the whole game automatically (see notes in file)
tools/
  make-placeholder-art.ps1   (Windows) re-draws the simple pictures
```

**How the tracing check works** (in `script.js`, section 3): the letter and
the child's line are drawn into small black-and-white pictures.
- **coverage %** = how much of the letter the child's line covers
- **precision %** = how much of the child's line is on the letter
- ⭐⭐⭐ = both ≥ 80% · ⭐⭐ = both ≥ 60% · ⭐ = coverage ≥ 25% · otherwise "try again"
- a drawing more than 2.5× longer than the letter counts as scribbling → max ⭐

The letters are drawn with the Bangla font that is already on the device
(Windows: Nirmala UI, Android: Noto Sans Bengali, iPhone: Kohinoor Bangla).
If a device has no Bangla font, simple backup shapes from `letters.js` are
used instead (try it with `index.html?strokes=1`).

## Adding a letter
Copy one block in `assets/letters.js`, change `id`, `letter`, `word`,
`english`, `picture`, and put the picture in `assets/images/`. No other
change needed – the letter appears in tracing, the grid, both games and the
parent page.

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
