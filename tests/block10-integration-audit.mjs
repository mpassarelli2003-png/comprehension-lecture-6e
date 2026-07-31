import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const paths = {
  panel: new URL("../app/admin/LocalExerciseWorkshopPanel.jsx", import.meta.url),
  mount: new URL("../app/admin/ContentCalibrationAdminMount.jsx", import.meta.url),
  calibration: new URL("../app/admin/ContentCalibrationAdminPanel.jsx", import.meta.url),
  manual: new URL("../app/admin/ManualPedagogicalAuditPanel.jsx", import.meta.url),
  hook: new URL("../app/useExerciseBank.js", import.meta.url),
  registry: new URL("../lib/exerciseBankRegistration.js", import.meta.url),
  learning: new URL("../lib/learningConfig.js", import.meta.url),
  model: new URL("../lib/localExerciseWorkshop.js", import.meta.url),
  layout: new URL("../app/layout.jsx", import.meta.url),
  package: new URL("../package.json", import.meta.url)
};
const source = Object.fromEntries(await Promise.all(Object.entries(paths).map(async ([key, url]) => [key, await readFile(url, "utf8")])));
let checks = 0;
function ok(value, message) { checks += 1; assert.ok(value, message); }

ok(source.mount.includes("LocalExerciseWorkshopPanel"), "l’atelier est monté dans /admin");
ok(source.panel.includes("Création, importation, édition et publication locale d’exercices"), "le titre enrichi de l’atelier est visible");
ok(source.panel.includes("Classifier toutes les questions"), "la classification automatique est accessible");
ok(source.panel.includes("Dimension") && source.panel.includes("Type de réponse"), "la classification peut être corrigée manuellement");
ok(source.panel.includes("Audit automatique"), "l’audit automatique est affiché");
ok(source.panel.includes("Audit pédagogique manuel"), "la continuité vers l’audit manuel est indiquée");
ok(source.panel.includes("Entraînement") && source.panel.includes("Simulation"), "les deux aperçus sont disponibles");
ok(source.panel.includes("Importer le JSON collé") && source.panel.includes("Choisir un fichier JSON"), "les deux méthodes d’import sont présentes");
ok(source.panel.includes("Exporter cet exercice") && source.panel.includes("Exporter la banque locale"), "les exports individuel et global sont présents");
ok(source.panel.includes("Publier dans le parcours élève"), "la publication locale est explicite");
ok(source.panel.includes("disabled={!readiness.canPublish || !validation.valid}"), "une publication invalide ou non relue est bloquée");

ok(source.hook.includes("LOCAL_EXERCISE_STORE_KEY"), "la banque partagée lit le stockage local");
ok(source.hook.includes("includeDrafts"), "l’admin peut inclure les brouillons");
ok(source.registry.includes("registerPublishedLocalExercises"), "les modules historiques reçoivent les publications locales");
ok(source.learning.startsWith('import "./exerciseBankRegistration.js"'), "le registre est chargé avant la banque du parcours élève");
ok(source.calibration.includes("useExerciseBank({ includeDrafts: true })"), "l’audit automatique inclut les exercices locaux");
ok(source.manual.includes("useExerciseBank({ includeDrafts: true })"), "l’audit manuel inclut les exercices locaux");
ok(source.layout.includes("localExerciseWorkshop.css"), "les styles sont chargés");

ok(source.model.includes("local-browser"), "les exports déclarent une portée locale");
ok(source.model.includes("draft") && source.model.includes("published"), "les statuts brouillon et publié existent");
ok(!/fetch\s*\(/.test(source.panel), "l’atelier n’appelle aucun service réseau");
ok(!/axios|supabase|firebase|prisma|indexedDB/i.test(source.model + source.panel), "aucune base de données n’est ajoutée");
ok(!/studentAnswer|selectedProof|responseText/.test(source.model), "le modèle ne stocke pas le travail de l’élève");

const pkg = JSON.parse(source.package);
ok(pkg.scripts["test:block10"], "une suite block10 existe");
ok(pkg.scripts.prebuild.includes("test:block10"), "le bloc 10 est obligatoire avant compilation");

console.log(`Bloc 10 — audit d’intégration : ${checks} contrôles réussis.`);
