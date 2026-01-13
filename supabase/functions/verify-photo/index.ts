// @ts-nocheck
// Supabase Edge Function — проверка изображения через БЕСПЛАТНУЮ Gemini 1.5 Flash
// Работает в Supabase Edge (Deno)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// ENV
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

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
        'Access-Control-Allow-Headers':
          'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'GEMINI_API_KEY is not set',
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        },
      );
    }

    const body = (await req.json()) as VerifyRequest;
    const { photoBase64, challengeTitle } = body;

    if (!photoBase64 || !challengeTitle) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'photoBase64 and challengeTitle are required',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        },
      );
    }

    const prompt = `
Проанализируй изображение и определи, соответствует ли оно заданию.

Задание: "${challengeTitle}"

Ответь строго одним словом:
true — если соответствует
false — если не соответствует

Никаких объяснений. Только true или false.
`;

    // Убираем префикс data:image если он есть
    const base64 = photoBase64.replace(/^data:image\/\w+;base64,/, '');

    // Определяем MIME тип из base64 или используем jpeg по умолчанию
    let mimeType = 'image/jpeg';
    if (photoBase64.startsWith('data:image/png')) {
      mimeType = 'image/png';
    } else if (photoBase64.startsWith('data:image/webp')) {
      mimeType = 'image/webp';
    }

    const geminiRes = await fetch(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
            temperature: 0.4,
            maxOutputTokens: 10,
          },
        }),
      },
    );

    if (!geminiRes.ok) {
      const err = await geminiRes.text();
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Gemini API error',
          details: err,
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        },
      );
    }

    const data = await geminiRes.json();

    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text
        ?.trim()
        ?.toLowerCase() ?? '';

    const verified = text === 'true';

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
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal error',
        details: String(e),
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      },
    );
  }
});