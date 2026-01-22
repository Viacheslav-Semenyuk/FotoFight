# Android SDK Setup Guide for Windows

This guide will help you set up the Android SDK on Windows to build your Expo React Native app locally.

## Prerequisites

1. **Install Android Studio**
   - Download from: https://developer.android.com/studio
   - Run the installer and follow the setup wizard
   - During installation, make sure to install:
     - Android SDK
     - Android SDK Platform
     - Android Virtual Device (optional, for emulator)

2. **Install Required SDK Components**
   - Open Android Studio
   - Go to **Tools** → **SDK Manager**
   - In the **SDK Platforms** tab, install:
     - Android 14.0 (API 34) - or the version specified in your `app.json`
   - In the **SDK Tools** tab, make sure these are installed:
     - Android SDK Build-Tools
     - Android SDK Platform-Tools (includes `adb`)
     - Android SDK Command-line Tools
     - Android Emulator (optional)

## Configure Environment Variables

After installing Android Studio, you need to set up environment variables:

### Method 1: Using PowerShell (Recommended)

Run the setup script:
```powershell
powershell -ExecutionPolicy Bypass -File scripts/setup-android-sdk.ps1
```

### Method 2: Manual Setup

1. **Find your Android SDK path**
   - Default location: `C:\Users\<YourUsername>\AppData\Local\Android\Sdk`
   - Or open Android Studio → **Tools** → **SDK Manager** → check "Android SDK Location"

2. **Set ANDROID_HOME environment variable**
   - Press `Win + X` and select **System**
   - Click **Advanced system settings**
   - Click **Environment Variables**
   - Under **User variables**, click **New**
   - Variable name: `ANDROID_HOME`
   - Variable value: `C:\Users\<YourUsername>\AppData\Local\Android\Sdk` (or your SDK path)
   - Click **OK**

3. **Add to PATH**
   - In the same **Environment Variables** window
   - Under **User variables**, find and select **Path**, then click **Edit**
   - Click **New** and add these paths (replace with your actual SDK path):
     - `%ANDROID_HOME%\platform-tools`
     - `%ANDROID_HOME%\tools`
     - `%ANDROID_HOME%\tools\bin`
   - Click **OK** on all windows

4. **Restart your terminal/PowerShell**
   - Close all PowerShell/Command Prompt windows
   - Open a new terminal

5. **Verify the setup**
   ```powershell
   echo $env:ANDROID_HOME
   adb version
   ```
   - You should see your SDK path and adb version information

## Quick Setup Script

If you know your Android SDK path, you can set it up quickly:

```powershell
# Replace with your actual SDK path
$sdkPath = "C:\Users\viacheslav\AppData\Local\Android\Sdk"

# Set ANDROID_HOME
[Environment]::SetEnvironmentVariable("ANDROID_HOME", $sdkPath, "User")
$env:ANDROID_HOME = $sdkPath

# Add to PATH
$currentPath = [Environment]::GetEnvironmentVariable("PATH", "User")
$platformTools = "$sdkPath\platform-tools"
$tools = "$sdkPath\tools"
$toolsBin = "$sdkPath\tools\bin"

if ($currentPath -notlike "*$platformTools*") {
    [Environment]::SetEnvironmentVariable("PATH", "$currentPath;$platformTools;$tools;$toolsBin", "User")
}

Write-Host "Setup complete! Please restart your terminal."
```

## Troubleshooting

### Error: "adb is not recognized"
- Make sure `platform-tools` is in your PATH
- Restart your terminal after setting environment variables
- Verify: `adb version` should work in a new terminal

### Error: "Failed to resolve the Android SDK path"
- Check that `ANDROID_HOME` is set correctly
- Verify the path exists: `Test-Path $env:ANDROID_HOME`
- Make sure you restarted your terminal after setting the variable

### SDK not found in default location
- Open Android Studio → **Tools** → **SDK Manager** to find your SDK location
- Use that path for `ANDROID_HOME`

## After Setup

Once configured, you should be able to run:
```powershell
npm run build:android:local
```

This will:
1. Run `expo prebuild` to generate native Android project
2. Build and run the app on a connected device or emulator
