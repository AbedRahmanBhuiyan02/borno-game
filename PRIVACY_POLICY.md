# Privacy – Borno

_Last updated: 2026-10-25_

Borno is a learning game for young children (ages 3–6). It runs completely
inside the web browser.

**Borno collects nothing.** It has no ads, no analytics or tracking, no
accounts, no log-in, no purchases, and it does not connect to the internet
or to any external service.

**Saved on the device only:**
- Game progress (stars, level and medal per letter, when a letter should be
  reviewed again) and the settings, in the browser's local storage.
- Play time per day for the last 30 days (minutes, number of tracings and
  games – no times of day, nothing about the child), shown on the parent page.
- Voice recordings a parent makes on the parent page (optional), in the
  browser's IndexedDB. They are only played back inside the game.
- The stroke order a teacher draws in teacher mode (optional).

Nothing is sent anywhere. A parent can delete the progress on the parent page
("Delete all progress"); clearing the browser's site data removes everything.

**Downloads:** only when a parent taps "Download voices.js" or "Download
strokes.js". The file is saved on that device so the parent can add it to
the game; it contains the parent's recordings or the teacher's strokes.

**Device check:** reads the screen size, memory size and browser version and
shows them on the screen only. Nothing is stored or sent.

**Microphone:** only used when a parent taps 🎤 in the recording session,
and only after the browser asks for permission. Recordings are 2 seconds long
and stay in this browser.

The parent page is protected by a simple "grown-ups only" question.
