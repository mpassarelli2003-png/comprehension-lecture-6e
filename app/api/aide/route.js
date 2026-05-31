import exercises from "../../data/exercises";

export async function POST(request) {
  try {
    const { message, exerciseId, questionId, history = [] } = await request.json();

    if (!message || typeof message !== "string") {
      return Response.json({ error: "Message manquant." }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return Response.json({
        answer: "L’aide conversationnelle n’est pas encore activée. Il manque la clé OPENAI_API_KEY dans les variables d’environnement Vercel."
      });
    }

    const exercise = exercises.find((item) => item.id === exerciseId) || exercises[0];
    const question = exercise?.questions?.find((item) => item.id === questionId) || exercise?.questions?.[0];

    const safeHistory = Array.isArray(history)
      ? history.slice(-8).map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: String(m.text || m.content || "").slice(0, 1200) }))
      : [];

    const systemPrompt = `Tu es une aide vocale conversationnelle pour une application de compréhension de lecture de 6e année du primaire au Québec.
Tu aides des élèves de 11-12 ans, dont certains ont un TDAH, une dyslexie ou une dysorthographie.
Tu dois parler en français clair, court et rassurant.
Tu dois soutenir la démarche sans donner directement la réponse avant que l'élève ait essayé.
Tu dois utiliser uniquement le texte, la question, les indices, le corrigé et les stratégies fournis dans ce contexte.
Tu peux : reformuler la question, expliquer le mot-question, aider à trouver une preuve, proposer une amorce de phrase, rappeler une stratégie, aider à réviser la réponse.
Tu ne dois pas : écrire une réponse complète à la place de l'élève, faire le devoir au complet, inventer des faits hors du texte.
Quand la question est personnelle, tu peux donner une structure de réponse, mais pas une opinion à copier.
Réponds en 2 à 6 phrases maximum, avec des étapes simples si utile.`;

    const contextPrompt = `Texte actuel : ${exercise?.title || "Non précisé"}
Type : ${exercise?.textType || "Non précisé"}
Intention : ${exercise?.intention || "Non précisée"}
Texte complet :
${String(exercise?.text || "").slice(0, 12000)}

Question actuelle : ${question?.prompt || "Non précisée"}
Type de question : ${question?.type || "Non précisé"}
Points : ${question?.points || "Non précisé"}
Indices prévus : ${(question?.hints || []).join(" | ")}
Corrigé/exemple enseignant, à ne pas donner directement sauf si l'élève demande une comparaison après tentative : ${question?.expectedAnswer || "Non précisé"}`;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        input: [
          { role: "system", content: systemPrompt },
          { role: "user", content: contextPrompt },
          ...safeHistory,
          { role: "user", content: message }
        ],
        max_output_tokens: 350
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return Response.json({
        answer: "Je n’arrive pas à joindre l’aide IA pour le moment. Vérifie la clé API, le modèle configuré et les journaux Vercel.",
        detail: data?.error?.message || "Erreur inconnue."
      }, { status: 200 });
    }

    const answer = data.output_text || data.output?.flatMap((item) => item.content || []).map((c) => c.text || "").join("\n") || "Je n’ai pas réussi à formuler une aide. Réessaie avec une question plus courte.";
    return Response.json({ answer });
  } catch (error) {
    return Response.json({
      answer: "Une erreur est survenue dans l’aide conversationnelle.",
      detail: error?.message || String(error)
    }, { status: 500 });
  }
}
