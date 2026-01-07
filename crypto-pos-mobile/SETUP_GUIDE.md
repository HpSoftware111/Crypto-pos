# Crypto POS Mobile - Setup Guide

## Quick Start Guide for Windows 10

### Step 1: Install Required Software

1. **Install Node.js**
   - Download from: https://nodejs.org/
   - Choose LTS version (v18 or v20)
   - Verify: Open PowerShell and run:
     ```powershell
     node --version
     npm --version
     ```

2. **Install Android Studio**
   - Download from: https://developer.android.com/studio
   - During installation, make sure to install:
     - Android SDK
     - Android SDK Platform
     - Android Virtual Device (AVD)
   - After installation, set environment variable:
     - Open System Properties → Environment Variables
     - Add new variable:
       - Variable: `ANDROID_HOME`
       - Value: `C:\Users\YourUsername\AppData\Local\Android\Sdk`
     - Add to Path: `%ANDROID_HOME%\platform-tools`

### Step 2: Install Expo CLI

Open PowerShell or Command Prompt and run:

```bash
npm install -g expo-cli
```

### Step 3: Configure the App

1. **Navigate to the project:**
   ```bash
   cd crypto-pos-mobile
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure API URL:**
   
   Edit `src/utils/config.js`:
   
   ```javascript
   // For Android Emulator (recommended for testing):
   export const API_BASE_URL = 'http://10.0.2.2:4000';
   
   // For Physical Device:
   // 1. Find your computer's IP address:
   //    - Open Command Prompt
   //    - Run: ipconfig
   //    - Look for "IPv4 Address" under your network adapter
   // 2. Update the URL (example):
   export const API_BASE_URL = 'http://192.168.1.100:4000';
   ```

### Step 4: Start Backend Server

1. **Open a new terminal window:**
   ```bash
   cd "D:\Work\crypto pos"
   npm start
   ```
   
   Make sure the server is running on port 4000.

### Step 5: Start the Mobile App

1. **In the mobile app directory:**
   ```bash
   cd crypto-pos-mobile
   npm start
   ```

2. **Choose how to run:**
   
   **Option A: Android Emulator**
   - Make sure Android Studio is installed
   - Create/start an Android Virtual Device (AVD)
   - In Expo terminal, press `a` to open on Android
   - OR click "Run on Android device/emulator" in browser

   **Option B: Physical Android Device**
   - Install "Expo Go" app from Google Play Store
   - Make sure your phone and computer are on same WiFi
   - Scan QR code shown in terminal/browser
   - App will open in Expo Go

### Step 6: Troubleshooting

#### Can't Connect to Server?

**For Emulator:**
- Use `http://10.0.2.2:4000` in config.js
- Make sure backend server is running

**For Physical Device:**
- Find your computer's IP: `ipconfig` in CMD
- Use `http://YOUR_IP:4000` in config.js
- Make sure firewall allows port 4000
- Ensure phone and computer are on same network

#### Build Errors?

```bash
# Clear cache and reinstall
rm -rf node_modules
rm package-lock.json
npm install
npm start -- --reset-cache
```

#### Metro Bundler Issues?

```bash
# Stop Metro bundler (Ctrl+C)
# Then restart with cache cleared:
expo start -c
```

## Network Configuration Details

### Finding Your IP Address

**Windows:**
```powershell
ipconfig
# Look for "IPv4 Address" - something like 192.168.1.100
```

**PowerShell alternative:**
```powershell
Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.InterfaceAlias -notlike "*Loopback*"} | Select-Object IPAddress
```

### Testing Server Connection

Before running the app, test if server is accessible:

**From your computer:**
```bash
curl http://localhost:4000/api/health
```

**From Android Emulator:**
```bash
adb shell
# Then inside emulator:
curl http://10.0.2.2:4000/api/health
```

**From your phone browser:**
```
http://YOUR_COMPUTER_IP:4000/api/health
```

### Firewall Configuration

**Windows Firewall:**
1. Open Windows Defender Firewall
2. Click "Advanced settings"
3. Click "Inbound Rules" → "New Rule"
4. Select "Port" → Next
5. Select "TCP" and enter port "4000"
6. Allow the connection
7. Apply to all profiles

## Development Tips

1. **Hot Reload:** Changes to code automatically refresh the app
2. **Dev Menu:** Shake device or press `Ctrl+M` (emulator) to open developer menu
3. **Reload:** Press `R` twice in Metro bundler terminal
4. **Clear Cache:** `expo start -c` or `npm start -- --reset-cache`

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Unable to resolve module" | Run `npm install` again |
| "Network request failed" | Check API_BASE_URL and server status |
| "Expo Go not found" | Install Expo Go from Play Store |
| "Cannot connect to Metro" | Check if Metro bundler is running |
| "Build failed" | Clear cache, reinstall node_modules |

## Next Steps

Once everything is running:

1. ✅ Test payment method selection
2. ✅ Test amount input
3. ✅ Test QR code generation
4. ✅ Test payment monitoring
5. ✅ Test with real blockchain transactions

## Support

If you encounter issues:
1. Check Metro bundler logs
2. Check backend server logs
3. Verify network connectivity
4. Ensure all dependencies are installed

---

**Happy Coding! 🚀**

