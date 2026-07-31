import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [panel, manualPanel, logic, css, packageJson] = await Promise.all([
  readFile(new URL("../app/admin/LocalExerciseWorkshopPanel.jsx", import.meta.url), "utf8"),
  readFile(new URL("../app/admin/ManualPedagogicalAuditPanel.jsx", import.meta.url), "utf8"),
  readFile(new URL("../lib/publicationReadiness.js", import.meta.url), "utf8"),
  readFile(new URL("../app/localExerciseWorkshop.css", import.meta.url), "utf8"),
  readFile(new URL("../package.json", import.meta.url), "utf8")
]);

let checks = 0;
function ok(value, message) {
  checks += 1;
  assert.ok(value, message);
}

ok(panel.includes("Checklist de publication"), "la checklist est affichée dans l’atelier");
ok(panel.includes("Aperçu final obligatoire"), "l’aperçu final obligatoire est affiché");
ok(panel.includes("Ouvrir l’aperçu final complet"), "un geste explicite ouvre l’aperçu final");
ok(panel.includes("J’ai vérifié l’aperçu final complet"), "la vérification humaine de l’aperçu est demandée");
ok(panel.includes("PUBLICATION_REVIEW_CONFIRMATION"), "la phrase de relecture provient du moteur central");
ok(panel.includes("buildPublicationReadiness"), "le bouton de publication lit le moteur de préparation");
ok(panel.includes("disabled={!readiness.canPublish || !validation.valid}"), "le bouton reste désactivé tant que les blocages subsistent");
ok(panel.includes("readiness.blockers.join"), "une tentative refusée explique les blocages");
ok(panel.includes("readiness.warnings.length"), "les avertissements sont visibles avant publication");
ok(panel.includes("window.confirm(`Publier malgré"), "les avertissements exigent une confirmation supplémentaire");
ok(panel.includes('value={question.dimension || ""}'), "une dimension vide demeure visible comme telle");
ok(panel.includes("Choisir une dimension"), "l’interface n’impose pas silencieusement Comprendre");
ok(panel.includes("MANUAL_PEDAGOGICAL_AUDIT_KEY"), "la porte lit l’audit manuel local");
ok(panel.includes("lecture-manual-pedagogical-audit-changed"), "la porte réagit aux changements de l’audit manuel");
ok(manualPanel.includes("CustomEvent(MANUAL_AUDIT_CHANGE_EVENT"), "l’audit manuel diffuse ses changements dans le même onglet");
ok(logic.includes("Le texte est trop court pour être publié"), "le texte trop court est bloqué");
ok(logic.includes("Aucune question n’est présente"), "l’absence de question est bloquée");
ok(logic.includes("dimension absente ou invalide"), "la dimension absente est bloquée");
ok(logic.includes("preuve obligatoire est indiquée comme impossible"), "la preuve impossible est bloquée");
ok(logic.includes("L’audit pédagogique manuel indique Bloqué"), "le statut manuel Bloqué est bloquant");
ok(logic.includes("L’audit pédagogique manuel n’est pas terminé"), "l’audit incomplet produit un avertissement");
ok(logic.includes("Trop de questions explicites"), "la domination explicite produit un avertissement");
ok(logic.includes("Aucune question d’inférence ou d’interprétation"), "l’absence d’inférence produit un avertissement");
ok(logic.includes("finalPreviewReviewed"), "l’aperçu final fait partie de la décision");
ok(logic.includes("reviewerConfirmed"), "la confirmation de relecture fait partie de la décision");
ok(css.includes("publicationChecklistItem"), "la checklist possède des styles dédiés");
ok(css.includes("finalPreviewContent"), "l’aperçu final complet possède un conteneur dédié");
ok(css.includes("explicitConfirmation"), "la confirmation explicite est visuellement mise en évidence");
ok(packageJson.includes("test:block11"), "la suite du bloc 11 est déclarée dans package.json");
ok(!logic.match(/fetch\(|supabase|firebase|prisma|database/i), "la porte de publication ne crée ni réseau ni base de données");

console.log(`Bloc 11 — audit d’intégration : ${checks} contrôles réussis.`);
