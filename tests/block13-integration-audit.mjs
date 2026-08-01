import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const paths = {
  model: new URL("../lib/writingMinistryFeedback.js", import.meta.url),
  panel: new URL("../app/ecriture/WritingMinistryFeedbackPanel.jsx", import.meta.url),
  revision: new URL("../app/ecriture/Step5Revision.jsx", import.meta.url),
  page: new URL("../app/ecriture/page.jsx", import.meta.url),
  correction: new URL("../app/ecriture/Step6Correction.jsx", import.meta.url),
  layout: new URL("../app/layout.jsx", import.meta.url),
  css: new URL("../app/writingMinistryFeedback.css", import.meta.url),
  package: new URL("../package.json", import.meta.url)
};

const source = Object.fromEntries(await Promise.all(
  Object.entries(paths).map(async ([key, url]) => [key, await readFile(url, "utf8")])
));

let checks = 0;
function ok(value, message) { checks += 1; assert.ok(value, message); }

const labels = [
  "Adaptation à la situation d’écriture",
  "Cohérence du texte",
  "Utilisation d’un vocabulaire approprié",
  "Construction des phrases et ponctuation appropriées",
  "Respect de l’orthographe d’usage et grammaticale"
];

labels.forEach((label) => ok(source.model.includes(label), `le critère « ${label} » est présent`));
ok(source.model.includes("studentTextChanged: false"), "le moteur interdit toute modification du texte");
ok(source.model.includes("mode === \"simulation\""), "le moteur distingue la simulation");
ok(source.model.includes("strengths: []") && source.model.includes("improvements: []") && source.model.includes("signals: null"), "la simulation retire les rétroactions ciblées");
ok(source.model.includes("plus de 34 mots") && source.model.includes("moins de quatre mots"), "les longueurs de phrases sont repérées prudemment");
ok(source.model.includes("marqueurs de relation"), "les marqueurs de relation sont pris en compte");
ok(source.model.includes("groupe(s) du nom") && source.model.includes("sujet-verbe"), "les zones d’accord fréquentes sont ciblées");
ok(!/fetch\s*\(|axios|openai|anthropic|gemini|supabase|firebase|prisma/i.test(source.model), "le moteur n’appelle aucun service externe");
ok(!/localStorage|sessionStorage|indexedDB/.test(source.model), "le moteur pur ne conserve aucune donnée");

ok(source.revision.includes("WritingMinistryFeedbackPanel"), "la grille est montée à l’étape 5");
ok(source.revision.includes("examMode={examMode}"), "l’étape 5 transmet le mode réel");
ok(source.page.includes("examMode={examMode}"), "la page synchronise entraînement et simulation");
ok(source.panel.includes("Mode entraînement") && source.panel.includes("Mode simulation"), "les deux rendus sont explicites");
ok(source.panel.includes("Aucune analyse ciblée ni suggestion de contenu"), "la simulation annonce l’absence d’aide ciblée");
ok(source.panel.includes("Analyser mon brouillon pour préparer ma révision"), "l’analyse est déclenchée volontairement en entraînement");
ok(source.panel.includes("ne corrige aucun mot") && source.panel.includes("ne réécrit aucune phrase"), "les limites sont visibles pour l’élève");
ok(!source.panel.includes("setDraft") && !source.panel.includes("setFinalText"), "le panneau ne peut pas modifier le brouillon ou le texte final");
ok(!/localStorage|sessionStorage|indexedDB/.test(source.panel), "le panneau ne sauvegarde pas la rétroaction");
ok(!/fetch\s*\(|axios|openai|anthropic|gemini/i.test(source.panel), "le panneau n’appelle aucun correcteur distant");

ok(source.correction.includes("Accord du déterminant") && source.correction.includes("Accord de l’adjectif"), "les balayages d’accord existants sont conservés");
ok(source.correction.includes("Accord du verbe avec un pronom sujet") && source.correction.includes("groupe du nom sujet"), "les balayages sujet-verbe sont conservés");
ok(source.layout.includes("writingMinistryFeedback.css"), "les styles du bloc 13 sont chargés");
ok(source.css.includes("ministryWritingFeedback") && source.css.includes("ministryChecklistLine"), "les deux interfaces sont stylisées");

const pkg = JSON.parse(source.package);
ok(pkg.scripts["test:block13"], "une suite block13 existe");
ok(pkg.scripts.prebuild.includes("test:block13"), "le bloc 13 est obligatoire avant compilation");
ok(pkg.scripts.prebuild.indexOf("test:block13") > pkg.scripts.prebuild.indexOf("test:block12"), "le bloc 13 s’exécute après les blocs précédents");

console.log(`Bloc 13 — audit d’intégration : ${checks} contrôles réussis.`);
