const { getDefaultConfig } = require('expo/metro-config');
const { resolve } = require('metro-resolver');

const config = getDefaultConfig(__dirname);

// Add support for .tflite model files
config.resolver.assetExts.push('tflite');

// Store the default resolver if it exists
const defaultResolver = config.resolver.resolveRequest;

// Custom resolver to handle .tflite files
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Check if this is a .tflite file
  if (moduleName && typeof moduleName === 'string' && moduleName.includes('.tflite')) {
    try {
      // Try to resolve using default resolver if it exists
      // Expo's default resolver should handle .tflite files as assets
      if (defaultResolver) {
        const result = defaultResolver(context, moduleName, platform);
        // Log if we got a result (for debugging)
        if (process.env.NODE_ENV !== 'production' && result) {
          console.log('[Metro] Resolved .tflite file:', moduleName, result);
        }
        return result;
      }
      // Fallback to Metro's resolver
      return resolve(context, moduleName, platform);
    } catch (error) {
      // Log the error for debugging
      console.warn('[Metro] Failed to resolve .tflite file:', moduleName, error.message);
      // Re-throw the error so we know something went wrong
      // Don't return empty module - let the error propagate
      throw error;
    }
  }
  // Use default resolver for everything else
  if (defaultResolver) {
    return defaultResolver(context, moduleName, platform);
  }
  // If no default resolver, use Metro's resolver
  return resolve(context, moduleName, platform);
};

module.exports = config;
