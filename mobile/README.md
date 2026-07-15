# Velor — mobile app (v1 scaffold)

The Atlas design mockup, rebuilt as a real Expo / React Native app.
Everything it shows is live production data from velorcommerce.store —
honest zero states until real sellers list.

## Run it on your phone (no Mac, no build)

1. Install **Expo Go** from the App Store / Play Store
2. On any computer with Node 20+:
   ```
   git clone https://github.com/BILSY144/velor-marketplace -b mobile-app
   cd velor-marketplace/mobile
   npm install
   npx expo start
   ```
3. Scan the QR code with your phone (Camera app on iOS, Expo Go on Android)

## What's in v1

- Atlas: brand hero, live trading counts (/api/lattice), preview film rail,
  all 190 countries grouped by region with signature crafts
- Country dive: verified cover photo, origin story, craft chips, that
  country's preview films, REAL listings via /api/shop/products — or an
  honest "nobody sells from here yet" + founding-seat CTA
- Live: vertical swipeable film feed (PREVIEW-badged; no fake viewer counts)
- Search: any country or craft, straight into the dive
- Basket: real products, per-seller escrow copy; checkout deep-links to the
  site until in-app checkout ships at buyer launch (6 August)
- You: Ask Velor (the site's real assistant, any language), links into
  orders/passport/sell/legal on the site

## Store release path (later)

EAS Build (`npx eas build`) compiles cloud iOS/Android binaries — no Mac
needed. Requires an Expo account plus Apple Developer ($99/yr) and Google
Play ($25 one-off) accounts, which William registers himself.
App icon: assets/icon.png (from public/brand/velor-app-icon.png).
