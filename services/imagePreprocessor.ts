/**
 * Image Preprocessing for TensorFlow Lite
 * 
 * This module handles image preprocessing for YOLO models:
 * - Resize to model input size (640x640 for YOLOv8)
 * - Normalize pixel values (0-255 to 0-1)
 * - Convert to tensor format (Float32Array)
 */

import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { EncodingType } from 'expo-file-system';

/**
 * Model input size for YOLOv8 (can be adjusted based on your model)
 */
const MODEL_INPUT_SIZE = 640;

/**
 * Preprocess image for YOLO model input
 * 
 * @param uri - Image URI (file:// or data: URI)
 * @returns Float32Array tensor ready for model input [1, 640, 640, 3]
 */
export async function preprocessImageForYOLO(uri: string): Promise<Float32Array> {
  try {
    // Step 1: Resize image to model input size (640x640)
    const manipulatedImage = await ImageManipulator.manipulateAsync(
      uri,
      [
        {
          resize: {
            width: MODEL_INPUT_SIZE,
            height: MODEL_INPUT_SIZE,
          },
        },
      ],
      {
        compress: 1,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );

    // Step 2: Convert image to base64
    const base64 = await FileSystem.readAsStringAsync(manipulatedImage.uri, {
      encoding: EncodingType.Base64,
    });

    // Step 3: Decode base64 to image data
    // For React Native, we need to use a different approach
    // We'll use expo-image-manipulator's result or convert via canvas/Image
    
    // Note: This is a simplified version. In production, you might want to:
    // - Use react-native-image-to-tensor or similar library
    // - Or implement native module for better performance
    // - Or use expo-gl for GPU-accelerated processing
    
    // For now, we'll create a placeholder that needs native implementation
    // The actual conversion from image to tensor should be done in native code
    // or using a library like @tensorflow/tfjs-react-native
    
    throw new Error(
      'Image preprocessing needs native implementation. ' +
      'Consider using @tensorflow/tfjs-react-native or implementing a native module.'
    );
    
  } catch (error) {
    throw new Error(`Failed to preprocess image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Alternative: Preprocess using TensorFlow.js (if using tfjs-react-native)
 * This requires @tensorflow/tfjs-react-native to be installed
 */
export async function preprocessImageWithTFJS(uri: string): Promise<Float32Array> {
  // This would use @tensorflow/tfjs-react-native
  // Example implementation:
  /*
  const tf = require('@tensorflow/tfjs-react-native');
  await tf.ready();
  
  const imageAsset = require(uri); // or load from URI
  const imageTensor = tf.browser.fromPixels(imageAsset);
  const resized = tf.image.resizeBilinear(imageTensor, [640, 640]);
  const normalized = resized.div(255.0);
  const batched = normalized.expandDims(0);
  
  return await batched.data();
  */
  
  throw new Error('TensorFlow.js preprocessing not implemented. Install @tensorflow/tfjs-react-native if needed.');
}

/**
 * Convert image URI to base64 for debugging
 */
export async function imageUriToBase64(uri: string): Promise<string> {
  if (uri.startsWith('data:')) {
    return uri;
  }
  
  if (uri.startsWith('http://') || uri.startsWith('https://')) {
    const response = await fetch(uri);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
  
  // For local file URIs
  return await FileSystem.readAsStringAsync(uri, {
    encoding: EncodingType.Base64,
  });
}

export default {
  preprocessImageForYOLO,
  preprocessImageWithTFJS,
  imageUriToBase64,
  MODEL_INPUT_SIZE,
};
