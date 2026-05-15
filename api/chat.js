/**
 * Proxy to Gemini generateContent.
 * - If body has `contents`, pass through (native Gemini request).
 * - If body has `system` + `messages` (OpenAI-style), map to Gemini format.
 */
function buildGeminiRequest(body) {
  if (body && Array.isArray(body.contents)) {
    return body;
  }

  const systemText =
    typeof body.system === 'string'
      ? body.system
      : body.system?.parts?.map((p) => p.text).join('\n') ?? '';

  if (body.messages && Array.isArray(body.messages)) {
    const contents = body.messages.map((m) => {
      const role =
        m.role === 'assistant' || m.role === 'model' ? 'model' : 'user';
      const text =
        typeof m.content === 'string'
          ? m.content
          : m.parts?.map((p) => p.text).join('') ?? '';
      return { role, parts: [{ text }] };
    });

    const out = { contents };
    if (systemText.trim()) {
      out.system_instruction = { parts: [{ text: systemText }] };
    }
    // Preserve optional generationConfig etc. from client
    if (body.generationConfig) out.generationConfig = body.generationConfig;
    if (body.safetySettings) out.safetySettings = body.safetySettings;
    return out;
  }

  return body;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: { message: 'Missing GEMINI_API_KEY' } });
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  try {
    const geminiBody = buildGeminiRequest(req.body || {});

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(geminiBody),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: { message: error.message } });
  }
}
