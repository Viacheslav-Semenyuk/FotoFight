const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for .tflite model files
config.resolver.assetExts.push('tflite');

// Custom resolver to handle missing .tflite files gracefully
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Check if this is a .tflite file
  if (moduleName && typeof moduleName === 'string' && moduleName.includes('.tflite')) {
    try {
      // Try to resolve using default resolver
      return context.resolveRequest(context, moduleName, platform);
    } catch (error) {
      // If file doesn't exist, return empty module to allow build to continue
      // The error will be handled at runtime in localAIService.ts
      return {
        type: 'empty',
      };
    }
  }
  // Use default resolver for everything else
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
