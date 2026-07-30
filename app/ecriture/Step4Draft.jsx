function buildDraftFromPlan(plan) {
  return [plan.intro, plan.dev1, plan.dev2, plan.conclusion]
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join("\n\n");
}

function sentenceCount(text) {
  return String(text || "").split(/[.!?]+/).map((sentence) => sentence.trim()).filter(Boolean).length;
}

function paragraphCount(text) {
  return String(text || "").split(/\n\s*\n/).map((paragraph) => paragraph.trim()).filter(Boolean).length;
}

export default function Step4Draft({ writingBrief, plan, draft, setDraft, insertInDraft, wordCount }) {
  const words = wordCount(draft);
  const paragraphs = paragraphCount(draft);
  const sentences = sentenceCount(draft);
  const hasPlan = [plan.intro, plan.dev1, plan.dev2, plan.conclusion].some((part) => String(part || "").trim());
  const hasEnoughParagraphs = paragraphs >= writingBrief.minimumParagraphs;
  const hasEnoughWords = words >= writingBrief.minimumWords;

  function usePlanAsDraft() {
    const planText = buildDraftFromPlan(plan);
    if (!planText) return;
    setDraft((old) => old.trim() ? `${old.trim()}\n\n${planText}` : planText);
  }

  return (
    <div>
      <h2>Étape 4 — J’écris mon brouillon</h2>
      <div className="card yellow"><b>But de cette étape</b><p>Transforme le plan synchronisé en phrases complètes adaptées au destinataire et au but.</p></div>

      <div className="card">
        <b>Contrat à respecter</b>
        <p><b>Type :</b> {writingBrief.type}</p>
        <p><b>Destinataire :</b> {writingBrief.audience}</p>
        <p><b>But :</b> {writingBrief.purpose}</p>
        <p><b>Consigne :</b> {writingBrief.task}</p>
        <ul>{writingBrief.required.map((item) => <li key={item}>{item}</li>)}</ul>
      </div>

      <div className="card">
        <b>Mon plan de l’étape 3</b>
        {writingBrief.plan.map((part) => <p key={part.id}><b>{part.label} :</b> {plan[part.id] || "À compléter"}</p>)}
        <button className="green" onClick={usePlanAsDraft} disabled={!hasPlan}>Utiliser mon plan comme base du brouillon</button>
        {!hasPlan && <p className="yellow"><b>À faire :</b> complète d’abord ton plan à l’étape 3.</p>}
      </div>

      <div className="card">
        <b>Banque de phrases pour : {writingBrief.type}</b>
        <p>Ces débuts de phrase changent automatiquement avec le type de texte.</p>
        {writingBrief.starters.map((starter) => <button key={starter} onClick={() => insertInDraft(starter)}>{starter}</button>)}
      </div>

      <details className="card"><summary>Connecteurs pour organiser mes idées</summary>{["D’abord", "Ensuite", "De plus", "Par exemple", "Cependant", "Donc", "Finalement", "En conclusion"].map((connector) => <button key={connector} onClick={() => insertInDraft(connector)}>{connector}</button>)}</details>
      <details className="card"><summary>Débuts de phrases pour expliquer une preuve</summary>{["Dans le texte, on apprend que...", "Un exemple qui le montre est...", "Cela prouve que...", "Cela signifie que...", "Ce détail est important parce que..."].map((starter) => <button key={starter} onClick={() => insertInDraft(starter)}>{starter}</button>)}</details>

      <div className="card">
        <b>Tableau de bord du brouillon</b>
        <p>Mots : <b>{words}</b> / cible minimale {writingBrief.minimumWords}</p>
        <p>Paragraphes : <b>{paragraphs}</b> / cible minimale {writingBrief.minimumParagraphs}</p>
        <p>Phrases approximatives : <b>{sentences}</b></p>
        <p className={hasEnoughParagraphs && hasEnoughWords ? "green" : "yellow"}><b>{hasEnoughParagraphs && hasEnoughWords ? "Brouillon bien avancé." : "Brouillon à développer."}</b></p>
      </div>

      <label>Mon brouillon</label>
      <textarea style={{ minHeight: 520 }} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={`Écris un ${writingBrief.type.toLowerCase()} destiné à ${writingBrief.audience}.`} />
    </div>
  );
}
