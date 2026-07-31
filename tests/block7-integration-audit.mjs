import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [layout, recorder, dashboard, admin, css, engine] = await Promise.all([
  readFile(new URL("../app/layout.jsx", import.meta.url), "utf8"),
  readFile(new URL("../app/ProgressRecorder.jsx", import.meta.url), "utf8"),
  readFile(new URL("../app/progression/page.jsx", import.meta.url), "utf8"),
  readFile(new URL("../app/admin/AdminProgressSummary.jsx", import.meta.url), "utf8"),
  readFile(new URL("../app/progressDashboard.css", import.meta.url), "utf8"),
  readFile(new URL("../lib/progressTracking.js", import.meta.url), "utf8")
]);

assert.match(layout, /ProgressRecorder/);
assert.match(layout, /href="\/progression"/);
assert.match(layout, /progressDashboard\.css/);
assert.match(recorder, /Vérifier ma réponse/);
assert.match(recorder, /Question suivante/);
assert.match(recorder, /Remettre la simulation/);
assert.match(recorder, /writeProgressRecord/);
assert.match(recorder, /pathname === "\/admin"/);
assert.match(dashboard, /Ma progression en lecture/);
assert.match(dashboard, /Progression par dimension/);
assert.match(dashboard, /Entraînement et simulation/);
assert.match(dashboard, /Ce qui revient souvent/);
assert.match(admin, /Suivi de progression/);
assert.match(admin, /Télécharger le suivi/);
assert.match(admin, /Aucun texte de réponse ni passage/);
assert.match(css, /progressDimensionGrid/);
assert.match(css, /adminProgressTable/);
assert.doesNotMatch(engine, /expectedAnswer/);
assert.doesNotMatch(engine, /proof\.text/);
assert.doesNotMatch(engine, /answerText/);
assert.match(engine, /MAX_PROGRESS_RECORDS/);
assert.match(engine, /latestProgressRecords/);
assert.match(engine, /summarizeProgress/);
assert.match(engine, /validateProgressData/);

console.log("Bloc 7 : intégration élève/admin, confidentialité et navigation validées.");
