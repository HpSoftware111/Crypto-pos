# Build APK - Complete Guide

## ✅ Configuration Complete

Your project is now fully configured for EAS Build. The following files have been set up:
- ✅ `eas.json` - EAS build configuration
- ✅ `app.json` - Updated with EAS project ID

## 🚀 Build Your APK

### Step 1: Configure Android Credentials (One-time setup)

Run this command and follow the prompts:

```bash
cd "D:\Work\crypto pos\crypto-pos-mobile"
eas credentials
```

When prompted:
1. Select **Android**
2. Select **Set up a new keystore** (or use existing if you have one)
3. Choose **Let Expo handle the keystore** (recommended)
4. Confirm the setup

This is a one-time setup. After this, builds will use these credentials automatically.

### Step 2: Build the APK

Once credentials are configured, build your APK:

```bash
eas build --platform android --profile preview
```

This will:
- Build your APK in the cloud (10-20 minutes)
- Handle all dependencies automatically
- Give you a download link when complete

### Step 3: Download and Install

When the build completes:
1. You'll see a download link in the terminal
2. Or visit: https://expo.dev/accounts/ronelleferanil/projects/crypto-pos-mobile/builds
3. Download the APK file
4. Transfer to your Android device (USB, email, cloud storage)
5. Enable "Install from Unknown Sources" on your device
6. Install and test the app

---

## 📋 Quick Reference

**Configure credentials (first time only):**
```bash
eas credentials
# Select: Android → Set up new keystore → Let Expo handle it
```

**Build APK:**
```bash
eas build --platform android --profile preview
```

**Check build status:**
```bash
eas build:list
```

**View build details:**
Visit: https://expo.dev/accounts/ronelleferanil/projects/crypto-pos-mobile/builds

---

## 🔧 Build Profiles

Your `eas.json` has three build profiles:

1. **preview** - APK for testing (what you'll use)
2. **development** - Development build with dev client
3. **production** - Production APK (for Play Store)

For now, use the **preview** profile to get an installable APK.

---

## 📝 Notes

- The build happens in the cloud, so no local Java/Gradle setup needed
- Builds typically take 10-20 minutes
- You'll receive an email when the build completes
- APK file size will be around 20-40 MB

---

## ✅ Next Steps

1. Run `eas credentials` to set up Android keystore
2. Run `eas build --platform android --profile preview`
3. Wait for build to complete
4. Download and install APK on your device

**That's it! Your APK will be ready to install and test.**

