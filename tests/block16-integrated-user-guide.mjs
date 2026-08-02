import assert from "node:assert/strict";
import fs from "node:fs";

const page = fs.readFileSync(new URL("../app/guide/page.jsx", import.meta.url), "utf8");
const layout = fs.readFileSync(new URL("../app/layout.jsx", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../app/guide.css", import.meta.url), "utf8");
const pageLower = page.toLowerCase();

let checks = 0;
function ok(value, message) {
  checks += 1;
  assert.ok(value, message);
}
function equal(actual, expected, message) {
  checks += 1;
  assert.equal(actual, expected, message);
}
function includesText(text, message) {
  ok(pageLower.includes(text.toLowerCase()), message);
}

ok(layout.includes('import "./guide.css"'), "la mise en forme du guide est chargée globalement");
ok(layout.includes('href="/guide"'), "le guide est accessible dans la navigation principale");
ok(layout.includes('className="guideButton"'), "le lien du guide possède une classe dédiée");
ok(css.includes(".guideButton"), "le bouton du guide est visuellement identifié");
ok(css.includes("@media(max-width:850px)"), "le guide prévoit une mise en page mobile");
ok(css.includes("overflow-x:auto"), "le tableau de confidentialité reste lisible sur petit écran");

for (const heading of [
  "Utiliser l’application sans connaître son architecture technique",
  "Démarrage rapide en cinq décisions",
  "Entraînement ou simulation",
  "Comment choisir le niveau",
  "Utiliser chaque module",
  "Repères selon votre rôle",
  "Lire la progression sans la transformer en note",
  "Comprendre ce qui est conservé",
  "Sauvegarder et transférer les exercices locaux",
  "Ce que l’application fait et ne fait pas",
  "Vérifications simples",
  "Principe directeur"
]) {
  includesText(heading, `la section « ${heading} » est présente`);
}

for (const role of [
  "Enseignant ou intervenant",
  "Parent ou personne accompagnatrice",
  "Élève autonome"
]) {
  includesText(role, `le rôle « ${role} » est couvert`);
}

for (const route of ["/", "/ecriture", "/parcours", "/progression", "/admin/login"]) {
  ok(page.includes(`href: "${route}"`) || page.includes(`href="${route}"`), `le guide relie le module ${route}`);
}

for (const moduleTitle of [
  "Lecture — page d’accueil",
  "Écriture",
  "Parcours lecture-écriture",
  "Progression",
  "Administration"
]) {
  includesText(moduleTitle, `le module « ${moduleTitle} » possède une procédure`);
}

includesText("Il n’existe pas de route séparée /lecture", "le guide décrit fidèlement la route réelle de lecture");
ok(pageLower.includes("6e année") && pageLower.includes("secondaire 1") && pageLower.includes("secondaire 2"), "les trois niveaux sont expliqués");
includesText("simulation ne doit jamais servir à enseigner une nouvelle stratégie", "la frontière pédagogique de la simulation est explicite");
includesText("cinq autoévaluations ministérielles seulement", "la simulation d’écriture est décrite correctement");
includesText("ne corrige pas le texte, ne le réécrit pas et ne donne aucune note", "la rétroaction d’écriture n’est pas présentée comme un correcteur");

for (const expected of [
  "Les notes actives servent uniquement à reprendre le travail local",
  "Elles ne sont pas incluses dans l’historique minimal ni dans l’export administratif",
  "Aucun compte élève n’est créé",
  "Il n’existe aucune synchronisation automatique entre appareils",
  "Effacer les données du navigateur peut supprimer le travail",
  "navigation privée"
]) {
  includesText(expected, `la limite de confidentialité « ${expected} » est visible`);
}

for (const excluded of [
  "Aucune réponse, preuve, note active, brouillon ou version finale",
  "Aucun texte complet de l’élève",
  "ne remplace pas le jugement pédagogique",
  "attribuer une note, une cote ou un diagnostic"
]) {
  includesText(excluded, `la limite « ${excluded} » est documentée`);
}

for (const backupStep of [
  "Sauvegarde, restauration et transfert local",
  "Créer une sauvegarde datée",
  "Fusionner ou Remplacer",
  "doublons et conflits d’identifiants",
  "reviennent toujours comme brouillons",
  "somme de contrôle détecte une altération accidentelle"
]) {
  includesText(backupStep, `la procédure de sauvegarde couvre « ${backupStep} »`);
}

includesText("Ctrl + F5", "le dépannage mentionne le rechargement complet");
includesText("Sans sauvegarde exportée, les données locales supprimées ne peuvent pas être restaurées", "la limite de restauration est explicite");
includesText("Les exercices restaurés reviennent volontairement comme brouillons", "la porte de publication après restauration est expliquée");

ok(!page.startsWith('"use client"'), "le guide reste une page documentaire sans état client");
const forbiddenInfrastructure = /\b(fetch|axios|XMLHttpRequest|WebSocket|EventSource|supabase|firebase|indexedDB|localStorage|sessionStorage)\b/i;
ok(!forbiddenInfrastructure.test(page), "le guide n’ajoute aucun appel réseau, base de données ou stockage");
ok(!page.includes("correctedText") && !page.includes("rewrittenText") && !page.includes("replacementText"), "le guide ne crée aucun mécanisme de correction");
ok(!page.includes("studentAnswer") && !page.includes("expectedAnswer"), "le guide ne manipule aucune réponse d’élève ou réponse attendue");

equal((page.match(/<details>/g) || []).length, 4, "quatre cas de dépannage sont repliables");

console.log(`Bloc 16 — guide d’utilisation intégré : ${checks} contrôles réussis.`);
