"use client";

import { useEffect, useMemo, useState } from "react";
import {
  WRITING_MINISTRY_CRITERIA,
  analyzeWritingForRevision,
  buildWritingSimulationChecklist
} from "../../lib/writingMinistryFeedback";
import {
  recordWritingAnalysisEvent,
  recordWritingSelfAssessmentEvent
} from "../../lib/writingRevisionHistory";

function stateLabel(state) {
  if (state === "review") return "À revoir";
  if (state === "check") return "À vérifier humainement";
  return "Autoévaluation";
}

function criterionCheckKey(id) {
  return `ministere-ecriture-${id}`;
}

export default function WritingMinistryFeedbackPanel({
  draft,
  writingBrief,
  examMode,
  checks,
  setChecks,
  levelId = "6e",
  step = 5
}) {
  const mode = examMode ? "simulation" : "training";
  const [feedback, setFeedback] = useState(null);
  const inputFingerprint = useMemo(() => JSON.stringify({
    draft,
    audience: writingBrief.audience,
    purpose: writingBrief.purpose,
    textType: writingBrief.type,
    minimumParagraphs: writingBrief.minimumParagraphs,
    mode
  }), [draft, writingBrief.audience, writingBrief.purpose, writingBrief.type, writingBrief.minimumParagraphs, mode]);

  useEffect(() => {
    setFeedback(null);
  }, [inputFingerprint]);

  const simulationChecklist = useMemo(() => buildWritingSimulationChecklist(), []);

  function analyze() {
    const nextFeedback = analyzeWritingForRevision({
      text: draft,
      audience: writingBrief.audience,
      purpose: writingBrief.purpose,
      textType: writingBrief.type,
      minimumParagraphs: writingBrief.minimumParagraphs,
      mode: "training"
    });
    setFeedback(nextFeedback);
    recordWritingAnalysisEvent(nextFeedback, {
      levelId,
      textTypeId: writingBrief.typeId,
      step
    });
  }

  function toggleSimulationCriterion(item) {
    const key = criterionCheckKey(item.id);
    const nextChecks = { ...checks, [key]: !checks[key] };
    const wasComplete = simulationChecklist.every((criterion) => Boolean(checks[criterionCheckKey(criterion.id)]));
    const isComplete = simulationChecklist.every((criterion) => Boolean(nextChecks[criterionCheckKey(criterion.id)]));
    setChecks(nextChecks);
    if (!wasComplete && isComplete) {
      recordWritingSelfAssessmentEvent({
        levelId,
        textTypeId: writingBrief.typeId,
        step
      });
    }
  }

  if (examMode) {
    const completed = simulationChecklist.filter((item) => checks[criterionCheckKey(item.id)]).length;
    return (
      <section className="card ministryWritingFeedback simulation" aria-label="Liste de vérification ministérielle en simulation">
        <p className="eyebrow">Bloc 13 — Mode simulation</p>
        <h3>Liste de vérification — cinq critères d’écriture</h3>
        <p>Aucune analyse ciblée ni suggestion de contenu n’est affichée. Relis ton texte de façon autonome.</p>
        <p><b>Critères vérifiés :</b> {completed} / {simulationChecklist.length}</p>
        {simulationChecklist.map((item) => {
          const key = criterionCheckKey(item.id);
          return (
            <label className="ministryChecklistLine" key={item.id}>
              <input
                type="checkbox"
                checked={Boolean(checks[key])}
                onChange={() => toggleSimulationCriterion(item)}
              />
              <span><b>{item.label}</b><small>{item.action}</small></span>
            </label>
          );
        })}
      </section>
    );
  }

  return (
    <section className="card ministryWritingFeedback training" aria-label="Rétroaction formative selon les critères ministériels">
      <p className="eyebrow">Bloc 13 — Mode entraînement</p>
      <h3>Révision selon les cinq critères ministériels</h3>
      <p>Cette vérification repère des indices observables. Elle ne donne pas de note, ne corrige aucun mot et ne réécrit aucune phrase.</p>

      <div className="ministryCriteriaOverview">
        {WRITING_MINISTRY_CRITERIA.map((criterion) => (
          <div key={criterion.id}>
            <b>{criterion.label}</b>
            <small>{criterion.studentPrompt}</small>
          </div>
        ))}
      </div>

      <button type="button" className="blue" onClick={analyze}>Analyser mon brouillon pour préparer ma révision</button>

      {!feedback && <p className="yellow"><b>Aucune analyse lancée.</b> Ton texte reste exactement comme tu l’as écrit.</p>}

      {feedback && (
        <div className="ministryFeedbackResults" aria-live="polite">
          <div className="ministrySignals">
            <span>{feedback.signals.wordCount} mots</span>
            <span>{feedback.signals.paragraphCount} paragraphes</span>
            <span>{feedback.signals.sentenceCount} phrases ou segments</span>
            <span>{feedback.signals.relationMarkerCount} marqueurs différents</span>
          </div>

          {feedback.strengths.length > 0 && (
            <div className="card green">
              <h4>Ce qui est déjà visible</h4>
              {feedback.strengths.map((item) => <p key={item}>{item}</p>)}
            </div>
          )}

          {feedback.improvements.length > 0 && (
            <div className="card yellow">
              <h4>À relire en priorité</h4>
              {feedback.improvements.map((item) => <p key={item}>{item}</p>)}
            </div>
          )}

          <div className="card ministryNextStep">
            <h4>Prochaine action</h4>
            <p>{feedback.nextStep}</p>
          </div>

          <div className="ministryCriterionGrid">
            {feedback.criteria.map((criterion) => (
              <details className={`card ${criterion.state}`} key={criterion.id}>
                <summary>
                  <b>{criterion.label}</b>
                  <span>{stateLabel(criterion.state)}</span>
                </summary>
                <p>{criterion.summary}</p>
                <h5>Indices observés</h5>
                <ul>{criterion.evidence.map((item) => <li key={item}>{item}</li>)}</ul>
                <h5>Révision à faire par l’élève</h5>
                <ul>{criterion.actions.map((item) => <li key={item}>{item}</li>)}</ul>
              </details>
            ))}
          </div>

          <p className="smallText"><b>Limite :</b> l’application ne peut pas confirmer la justesse complète des idées, du vocabulaire, de la syntaxe ou de l’orthographe. Elle indique seulement des zones à relire.</p>
        </div>
      )}
    </section>
  );
}
