"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import baseExercises from "../data/exercises";
import moreExercises from "../data/moreExercises";

const exercises = [...baseExercises, ...moreExercises];

function normalize(text) {
  return String(text || "").replace(/\s+/g, " ").trim().toLowerCase();
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
  const [speechStatus, setSpeechStatus] = useState("Audio prêt.");
  const [audioUrl, setAudioUrl] = useState("");
  const [contextStatus, setContextStatus] = useState("Contexte chargé par défaut.");
  const audioRef = useRef(null);

  useEffect(() => {
    const savedTitle = localStorage.getItem("lectureCurrentExerciseTitle");
    const savedQuestion = localStorage.getItem("lectureCurrentQuestionPrompt");

    if (!savedTitle && !savedQuestion) return;

    const byTitle = exercises.find((item) => normalize(item.title) === normalize(savedTitle));
    const byQuestion = exercises.find((item) => item.questions?.some((q) => normalize(q.prompt) === normalize(savedQuestion)));
    const nextExercise = byTitle || byQuestion;

    if (nextExercise) {
      const nextQuestion = savedQuestion
        ? nextExercise.questions?.find((q) => normalize(q.prompt) === normalize(savedQuestion))
        : null;

      setExerciseId(nextExercise.id);
      setQuestionId(nextQuestion?.id || nextExercise.questions?.[0]?.id || "q1");
      setHistory([]);
      setContextStatus(`Contexte synchronisé : ${nextExercise.title}${nextQuestion ? " — question actuelle" : ""}.`);
    } else {
      setContextStatus("Aucun contexte synchronisé trouvé. Choisis le texte et la question manuellement.");
    }
  }, []);

  function changeExercise(id) {
    const next = exercises.find((item) => item.id === id) || exercises[0];
    setExerciseId(next.id);
    setQuestionId(next.questions?.[0]?.id || "q1");
    setHistory([]);
    localStorage.setItem("lectureCurrentExerciseTitle", next.title);
    localStorage.removeItem("lectureCurrentQuestionPrompt");
    setContextStatus(`Contexte changé : ${next.title}.`);
  }

  function changeQuestion(id) {
    setQuestionId(id);
    const nextQuestion = exercise?.questions?.find((item) => item.id === id);
    if (nextQuestion) {
      localStorage.setItem("lectureCurrentExerciseTitle", exercise.title);
      localStorage.setItem("lectureCurrentQuestionPrompt", nextQuestion.prompt);
      setContextStatus(`Question synchronisée : ${nextQuestion.prompt}`);
    }
  }

  async function readAloud(text) {
    const cleanText = String(text || "").trim();
    if (!cleanText) {
      setSpeechStatus("Il n’y a rien à lire.");
      return;
    }

    setSpeechStatus("Création de l’audio...");
    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: cleanText })
      });

      if (!response.ok) {
        const detail = await response.text();
        setSpeechStatus("Audio non disponible. Vérifie OPENAI_API_KEY et les crédits API.");
        console.error("Erreur TTS", detail);
        return;
      }

      const blob = await response.blob();
      const nextUrl = URL.createObjectURL(blob);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      setAudioUrl(nextUrl);
      setSpeechStatus("Audio prêt. Lecture en cours...");

      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.src = nextUrl;
          audioRef.current.play().catch(() => {
            setSpeechStatus("Le navigateur bloque la lecture automatique. Appuie sur le bouton lecture du lecteur audio.");
          });
        }
      }, 50);
    } catch (error) {
      setSpeechStatus("Erreur audio. Vérifie la connexion et les journaux Vercel.");
      console.error(error);
    }
  }

  function stopSpeaking() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setSpeechStatus("Lecture arrêtée.");
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
        <p className="yellow"><b>Contexte :</b> {contextStatus}</p>
        <p className="yellow"><b>État audio :</b> {speechStatus}</p>
        <button onClick={() => readAloud("Bonjour. L’audio OpenAI fonctionne. Je peux lire les réponses à voix haute.")}>Tester l’audio OpenAI</button>
        <button onClick={stopSpeaking}>Arrêter la lecture</button>
        <audio ref={audioRef} controls style={{ width: "100%", marginTop: 12 }} onEnded={() => setSpeechStatus("Lecture terminée.")}>Votre navigateur ne supporte pas le lecteur audio.</audio>
      </section>

      <section className="grid cols">
        <div className="card">
          <h2>Contexte de l’aide</h2>
          <label>Texte</label>
          <select value={exercise?.id || ""} onChange={(event) => changeExercise(event.target.value)}>
            {exercises.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
          </select>
          <label>Question</label>
          <select value={question?.id || ""} onChange={(event) => changeQuestion(event.target.value)}>
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
            {item.role === "assistant" && <button onClick={() => readAloud(item.text)}>Réécouter avec audio OpenAI</button>}
          </div>
        ))}
      </section>
    </main>
  );
}
