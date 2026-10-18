# Play Store preparation

A step-by-step list for publishing Borno on Google Play. Everything here
is a draft – read it, change what you like, and replace every
`<...>` placeholder.

## 1. Before you build
- [ ] Change the package name in `Assets/Scripts/Editor/BornoSetup.cs`
      (`AndroidPackageName = "com.borno.alphabet"`) to your own, e.g.
      `com.<yourname>.borno`. It can **never** change after the first upload.
- [ ] Record the voices (see `RECORDING_GUIDE.md`) – the game is much
      better with real Bangla sounds.
- [ ] (Optional) add a Bangla font (Noto Sans Bengali, SIL OFL) as
      `Assets/Art/Resources/Fonts/BornoFont.ttf` and list it in ASSETS.md.
- [ ] Test on at least one cheap phone (Borno → Build Android APK (test)).
- [ ] Every release: increase `Version` and `AndroidVersionCode` in
      `BornoSetup.cs`, then run Borno → Setup Project.

## 2. Upload key (keystore) – keep it secret!
1. Unity: Edit → Project Settings → Player → Android → Publishing Settings →
   **Keystore Manager** → Create new → save it **outside** the project folder,
   e.g. `D:\Keys\borno-upload.keystore`.
2. Write the passwords in a password manager. If you lose the key you
   can't update the app (Play App Signing can reset an *upload* key, but
   it is a hassle).
3. **Never** put the keystore or passwords in git. `.gitignore` already
   blocks `*.keystore` / `*.jks`, and the hourly auto-push refuses them.
4. Borno → **Build Android App Bundle (Play Store)** → `Builds/Borno.aab`.

## 3. Play Console – app setup
| Item | Answer for Borno |
|------|------------------|
| App or game | Game – Educational |
| Free or paid | Free |
| Target age groups | **Ages 5 & under** and **6–8** |
| Appeals to children | Yes → the app is in the Families program |
| Ads | **No ads** |
| In-app purchases | None |
| Content rating (IARC questionnaire) | Educational, no violence, no user interaction, no sharing of location/personal info → expect "Everyone / PEGI 3" |
| Privacy policy URL | Publish `PRIVACY_POLICY.md` somewhere public (e.g. GitHub Pages or a public gist) and paste the link |
| News app / COVID app / Government app | No |

### Data safety form
- Does the app collect or share user data? **No.**
- Is data encrypted in transit? Not applicable (no data leaves the device).
- Can users request deletion? Data stays on the device; "Reset progress" in
  the parent page deletes it; uninstalling removes it.
- Microphone (only if you build with `BORNO_SPEECH`): audio is processed
  on the device only and **not collected** → still "No data collected".

### Families policy checklist
- [x] No ads, no ad SDKs
- [x] No analytics / tracking SDKs (Unity Analytics not used – also check
      Unity Services are off: Edit → Project Settings → Services)
- [x] No internet permission
- [x] No personal data collected
- [x] Parent area behind a parent gate
- [x] No links out of the app, no social features, no purchases
- [ ] Check the final `AndroidManifest` permissions: build an APK, then in
      Android Studio "Analyze APK" (or `aapt dump permissions`) – expected:
      none (or only `RECORD_AUDIO` if you built with `BORNO_SPEECH`).

## 4. Store listing (draft)
**App name (30 chars):** Borno – Bangla Letters for Kids

**Short description (80 chars):**
Trace Bangla letters, hear the sounds and play – no ads, works offline.

**Full description:**
> Borno (বর্ণ) helps children aged 3–6 take their first steps with the
> Bangla alphabet.
>
> ✏️ Trace letters with a finger – green dots show where to start, and the
> child gets 1 to 3 stars.
> 🔊 Hear each letter and a simple example word.
> 🎈 Two mini-games: Letter Match and Balloon Pop.
> 🧠 Letters the child finds hard come back more often.
> ⭐ Collect stars and stickers.
> 👪 Parent page (behind a grown-ups check) shows progress for every letter.
>
> Safe for kids: no ads, no internet needed, no data collected.
> Made for low-cost Android phones.
>
> Letters so far: অ আ ই ঈ উ ক খ গ ঘ চ – more coming!

**Graphics you need:**
- App icon 512×512 PNG – export from `Assets/Art/Icon/borno_icon.png`
  (1024×1024, resize).
- Feature graphic 1024×500.
- At least 2 phone screenshots (take them from the Game view in Unity,
  portrait 1080×1920, or from your phone).

## 5. Testing track
Start with **Internal testing** (up to 100 testers by email), then Closed
testing. New personal developer accounts must run a closed test with
testers for some days before production – check the current rule in the
Play Console.
