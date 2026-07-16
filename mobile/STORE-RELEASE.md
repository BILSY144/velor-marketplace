# Velor — Store Release Path

The app is fully configured for standalone builds (bundle ID
`store.velorcommerce.app` on both platforms, EAS project linked, build
profiles in `eas.json`, manual build workflow in
`.github/workflows/eas-build.yml`). What remains is account registration —
William does these himself, per standing practice:

## 1. William registers (one-time)

- **Apple Developer Program** — https://developer.apple.com/programs/enroll/
  — $99/year, enrol as Velor Commerce Ltd (needs the company's D-U-N-S
  number; enrolling as an organisation lets the App Store listing say
  "Velor Commerce Ltd" instead of a personal name). Approval usually 1–2
  days.
- **Google Play Console** — https://play.google.com/console/signup —
  $25 one-off, register as an organisation (needs the company details and
  a payment card).

## 2. One-time credential setup (after registration)

From any machine with Node (or ask a session to walk through it):

- `cd mobile && npx eas-cli credentials` — sign in as bilsy144, let EAS
  generate and store the Android keystore and iOS distribution certificate
  + provisioning profile. **The Android keystore cannot be recovered if
  lost outside EAS — letting EAS manage it is the safe default.**
- For iOS, EAS will ask for the Apple ID that owns the developer account
  (interactive, once). After that, CI builds run non-interactively.

## 3. Building

- GitHub → Actions → "EAS Build (manual)" → Run workflow:
  - `android` + `preview` → installable .apk for direct testing (no Play
    account needed at all — works today).
  - `production` + platform → store-ready .aab / .ipa.
- Builds queue on Expo's servers; progress and artifacts at
  https://expo.dev/accounts/bilsy144/projects/velorvelor/builds

## 4. Submitting

- iOS: `npx eas-cli submit -p ios` (uses an App Store Connect API key EAS
  can create) → TestFlight first, then App Store review (1–3 days).
- Android: first upload to Play Console is manual (create the app listing,
  upload the .aab to Internal testing); after that `eas submit -p android`
  automates it.
- Store listing assets: the 1024×1024 icon exists (`assets/icon.png`);
  screenshots come from the finished app on-device; privacy nutrition
  labels / Data safety answers should match the website's privacy policy.

## Notes

- OTA updates keep working for store builds: production builds follow the
  `production` update channel (see eas.json), Expo Go keeps following
  `preview`. Publishing to production is a deliberate, separate act.
- Buyer launch is 6 August — Apple review takes 1–3 days plus enrolment
  1–2 days, so registering the Apple account this week keeps the app
  store-ready ahead of launch.
