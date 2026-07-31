import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [panel, mount, layout, logic, css] = await Promise.all([
  readFile(new URL("../app/admin/ManualPedagogicalAuditPanel.jsx", import.meta.url), "utf8"),
  readFile(new URL("../app/admin/ContentCalibrationAdminMount.jsx", import.meta.url), "utf8"),
  readFile(new URL("../app/layout.jsx", import.meta.url), "utf8"),
  readFile(new URL("../lib/manualPedagogicalAudit.js", import.meta.url), "utf8"),
  readFile(new URL("../app/manualPedagogicalAudit.css", import.meta.url), "utf8")
]);

let checks = 0;
function ok(value, message) {
  checks += 1;
  assert.ok(value, message);
}

ok(mount.includes("ManualPedagogicalAuditPanel"), "le panneau manuel est monté dans /admin");
ok(mount.includes('pathname === "/admin"'), "le panneau reste limité à la route admin");
ok(layout.includes('manualPedagogicalAudit.css'), "les styles sont chargés");
ok(panel.includes("MANUAL_PEDAGOGICAL_AUDIT_KEY"), "une clé de stockage local dédiée est utilisée");
ok(panel.includes("localStorage.getItem"), "les audits sont chargés du navigateur");
ok(panel.includes("localStorage.setItem"), "les audits sont sauvegardés dans le navigateur");
ok(panel.includes("buildManualAuditExport"), "l’export JSON est branché");
ok(panel.includes("auditExerciseContent"), "l’audit automatique reste visible séparément");
ok(panel.includes("secondaryExercises"), "les textes secondaires sont inclus explicitement");
ok(panel.includes("Exporter tous les audits JSON"), "un export complet est offert");
ok(panel.includes("Exporter ce texte"), "un export par exercice est offert");
ok(panel.includes("Statut manuel du texte"), "le statut manuel est modifiable");
ok(panel.includes("À valider") || logic.includes("À valider"), "le statut à valider existe");
ok(logic.includes("Niveau réellement approprié"), "les critères du texte sont présents");
ok(logic.includes("Preuve réellement disponible dans le texte"), "les critères des questions sont présents");
ok(logic.includes("Difficulté réaliste sans aide"), "les critères de simulation sont présents");
ok(logic.includes('storageScope: "local-browser"'), "l’export déclare sa portée locale");
ok(logic.includes("automaticAuditPreserved: true"), "l’audit automatique n’est pas remplacé");
ok(!panel.includes("fetch("), "aucun appel réseau n’est ajouté");
ok(!panel.match(/supabase|firebase|prisma|database/i), "aucune base de données n’est ajoutée");
ok(css.includes("manualAuditRow"), "la grille possède des styles dédiés");
ok(css.includes("@media"), "la grille reste utilisable sur petit écran");

console.log(`Bloc 9 — intégration : ${checks} contrôles réussis.`);
