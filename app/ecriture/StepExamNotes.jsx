function defaultNotesFromSituation(preciseSituation) {
  return (preciseSituation.required || []).slice(0, 4).map((item, index) => ({
    id: index + 1,
    info: item,
    fact: "",
    keyword: "",
    opinionLink: ""
  }));
}

export function createDefaultExamNotes(preciseSituation) {
  return defaultNotesFromSituation(preciseSituation);
}

export default function StepExamNotes({ notes, setNotes, preciseSituation }) {
  function updateNote(index, field, value) {
    setNotes((old) => old.map((row, i) => i === index ? { ...row, [field]: value } : row));
  }

  function resetNotes() {
    setNotes(defaultNotesFromSituation(preciseSituation));
  }

  return (
    <div className="card">
      <h3>Feuille de notes — mode épreuve</h3>
      <p>Dans l’épreuve, tu n’écris pas avec le texte complet devant toi. Tu dois utiliser une feuille de notes. Cette section t’entraîne à garder seulement les informations utiles.</p>
      <button className="green" onClick={resetNotes}>Préparer une feuille de notes à partir de la consigne</button>
      {notes.map((row, index) => (
        <div className="card" key={row.id || index}>
          <h4>Note {index + 1}</h4>
          <label>Information importante</label>
          <input value={row.info || ""} onChange={(e) => updateNote(index, "info", e.target.value)} placeholder="Information utile tirée du texte ou de la consigne" />
          <label>Fait, exemple ou donnée utile</label>
          <input value={row.fact || ""} onChange={(e) => updateNote(index, "fact", e.target.value)} placeholder="Ex. un fait, un exemple, une donnée saisissante" />
          <label>Mot-clé</label>
          <input value={row.keyword || ""} onChange={(e) => updateNote(index, "keyword", e.target.value)} placeholder="Ex. environnement, bienfait, conséquence" />
          <label>Lien possible avec mon opinion ou mon explication</label>
          <input value={row.opinionLink || ""} onChange={(e) => updateNote(index, "opinionLink", e.target.value)} placeholder="Ex. Cette information peut servir à montrer que..." />
        </div>
      ))}
    </div>
  );
}
