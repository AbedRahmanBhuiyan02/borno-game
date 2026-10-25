# Blockers / open points

## Open
- **No Bangla voices yet.** No offline Bangla voice is installed on this PC,
  and recordings must be made by a person. → Parents page → *Record letter
  sounds* (20 short recordings: 10 letters + 10 words). On many Android
  phones a built-in Bangla voice is used automatically if it works offline.
- **Phone use needs a small web server** (`python -m http.server 8000`) – a
  phone cannot easily open `index.html` from a computer. Python is not
  installed on this PC yet (python.org, free). Recording on the phone only
  works over https or on the phone itself, not via `http://192.168…`.

## Solved
- Unity / Android build tools: **no longer needed** – the game is a web page.
  The Unity version is kept in git as tag `unity-version`. The Unity programs
  in `D:\Unity` (about 12 GB incl. downloads) are no longer used and can be
  uninstalled (Unity Hub → Installs → Uninstall, then uninstall Unity Hub in
  Windows Settings → Apps); `D:\Unity\_downloads` can be deleted.
- GitHub repo: private repo https://github.com/AbedRahmanBhuiyan02/borno-game,
  hourly auto-push task in the Claude app.
