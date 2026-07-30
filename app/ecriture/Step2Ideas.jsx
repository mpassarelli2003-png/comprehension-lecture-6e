function hasStudentIdeaContent(ideas) {
  return (ideas || []).some((row) => String(row?.know || "").trim() || String(row?.say || "").trim() || String(row?.proof || "").trim());
}

export default function Step2Ideas({ writingBrief, ideas, updateIdea, prepareIdeasFromConsigne, filledIdeas, ideasWithProof, readyForPlan }) {
  function safePrepareIdeas() {
    if (hasStudentIdeaContent(ideas)) {
      const confirmReplace = window.confirm("Tu as déjà écrit des idées. Veux-tu vraiment les remplacer par des idées préparées à partir de la consigne synchronisée ?");
      if (!confirmReplace) return;
    }
    prepareIdeasFromConsigne();
  }

  return (
    <div>
      <h2>Étape 2 — Je prépare mes idées</h2>
      <div className="card yellow"><b>But de cette étape</b><p>Transforme la consigne synchronisée en idées utilisables sans perdre le destinataire ni le but.</p></div>
      <div className="card green"><b>Méthode 3 cases</b><p><b>1. Information du texte :</b> un fait, un événement ou un exemple.</p><p><b>2. Idée avec mes mots :</b> ce que je veux faire comprendre au destinataire.</p><p><b>3. Preuve :</b> un détail précis qui soutient mon idée.</p></div>

      <div className="card">
        <b>Rappel du contrat</b>
        <p><b>Type :</b> {writingBrief.type}</p>
        <p><b>Destinataire :</b> {writingBrief.audience}</p>
        <p><b>But :</b> {writingBrief.purpose}</p>
        <p><b>Consigne :</b> {writingBrief.task}</p>
        <b>Je dois penser à :</b>
        <ul>{writingBrief.required.map((item) => <li key={item}>{item}</li>)}</ul>
        <button className="green" onClick={safePrepareIdeas}>Préparer mes 3 idées à partir de la consigne</button>
        <p className="yellow"><b>Sécurité :</b> une confirmation est demandée avant de remplacer des idées existantes.</p>
      </div>

      <div className="card"><b>Validation rapide avant le plan</b><p>Idées commencées : <b>{filledIdeas}</b> / 3</p><p>Idées avec preuve : <b>{ideasWithProof}</b> / 3</p><p className={readyForPlan ? "green" : "yellow"}><b>{readyForPlan ? "Prêt pour le plan." : "À compléter."}</b></p></div>

      {ideas.map((row, index) => (
        <div className="card" key={index}>
          <h3>{row.role || `Idée ${index + 1}`}</h3>
          <label>1. Information du texte que je peux utiliser</label>
          <input value={row.know} onChange={(event) => updateIdea(index, "know", event.target.value)} placeholder="Ex. Le texte dit que..." />
          <label>2. Mon idée avec mes mots</label>
          <input value={row.say} onChange={(event) => updateIdea(index, "say", event.target.value)} placeholder={`Ex. Pour ${writingBrief.purpose}, je veux montrer que...`} />
          <label>3. Preuve ou exemple précis du texte</label>
          <input value={row.proof} onChange={(event) => updateIdea(index, "proof", event.target.value)} placeholder="Ex. Dans le texte, on voit que..." />
        </div>
      ))}
    </div>
  );
}
