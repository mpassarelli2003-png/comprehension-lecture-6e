function buildPlanFromIdeas(ideas, writingBrief) {
  const idea1 = ideas?.[0] || {};
  const idea2 = ideas?.[1] || {};
  const idea3 = ideas?.[2] || {};
  const isOpinion = writingBrief.typeId === "opinion";
  const isReaction = writingBrief.typeId === "reaction";

  return {
    intro: isOpinion
      ? `Destinataire : ${writingBrief.audience}\nSujet : ${writingBrief.sourceTitle}\nMon opinion : ${idea1.say || "Je pense que..."}`
      : isReaction
        ? `Titre du texte : ${writingBrief.sourceTitle}\nMa réaction générale : ${idea1.say || "J’ai réagi parce que..."}`
        : `Sujet à expliquer : ${writingBrief.sourceTitle}\nCe que je vais expliquer : ${idea1.say || "Je vais expliquer que..."}`,
    dev1: `Idée 1 : ${idea2.say || idea1.say || ""}\nInformation du texte : ${idea2.know || idea1.know || ""}\nPreuve ou exemple : ${idea2.proof || idea1.proof || ""}\nLien avec le but : Cette idée aide à ${writingBrief.purpose} parce que...`,
    dev2: `Idée 2 : ${idea3.say || ""}\nInformation du texte : ${idea3.know || ""}\nPreuve ou exemple : ${idea3.proof || ""}\nLien avec le but : Cette idée complète mon texte parce que...`,
    conclusion: isOpinion
      ? "Je rappelle mon opinion : ...\nJe termine avec une recommandation, un appel à l’action ou une phrase forte."
      : isReaction
        ? "Je résume ma réaction : ...\nJe termine en disant ce que le texte m’a fait comprendre ou retenir."
        : "Je résume l’explication principale : ...\nJe termine avec l’idée importante à retenir."
  };
}

function hasPlanContent(plan) {
  return [plan.intro, plan.dev1, plan.dev2, plan.conclusion].some((part) => String(part || "").trim());
}

export default function Step3Plan({ writingBrief, ideas, plan, setPlan, readyForPlan }) {
  const parts = ["intro", "dev1", "dev2", "conclusion"];
  const completeCount = parts.filter((key) => String(plan[key] || "").trim()).length;

  function fillPlan() {
    if (hasPlanContent(plan)) {
      const confirmReplace = window.confirm("Tu as déjà écrit dans ton plan. Veux-tu vraiment le remplacer par un plan synchronisé avec le type de texte et tes idées ?");
      if (!confirmReplace) return;
    }
    setPlan(buildPlanFromIdeas(ideas, writingBrief));
  }

  return (
    <div>
      <h2>Étape 3 — Je construis mon plan</h2>
      <div className="card yellow"><b>But de cette étape</b><p>Le plan doit suivre le type de texte, la consigne, le destinataire et le but affichés dans le contrat d’écriture.</p></div>

      <div className="card green">
        <b>Plan synchronisé pour : {writingBrief.type}</b>
        {writingBrief.plan.map((part) => <p key={part.id}><b>{part.label} :</b> {part.instruction}</p>)}
      </div>

      <div className="card">
        <b>Consigne à garder en tête</b>
        <p>{writingBrief.task}</p>
        <p><b>Destinataire :</b> {writingBrief.audience}</p>
        <p><b>But :</b> {writingBrief.purpose}</p>
      </div>

      <div className="card">
        <b>Mes idées de l’étape 2</b>
        {ideas.map((idea, index) => <p key={index}><b>{idea.role || `Idée ${index + 1}`} :</b> {idea.say || "À compléter"} {idea.proof ? `— preuve : ${idea.proof}` : ""}</p>)}
        <button className="green" onClick={fillPlan}>Transformer mes idées en plan synchronisé</button>
        <p className="yellow"><b>Sécurité :</b> l’application demande une confirmation avant de remplacer un plan déjà commencé.</p>
        {!readyForPlan && <p className="yellow"><b>Attention :</b> complète au moins 2 idées et 1 preuve à l’étape 2.</p>}
      </div>

      <div className="card">
        <b>Validation du plan</b>
        <p>Parties commencées : <b>{completeCount}</b> / 4</p>
        <p className={completeCount === 4 ? "green" : "yellow"}><b>{completeCount === 4 ? "Plan complet." : "Plan à compléter."}</b></p>
      </div>

      {writingBrief.plan.map((part) => (
        <div key={part.id}>
          <label>{part.label} — {part.instruction}</label>
          <textarea
            value={plan[part.id] || ""}
            onChange={(event) => setPlan({ ...plan, [part.id]: event.target.value })}
            placeholder={part.instruction}
          />
        </div>
      ))}
    </div>
  );
}
