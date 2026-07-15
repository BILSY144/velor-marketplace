# Velor mobile — dev log

## 2026-07-15 — v1 running on William's phone (first ever)

Scaffold session end-to-end: Expo app built from the approved Atlas mockup,
published via GitHub Actions (EAS Update, branch "preview", project
bilsy144/velorvelor, id 3207e08b-8832-4dba-bc40-d690d70628d9), opened in
Expo Go on William's device. CONFIRMED WORKING by William in chat.

Publishing pipeline: any push to mobile-app touching mobile/** republishes
automatically (.github/workflows/eas-update.yml, secret EXPO_TOKEN set by
William in repo settings). This sandbox CANNOT reach api.expo.dev directly
— always publish through the workflow.

CRITICAL VERSION NOTE: the app is pinned to **SDK 54** (RN 0.81.5, React
19.1, TS 5.9) because the App Store/Play Store version of Expo Go only
supports SDK 54 (newer Expo Go builds stuck in Apple review — see Expo
changelog "expo-go-and-app-store-may-2026"). The first publish was SDK 57
and Expo Go rejected it as incompatible. Do NOT bump the SDK until either
Expo Go catches up or we move to development builds / EAS production
builds (which don't need Expo Go at all). Deps were aligned offline via
node_modules/expo/bundledNativeModules.json since expo install can't
reach the API from the sandbox.

Next build phases: passport + orders screens, real product detail page,
sign-in (passkeys at launch), in-app checkout for 6 Aug, seller side.
Store release path: EAS Build + Apple Developer ($99/yr) + Play ($25) —
William registers those himself.
