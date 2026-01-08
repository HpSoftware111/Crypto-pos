# Build APK - Complete Instructions

## Current Status

The Android project has been successfully prebuilt. However, to build the APK, you need **Java 11 or higher** installed.

## Issue

Your system currently has **Java 8** installed, but Android Gradle Plugin 7.4.2 requires **Java 11+**.

## Solution: Install Java 11+

### Quick Steps:

1. **Download Java 17 (LTS - Recommended):**
   - Visit: https://adoptium.net/temurin/releases/
   - Choose: JDK 17 (LTS), Windows x64, Installer (.msi)
   - Download and install

2. **Set JAVA_HOME:**
   - Open **Environment Variables** (Windows Search → "Edit the system environment variables")
   - Click **Environment Variables**
   - Under **User variables**, click **New**
     - Variable name: `JAVA_HOME`
     - Variable value: `C:\Program Files\Eclipse Adoptium\jdk-17.x.x.x-hotspot` (adjust to your install path)
   - Edit **Path** variable, click **New**, add: `%JAVA_HOME%\bin`
   - Click **OK** on all dialogs

3. **Restart Terminal/Cursor:**
   - Close all terminal windows
   - Restart Cursor

4. **Verify Installation:**
   ```powershell
   java -version
   # Should show: openjdk version "17" or higher
   
   echo $env:JAVA_HOME
   # Should show your JDK path
   ```

5. **Build the APK:**
   ```bash
   cd crypto-pos-mobile/android
   gradlew.bat assembleRelease
   ```

6. **Find Your APK:**
   ```
   android/app/build/outputs/apk/release/app-release.apk
   ```

---

## Alternative: Use Android Studio's JDK

If you have Android Studio installed, you can use its bundled JDK:

1. **Find Android Studio's JDK:**
   - Usually at: `C:\Program Files\Android\Android Studio\jbr`

2. **Set JAVA_HOME to that path** (same steps as above)

3. **Verify and build** (same as above)

---

## After Building

1. **Transfer APK to your device** (USB, email, cloud storage)
2. **Enable "Install from Unknown Sources"** on your Android device
3. **Install the APK**
4. **Test the app**

---

## Note About Keystore

The current build uses a **debug keystore** which is fine for testing. For production/Play Store, you'll need to generate a proper release keystore later.

To generate a release keystore (after Java 11+ is installed):
```bash
cd android/app
keytool -genkeypair -v -storetype PKCS12 -keystore crypto-pos-release.keystore -alias crypto-pos-key -keyalg RSA -keysize 2048 -validity 10000
```

Then update `android/gradle.properties` with the keystore credentials.

---

## Summary

**What's Done:**
- ✅ Android project prebuilt
- ✅ Build configuration updated
- ✅ Gradle files configured

**What You Need to Do:**
1. Install Java 11+ (or use Android Studio's JDK)
2. Set JAVA_HOME environment variable
3. Run `gradlew.bat assembleRelease`
4. Install and test APK

---

**Need help?** Check `JAVA_SETUP.md` for detailed Java installation instructions.

