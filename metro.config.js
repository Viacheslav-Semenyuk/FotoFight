const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const fs = require('fs');

const config = getDefaultConfig(__dirname);

// Add support for .tflite model files
config.resolver.assetExts.push('tflite');

// Custom resolver to handle missing .tflite files gracefully
const defaultResolver = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, realModuleName, platform, moduleName) => {
  // Check if this is a .tflite file
  if (realModuleName && typeof realModuleName === 'string' && realModuleName.includes('.tflite')) {
    try {
      // Try to resolve using default resolver
      const result = defaultResolver(context, realModuleName, platform, moduleName);
      return result;
    } catch (error) {
      // If file doesn't exist, return empty module to allow build to continue
      // The error will be handled at runtime in localAIService.ts
      return {
        type: 'empty',
      };
    }
  }
  // Use default resolver for everything else
  return defaultResolver(context, realModuleName, platform, moduleName);
};

module.exports = config;
