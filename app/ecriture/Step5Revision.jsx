import { revisionCheckKey, successCheckKey } from "../../lib/writingSynchronization";
import WritingMinistryFeedbackPanel from "./WritingMinistryFeedbackPanel";

function paragraphCount(text) {
  return String(text || "").split(/\n\s*\n/).map((paragraph) => paragraph.trim()).filter(Boolean).length;
}

function hasAny(text, words) {
  const lower = String(text || "").toLowerCase();
  return words.some((word) => lower.includes(word.toLowerCase()));
}

export default function Step5Revision({ draft, checks, setChecks, writingBrief, plan, wordCount, examMode }) {
  const words = wordCount(draft);
  const paragraphs = paragraphCount(draft);
  const hasTextProofWords = hasAny(draft, ["dans le texte", "par exemple", "on apprend", "le texte dit", "un exemple"]);
  const hasConclusionWords = hasAny(draft, ["en conclusion", "finalement", "pour conclure", "je retiens", "je vous invite"]);
  const checkedRevisionCount = writingBrief.revisionCriteria.filter((item) => checks[revisionCheckKey(writingBrief.typeId, item.id)]).length;
  const checkedSuccessCount = writingBrief.successCriteria.filter((_, index) => checks[successCheckKey(writingBrief.typeId, index)]).length;

  return (
    <div>
      <h2>Étape 5 — Je révise mes idées et mon texte</h2>
      <div className="card yellow"><b>But de cette étape</b><p>Je vérifie d’abord les cinq critères ministériels, puis les exigences propres à mon type de texte, à mon destinataire, à mon but et à ma consigne.</p></div>

      <div className="card">
        <b>Consigne à vérifier</b>
        <p>{writingBrief.task}</p>
        <p><b>Destinataire :</b> {writingBrief.audience}</p>
        <p><b>But :</b> {writingBrief.purpose}</p>
      </div>

      <div className="card">
        <b>Tableau de bord de révision</b>
        <p>Mots : <b>{words}</b> / {writingBrief.minimumWords}</p>
        <p>Paragraphes : <b>{paragraphs}</b> / {writingBrief.minimumParagraphs}</p>
        <p>Indices de preuve : <b>{hasTextProofWords ? "oui" : "à vérifier"}</b></p>
        <p>Conclusion repérée : <b>{hasConclusionWords ? "oui" : "à vérifier"}</b></p>
        <p>Critères de révision répondus : <b>{checkedRevisionCount}</b> / {writingBrief.revisionCriteria.length}</p>
        <p>Critères de réussite confirmés : <b>{checkedSuccessCount}</b> / {writingBrief.successCriteria.length}</p>
      </div>

      <WritingMinistryFeedbackPanel
        draft={draft}
        writingBrief={writingBrief}
        examMode={examMode}
        checks={checks}
        setChecks={setChecks}
      />

      <div className="card">
        <h3>Révision propre au type de texte</h3>
        <p>Ces questions complètent les cinq critères ministériels en tenant compte de la consigne actuelle.</p>
      </div>

      {writingBrief.revisionCriteria.map((item) => {
        const key = revisionCheckKey(writingBrief.typeId, item.id);
        return (
          <div className="card" key={item.id}>
            <h3>{item.title}</h3>
            <p>{item.instruction}</p>
            {item.choices.map((choice) => (
              <label className="choiceLine" key={choice}>
                <input type="radio" name={key} checked={checks[key] === choice} onChange={() => setChecks({ ...checks, [key]: choice })} />
                <span>{choice}</span>
              </label>
            ))}
          </div>
        );
      })}

      <div className="card green">
        <h3>Critères de réussite — {writingBrief.type}</h3>
        <p>Coche chaque critère seulement après l’avoir vérifié dans ton brouillon.</p>
        {writingBrief.successCriteria.map((criterion, index) => {
          const key = successCheckKey(writingBrief.typeId, index);
          return (
            <label className="choiceLine" key={criterion}>
              <input type="checkbox" checked={Boolean(checks[key])} onChange={() => setChecks({ ...checks, [key]: !checks[key] })} />
              <span>{criterion}</span>
            </label>
          );
        })}
      </div>

      <div className="card yellow"><b>Actions de révision possibles</b><ul><li>Ajoute une preuve du texte.</li><li>Ajoute une phrase qui explique le lien avec le but.</li><li>Adapte le ton au destinataire.</li><li>Replace une idée dans la bonne partie du plan.</li><li>Renforce la conclusion selon le type de texte.</li></ul></div>

      <details className="card"><summary>Voir mon plan pour comparer</summary>{writingBrief.plan.map((part) => <p key={part.id}><b>{part.label} :</b> {plan[part.id] || "À compléter"}</p>)}</details>
    </div>
  );
}
