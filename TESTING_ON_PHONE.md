# Testing Borno on a real low-cost phone

Most families will use a cheap Android phone (2–3 GB memory, small screen,
older Chrome). This checklist finds the problems that tests on a computer
cannot find. It takes about 20 minutes.

## 1. Get the game onto the phone
1. On the computer, in the project folder:
   ```bash
   python -m http.server 8000
   ```
2. Find the computer's address with `ipconfig` (e.g. `192.168.0.105`).
3. On the phone (same Wi-Fi), open Chrome: `http://192.168.0.105:8000`
4. Chrome menu ⋮ → **Add to Home screen**.

## 2. Built-in device check (1 minute)
Parents (answer the sum) → **📱 Device check**. It measures:

| Line | Good | Problem if |
|------|------|-----------|
| Screen | any | width below 320 |
| Tracing check | under 150 ms | over 300 ms → the stars appear late |
| Animation | 40+ frames per second | under 30 → balloons and the demo stutter |
| Memory | 2 GB or more | 1 GB → the browser may reload the game |
| Font / emoji / microphone / saving | all "yes" | any "no" – note which one |

The last line says **✔ Runs well** or **⚠ A bit slow**. Take a photo of the
result (no personal data is shown) and note the phone model.

## 3. Checklist (tick each one)

Write the phone model, Android version and Chrome version
(Chrome ⋮ → Settings → About Chrome) at the top.

**Start**
- [ ] The game opens from the home screen icon in under 5 seconds
- [ ] Bangla letters look right (no boxes □, no dotted circles ◌)
- [ ] Emoji pictures show (no empty boxes)

**Tracing**
- [ ] The drawing follows the finger with no visible delay
- [ ] The page does not scroll or zoom while drawing
- [ ] Two fingers at once do not break the drawing
- [ ] Stars appear within 1 second after ✔
- [ ] 👀 দেখো animation is smooth
- [ ] Level 3: the letter disappears after a moment

**Games**
- [ ] Balloons move smoothly; a tap pops the right balloon
- [ ] কার and শব্দ বানাও buttons are big enough for a child's finger

**Sound**
- [ ] Pop / chime sounds play (phone not on silent)
- [ ] Recording session: the microphone works (only on `localhost` or https –
      on `http://192.168…` the browser blocks the microphone, that is normal)

**Phone behaviour**
- [ ] Turn the phone sideways and back: the game still fits
- [ ] Press the phone's ◀ back button: the game goes back one screen
      (it does not close the game)
- [ ] Switch to another app for 1 minute and come back: progress is still there
- [ ] Close the browser completely and open the game again: stars are still there
- [ ] **Airplane mode on**, open the game from the home screen icon:
      it still starts (offline copy)
- [ ] Play 10 minutes: the phone does not get hot, the game does not slow down

**Battery** (optional): note the battery % before and after 15 minutes of play.

## 4. Report
For each problem write: the screen, what you did, what happened, and the
device check photo. Send it to me – I will fix it and add a test where possible.

| Phone | Android | Chrome | Device check | Problems |
|-------|---------|--------|--------------|----------|
|       |         |        | ✔ / ⚠        |          |
