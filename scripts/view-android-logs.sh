#!/bin/bash
# Bash script to view Android app logs using adb logcat
# Usage: ./scripts/view-android-logs.sh

echo "Starting Android logcat viewer for Foto Fight app..."
echo "Press Ctrl+C to stop"
echo ""

# Package name for the app
PACKAGE_NAME="com.fotofight.app"

# Clear previous logs
echo "Clearing previous logs..."
adb logcat -c

# Start logcat with filters for React Native and the app
# Filters:
# - React Native logs (ReactNativeJS)
# - Android system logs (AndroidRuntime)
# - Expo logs (ExpoModules)
# - App-specific logs (com.fotofight.app)
echo "Starting logcat with filters..."
echo "Filtering for: ReactNativeJS, AndroidRuntime, ExpoModules, $PACKAGE_NAME"
echo ""

adb logcat -v time ReactNativeJS:V AndroidRuntime:E ExpoModules:V *:S | grep -E "ReactNativeJS|AndroidRuntime|ExpoModules|$PACKAGE_NAME|FATAL|ERROR|Exception|Crash" --line-buffered
