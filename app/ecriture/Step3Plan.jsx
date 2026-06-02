function buildPlanFromIdeas(ideas, preciseSituation, situation) {
  const idea1 = ideas?.[0] || {};
  const idea2 = ideas?.[1] || {};
  const idea3 = ideas?.[2] || {};
  const isOpinion = (preciseSituation?.suggestedType || situation?.id) === "opinion";
  const isReaction = (preciseSituation?.suggestedType || situation?.id) === "reaction";

  return {
    intro: isOpinion
      ? `Sujet : ${preciseSituation?.task || ""}\nMon opinion : ${idea1.say || "Je pense que..."}`
      : isReaction
        ? `Titre du texte : ${preciseSituation?.task || ""}\nMa réaction générale : ${idea1.say || "J’ai réagi parce que..."}`
        : `Sujet à expliquer : ${preciseSituation?.task || ""}\nCe que je vais expliquer : ${idea1.say || "Je vais expliquer que..."}`,
    dev1: `Idée 1 : ${idea2.say || idea1.say || ""}\nInformation du texte : ${idea2.know || idea1.know || ""}\nPreuve ou exemple : ${idea2.proof || idea1.proof || ""}\nLien avec la consigne : Cette idée aide à répondre parce que...`,
    dev2: `Idée 2 : ${idea3.say || ""}\nInformation du texte : ${idea3.know || ""}\nPreuve ou exemple : ${idea3.proof || ""}\nLien avec la consigne : Cette idée complète ma réponse parce que...`,
    conclusion: isOpinion
      ? "Je rappelle mon opinion : ...\nJe termine avec une phrase qui fait réfléchir le lecteur."
      : isReaction
        ? "Je résume ma réaction : ...\nJe termine en disant ce que le texte m’a fait comprendre."
        : "Je résume l’explication principale : ...\nJe termine avec une idée importante à retenir."
  };
}

export default function Step3Plan({ situation, preciseSituation, ideas, plan, setPlan, readyForPlan }) {
  const introOk = plan.intro.trim().length > 0;
  const dev1Ok = plan.dev1.trim().length > 0;
  const dev2Ok = plan.dev2.trim().length > 0;
  const conclusionOk = plan.conclusion.trim().length > 0;
  const completeCount = [introOk, dev1Ok, dev2Ok, conclusionOk].filter(Boolean).length;

  function fillPlan() {
    setPlan(buildPlanFromIdeas(ideas, preciseSituation, situation));
  }

  return (
    <div>
      <h2>Étape 3 — Je construis mon plan</h2>

      <div className="card yellow">
        <b>But de cette étape</b>
        <p>Le plan sert à placer tes idées avant d’écrire. Il t’aide à répondre à la consigne, à éviter les répétitions et à garder un ordre logique.</p>
      </div>

      <div className="card green">
        <b>Méthode orthopédagogique : 1 idée par bloc</b>
        <p><b>Introduction :</b> je présente le sujet et ce que je vais dire.</p>
        <p><b>Développement 1 :</b> je développe ma première idée avec une preuve.</p>
        <p><b>Développement 2 :</b> je développe ma deuxième idée avec une preuve.</p>
        <p><b>Conclusion :</b> je rappelle l’idée importante sans ajouter un nouveau sujet.</p>
      </div>

      <div className="card">
        <b>Consigne à garder en tête</b>
        <p>{preciseSituation.task}</p>
        <b>Plan suggéré pour : {situation.title}</b>
        {situation.plan.map((item) => <p key={item}>{item}</p>)}
      </div>

      <div className="card">
        <b>Mes idées de l’étape 2</b>
        {ideas.map((idea, index) => (
          <p key={index}><b>{idea.role || `Idée ${index + 1}`} :</b> {idea.say || "À compléter"} {idea.proof ? `— preuve : ${idea.proof}` : ""}</p>
        ))}
        <button className="green" onClick={fillPlan}>Transformer mes idées en plan</button>
        {!readyForPlan && <p className="yellow"><b>Attention :</b> ton plan sera meilleur si tu complètes au moins 2 idées et 1 preuve à l’étape 2.</p>}
      </div>

      <div className="card">
        <b>Validation du plan</b>
        <p>Parties commencées : <b>{completeCount}</b> / 4</p>
        <p className={completeCount === 4 ? "green" : "yellow"}><b>{completeCount === 4 ? "Plan complet." : "Plan à compléter."}</b> Avant le brouillon, vise les 4 parties du texte.</p>
      </div>

      <label>Introduction : sujet + intention + opinion ou idée principale</label>
      <textarea value={plan.intro} onChange={(e) => setPlan({...plan, intro: e.target.value})} placeholder="J’annonce le sujet. Je dis ce que je vais expliquer, défendre ou apprécier." />

      <label>Développement 1 : première idée + preuve</label>
      <textarea value={plan.dev1} onChange={(e) => setPlan({...plan, dev1: e.target.value})} placeholder="J’écris ma première idée. J’ajoute une preuve ou un exemple du texte." />

      <label>Développement 2 : deuxième idée + preuve</label>
      <textarea value={plan.dev2} onChange={(e) => setPlan({...plan, dev2: e.target.value})} placeholder="J’écris ma deuxième idée. J’ajoute une preuve ou un exemple du texte." />

      <label>Conclusion : rappel + phrase finale</label>
      <textarea value={plan.conclusion} onChange={(e) => setPlan({...plan, conclusion: e.target.value})} placeholder="Je rappelle l’idée principale. Je termine sans ajouter une nouvelle idée." />
    </div>
  );
}
