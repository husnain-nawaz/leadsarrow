# LeadsArrow Mobile App (React Native & Expo)

An ultra-responsive, native mobile application for **LeadsArrow** — the High-Velocity B2B Intelligence & Contact Reveal Engine.

---

## 🚀 Features

- **10.3M+ Lead Finder**: Real-time search across global B2B decision makers with infinite scrolling and pull-to-refresh.
- **Multi-Facet Filters**: Filter by Industry, Employee Count, Annual Revenue, Country, and Buying Intent Score.
- **1-Tap Direct Contact Reveal**: Instant email & phone number unlock powered by `POST /api/leads/reveal`.
- **Custom Clusters & Private Groups**: Add proprietary custom leads into clustered target campaigns (newest cluster first).
- **Saved Target Lists**: Create custom lists, append leads from the 10M+ database or private clusters, and manage list items.
- **Authentication & Daily Credits**: Sign in with existing LeadsArrow accounts; 100 free verified credits replenished daily.
- **Configurable Backend Host**: Switch effortlessly between local LAN WiFi (`http://192.168.18.4:3000`) and production deployment domains in app settings.

---

## 🛡️ Hostinger Inode Protection Notice

**DO NOT upload this `mobile/` directory to your Hostinger web hosting server.**

Web hosting servers on Hostinger or cPanel have strict **Inode limits** (usually 200,000 – 400,000 files). React Native mobile projects contain build tools and node modules that consume over 50,000 inodes. 

- This repository includes `.hostingerignore` and `.cpanelignore` files that automatically exclude `mobile/` and its artifacts during Hostinger Git deployments.
- The web app and backend run independently from the mobile frontend.

---

## 📱 How to Run on Real Mobile Devices (Instant)

### Option 1: Live via Expo Go (Fastest, zero native compilation needed)

1. Install **Expo Go** on your Android phone (Google Play) or iPhone (App Store).
2. Ensure your phone and development PC are connected to the same Wi-Fi network.
3. Open a terminal in the `mobile` folder:
   ```bash
   cd mobile
   npx expo start
   ```
4. Scan the QR code displayed in your terminal using the **Expo Go** app (or iPhone Camera).
5. The LeadsArrow mobile app will open immediately on your device!

---

## 🛠️ Building Standalone Android APK

### Option A: Local Build with Android SDK & Java 17
```bash
cd mobile/android
./gradlew assembleDebug
```
The installable debug APK will be generated at:
`mobile/android/app/build/outputs/apk/debug/app-debug.apk`

### Option B: Cloud Build with EAS (Expo Application Services)
1. Install EAS CLI:
   ```bash
   npm install -g eas-cli
   ```
2. Run build:
   ```bash
   cd mobile
   eas build -p android --profile preview
   ```
   EAS will compile a downloadable `.apk` file that can be installed on any Android phone.

---

## 🌐 Connecting to the Backend

By default, the app is configured to point to your development LAN IP:
`http://192.168.18.4:3000`

To point to your production server or a different local IP:
1. Tap the **Account** tab in the mobile app.
2. Under **Backend Server Endpoint**, enter your server URL (e.g. `https://your-domain.com`).
3. Tap **Save & Test Connection**.
