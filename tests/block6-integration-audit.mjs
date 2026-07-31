import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [layout, panel, engine, admin, styles, packageJson] = await Promise.all([
  readFile(new URL("../app/layout.jsx", import.meta.url), "utf8"),
  readFile(new URL("../app/FormativeFeedbackPanel.jsx", import.meta.url), "utf8"),
  readFile(new URL("../lib/formativeFeedback.js", import.meta.url), "utf8"),
  readFile(new URL("../app/admin/AdminWorkspace.jsx", import.meta.url), "utf8"),
  readFile(new URL("../app/formativeFeedback.css", import.meta.url), "utf8"),
  readFile(new URL("../package.json", import.meta.url), "utf8")
]);

assert.ok(layout.indexOf("<FormativeFeedbackPanel>") < layout.indexOf("<ProgressiveAnswerGuard>"), "La rétroaction doit observer la tentative avant le blocage gradué.");
assert.match(panel, /evaluateReadingAnswer/);
assert.match(panel, /evaluateExerciseSubmission/);
assert.match(panel, /feedback\.canContinue/);
assert.match(panel, /summary\.readyToSubmit/);
assert.match(panel, /missingQuestions === 0/);
assert.match(panel, /slice\(0, 3\)/, "L’interface doit limiter les améliorations affichées à trois.");
assert.match(panel, /Ce qui est réussi/);
assert.match(panel, /À améliorer/);
assert.match(panel, /Prochaine action/);
assert.match(panel, /Grille finale simplifiée/);
assert.doesNotMatch(panel, /expectedAnswer/, "L’interface élève ne doit jamais lire la réponse attendue.");
assert.doesNotMatch(engine, /\.expectedAnswer|expectedAnswer\s*\]/, "Le moteur ne doit jamais comparer avec la réponse attendue.");
assert.match(engine, /exerciseId === expectedExercise/);
assert.match(engine, /modeId === expectedMode/);
assert.match(engine, /sameQuestion/);
assert.match(engine, /FINAL_READING_CHECKLIST/);
assert.match(engine, /procedureOnly/);
assert.match(admin, /Rétroaction formative/);
assert.match(admin, /Valider la rétroaction/);
assert.match(admin, /Règles à clarifier/);
assert.match(styles, /formativeFeedbackGrid/);
assert.match(styles, /formativeChecklistGrid/);

const pkg = JSON.parse(packageJson);
assert.match(pkg.scripts["test:block6"], /block6-formative-feedback\.mjs/);
assert.match(pkg.scripts["test:block6"], /block6-feedback-audit\.mjs/);
assert.match(pkg.scripts.prebuild, /test:block5/);
assert.match(pkg.scripts.prebuild, /test:block6/);

console.log("Bloc 6 : audit d’intégration réussi.");
