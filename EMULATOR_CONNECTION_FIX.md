# Emulator Connection Fix

## Issue
The Android emulator couldn't connect to the backend server, showing "I'm a teapot" error.

## ✅ Fixes Applied

### 1. Server Binding
**Updated `server.js`:**
- Changed `app.listen(PORT, ...)` to `app.listen(PORT, '0.0.0.0', ...)`
- This makes the server accessible from the emulator (10.0.2.2) and network devices

### 2. Error Handling
**Updated `src/screens/PaymentMethodScreen.js`:**
- Improved error messages
- Added retry button
- Better connection troubleshooting hints

**Updated `src/api/endpoints.js`:**
- Better error messages for connection issues
- Handles HTTP 418 errors specifically

**Updated `src/api/apiClient.js`:**
- Enhanced error logging
- Better debugging information

## 🔄 Next Steps

### 1. Restart Your Backend Server

**Important:** You need to restart the backend server for the binding change to take effect.

```bash
# Stop the current server (Ctrl+C)
# Then restart:
cd "D:\Work\crypto pos"
npm start
```

You should now see:
```
📱 Access from Android emulator: http://10.0.2.2:4000
```

### 2. Test the Connection

1. **Make sure backend is running** on port 4000
2. **Restart the app** in the emulator (or reload)
3. **The app should now connect** successfully

### 3. If Still Not Working

**Check Windows Firewall:**
1. Open Windows Defender Firewall
2. Allow port 4000 for Node.js
3. Or temporarily disable firewall to test

**Verify Server is Accessible:**
From your computer, test:
```bash
curl http://localhost:4000/api/health
```

Should return: `{"status":"ok",...}`

**Check API_BASE_URL:**
In `crypto-pos-mobile/src/utils/config.js`, make sure:
```javascript
export const API_BASE_URL = __DEV__
  ? 'http://10.0.2.2:4000' // For emulator
  : 'https://your-production-server.com';
```

---

## ✅ Summary

The main fix was binding the server to `0.0.0.0` instead of just `localhost`. This allows:
- ✅ Emulator connections (10.0.2.2)
- ✅ Physical device connections (your computer's IP)
- ✅ Network device connections

**Restart your backend server and the app should connect!** 🚀

