"use client";

import { useEffect, useMemo, useState } from "react";
import baseExercises from "../data/exercises";
import moreExercises from "../data/moreExercises";
import genesisExercise from "../data/genesisExercise";

const texts = [...baseExercises, ...moreExercises, genesisExercise];
const STORAGE_KEY = "lecture6e_writing_practice_v2";
const OLD_KEY = "lecture6e_writing_practice_v1";

const writingSituations = [
  {
    id: "opinion",
    title: "Texte d’opinion",
    plan: ["Introduction : je présente le sujet et mon opinion.", "Développement 1 : je donne une première raison et un exemple.", "Développement 2 : je donne une deuxième raison et un exemple.", "Conclusion : je rappelle mon opinion et je termine avec une phrase forte."],
    starters: ["Selon moi, ...", "Je pense que ...", "Ma première raison est que ...", "Par exemple, dans le texte, ...", "De plus, ...", "En conclusion, ..."]
  },
  {
    id: "explicatif",
    title: "Texte explicatif",
    plan: ["Introduction : je présente ce que je vais expliquer.", "Développement 1 : j’explique un premier aspect.", "Développement 2 : j’explique un deuxième aspect.", "Conclusion : je résume l’explication principale."],
    starters: ["Ce texte permet de comprendre que ...", "Un premier élément important est ...", "Cela signifie que ...", "Un autre aspect est ...", "Par exemple, ...", "Pour conclure, ..."]
  },
  {
    id: "reaction",
    title: "Réaction ou appréciation",
    plan: ["Introduction : je nomme le texte et ma réaction générale.", "Développement 1 : j’explique un élément que j’ai aimé, moins aimé ou trouvé important.", "Développement 2 : j’appuie mon idée avec un exemple du texte.", "Conclusion : je résume mon appréciation."],
    starters: ["J’ai réagi à ce texte parce que ...", "J’ai trouvé intéressant que ...", "Un passage important est ...", "Cela m’a fait penser à ...", "Je recommande / je ne recommande pas ce texte parce que ..."]
  }
];

const preciseWritingSituations = {
  "Les aurores boréales": {
    type: "Texte explicatif",
    audience: "des élèves de 5e année qui préparent une activité scientifique",
    purpose: "expliquer clairement un phénomène naturel",
    task: "Après avoir lu « Les aurores boréales », écris un texte explicatif pour répondre à la question suivante : comment peut-on expliquer simplement ce que sont les aurores boréales et pourquoi elles fascinent les gens ?",
    required: ["Décris ce qu’est une aurore boréale.", "Explique au moins deux éléments importants du phénomène.", "Utilise des informations du texte source.", "Termine en expliquant pourquoi ce phénomène peut impressionner les gens."],
    suggestedType: "explicatif"
  },
  "M. Vadeboncoeur": {
    type: "Réaction ou appréciation",
    audience: "ton enseignante ou ton enseignant",
    purpose: "montrer ce que tu as compris d’un personnage et de son rôle dans le récit",
    task: "Après avoir lu « M. Vadeboncoeur », écris un court texte pour expliquer si tu trouves que ce personnage est important dans l’histoire. Appuie ton point de vue avec des exemples du texte.",
    required: ["Présente ton opinion sur le personnage.", "Explique au moins deux traits ou actions du personnage.", "Ajoute un exemple du texte.", "Termine par une appréciation personnelle."],
    suggestedType: "reaction"
  },
  "Mille et un flocons": {
    type: "Texte d’opinion",
    audience: "les élèves de ta classe",
    purpose: "donner ton opinion sur l’hiver ou sur un aspect du texte",
    task: "Après avoir lu « Mille et un flocons », écris un texte d’opinion pour répondre à la question suivante : l’hiver est-il surtout une saison agréable ou difficile ? Utilise des éléments du texte pour appuyer ton opinion.",
    required: ["Présente clairement ton opinion.", "Donne deux raisons.", "Utilise au moins un exemple du texte.", "Ajoute une courte conclusion."],
    suggestedType: "opinion"
  },
  "Pattes dans l’eau": {
    type: "Réaction ou appréciation",
    audience: "un ami qui n’a pas lu le texte",
    purpose: "expliquer ta réaction à une situation vécue par un personnage ou un animal",
    task: "Après avoir lu « Pattes dans l’eau », écris un texte pour expliquer ce que tu as ressenti ou pensé devant la situation présentée. Appuie ta réaction avec des événements précis du texte.",
    required: ["Nomme ta réaction principale.", "Explique ce qui a provoqué cette réaction.", "Utilise deux éléments du texte.", "Termine en disant ce que cette situation t’a fait comprendre."],
    suggestedType: "reaction"
  },
  "Pirouette dans les airs": {
    type: "Réaction ou appréciation",
    audience: "un élève qui aime les récits d’action",
    purpose: "apprécier un moment marquant du texte",
    task: "Après avoir lu « Pirouette dans les airs », écris un texte pour expliquer quel moment du récit t’a semblé le plus marquant. Appuie ton choix avec des détails du texte.",
    required: ["Nomme le moment choisi.", "Explique pourquoi ce moment est marquant.", "Ajoute au moins deux détails du texte.", "Termine par ton appréciation du récit."],
    suggestedType: "reaction"
  },
  "Le surf au Québec": {
    type: "Texte d’opinion",
    audience: "des jeunes qui cherchent une nouvelle activité sportive",
    purpose: "convaincre ou informer sur une activité présentée dans le texte",
    task: "Après avoir lu « Le surf au Québec », écris un texte d’opinion pour répondre à la question suivante : le surf à pagaie est-il une activité intéressante à essayer au Québec ? Appuie ton opinion avec des bienfaits et des exemples du texte.",
    required: ["Présente ton opinion clairement.", "Explique au moins deux bienfaits ou intérêts du surf à pagaie.", "Utilise des informations du texte source.", "Termine par une recommandation."],
    suggestedType: "opinion"
  },
  "La chasse aux noix": {
    type: "Texte explicatif",
    audience: "des élèves plus jeunes qui découvrent le comportement des animaux",
    purpose: "expliquer une stratégie de survie observée dans le texte",
    task: "Après avoir lu « La chasse aux noix », écris un texte explicatif pour montrer comment l’animal du texte se prépare ou s’organise pour répondre à ses besoins. Utilise des exemples précis du texte.",
    required: ["Présente l’animal ou la situation.", "Explique deux comportements importants.", "Utilise des exemples du texte.", "Termine en expliquant pourquoi cette préparation est utile."],
    suggestedType: "explicatif"
  },
  "Le temps des pommes": {
    type: "Texte d’opinion",
    audience: "ta classe ou le journal de l’école",
    purpose: "donner ton opinion sur une activité saisonnière",
    task: "Après avoir lu « Le temps des pommes », écris un texte d’opinion pour répondre à la question suivante : une sortie aux pommes est-elle une activité intéressante à vivre en famille ou avec l’école ? Appuie ton opinion avec des éléments du texte.",
    required: ["Présente ton opinion.", "Donne deux raisons.", "Utilise au moins un détail du texte.", "Termine par une phrase qui résume ton point de vue."],
    suggestedType: "opinion"
  },
  "La légende des ombres chinoises": {
    type: "Texte explicatif",
    audience: "des élèves qui préparent une activité culturelle",
    purpose: "expliquer l’origine ou l’importance d’une tradition artistique",
    task: "Après avoir lu « La légende des ombres chinoises », écris un texte explicatif pour montrer ce que cette légende permet de comprendre sur les ombres chinoises et leur valeur culturelle.",
    required: ["Présente la légende ou la tradition.", "Explique deux éléments importants du texte.", "Utilise des informations du texte source.", "Termine en disant pourquoi cette tradition peut être intéressante."],
    suggestedType: "explicatif"
  },
  "L’avenir de la planète": {
    type: "Texte d’opinion",
    audience: "les jeunes de ton école",
    purpose: "sensibiliser les autres à un enjeu environnemental",
    task: "Après avoir lu « L’avenir de la planète », écris un texte d’opinion pour répondre à la question suivante : les jeunes peuvent-ils vraiment poser des gestes utiles pour protéger la planète ? Appuie ton opinion avec des idées du texte.",
    required: ["Présente clairement ton opinion.", "Donne deux gestes ou raisons.", "Utilise des informations du texte source.", "Termine avec un message d’encouragement ou de sensibilisation."],
    suggestedType: "opinion"
  },
  "Les origines selon la Genèse": {
    type: "Texte d’opinion",
    audience: "un élève qui étudie les récits anciens",
    purpose: "réfléchir au message d’un récit patrimonial",
    task: "Après avoir lu « Les origines selon la Genèse », écris un texte d’opinion pour répondre à la question suivante : ce récit montre-t-il bien que les choix peuvent avoir des conséquences importantes ? Appuie ton opinion avec des événements du récit.",
    required: ["Présente ton opinion.", "Explique deux raisons liées au récit.", "Utilise des exemples comme l’interdit, le serpent, le choix ou les conséquences.", "Termine en expliquant le message que tu retiens."],
    suggestedType: "opinion"
  }
};

const connectors = ["D’abord", "Ensuite", "De plus", "Par exemple", "Cependant", "Donc", "Finalement", "En conclusion"];
const frequentErrors = [
  "J’ai mis une majuscule au début des phrases et aux noms propres.",
  "J’ai mis un point, un point d’interrogation ou un point d’exclamation à la fin des phrases.",
  "J’ai vérifié les accords dans le groupe du nom : déterminant, nom, adjectif.",
  "J’ai trouvé le sujet de chaque verbe et vérifié l’accord du verbe.",
  "J’ai vérifié les homophones fréquents : a/à, son/sont, et/est, on/ont, ces/ses/c’est.",
  "J’ai coupé les phrases trop longues.",
  "J’ai remplacé les répétitions par des synonymes ou des pronoms clairs.",
  "J’ai relu mon texte à voix basse ou dans ma tête pour vérifier qu’il a du sens."
];

function loadDraft() {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || localStorage.getItem(OLD_KEY) || "null"); } catch { return null; }
}

function wordCount(text) {
  return String(text || "").trim().split(/\s+/).filter(Boolean).length;
}

function fallbackSituation(text, situation) {
  return {
    type: situation.title,
    audience: "un élève de 6e année",
    purpose: "répondre clairement à une intention d’écriture liée au texte lu",
    task: `Après avoir lu « ${text?.title || "le texte"} », écris un ${situation.title.toLowerCase()} lié au sujet du texte. Appuie tes idées avec des informations précises du texte source.`,
    required: ["Présente clairement le sujet.", "Développe au moins deux idées.", "Utilise une information du texte source.", "Termine par une courte conclusion."],
    suggestedType: situation.id
  };
}

export default function WritingPage() {
  const [step, setStep] = useState(1);
  const [textId, setTextId] = useState(texts[0]?.id || "");
  const [situationId, setSituationId] = useState("opinion");
  const [audience, setAudience] = useState("un élève de 6e année");
  const [purpose, setPurpose] = useState("répondre clairement à une intention d’écriture liée au texte lu");
  const [ideas, setIdeas] = useState([{ know: "", say: "", proof: "" }, { know: "", say: "", proof: "" }, { know: "", say: "", proof: "" }]);
  const [plan, setPlan] = useState({ intro: "", dev1: "", dev2: "", conclusion: "" });
  const [draft, setDraft] = useState("");
  const [finalText, setFinalText] = useState("");
  const [checks, setChecks] = useState({});
  const [saveStatus, setSaveStatus] = useState("Sauvegarde locale prête.");
  const [ready, setReady] = useState(false);

  const selectedText = texts.find((t) => t.id === textId) || texts[0];
  const situation = writingSituations.find((s) => s.id === situationId) || writingSituations[0];
  const preciseSituation = preciseWritingSituations[selectedText?.title] || fallbackSituation(selectedText, situation);
  const paragraphs = useMemo(() => String(selectedText?.text || "").split("\n").filter(Boolean).slice(0, 8), [selectedText]);

  useEffect(() => {
    const saved = loadDraft();
    if (saved) {
      setStep(saved.step || 1);
      setTextId(saved.textId || texts[0]?.id || "");
      setSituationId(saved.situationId || "opinion");
      setAudience(saved.audience || "un élève de 6e année");
      setPurpose(saved.purpose || "répondre clairement à une intention d’écriture liée au texte lu");
      setIdeas(saved.ideas || ideas);
      setPlan(saved.plan || plan);
      setDraft(saved.draft || "");
      setFinalText(saved.finalText || "");
      setChecks(saved.checks || {});
      setSaveStatus("Travail d’écriture repris automatiquement.");
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ step, textId, situationId, audience, purpose, ideas, plan, draft, finalText, checks, savedAt: new Date().toISOString() }));
    setSaveStatus("Sauvegardé automatiquement sur cet appareil.");
  }, [ready, step, textId, situationId, audience, purpose, ideas, plan, draft, finalText, checks]);

  function updateIdea(index, field, value) {
    setIdeas((old) => old.map((row, i) => i === index ? { ...row, [field]: value } : row));
  }
  function insertInDraft(text) {
    setDraft((old) => old ? `${old}\n${text}` : text);
  }
  function applyPreciseSituation() {
    setSituationId(preciseSituation.suggestedType || situationId);
    setAudience(preciseSituation.audience);
    setPurpose(preciseSituation.purpose);
    setSaveStatus("Situation d’écriture précise appliquée.");
  }
  function clearWritingDraft() {
    if (window.confirm("Effacer le travail d’écriture sauvegardé sur cet appareil ?")) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(OLD_KEY);
      setStep(1); setIdeas([{ know: "", say: "", proof: "" }, { know: "", say: "", proof: "" }, { know: "", say: "", proof: "" }]); setPlan({ intro: "", dev1: "", dev2: "", conclusion: "" }); setDraft(""); setFinalText(""); setChecks({});
      setSaveStatus("Travail d’écriture effacé.");
    }
  }

  return (
    <main className="page">
      <section className="card">
        <h1>Préparation à l’écriture — 6e année</h1>
        <p>Volet guidé pour se pratiquer à l’épreuve d’écriture : comprendre la situation, planifier, rédiger, réviser, corriger et mettre au propre.</p>
        <p className="yellow"><b>{saveStatus}</b></p>
        <button onClick={clearWritingDraft}>Effacer ma sauvegarde d’écriture</button>
      </section>

      <div className="card">
        {[1,2,3,4,5,6,7].map((n) => <button key={n} className={step === n ? "blue" : ""} onClick={() => setStep(n)}>Étape {n}</button>)}
      </div>

      <div className="grid cols">
        <section className="card">
          <h2>Texte source</h2>
          <select value={textId} onChange={(e) => setTextId(e.target.value)}>
            {texts.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
          <p><b>Intention de lecture :</b> {selectedText?.intention}</p>
          <div className="card green"><b>Situation d’écriture précise liée à ce texte</b><p>{preciseSituation.task}</p></div>
          <details className="card" open={step <= 2}>
            <summary><b>Voir le texte ou les passages utiles</b></summary>
            <div className="reader">{paragraphs.map((p, i) => <p key={i}>{p}</p>)}</div>
          </details>
        </section>

        <section className="card">
          {step === 1 && <div>
            <h2>Étape 1 — Je comprends la situation d’écriture</h2>
            <div className="card yellow"><b>Consigne précise :</b><p>{preciseSituation.task}</p></div>
            <p><b>Type de texte suggéré :</b> {preciseSituation.type}</p>
            <button className="green" onClick={applyPreciseSituation}>Utiliser cette situation d’écriture</button>
            <label>Type de texte à pratiquer</label>
            <select value={situationId} onChange={(e) => setSituationId(e.target.value)}>
              {writingSituations.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
            </select>
            <label>À qui j’écris ?</label>
            <input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder={preciseSituation.audience} />
            <label>Pourquoi j’écris ?</label>
            <input value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder={preciseSituation.purpose} />
            <div className="card">
              <b>Dans mon texte, je dois :</b>
              <ul>{preciseSituation.required.map((item) => <li key={item}>{item}</li>)}</ul>
            </div>
            <ul><li>Je repère le sujet précis.</li><li>Je repère mon destinataire.</li><li>Je repère le but de mon texte.</li><li>Je pense aux informations du texte source que je peux réutiliser.</li></ul>
          </div>}

          {step === 2 && <div>
            <h2>Étape 2 — Je prépare mes idées</h2>
            <p>Commence par choisir 2 ou 3 idées que tu pourrais utiliser dans ton texte. Écris seulement des mots-clés ou de petites phrases. Tu développeras tes idées plus tard dans ton brouillon.</p>
            <div className="card yellow"><b>Astuce :</b><p>Une bonne idée répond à la consigne et peut être appuyée par une preuve ou un exemple du texte source.</p></div>
            {ideas.map((row, i) => <div className="card" key={i}>
              <h3>Idée {i + 1}</h3>
              <label>Ce que le texte m’apprend</label><input value={row.know} onChange={(e) => updateIdea(i, "know", e.target.value)} />
              <label>Mon idée avec mes mots</label><input value={row.say} onChange={(e) => updateIdea(i, "say", e.target.value)} />
              <label>Preuve ou exemple du texte</label><input value={row.proof} onChange={(e) => updateIdea(i, "proof", e.target.value)} />
            </div>)}
          </div>}

          {step === 3 && <div>
            <h2>Étape 3 — Je construis mon plan</h2>
            <div className="card yellow"><b>Plan suggéré pour : {situation.title}</b>{situation.plan.map((item) => <p key={item}>{item}</p>)}</div>
            <label>Introduction</label><textarea value={plan.intro} onChange={(e) => setPlan({...plan, intro: e.target.value})} />
            <label>Développement 1</label><textarea value={plan.dev1} onChange={(e) => setPlan({...plan, dev1: e.target.value})} />
            <label>Développement 2</label><textarea value={plan.dev2} onChange={(e) => setPlan({...plan, dev2: e.target.value})} />
            <label>Conclusion</label><textarea value={plan.conclusion} onChange={(e) => setPlan({...plan, conclusion: e.target.value})} />
          </div>}

          {step === 4 && <div>
            <h2>Étape 4 — J’écris mon brouillon</h2>
            <p><b>Compteur approximatif :</b> {wordCount(draft)} mots</p>
            <details className="card"><summary>Banque de débuts de phrases</summary>{situation.starters.map((s) => <button key={s} onClick={() => insertInDraft(s)}>{s}</button>)}</details>
            <details className="card"><summary>Connecteurs</summary>{connectors.map((c) => <button key={c} onClick={() => insertInDraft(c)}>{c}</button>)}</details>
            <textarea style={{minHeight: 460}} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Écris ton brouillon ici. L’application guide, mais n’écrit pas à ta place." />
          </div>}

          {step === 5 && <div>
            <h2>Étape 5 — Je révise mes idées</h2>
            {["Mon texte répond à la consigne précise.", "Mon introduction présente clairement le sujet.", "Chaque paragraphe développe une idée claire.", "J’ai utilisé au moins une information ou un exemple du texte source.", "Mes idées sont placées dans un ordre logique.", "Ma conclusion termine bien le texte."].map((item) => <label key={item} style={{display:"block", margin:"10px 0"}}><input type="checkbox" checked={!!checks[item]} onChange={() => setChecks({...checks, [item]: !checks[item]})} /> {item}</label>)}
          </div>}

          {step === 6 && <div>
            <h2>Étape 6 — Je corrige les erreurs fréquentes</h2>
            {frequentErrors.map((item) => <label key={item} style={{display:"block", margin:"10px 0"}}><input type="checkbox" checked={!!checks[item]} onChange={() => setChecks({...checks, [item]: !checks[item]})} /> {item}</label>)}
            <div className="card yellow"><b>Conseil :</b><p>Corrige une seule catégorie à la fois. Par exemple : d’abord les points, ensuite les accords, ensuite les homophones.</p></div>
          </div>}

          {step === 7 && <div>
            <h2>Étape 7 — Je mets au propre</h2>
            <p>Copie ici ta version finale après révision et correction.</p>
            <p><b>Compteur approximatif :</b> {wordCount(finalText)} mots</p>
            <textarea style={{minHeight: 480}} value={finalText} onChange={(e) => setFinalText(e.target.value)} placeholder="Écris ta version finale ici." />
            <button className="green" onClick={() => navigator.clipboard?.writeText(finalText)}>Copier ma version finale</button>
          </div>}
        </section>
      </div>
    </main>
  );
}
