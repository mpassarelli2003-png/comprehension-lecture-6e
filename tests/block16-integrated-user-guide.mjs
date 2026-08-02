import assert from "node:assert/strict";
import fs from "node:fs";

const page = fs.readFileSync(new URL("../app/guide/page.jsx", import.meta.url), "utf8");
const layout = fs.readFileSync(new URL("../app/layout.jsx", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../app/guide.css", import.meta.url), "utf8");

let checks = 0;
function ok(value, message) {
  checks += 1;
  assert.ok(value, message);
}
function equal(actual, expected, message) {
  checks += 1;
  assert.equal(actual, expected, message);
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
  ok(page.includes(heading), `la section « ${heading} » est présente`);
}

for (const role of [
  "Enseignant ou intervenant",
  "Parent ou personne accompagnatrice",
  "Élève autonome"
]) {
  ok(page.includes(role), `le rôle « ${role} » est couvert`);
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
  ok(page.includes(moduleTitle), `le module « ${moduleTitle} » possède une procédure`);
}

ok(page.includes("Il n’existe pas de route séparée /lecture"), "le guide décrit fidèlement la route réelle de lecture");
ok(page.includes("6e année") && page.includes("Secondaire 1") && page.includes("Secondaire 2"), "les trois niveaux sont expliqués");
ok(page.includes("simulation ne doit jamais servir à enseigner une nouvelle stratégie"), "la frontière pédagogique de la simulation est explicite");
ok(page.includes("cinq autoévaluations ministérielles seulement"), "la simulation d’écriture est décrite correctement");
ok(page.includes("ne corrige pas le texte, ne le réécrit pas et ne donne aucune note"), "la rétroaction d’écriture n’est pas présentée comme un correcteur");

for (const expected of [
  "Les notes actives servent uniquement à reprendre le travail local",
  "Elles ne sont pas incluses dans l’historique minimal ni dans l’export administratif",
  "Aucun compte élève n’est créé",
  "Il n’existe aucune synchronisation automatique entre appareils",
  "Effacer les données du navigateur peut supprimer le travail",
  "navigation privée"
]) {
  ok(page.includes(expected), `la limite de confidentialité « ${expected} » est visible`);
}

for (const excluded of [
  "Aucune réponse, preuve, note active, brouillon ou version finale",
  "ni réponses de lecture, ni passages sélectionnés, ni brouillon, ni version finale",
  "ne remplace pas le jugement pédagogique",
  "ne peut pas attribuer une note, une cote ou un diagnostic"
]) {
  ok(page.includes(excluded), `la limite « ${excluded} » est documentée`);
}

for (const backupStep of [
  "Sauv​egarde, restauration et transfert local".replace("​", ""),
  "Créer une sauvegarde datée",
  "Fusionner ou Remplacer",
  "doublons et conflits d’identifiants",
  "reviennent toujours comme brouillons",
  "somme de contrôle détecte une altération accidentelle"
]) {
  ok(page.includes(backupStep), `la procédure de sauvegarde couvre « ${backupStep} »`);
}

ok(page.includes("Ctrl + F5"), "le dépannage mentionne le rechargement complet");
ok(page.includes("Sans sauvegarde exportée, les données locales supprimées ne peuvent pas être restaurées"), "la limite de restauration est explicite");
ok(page.includes("Les exercices restaurés reviennent volontairement comme brouillons"), "la porte de publication après restauration est expliquée");

ok(!page.startsWith('"use client"'), "le guide reste une page documentaire sans état client");
const forbiddenInfrastructure = /\b(fetch|axios|XMLHttpRequest|WebSocket|EventSource|supabase|firebase|indexedDB|localStorage|sessionStorage)\b/i;
ok(!forbiddenInfrastructure.test(page), "le guide n’ajoute aucun appel réseau, base de données ou stockage");
ok(!page.includes("correctedText") && !page.includes("rewrittenText") && !page.includes("replacementText"), "le guide ne crée aucun mécanisme de correction");
ok(!page.includes("studentAnswer") && !page.includes("expectedAnswer"), "le guide ne manipule aucune réponse d’élève ou réponse attendue");

equal((page.match(/<details>/g) || []).length, 4, "quatre cas de dépannage sont repliables");

console.log(`Bloc 16 — guide d’utilisation intégré : ${checks} contrôles réussis.`);
