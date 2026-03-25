<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/94f1ba32-fca0-4b7e-8f5d-89d2bda70f0b

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Run the app:
   `npm run dev`

## Android Release

1. Copy `keystore.properties.example` to `keystore.properties` and fill in your real signing values.
2. Place the keystore file at the repository root, or update `KEYSTORE_PATH` to point to it.
3. Build the Android bundle from the `android` directory:
   `.\gradlew.bat bundleRelease`
4. Upload the generated `.aab` from `android\app\build\outputs\bundle\release\`.
5. If Play Console asks for the deobfuscation file, upload `android\app\build\outputs\mapping\release\mapping.txt` from the same build.

Release builds now use R8 (`minifyEnabled true`), which is what generates `mapping.txt` for crash deobfuscation in Play Console.
