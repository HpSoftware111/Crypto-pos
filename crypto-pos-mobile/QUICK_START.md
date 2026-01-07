# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Prerequisites Check
- ✅ Node.js installed (`node --version`)
- ✅ Android Studio installed with AVD setup
- ✅ Backend server running on port 4000

### Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure API URL**
   
   Edit `src/utils/config.js`:
   ```javascript
   // For Android Emulator:
   export const API_BASE_URL = 'http://10.0.2.2:4000';
   
   // For Physical Device (use your computer's IP):
   export const API_BASE_URL = 'http://192.168.1.100:4000';
   ```

3. **Start App**
   ```bash
   npm start
   ```

4. **Run on Device**
   - Press `a` for Android emulator
   - OR scan QR code with Expo Go app on your phone

## 🔍 Quick Troubleshooting

| Problem | Quick Fix |
|---------|-----------|
| Can't connect | Check API_BASE_URL in config.js |
| Build fails | `npm install` again |
| Metro errors | `npm start -- --reset-cache` |
| Images not loading | Check network and server |

## 📖 Full Documentation

- **Setup Guide:** See `SETUP_GUIDE.md`
- **Full README:** See `README.md`
- **Project Summary:** See `PROJECT_SUMMARY.md`

---

**Ready to go! 🎉**

