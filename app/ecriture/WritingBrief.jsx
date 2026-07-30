export default function WritingBrief({ writingBrief, alignmentWarning, onConfirmAlignment }) {
  return (
    <section className="card writingContract" aria-label="Contrat d’écriture synchronisé">
      <p className="eyebrow">Contrat d’écriture synchronisé</p>
      <h2>{writingBrief.type}</h2>

      {alignmentWarning && (
        <div className="statusBox warningBox" role="alert">
          <b>Le texte source ou le type de texte a changé.</b>
          <p>Les anciennes idées, le plan et le brouillon ont été conservés. Vérifie qu’ils respectent maintenant la nouvelle consigne avant de poursuivre.</p>
          <button className="blue" onClick={onConfirmAlignment}>J’ai vérifié l’alignement</button>
        </div>
      )}

      <div className="writingChain">
        <div><b>1. Type</b><span>{writingBrief.type}</span></div>
        <div><b>2. Consigne</b><span>{writingBrief.task}</span></div>
        <div><b>3. Destinataire</b><span>{writingBrief.audience}</span></div>
        <div><b>4. But</b><span>{writingBrief.purpose}</span></div>
      </div>

      <details className="card writingContractDetails">
        <summary><b>5. Plan, 6. grille de révision et 7. critères de réussite</b></summary>
        <h3>Plan attendu</h3>
        <ol>{writingBrief.plan.map((part) => <li key={part.id}><b>{part.label} :</b> {part.instruction}</li>)}</ol>
        <h3>Grille de révision</h3>
        <ol>{writingBrief.revisionCriteria.map((criterion) => <li key={criterion.id}>{criterion.title.replace(/^\d+\.\s*/, "")}</li>)}</ol>
        <h3>Critères de réussite</h3>
        <ul>{writingBrief.successCriteria.map((criterion) => <li key={criterion}>{criterion}</li>)}</ul>
      </details>
    </section>
  );
}
