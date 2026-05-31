"use client";

import { useMemo, useState } from "react";
import exercises from "../data/exercises";

function getFrenchVoice() {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices() || [];
  return voices.find((voice) => voice.lang === "fr-CA")
    || voices.find((voice) => voice.lang?.toLowerCase().startsWith("fr"))
    || voices[0]
    || null;
}

function splitTextForSpeech(text) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  if (!clean) return [];
  const chunks = [];
  let rest = clean;
  while (rest.length > 0) {
    let slice = rest.slice(0, 180);
    const lastStop = Math.max(slice.lastIndexOf("."), slice.lastIndexOf("!"), slice.lastIndexOf("?"), slice.lastIndexOf(";"), slice.lastIndexOf(","));
    if (rest.length > 180 && lastStop > 60) slice = slice.slice(0, lastStop + 1);
    chunks.push(slice.trim());
    rest = rest.slice(slice.length).trim();
  }
  return chunks;
}

function speak(text, onStatus) {
  if (typeof window === "undefined" || !window.speechSynthesis || typeof SpeechSynthesisUtterance === "undefined") {
    onStatus?.("La lecture vocale n’est pas disponible dans ce navigateur.");
    return;
  }

  const chunks = splitTextForSpeech(text);
  if (chunks.length === 0) {
    onStatus?.("Il n’y a rien à lire.");
    return;
  }

  window.speechSynthesis.cancel();
  const voice = getFrenchVoice();
  let index = 0;

  const readNext = () => {
    if (index >= chunks.length) {
      onStatus?.("Lecture terminée.");
      return;
    }
    const utterance = new SpeechSynthesisUtterance(chunks[index]);
    utterance.lang = voice?.lang || "fr-CA";
    utterance.voice = voice;
    utterance.rate = 0.85;
    utterance.pitch = 1;
    utterance.volume = 1;
    utterance.onstart = () => onStatus?.("Lecture en cours...");
    utterance.onerror = () => onStatus?.("La lecture vocale a été bloquée ou n’est pas disponible. Essaie Chrome et vérifie le son de l’appareil.");
    utterance.onend = () => {
      index += 1;
      setTimeout(readNext, 120);
    };
    window.speechSynthesis.speak(utterance);
  };

  setTimeout(readNext, 50);
}

export default function AideVocalePage() {
  const [exerciseId, setExerciseId] = useState(exercises[0]?.id || "");
  const exercise = useMemo(() => exercises.find((item) => item.id === exerciseId) || exercises[0], [exerciseId]);
  const [questionId, setQuestionId] = useState(exercise?.questions?.[0]?.id || "q1");
  const question = exercise?.questions?.find((item) => item.id === questionId) || exercise?.questions?.[0];
  const [message, setMessage] = useState("Je ne comprends pas ce que je dois faire.");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [speechStatus, setSpeechStatus] = useState("Lecture vocale prête.");

  function readAloud(text) {
    speak(text, setSpeechStatus);
  }

  function stopSpeaking() {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setSpeechStatus("Lecture arrêtée.");
    }
  }

  function changeExercise(id) {
    const next = exercises.find((item) => item.id === id) || exercises[0];
    setExerciseId(next.id);
    setQuestionId(next.questions?.[0]?.id || "q1");
    setHistory([]);
  }

  async function askAI(customMessage) {
    const userText = (customMessage || message).trim();
    if (!userText) return;
    const nextHistory = [...history, { role: "user", text: userText }];
    setHistory(nextHistory);
    setMessage("");
    setLoading(true);
    try {
      const response = await fetch("/api/aide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          exerciseId: exercise.id,
          questionId: question?.id,
          history: nextHistory
        })
      });
      const data = await response.json();
      const answer = data.answer || "Je n’ai pas réussi à répondre. Essaie de reformuler ta demande.";
      setHistory([...nextHistory, { role: "assistant", text: answer }]);
      readAloud(answer);
    } catch (error) {
      const answer = "L’aide IA n’est pas disponible pour le moment.";
      setHistory([...nextHistory, { role: "assistant", text: answer }]);
      readAloud(answer);
    } finally {
      setLoading(false);
    }
  }

  function startVoice() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("La reconnaissance vocale n’est pas disponible dans ce navigateur. Essaie Chrome.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "fr-CA";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    setListening(true);
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || "";
      setMessage(transcript);
      askAI(transcript);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognition.start();
  }

  return (
    <main className="page">
      <section className="card">
        <a href="/">Retour à l’application</a>
        <h1>Aide vocale conversationnelle</h1>
        <p>Cette aide utilise le texte choisi, la question, les indices et les corrigés enseignants. Elle guide l’élève sans donner directement la réponse.</p>
        <p className="yellow"><b>État vocal :</b> {speechStatus}</p>
        <button onClick={() => readAloud("Bonjour. La lecture vocale fonctionne. Je peux lire les réponses à voix haute.")}>Tester le son</button>
        <button onClick={stopSpeaking}>Arrêter la lecture</button>
      </section>

      <section className="grid cols">
        <div className="card">
          <h2>Contexte de l’aide</h2>
          <label>Texte</label>
          <select value={exercise?.id || ""} onChange={(event) => changeExercise(event.target.value)}>
            {exercises.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
          </select>
          <label>Question</label>
          <select value={question?.id || ""} onChange={(event) => setQuestionId(event.target.value)}>
            {exercise?.questions?.map((item, index) => <option key={item.id} value={item.id}>Question {index + 1} — {item.prompt}</option>)}
          </select>
          <div className="card yellow">
            <b>Question actuelle</b>
            <p>{question?.prompt}</p>
            <p><b>Type :</b> {question?.type} — <b>Points :</b> {question?.points}</p>
          </div>
          <div className="card">
            <b>Demandes rapides</b>
            <button onClick={() => askAI("Reformule la question en mots plus simples sans donner la réponse.")}>Reformule la question</button>
            <button onClick={() => askAI("Aide-moi à trouver où chercher dans le texte sans donner la réponse.")}>Où chercher ?</button>
            <button onClick={() => askAI("Aide-moi à choisir une preuve dans le texte sans donner directement la réponse.")}>Trouver une preuve</button>
            <button onClick={() => askAI("Donne-moi une amorce de phrase adaptée à cette question sans compléter la réponse.")}>Amorce de phrase</button>
          </div>
        </div>

        <div className="card">
          <h2>Parler ou écrire à l’aide IA</h2>
          <button className="green" onClick={startVoice} disabled={listening || loading}>{listening ? "J’écoute..." : "Parler"}</button>
          <textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Écris ou dicte ta question ici..." />
          <button className="blue" onClick={() => askAI()} disabled={loading}>{loading ? "Réponse en cours..." : "Demander de l’aide"}</button>
          <button onClick={() => setHistory([])}>Effacer la conversation</button>
        </div>
      </section>

      <section className="card">
        <h2>Conversation</h2>
        {history.length === 0 ? <p>Aucune conversation pour le moment.</p> : history.map((item, index) => (
          <div className={item.role === "assistant" ? "card green" : "card blue"} key={index}>
            <b>{item.role === "assistant" ? "Aide IA" : "Élève"}</b>
            <p>{item.text}</p>
            {item.role === "assistant" && <button onClick={() => readAloud(item.text)}>Réécouter</button>}
          </div>
        ))}
      </section>
    </main>
  );
}
