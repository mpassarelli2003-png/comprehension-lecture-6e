function hasStudentIdeaContent(ideas) {
  return (ideas || []).some((row) =>
    String(row?.know || "").trim() ||
    String(row?.say || "").trim() ||
    String(row?.proof || "").trim()
  );
}

export default function Step2Ideas({ preciseSituation, ideas, updateIdea, prepareIdeasFromConsigne, filledIdeas, ideasWithProof, readyForPlan }) {
  function safePrepareIdeas() {
    if (hasStudentIdeaContent(ideas)) {
      const confirmReplace = window.confirm("Tu as déjà écrit des idées. Veux-tu vraiment les remplacer par des idées préparées à partir de la consigne ?");
      if (!confirmReplace) return;
    }
    prepareIdeasFromConsigne();
  }

  return (
    <div>
      <h2>Étape 2 — Je prépare mes idées</h2>

      <div className="card yellow">
        <b>But de cette étape</b>
        <p>Avant d’écrire, transforme la consigne en idées utilisables. À l’épreuve, cela t’aide à éviter le hors-sujet et à ne pas oublier les preuves du texte.</p>
      </div>

      <div className="card green">
        <b>Méthode 3 cases</b>
        <p><b>1. Information du texte :</b> ce que le texte donne comme fait, événement ou exemple.</p>
        <p><b>2. Idée avec mes mots :</b> ce que tu veux faire comprendre au lecteur.</p>
        <p><b>3. Preuve :</b> un détail précis du texte qui soutient ton idée.</p>
      </div>

      <div className="card">
        <b>Rappel de la consigne</b>
        <p>{preciseSituation.task}</p>
        <b>Je dois penser à :</b>
        <ul>{preciseSituation.required.map((item) => <li key={item}>{item}</li>)}</ul>
        <button className="green" onClick={safePrepareIdeas}>Préparer mes 3 idées à partir de la consigne</button>
        <p className="yellow"><b>Sécurité :</b> si tu as déjà écrit dans les cases, l’application demandera une confirmation avant de remplacer tes idées.</p>
      </div>

      <div className="card">
        <b>Validation rapide avant de passer au plan</b>
        <p>Idées commencées : <b>{filledIdeas}</b> / 3</p>
        <p>Idées avec preuve ou exemple : <b>{ideasWithProof}</b> / 3</p>
        <p className={readyForPlan ? "green" : "yellow"}><b>{readyForPlan ? "Prêt pour le plan." : "À compléter."}</b> Pour être prêt, vise au moins 2 idées et au moins 1 preuve du texte.</p>
      </div>

      {ideas.map((row, i) => <div className="card" key={i}>
        <h3>{row.role || `Idée ${i + 1}`}</h3>
        <label>1. Information du texte que je peux utiliser</label>
        <input value={row.know} onChange={(e) => updateIdea(i, "know", e.target.value)} placeholder="Ex. Le texte dit que... / Le personnage fait... / On apprend que..." />
        <label>2. Mon idée avec mes mots</label>
        <input value={row.say} onChange={(e) => updateIdea(i, "say", e.target.value)} placeholder="Ex. Je veux expliquer que... / Je pense que... / Cela montre que..." />
        <label>3. Preuve ou exemple précis du texte</label>
        <input value={row.proof} onChange={(e) => updateIdea(i, "proof", e.target.value)} placeholder="Ex. Dans le texte, on voit que... / Un exemple est..." />
      </div>)}
    </div>
  );
}
