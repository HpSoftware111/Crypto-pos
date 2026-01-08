# Java 11+ Setup Required

## Issue
The Android build requires **Java 11 or higher**, but your system currently has Java 8 installed.

## Solution: Install Java 11 or higher

### Option 1: Install JDK 11 or higher (Recommended)

1. **Download JDK 17 (LTS) from:**
   - Oracle: https://www.oracle.com/java/technologies/downloads/#java17
   - OR Adoptium (OpenJDK): https://adoptium.net/temurin/releases/

2. **Install the JDK:**
   - Run the installer
   - Note the installation path (usually `C:\Program Files\Java\jdk-17`)

3. **Set JAVA_HOME environment variable:**
   - Open System Properties → Environment Variables
   - Add new User variable:
     - Variable: `JAVA_HOME`
     - Value: `C:\Program Files\Java\jdk-17` (or your JDK path)
   - Edit `Path` variable and add: `%JAVA_HOME%\bin`

4. **Restart terminal/Cursor and verify:**
   ```powershell
   java -version
   ```
   Should show Java 11 or higher

5. **Try building again:**
   ```bash
   cd android
   gradlew.bat assembleRelease
   ```

### Option 2: Use Android Studio's Bundled JDK

Android Studio comes with JDK 11. You can point Gradle to use it:

1. Find Android Studio's JDK:
   - Usually at: `C:\Program Files\Android\Android Studio\jbr`

2. Set JAVA_HOME to that path (as in Option 1)

### Quick Check

After installing Java 11+, verify:
```powershell
java -version
# Should show: java version "11" or higher

echo $env:JAVA_HOME
# Should show your JDK path
```

---

## After Installing Java

Once Java 11+ is installed, you can proceed with building the APK:

```bash
cd crypto-pos-mobile/android
gradlew.bat assembleRelease
```

The APK will be generated at:
```
android/app/build/outputs/apk/release/app-release.apk
```

