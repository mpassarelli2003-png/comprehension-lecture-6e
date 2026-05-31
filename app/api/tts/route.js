export async function POST(request) {
  try {
    const { text } = await request.json();
    const cleanText = String(text || "").replace(/\s+/g, " ").trim().slice(0, 1200);

    if (!cleanText) {
      return Response.json({ error: "Texte manquant." }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return Response.json({ error: "OPENAI_API_KEY manquante dans Vercel." }, { status: 400 });
    }

    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts",
        voice: process.env.OPENAI_TTS_VOICE || "coral",
        input: cleanText,
        response_format: "mp3",
        instructions: "Parle en français québécois clair, lentement, avec une voix chaleureuse et pédagogique. Fais de courtes pauses entre les idées."
      })
    });

    if (!response.ok) {
      const detail = await response.text();
      return Response.json({ error: "Erreur TTS OpenAI.", detail }, { status: 500 });
    }

    const audioBuffer = await response.arrayBuffer();
    return new Response(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store"
      }
    });
  } catch (error) {
    return Response.json({ error: "Erreur du serveur TTS.", detail: error?.message || String(error) }, { status: 500 });
  }
}
