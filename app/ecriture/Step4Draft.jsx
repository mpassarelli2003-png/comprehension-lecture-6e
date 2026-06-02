function buildDraftFromPlan(plan) {
  const parts = [plan.intro, plan.dev1, plan.dev2, plan.conclusion]
    .map((part) => String(part || "").trim())
    .filter(Boolean);
  return parts.join("\n\n");
}

function sentenceCount(text) {
  return String(text || "").split(/[.!?]+/).map((s) => s.trim()).filter(Boolean).length;
}

function paragraphCount(text) {
  return String(text || "").split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean).length;
}

export default function Step4Draft({ situation, preciseSituation, plan, draft, setDraft, insertInDraft, wordCount }) {
  const words = wordCount(draft);
  const paragraphs = paragraphCount(draft);
  const sentences = sentenceCount(draft);
  const hasPlan = [plan.intro, plan.dev1, plan.dev2, plan.conclusion].some((part) => String(part || "").trim());
  const hasEnoughParagraphs = paragraphs >= 3;
  const hasEnoughWords = words >= 80;

  function usePlanAsDraft() {
    const planText = buildDraftFromPlan(plan);
    if (!planText) return;
    setDraft((old) => old.trim() ? `${old.trim()}\n\n${planText}` : planText);
  }

  return (
    <div>
      <h2>Étape 4 — J’écris mon brouillon</h2>

      <div className="card yellow">
        <b>But de cette étape</b>
        <p>Le brouillon sert à transformer ton plan en phrases complètes. Tu n’as pas besoin d’être parfait tout de suite : tu écris d’abord tes idées, puis tu corrigeras aux étapes suivantes.</p>
      </div>

      <div className="card green">
        <b>Méthode orthopédagogique : P-I-E</b>
        <p><b>P — Point :</b> j’annonce mon idée.</p>
        <p><b>I — Information :</b> j’ajoute une preuve, un exemple ou une information du texte.</p>
        <p><b>E — Explication :</b> j’explique le lien avec la consigne.</p>
      </div>

      <div className="card">
        <b>Consigne à garder en tête</b>
        <p>{preciseSituation.task}</p>
        <b>Je dois inclure :</b>
        <ul>{preciseSituation.required.map((item) => <li key={item}>{item}</li>)}</ul>
      </div>

      <div className="card">
        <b>Mon plan de l’étape 3</b>
        <p><b>Introduction :</b> {plan.intro || "À compléter"}</p>
        <p><b>Développement 1 :</b> {plan.dev1 || "À compléter"}</p>
        <p><b>Développement 2 :</b> {plan.dev2 || "À compléter"}</p>
        <p><b>Conclusion :</b> {plan.conclusion || "À compléter"}</p>
        <button className="green" onClick={usePlanAsDraft} disabled={!hasPlan}>Utiliser mon plan comme base du brouillon</button>
        {!hasPlan && <p className="yellow"><b>À faire :</b> complète d’abord ton plan à l’étape 3.</p>}
      </div>

      <div className="card">
        <b>Banque de phrases utiles</b>
        <p>Choisis seulement les phrases qui t’aident. Tu peux les modifier.</p>
        {situation.starters.map((s) => <button key={s} onClick={() => insertInDraft(s)}>{s}</button>)}
      </div>

      <details className="card">
        <summary>Connecteurs pour organiser mes idées</summary>
        {["D’abord", "Ensuite", "De plus", "Par exemple", "Cependant", "Donc", "Finalement", "En conclusion"].map((c) => <button key={c} onClick={() => insertInDraft(c)}>{c}</button>)}
      </details>

      <details className="card">
        <summary>Débuts de phrases pour expliquer une preuve</summary>
        {["Dans le texte, on apprend que...", "Un exemple qui le montre est...", "Cela prouve que...", "Cela signifie que...", "Ce détail est important parce que..."].map((s) => <button key={s} onClick={() => insertInDraft(s)}>{s}</button>)}
      </details>

      <div className="card">
        <b>Tableau de bord du brouillon</b>
        <p>Mots : <b>{words}</b></p>
        <p>Paragraphes : <b>{paragraphs}</b></p>
        <p>Phrases approximatives : <b>{sentences}</b></p>
        <p className={hasEnoughParagraphs && hasEnoughWords ? "green" : "yellow"}>
          <b>{hasEnoughParagraphs && hasEnoughWords ? "Brouillon bien avancé." : "Brouillon à développer."}</b> Vise au moins 3 paragraphes et un texte assez développé pour répondre à la consigne.
        </p>
      </div>

      <label>Mon brouillon</label>
      <textarea
        style={{minHeight: 520}}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Écris ton brouillon ici. Commence par ton idée, ajoute une preuve du texte, puis explique le lien avec la consigne."
      />
    </div>
  );
}
