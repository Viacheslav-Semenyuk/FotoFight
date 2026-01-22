/**
 * Image to Tensor conversion utility
 * Converts images to Float32Array tensors for TensorFlow Lite
 */

import * as ImageManipulator from 'expo-image-manipulator';
import { GLView } from 'expo-gl';
import { Asset } from 'expo-asset';
import { Platform } from 'react-native';

const MODEL_INPUT_SIZE = 640;

/**
 * Extract pixels from image using GLView
 * This is a helper function that creates a temporary GLView to extract pixel data
 */
async function extractPixelsWithGL(imageUri: string): Promise<{ data: Float32Array; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    // Create a temporary GLView component
    // Note: This approach requires a React component, so we'll use a different method
    // For now, we'll use a workaround with Image component
    
    // Alternative: Use react-native's Image component and canvas-like API if available
    reject(new Error('GL-based pixel extraction requires GLView component. Using alternative method.'));
  });
}

/**
 * Preprocess image for YOLO model
 * Resizes to 640x640 and converts to Float32Array tensor
 * 
 * @param uri - Image URI
 * @returns Float32Array in shape [1, 640, 640, 3] normalized to 0-1
 */
export async function preprocessImageForYOLO(uri: string): Promise<Float32Array> {
  try {
    // Step 1: Resize image to 640x640
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

    // Step 2: For React Native, we need to use a native approach
    // Since react-native-fast-tflite may support image URIs directly,
    // we'll return the URI and let the library handle it
    // If not, we'll need to implement pixel extraction
    
    // For now, create a placeholder tensor
    // In production, you would extract actual pixel data
    const tensorSize = 1 * MODEL_INPUT_SIZE * MODEL_INPUT_SIZE * 3; // [1, 640, 640, 3]
    const tensor = new Float32Array(tensorSize);
    
    // Fill with placeholder values (in real implementation, extract from image)
    // For testing, we'll fill with zeros (black image)
    // This will need to be replaced with actual pixel extraction
    
    console.warn('[ImageToTensor] Image preprocessing: Using placeholder tensor. Pixel extraction needs to be implemented.');
    
    return tensor;
    
  } catch (error) {
    throw new Error(`Failed to preprocess image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Alternative: Check if react-native-fast-tflite supports image URIs directly
 * Some TFLite wrappers can handle image preprocessing internally
 */
export async function preprocessImageURI(uri: string): Promise<string> {
  // Resize image and return URI
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
  
  return manipulatedImage.uri;
}

export { MODEL_INPUT_SIZE };
