/**
 * Local AI Service for Android
 * Uses TensorFlow Lite for on-device object detection
 * 
 * This service provides COMPLETELY LOCAL photo verification without sending images to a server.
 * Requires a YOLO model in TFLite format to be placed in assets/models/
 * 
 * CURRENT IMPLEMENTATION:
 * - Uses YOLO-Worldv2 model with custom vocabulary (251 classes)
 * - Uses detectable_object from database to match detected objects
 * - All challenge objects are configured in database with detectable_object
 * - NO server fallback - everything is processed locally
 * 
 * Data Source:
 * - Object mapping comes from database (challenges table: detectable_object)
 * - Vocabulary (251 classes) is stored in code
 */

import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { EncodingType } from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { Asset } from 'expo-asset';
import jpeg from 'jpeg-js';

// Custom vocabulary from vocab.txt (251 classes for YOLO-Worldv2)
// Stored in code, not in database
let CUSTOM_VOCAB: string[] | null = null;

/**
 * Load custom vocabulary from code
 * This is the vocabulary that was baked into YOLO-Worldv2 model
 * Caches result in memory
 */
function loadCustomVocabulary(): string[] {
  // Return cached vocabulary if available
  if (CUSTOM_VOCAB !== null) {
    return CUSTOM_VOCAB;
  }

  // Vocabulary from vocab.txt (251 classes)
  // This matches the vocabulary used when exporting the YOLO-Worldv2 model
  CUSTOM_VOCAB = [
    'banana', 'apple', 'orange', 'lemon', 'pear', 'peach', 'plum', 'avocado', 'kiwi',
    'mango', 'melon', 'grapes', 'cherry', 'tomato', 'cucumber', 'carrot', 'potato', 'onion',
    'garlic', 'pepper', 'broccoli', 'cabbage', 'lettuce', 'spinach', 'zucchini', 'mushroom',
    'corn', 'beans', 'peas', 'radish', 'beetroot',
    'bread', 'bagel', 'bun', 'sandwich', 'burger', 'pizza', 'donut', 'cake', 'cookie',
    'biscuit', 'chocolate', 'candy', 'yogurt', 'cheese', 'butter', 'honey', 'jam',
    'ketchup', 'mustard', 'mayonnaise',
    'cup', 'mug', 'glass', 'bowl', 'plate', 'fork', 'knife', 'spoon', 'spatula', 'whisk',
    'pan', 'pot', 'kettle', 'ladle', 'colander', 'grater',
    'microwave', 'oven', 'toaster', 'blender', 'mixer', 'refrigerator', 'freezer',
    'dishwasher', 'sink', 'faucet', 'coffeemaker', 'juicer', 'grinder', 'scale',
    'sponge', 'broom', 'mop', 'bucket', 'vacuum', 'detergent', 'spray', 'brush', 'dustpan',
    'hanger', 'wardrobe', 'drawer', 'shelf', 'cabinet', 'desk', 'table', 'bed', 'pillow',
    'blanket', 'mattress', 'sofa', 'armchair', 'chair', 'stool', 'bench', 'lamp', 'bulb', 'fan',
    'switch', 'outlet', 'charger', 'cable', 'battery', 'remote', 'television', 'monitor',
    'computer', 'laptop', 'tablet', 'keyboard', 'mouse', 'printer', 'router', 'speaker',
    'headphones', 'earbuds', 'microphone', 'tripod', 'controller', 'console', 'smartphone',
    'watch', 'clock', 'camera',
    'book', 'notebook', 'pen', 'pencil', 'marker', 'scissors', 'stapler', 'glue', 'folder',
    'envelope', 'calculator', 'calendar',
    'backpack', 'handbag', 'wallet', 'keys', 'umbrella', 'sunglasses', 'hat', 'scarf',
    'gloves', 'belt', 'jacket', 'coat', 'hoodie', 'sweater', 'shirt', 'pants', 'jeans',
    'shorts', 'dress', 'skirt', 'socks', 'shoes', 'sneakers', 'boots', 'slippers', 'towel',
    'toothbrush', 'toothpaste', 'soap', 'shampoo', 'conditioner', 'razor', 'mirror', 'toilet',
    'bathtub', 'shower', 'curtain', 'sinkbasin',
    'heater', 'radiator', 'humidifier', 'window', 'door', 'lock', 'rug', 'carpet',
    'plant', 'vase', 'wateringcan',
    'tree', 'bush', 'grass', 'flower', 'mailbox', 'doorbell', 'detector', 'extinguisher',
    'ladder', 'toolbox',
    'hammer', 'screwdriver', 'wrench', 'pliers', 'drill', 'saw', 'flashlight', 'candle',
    'lighter', 'helmet',
    'car', 'sedan', 'hatchback', 'suv', 'truck', 'van', 'bus', 'motorcycle', 'scooter',
    'bicycle', 'skateboard', 'rollerblade',
    'hydrant', 'cone', 'barrier', 'cart', 'bin', 'container',
  ];

  console.log(`Loaded custom vocabulary from code: ${CUSTOM_VOCAB.length} classes for YOLO-Worldv2`);
  return CUSTOM_VOCAB;
}

/**
 * Get vocabulary (sync version - loads from code)
 */
function getVocabulary(): string[] {
  return loadCustomVocabulary();
}

/**
 * Get vocabulary (async version - for compatibility)
 * Vocabulary is loaded from code, so this is just a wrapper
 */
async function getVocabularyAsync(): Promise<string[]> {
  return loadCustomVocabulary();
}

interface DetectionResult {
  classIndex: number;
  className: string;
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface VerificationResult {
  success: boolean;
  verified: boolean;
  message: string;
  detections: DetectionResult[];
  matchedClass?: string;
  maxConfidence?: number;
}

/**
 * Extract object name from challenge title
 * Examples: 
 * - "Snap a kettle" -> "kettle"
 * - "Snap a wall clock" -> "wall clock" -> "clock"
 * - "Snap a set of kitchen knives" -> "knives" -> "knife"
 * - "Snap a computer mouse" -> "mouse"
 * - "Snap a TV remote control" -> "remote"
 */
function extractObjectFromChallenge(title: string): string {
  // Remove "Snap a/an" prefix
  let object = title.replace(/^snap\s+(a|an)\s+/i, '').trim();
  
  // Remove trailing punctuation
  object = object.replace(/[.,!?;:]$/, '').trim();
  
  // Convert to lowercase
  object = object.toLowerCase();
  
  // Extract key object from complex descriptions
  // Handle common patterns:
  
  // "a set of X" -> "X"
  object = object.replace(/^set\s+of\s+(.+)$/, '$1');
  
  // "a bunch of X" -> "X"
  object = object.replace(/^bunch\s+of\s+(.+)$/, '$1');
  
  // "a pack of X" -> "X"
  object = object.replace(/^pack\s+of\s+(.+)$/, '$1');
  
  // "a piece of X" -> "X"
  object = object.replace(/^piece\s+of\s+(.+)$/, '$1');
  
  // "a jar of X" -> "X"
  object = object.replace(/^jar\s+of\s+(.+)$/, '$1');
  
  // "a bag of X" -> "X"
  object = object.replace(/^bag\s+of\s+(.+)$/, '$1');
  
  // "a bottle of X" -> "X"
  object = object.replace(/^bottle\s+of\s+(.+)$/, '$1');
  
  // "a pair of X" -> "X"
  object = object.replace(/^pair\s+of\s+(.+)$/, '$1');
  
  // "X on Y" -> "X" (e.g., "picture hanging on the wall" -> "picture")
  object = object.replace(/\s+on\s+.+$/, '');
  
  // "X in Y" -> "X"
  object = object.replace(/\s+in\s+.+$/, '');
  
  // "X attached to Y" -> "X"
  object = object.replace(/\s+attached\s+to\s+.+$/, '');
  
  // "X plugged in" -> "X"
  object = object.replace(/\s+plugged\s+in$/, '');
  
  // "X hanging" -> "X"
  object = object.replace(/\s+hanging$/, '');
  
  // Extract main noun from compound phrases
  // "wall clock" -> "clock"
  // "door handle" -> "handle" (but we want to keep "door handle" for mapping)
  // "light switch" -> "switch"
  // "computer mouse" -> "mouse"
  // "TV remote control" -> "remote"
  
  // For now, return the processed object
  // The matching function will handle compound names via OBJECT_MAPPING
  
  return object.trim();
}

/**
 * Check if detected class matches the target object
 * Uses simple name matching
 */
function matchesObject(
  detectedClass: string, 
  targetObject: string
): boolean {
  const detected = detectedClass.toLowerCase().trim();
  const target = targetObject.toLowerCase().trim();
  
  // 1. Exact match
  if (detected === target) return true;
  
  // 2. Check if one contains the other (e.g., "cell phone" contains "phone")
  if (detected.includes(target) || target.includes(detected)) return true;
  
  // 3. Check if target is a compound name and detected matches part of it
  // e.g., "wall clock" -> check if "clock" matches detected "clock"
  const targetWords = target.split(/\s+/);
  for (const word of targetWords) {
    if (word.length > 3 && detected === word) {
      return true;
    }
  }
  
  // 4. Check if detected is a compound name and target matches part of it
  const detectedWords = detected.split(/\s+/);
  for (const word of detectedWords) {
    if (word.length > 3 && target === word) {
      return true;
    }
  }
  
  // 5. Check main word match (last word is usually the main object)
  const targetMainWord = targetWords[targetWords.length - 1];
  const detectedMainWord = detectedWords[detectedWords.length - 1];
  if (targetMainWord && detectedMainWord && targetMainWord.length > 3) {
    if (targetMainWord === detectedMainWord || 
        targetMainWord.includes(detectedMainWord) || 
        detectedMainWord.includes(targetMainWord)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Decode base64 string to Uint8Array
 * React Native compatible (no Buffer required)
 */
function base64ToUint8Array(base64: string): Uint8Array {
  // Create a binary string from base64
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  return bytes;
}

/**
 * Preprocess image for YOLO model input
 * Resizes to 640x640 and extracts RGB pixels, normalizes to [0, 1]
 * Returns Float32Array in shape [1, 640, 640, 3] for RGB
 * 
 * Implementation:
 * - Uses expo-image-manipulator to resize image
 * - Uses jpeg-js to decode JPEG and extract pixel data
 * - Converts RGB pixels to normalized Float32Array tensor
 */
async function preprocessImage(uri: string): Promise<Float32Array> {
  const MODEL_INPUT_SIZE = 640;
  
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

    // Step 2: Read image file as binary data (Uint8Array)
    let binaryData: Uint8Array;
    if (manipulatedImage.uri.startsWith('file://')) {
      // Read file from file system as base64, then decode
      const base64Data = await FileSystem.readAsStringAsync(manipulatedImage.uri, {
        encoding: EncodingType.Base64,
      });
      // Decode base64 to Uint8Array
      binaryData = base64ToUint8Array(base64Data);
    } else if (manipulatedImage.uri.startsWith('data:')) {
      // Already base64 data URI, extract and decode
      const parts = manipulatedImage.uri.split(',');
      if (parts.length > 1) {
        binaryData = base64ToUint8Array(parts[1]);
      } else {
        throw new Error('Invalid data URI format');
      }
    } else {
      // Try to fetch if it's a URL
      const response = await fetch(manipulatedImage.uri);
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      binaryData = new Uint8Array(arrayBuffer);
    }

    // Step 3: Decode JPEG using jpeg-js
    // formatAsRGBA: false gives RGB (without alpha channel)
    const decodedImage = jpeg.decode(binaryData, {
      useTArray: true,
      formatAsRGBA: false, // Get RGB (not RGBA) - 3 channels
    });

    const { data: rawPixels, width, height } = decodedImage;

    // Validate dimensions
    if (width !== MODEL_INPUT_SIZE || height !== MODEL_INPUT_SIZE) {
      throw new Error(
        `Image dimensions mismatch. Expected ${MODEL_INPUT_SIZE}x${MODEL_INPUT_SIZE}, got ${width}x${height}`
      );
    }

    // Step 4: Convert RGB pixels to normalized Float32Array
    // Format: [1, 640, 640, 3] - batch, height, width, channels
    // Values normalized to [0, 1] by dividing by 255
    const tensorSize = 1 * MODEL_INPUT_SIZE * MODEL_INPUT_SIZE * 3;
    const tensor = new Float32Array(tensorSize);

    // rawPixels is RGB format: [R, G, B, R, G, B, ...] (3 bytes per pixel)
    // We need to reshape to [1, height, width, channels]
    // For YOLO, we typically use NHWC format (batch, height, width, channels)
    let tensorIndex = 0;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // Calculate index in rawPixels array (RGB format)
        const pixelIndex = (y * width + x) * 3;
        
        // Extract RGB values and normalize to [0, 1]
        // YOLO expects RGB order
        tensor[tensorIndex++] = rawPixels[pixelIndex] / 255.0;     // R
        tensor[tensorIndex++] = rawPixels[pixelIndex + 1] / 255.0; // G
        tensor[tensorIndex++] = rawPixels[pixelIndex + 2] / 255.0; // B
      }
    }

    console.log(
      `Image preprocessing: Extracted ${width}x${height} RGB pixels, ` +
      `normalized to Float32Array[${tensor.length}] for YOLO model`
    );

    return tensor;
    
  } catch (error) {
    console.error('Image preprocessing error:', error);
    throw new Error(
      `Failed to preprocess image: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Postprocess YOLO-Worldv2 model output
 * Parses bounding boxes, classes, and scores from model output
 * 
 * YOLO-Worldv2 output format (with custom vocabulary):
 * - Shape: [1, num_detections, 255] where 255 = [x, y, w, h, 251 class scores]
 * - Or: [1, 8400, 255] for YOLOv8s-worldv2 (8400 = number of anchor boxes)
 * 
 * Each detection has:
 * - x, y: center coordinates (normalized 0-1)
 * - w, h: width and height (normalized 0-1)
 * - 251 class scores (one for each custom vocabulary class)
 */
function postprocessOutput(
  output: any,
  vocabulary: string[], // Vocabulary loaded from database
  confidenceThreshold: number = 0.25,
  numClasses: number = 251  // YOLO-Worldv2 with custom vocabulary (251 classes)
): DetectionResult[] {
  const detections: DetectionResult[] = [];
  
  try {
    
    if (!output || !Array.isArray(output) || output.length === 0) {
      console.warn('Model output is empty or invalid');
      return detections;
    }
    
    // Get the first output tensor (YOLO typically has one output)
    const outputTensor = output[0];
    
    if (!outputTensor || !(outputTensor instanceof Float32Array)) {
      console.warn('Model output is not a valid tensor:', typeof outputTensor, outputTensor?.constructor?.name);
      return detections;
    }
    
    // YOLO-Worldv2 output format:
    // Format: [1, num_detections, num_classes + 4] - flattened as [num_detections * (4 + num_classes)]
    // For YOLO-Worldv2 with 251 classes: [1, 8400, 255] = [1, 8400, 4 + 251]
    
    const elementsPerDetection = 4 + numClasses; // 4 (bbox) + num_classes (class scores)
    const tensorSize = outputTensor.length;
    const numDetections = Math.floor(tensorSize / elementsPerDetection);
    
    // Support both YOLO-Worldv2 (255 elements) and legacy YOLO (84 elements for COCO)
    if (numDetections === 0 || tensorSize % elementsPerDetection !== 0) {
      // Try legacy format (84 elements for COCO)
      const legacyElementsPerDetection = 84; // 4 + 80 COCO classes
      const legacyNumDetections = Math.floor(tensorSize / legacyElementsPerDetection);
      
      if (legacyNumDetections > 0 && tensorSize % legacyElementsPerDetection === 0) {
        console.log('Detected legacy YOLO format (84 elements, COCO classes). Using COCO vocabulary.');
        // Use legacy processing with COCO classes
        return postprocessOutputLegacy(output, confidenceThreshold);
      }
      
      console.warn(`Invalid tensor size for YOLO-Worldv2 output: ${tensorSize} (expected multiple of ${elementsPerDetection})`);
      return detections;
    }
    
    console.log(`Processing ${numDetections} detections from tensor of size ${tensorSize} (${numClasses} classes)`);
    
    // Process each detection
    // Format: [x, y, w, h, class_score_0, class_score_1, ..., class_score_250]
    for (let i = 0; i < numDetections; i++) {
      const offset = i * elementsPerDetection;
      
      // Extract bounding box (normalized coordinates)
      // YOLO-Worldv2 uses center coordinates (x, y) and size (w, h), all normalized 0-1
      const x = outputTensor[offset + 0]; // center x
      const y = outputTensor[offset + 1]; // center y
      const w = outputTensor[offset + 2]; // width
      const h = outputTensor[offset + 3]; // height
      
      // Validate bounding box
      if (x < 0 || x > 1 || y < 0 || y > 1 || w <= 0 || h <= 0 || w > 1 || h > 1) {
        continue; // Skip invalid detections
      }
      
      // Extract class scores (numClasses classes from custom vocabulary)
      let maxScore = 0;
      let maxClassIndex = 0;
      
      for (let classIdx = 0; classIdx < numClasses; classIdx++) {
        const score = outputTensor[offset + 4 + classIdx];
        if (score > maxScore) {
          maxScore = score;
          maxClassIndex = classIdx;
        }
      }
      
      // Apply confidence threshold
      if (maxScore < confidenceThreshold) {
        continue;
      }
      
      // Convert normalized coordinates to pixel coordinates
      // YOLO uses center coordinates, we need top-left corner for bounding box
      const MODEL_SIZE = 640;
      const x1 = (x - w / 2) * MODEL_SIZE; // top-left x
      const y1 = (y - h / 2) * MODEL_SIZE; // top-left y
      const width = w * MODEL_SIZE;
      const height = h * MODEL_SIZE;
      
      // Get class name from custom vocabulary
      const className = vocabulary[maxClassIndex] || `class_${maxClassIndex}`;
      
      detections.push({
        classIndex: maxClassIndex,
        className,
        confidence: maxScore,
        boundingBox: {
          x: Math.max(0, x1), // Clamp to valid range
          y: Math.max(0, y1),
          width: Math.min(MODEL_SIZE, width),
          height: Math.min(MODEL_SIZE, height),
        },
      });
    }
    
    // Sort by confidence (highest first)
    detections.sort((a, b) => b.confidence - a.confidence);
    
    // Apply Non-Maximum Suppression (NMS) to remove overlapping detections
    // For simplicity, we'll just return top detections
    // In production, implement proper NMS
    
    return detections.slice(0, 100); // Return top 100 detections
    
  } catch (error) {
    console.error('Error postprocessing YOLO output:', error);
    return detections;
  }
}

/**
 * Challenge data structure for local AI
 */
export interface ChallengeData {
  title: string;
  detectable_object?: string | null; // Key object to detect (from database)
}

/**
 * Verify photo locally using TensorFlow Lite (Android only)
 * Falls back to server verification on other platforms
 * 
 * @param photoUri - URI of the photo to verify
 * @param challengeTitle - Title of the challenge (for backward compatibility)
 * @param challengeData - Optional challenge data from database (detectable_object)
 */
export async function verifyPhotoLocally(
  photoUri: string,
  challengeTitle: string,
  challengeData?: ChallengeData
): Promise<VerificationResult> {
  // Only works on Android
  if (Platform.OS !== 'android') {
    return {
      success: false,
      verified: false,
      message: 'Local AI verification is only available on Android',
      detections: [],
    };
  }

  // Using YOLO-Worldv2 model only
  const isYOLOWorld: boolean = true;

  try {
    // Dynamic import to avoid errors on non-Android platforms
    let TFLite;
    try {
      TFLite = require('react-native-fast-tflite');
    } catch (e) {
      return {
        success: false,
        verified: false,
        message: 'TensorFlow Lite library not available. Please install react-native-fast-tflite and rebuild the app.',
        detections: [],
      };
    }
    
    // Load YOLO-Worldv2 model
    // Use require() for bundled assets - Metro will handle missing files during build
    let modelPath: any;
    try {
      // For Android: use require() to load bundled asset
      // Note: If file doesn't exist, Metro bundler will fail during build
      // This is expected - the model file must be added before building
      if (Platform.OS === 'android') {
        // @ts-ignore - Metro bundler will handle this for Android builds
        // If file is missing, build will fail with clear error message
        modelPath = require('../../assets/models/yolov8s-worldv2_int8.tflite');
        if (!modelPath) {
          throw new Error('Model file resolved to null');
        }
        console.log('Using YOLO-Worldv2 model with custom vocabulary (251 classes)');
      } else {
        throw new Error('Model loading only supported on Android');
      }
    } catch (e: any) {
      // If require fails (file missing), provide helpful error message
      const errorMessage = e?.message || 'Unknown error';
      if (errorMessage.includes('Unable to resolve') || errorMessage.includes('not found')) {
        return {
          success: false,
          verified: false,
          message: 'AI model not found. Please add yolov8s-worldv2_int8.tflite to assets/models/ and rebuild the app. See docs/YOLO_WORLD_ANDROID_SETUP.md for instructions.',
          detections: [],
        };
      }
      console.warn('Failed to load model:', e);
      return {
        success: false,
        verified: false,
        message: `Failed to load AI model: ${errorMessage}. Make sure yolov8s-worldv2_int8.tflite is in assets/models/ and rebuild the app.`,
        detections: [],
      };
    }

    // Load the model
    // react-native-fast-tflite API: loadTensorflowModel(asset) for bundled assets
    let model;
    try {
      if (TFLite.loadTensorflowModel) {
        model = await TFLite.loadTensorflowModel(modelPath);
      } else if (TFLite.loadModel) {
        // Alternative API name
        model = await TFLite.loadModel(modelPath);
      } else {
        throw new Error('loadTensorflowModel or loadModel not found in react-native-fast-tflite');
      }
    } catch (loadError) {
      console.error('Failed to load model:', loadError);
      return {
        success: false,
        verified: false,
        message: `Failed to load AI model: ${loadError instanceof Error ? loadError.message : 'Unknown error'}. Make sure the model file is valid and the app was rebuilt after adding it.`,
        detections: [],
      };
    }
    
    if (!model) {
      return {
        success: false,
        verified: false,
        message: 'Model loaded but is null. Please check the model file.',
        detections: [],
      };
    }
    
    // Determine object to detect
    // Priority: 1) challengeData.detectable_object, 2) extract from title
    // For YOLO-Worldv2: No need for coco_classes mapping - model recognizes objects directly!
    let objectToDetect: string;
    let useDirectMatch = true; // YOLO-Worldv2 supports direct class matching
    
    if (challengeData?.detectable_object) {
      // Use detectable_object from database if available
      objectToDetect = challengeData.detectable_object.toLowerCase().trim();
      console.log('Local AI (YOLO-Worldv2): Using detectable_object from database:', objectToDetect);
      console.log('Local AI: Direct matching - no COCO mapping needed with YOLO-Worldv2!');
    } else {
      // Fallback to extracting from title
      objectToDetect = extractObjectFromChallenge(challengeTitle);
      console.log('Local AI: Extracted object from title:', objectToDetect);
    }
    
    // isYOLOWorld already determined above when loading model
    if (isYOLOWorld) {
      console.log('Using YOLO-Worldv2: Direct vocabulary matching (no COCO mapping needed)');
    } else {
      console.log('Using legacy YOLO: COCO classes mapping required');
    }
    
    // Preprocess image
    // This will resize to 640x640 and extract RGB pixels into Float32Array tensor
    const inputTensor = await preprocessImage(photoUri);
    
    // Run inference
    // react-native-fast-tflite expects an array of input tensors
    // Input shape: [1, 640, 640, 3] - batch, height, width, RGB channels
    // Values normalized to [0, 1]
    let output;
    try {
      // Run model with extracted pixel tensor
      output = await model.run([inputTensor]);
    } catch (runError) {
      console.error('Model inference error:', runError);
      throw new Error(
        `Failed to run model inference: ${runError instanceof Error ? runError.message : 'Unknown error'}`
      );
    }
    
    // Load vocabulary from code (for YOLO-Worldv2)
    // For legacy YOLO, we'll use COCO classes in postprocessOutputLegacy
    let vocabulary: string[] = [];
    if (isYOLOWorld) {
      vocabulary = getVocabulary(); // Load from code, not database
      if (vocabulary.length === 0) {
        console.warn('Vocabulary is empty. This should not happen.');
      }
    }
    
    // Postprocess output
    // Check if using YOLO-Worldv2 (255 elements = 4 bbox + 251 classes) or legacy YOLO (84 elements = 4 bbox + 80 COCO)
    const numClasses = isYOLOWorld ? 251 : 80; // YOLO-Worldv2 has 251 classes, legacy YOLO has 80 COCO classes
    
    const detections = isYOLOWorld 
      ? postprocessOutput(output, vocabulary, 0.25, numClasses)
      : postprocessOutputLegacy(output, 0.25);
    
    console.log(`Local AI: Found ${detections.length} total detections (using ${numClasses} classes)`);
    
    // Filter detections that match our target object
    // For YOLO-Worldv2: Direct matching with vocabulary
    // For legacy YOLO: Use simple matching
    const relevantDetections = detections.filter(det => {
      if (isYOLOWorld) {
        // YOLO-Worldv2: Direct exact match or partial match with vocabulary
        const detected = det.className.toLowerCase().trim();
        const target = objectToDetect.toLowerCase().trim();
        
        // Exact match
        if (detected === target) return true;
        
        // Partial match (e.g., "wall clock" matches "clock")
        if (detected.includes(target) || target.includes(detected)) return true;
        
        // Word matching (for compound names like "wall clock" vs "clock")
        const detectedWords = detected.split(/\s+/);
        const targetWords = target.split(/\s+/);
        
        for (const word of targetWords) {
          if (word.length > 3 && detectedWords.includes(word)) {
            return true;
          }
        }
        
        return false;
      } else {
        // Legacy YOLO (COCO): Use matching function
        return matchesObject(det.className, objectToDetect);
      }
    });
    
    console.log(`Local AI: Found ${relevantDetections.length} relevant detections for "${objectToDetect}"`);
    
    // Check if we found the object with sufficient confidence
    const minConfidence = 0.25;
    const verified = relevantDetections.length > 0 && 
                     relevantDetections.some(det => det.confidence >= minConfidence);
    
    const maxConfidence = relevantDetections.length > 0
      ? Math.max(...relevantDetections.map(d => d.confidence))
      : 0;
    
    // For local-only verification, we always return success (even if not verified)
    // This ensures the app doesn't try to fall back to server
    return {
      success: true, // Always true for local-only mode
      verified,
      message: verified
        ? `Object "${objectToDetect}" detected with confidence ${maxConfidence.toFixed(2)}`
        : `Object "${objectToDetect}" not found in the image. Please try again with a clearer photo.`,
      detections: relevantDetections,
      matchedClass: relevantDetections[0]?.className,
      maxConfidence,
    };
    
  } catch (error) {
    console.error('Local AI verification error:', error);
    return {
      success: false,
      verified: false,
      message: `Local AI verification failed: ${error instanceof Error ? error.message : 'Unknown error'}. Falling back to server verification.`,
      detections: [],
    };
  }
}

/**
 * Check if local AI verification is available
 */
export function isLocalAIAvailable(): boolean {
  return Platform.OS === 'android';
}

/**
 * Legacy postprocessing for COCO YOLO models (backward compatibility)
 */
function postprocessOutputLegacy(
  output: any,
  confidenceThreshold: number = 0.25
): DetectionResult[] {
  // COCO class names for legacy support
  const COCO_CLASSES = [
    'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 'truck', 'boat',
    'traffic light', 'fire hydrant', 'stop sign', 'parking meter', 'bench', 'bird', 'cat',
    'dog', 'horse', 'sheep', 'cow', 'elephant', 'bear', 'zebra', 'giraffe', 'backpack',
    'umbrella', 'handbag', 'tie', 'suitcase', 'frisbee', 'skis', 'snowboard', 'sports ball',
    'kite', 'baseball bat', 'baseball glove', 'skateboard', 'surfboard', 'tennis racket',
    'bottle', 'wine glass', 'cup', 'fork', 'knife', 'spoon', 'bowl', 'banana', 'apple',
    'sandwich', 'orange', 'broccoli', 'carrot', 'hot dog', 'pizza', 'donut', 'cake',
    'chair', 'couch', 'potted plant', 'bed', 'dining table', 'toilet', 'tv', 'laptop',
    'mouse', 'remote', 'keyboard', 'cell phone', 'microwave', 'oven', 'toaster', 'sink',
    'refrigerator', 'book', 'clock', 'vase', 'scissors', 'teddy bear', 'hair drier',
    'toothbrush'
  ];

  const detections: DetectionResult[] = [];
  const outputTensor = output[0];
  const tensorSize = outputTensor.length;
  const numDetections = Math.floor(tensorSize / 84); // 84 = 4 + 80 COCO classes

  for (let i = 0; i < numDetections; i++) {
    const offset = i * 84;
    const x = outputTensor[offset + 0];
    const y = outputTensor[offset + 1];
    const w = outputTensor[offset + 2];
    const h = outputTensor[offset + 3];

    if (x < 0 || x > 1 || y < 0 || y > 1 || w <= 0 || h <= 0 || w > 1 || h > 1) {
      continue;
    }

    let maxScore = 0;
    let maxClassIndex = 0;

    for (let classIdx = 0; classIdx < 80; classIdx++) {
      const score = outputTensor[offset + 4 + classIdx];
      if (score > maxScore) {
        maxScore = score;
        maxClassIndex = classIdx;
      }
    }

    if (maxScore < confidenceThreshold) {
      continue;
    }

    const MODEL_SIZE = 640;
    const x1 = (x - w / 2) * MODEL_SIZE;
    const y1 = (y - h / 2) * MODEL_SIZE;
    const width = w * MODEL_SIZE;
    const height = h * MODEL_SIZE;

    detections.push({
      classIndex: maxClassIndex,
      className: COCO_CLASSES[maxClassIndex] || `class_${maxClassIndex}`,
      confidence: maxScore,
      boundingBox: {
        x: Math.max(0, x1),
        y: Math.max(0, y1),
        width: Math.min(MODEL_SIZE, width),
        height: Math.min(MODEL_SIZE, height),
      },
    });
  }

  detections.sort((a, b) => b.confidence - a.confidence);
  return detections.slice(0, 100);
}

export default {
  verifyPhotoLocally,
  isLocalAIAvailable,
  extractObjectFromChallenge,
  matchesObject,
  getVocabularyAsync, // Async version - loads from code
  getVocabulary, // Sync version - loads from code
};

// Note: ChallengeData, VerificationResult, and DetectionResult are already exported above
