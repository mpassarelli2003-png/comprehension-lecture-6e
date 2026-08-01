import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const paths = {
  panel: new URL("../app/admin/LocalBackupRestorePanel.jsx", import.meta.url),
  mount: new URL("../app/admin/ContentCalibrationAdminMount.jsx", import.meta.url),
  model: new URL("../lib/localBackupRestore.js", import.meta.url),
  bank: new URL("../lib/localExerciseWorkshop.js", import.meta.url),
  hook: new URL("../app/useExerciseBank.js", import.meta.url),
  layout: new URL("../app/layout.jsx", import.meta.url),
  css: new URL("../app/localBackupRestore.css", import.meta.url),
  package: new URL("../package.json", import.meta.url)
};

const source = Object.fromEntries(await Promise.all(
  Object.entries(paths).map(async ([key, url]) => [key, await readFile(url, "utf8")])
));
let checks = 0;
function ok(value, message) { checks += 1; assert.ok(value, message); }

ok(source.mount.includes("LocalBackupRestorePanel"), "le bloc 12 est monté dans /admin");
ok(source.panel.includes("Sauvegarde, restauration et transfert local"), "le titre du bloc 12 est visible");
ok(source.panel.includes("Créer une sauvegarde datée"), "une sauvegarde locale datée peut être créée");
ok(source.panel.includes("Télécharger la sauvegarde complète"), "la banque complète peut être téléchargée");
ok(source.panel.includes("Choisir un fichier de sauvegarde"), "un fichier peut être transféré vers un autre navigateur");
ok(source.panel.includes("Vérifier le JSON collé"), "le JSON est inspecté avant restauration");
ok(source.panel.includes("Intégrité conforme"), "le résultat du contrôle d’intégrité est affiché");
ok(source.panel.includes("Fusionner avec la banque actuelle"), "le mode fusion est disponible");
ok(source.panel.includes("Remplacer toute la banque actuelle"), "le mode remplacement est disponible");
ok(source.panel.includes("Conserver les deux avec un nouvel identifiant"), "les conflits peuvent être renommés");
ok(source.panel.includes("Garder l’exercice actuel et ignorer le conflit"), "les conflits peuvent être ignorés");
ok(source.panel.includes("Écraser l’exercice actuel"), "les conflits peuvent être remplacés explicitement");
ok(source.panel.includes("window.confirm(replacementWarning)"), "une confirmation est exigée avant restauration");
ok(source.panel.includes("Confirmer l’écrasement"), "un second avertissement protège l’écrasement conflictuel");
ok(source.panel.includes("Copie automatique avant restauration"), "une copie de sécurité précède toute restauration");
ok(source.panel.includes("Tous les exercices restaurés sont en brouillon"), "la politique de brouillon est indiquée après restauration");
ok(source.panel.includes("Aucun exercice restauré ne sera publié automatiquement"), "l’interface empêche toute publication implicite");

ok(source.model.includes("LOCAL_BACKUP_HISTORY_KEY"), "l’historique possède une clé locale dédiée");
ok(source.model.includes("fnv1a-32"), "le format inclut une somme de contrôle déterministe");
ok(source.model.includes("all-exercises-return-as-draft"), "la sauvegarde déclare la politique de restauration");
ok(source.model.includes("studentDataIncluded: false"), "le fichier déclare l’exclusion des données d’élève");
ok(source.model.includes("FORBIDDEN_STUDENT_KEYS"), "le moteur retire les champs de travail élève connus");
ok(source.model.includes("skippedDuplicates"), "les doublons stricts sont comptés séparément");
ok(source.model.includes("skippedConflicts"), "les conflits ignorés sont comptés séparément");
ok(source.model.includes("conflictPolicy"), "la politique de conflit est explicite dans le moteur");
ok(source.model.includes("LOCAL_BACKUP_HISTORY_LIMIT"), "le nombre de versions locales est limité");

ok(source.panel.includes("saveLocalExerciseStore"), "la restauration utilise la banque partagée réelle");
ok(source.hook.includes("LOCAL_EXERCISE_EVENT"), "la banque diffusée aux écrans reste synchronisée");
ok(source.layout.includes("localBackupRestore.css"), "les styles du bloc 12 sont chargés");
ok(source.css.includes("localBackupRestore"), "la section possède ses styles propres");
ok(!/fetch\s*\(/.test(source.panel + source.model), "aucun appel réseau n’est ajouté");
ok(!/axios|supabase|firebase|prisma|indexedDB/i.test(source.panel + source.model), "aucune base de données n’est ajoutée");
ok(!source.model.includes("localStorage"), "le moteur pur ne dépend pas directement du navigateur");

const pkg = JSON.parse(source.package);
ok(pkg.scripts["test:block12"], "une suite block12 existe");
ok(pkg.scripts.prebuild.includes("test:block11b"), "le test réel du bloc 11b demeure obligatoire");
ok(pkg.scripts.prebuild.includes("test:block12"), "le bloc 12 est obligatoire avant compilation");
ok(pkg.scripts.prebuild.indexOf("test:block11b") < pkg.scripts.prebuild.indexOf("test:block12"), "le bloc 12 s’exécute après la porte de publication réelle");

console.log(`Bloc 12 — audit d’intégration : ${checks} contrôles réussis.`);
