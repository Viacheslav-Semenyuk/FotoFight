// @ts-nocheck
// Supabase Edge Function — image verification via Gemini 2.5 Flash
// With FULL DEBUG LOGS
// Runs on Supabase Edge (Deno)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// ENV
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

interface VerifyRequest {
  photoBase64: string;
  challengeTitle: string;
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
    console.log('--- VERIFY FUNCTION CALLED ---');

    if (!GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY is missing');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'GEMINI_API_KEY is not set',
        }),
        { status: 500 },
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
        { status: 400 },
      );
    }

    const prompt = `Does the image match the challenge title exactly? Title: "${challengeTitle}" Answer only: true or false`;

    // Remove data:image prefix if exists
    const base64 = photoBase64.replace(/^data:image\/\w+;base64,/, '');

    // Detect mime type
    let mimeType = 'image/jpeg';
    if (photoBase64.startsWith('data:image/png')) mimeType = 'image/png';
    if (photoBase64.startsWith('data:image/webp')) mimeType = 'image/webp';

    console.log('Image info:', {
      mimeType,
      base64Length: base64.length,
      base64Preview: base64.slice(0, 50),
    });

    if (base64.length < 1000) {
      console.warn('⚠️ Base64 is very small, image may be broken');
    }

    const requestPayload = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: mimeType,
                data: base64,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0,
        maxOutputTokens: 50,
      },
    };

    console.log('Gemini request payload (without image data):', {
      prompt,
      mimeType,
      temperature: 0,
      maxOutputTokens: 50,
    });

    const geminiRes = await fetch(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      },
    );

    console.log('Gemini response status:', geminiRes.status);

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('Gemini API error:', errText);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Gemini API error',
          details: errText,
        }),
        { status: 500 },
      );
    }

    const data = await geminiRes.json();
    console.log('Gemini raw response:', JSON.stringify(data, null, 2));

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
      ?.trim()
      ?.toLowerCase() ?? '';

    console.log('Parsed Gemini text:', text);

    const verified = text === 'true';

    console.log('Final verification result:', verified);

    return new Response(
      JSON.stringify({
        success: true,
        verified,
        rawResponse: text,
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
      { status: 500 },
    );
  }
});
