// @ts-nocheck
// Supabase Edge Function — image verification via Roboflow YOLO-World
// Supports open-vocabulary object detection with text queries
// Runs on Supabase Edge (Deno)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// ENV
const ROBOFLOW_API_KEY = Deno.env.get('ROBOFLOW_API_KEY');
const ROBOFLOW_API_URL = 'https://infer.roboflow.com/yolo_world/infer';
const YOLO_MODEL_VERSION = Deno.env.get('YOLO_MODEL_VERSION') || 'l'; // s, m, l, x

interface VerifyRequest {
  photoBase64: string;
  challengeTitle: string;
}

// Extract object name from challenge title
// Examples: "Snap a kettle" -> "kettle", "Snap a wall clock" -> "wall clock"
function extractObjectFromChallenge(title: string): string {
  // Remove "Snap a" or "Snap an" prefix
  let object = title.replace(/^snap\s+(a|an)\s+/i, '').trim();
  
  // Remove trailing punctuation
  object = object.replace(/[.,!?;:]$/, '').trim();
  
  // Convert to lowercase for better matching
  return object.toLowerCase();
}

serve(async (req: Request) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    console.log('--- YOLO-WORLD VERIFY FUNCTION CALLED ---');

    if (!ROBOFLOW_API_KEY) {
      console.error('ROBOFLOW_API_KEY is missing');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'ROBOFLOW_API_KEY is not set',
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    const body = (await req.json()) as VerifyRequest;
    const { photoBase64, challengeTitle } = body;

    console.log('Incoming body:', {
      hasPhoto: Boolean(photoBase64),
      challengeTitle,
    });

    if (!photoBase64 || !challengeTitle) {
      console.error('Missing required fields');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'photoBase64 and challengeTitle are required',
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    // Extract object name from challenge title
    const objectToDetect = extractObjectFromChallenge(challengeTitle);
    console.log('Extracted object to detect:', objectToDetect);

    // Remove data:image prefix if exists
    const base64 = photoBase64.replace(/^data:image\/\w+;base64,/, '');

    // Detect mime type
    let mimeType = 'image/jpeg';
    if (photoBase64.startsWith('data:image/png')) mimeType = 'image/png';
    if (photoBase64.startsWith('data:image/webp')) mimeType = 'image/webp';

    console.log('Image info:', {
      mimeType,
      base64Length: base64.length,
    });

    if (base64.length < 1000) {
      console.warn('⚠️ Base64 is very small, image may be broken');
    }

    // Prepare Roboflow API request
    const requestPayload = {
      id: `req_${Date.now()}`,
      api_key: ROBOFLOW_API_KEY,
      usage_billable: true,
      model_id: `yolo_world/${YOLO_MODEL_VERSION}`,
      image: [
        {
          type: 'base64',
          value: base64,
        },
      ],
      text: [objectToDetect], // The object we want to detect from challenge
      confidence: 0.25, // Confidence threshold (can be adjusted)
    };

    console.log('Roboflow request payload (without image data):', {
      model_id: requestPayload.model_id,
      text: requestPayload.text,
      confidence: requestPayload.confidence,
    });

    // Call Roboflow API
    const roboflowRes = await fetch(ROBOFLOW_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestPayload),
    });

    console.log('Roboflow response status:', roboflowRes.status);

    if (!roboflowRes.ok) {
      const errText = await roboflowRes.text();
      console.error('Roboflow API error:', errText);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Roboflow API error',
          details: errText,
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    const data = await roboflowRes.json();
    console.log('Roboflow raw response:', JSON.stringify(data, null, 2));

    // Check if any detections were found
    const predictions = data?.predictions || [];
    const hasDetections = predictions.length > 0;
    
    // Get the highest confidence detection for the object
    const relevantDetections = predictions.filter((pred: any) => {
      const predClass = (pred.class || '').toLowerCase();
      return predClass.includes(objectToDetect) || objectToDetect.includes(predClass);
    });

    // Verify if we found the object with reasonable confidence
    const verified = hasDetections && (
      relevantDetections.length > 0 || 
      predictions.some((pred: any) => (pred.confidence || 0) >= 0.3)
    );

    const maxConfidence = predictions.length > 0
      ? Math.max(...predictions.map((p: any) => p.confidence || 0))
      : 0;

    console.log('Verification result:', {
      verified,
      detectionsFound: predictions.length,
      relevantDetections: relevantDetections.length,
      maxConfidence,
      objectToDetect,
    });

    return new Response(
      JSON.stringify({
        success: true,
        verified,
        detections: predictions.length,
        maxConfidence,
        objectToDetect,
        rawResponse: data,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      },
    );
  } catch (e) {
    console.error('Unhandled error:', e);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal error',
        details: String(e),
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
});
