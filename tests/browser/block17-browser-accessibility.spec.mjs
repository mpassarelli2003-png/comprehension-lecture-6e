import { test, expect } from "@playwright/test";

const PUBLIC_ROUTES = [
  { path: "/", heading: /Choisis ton niveau et ta façon de pratiquer/i },
  { path: "/ecriture", heading: /Préparation à l’écriture/i },
  { path: "/parcours", heading: /Parcours complet lecture/i },
  { path: "/progression", heading: /Ma progression en lecture/i },
  { path: "/guide", heading: /Utiliser l’application sans connaître/i },
  { path: "/admin/login", heading: /Accès protégé/i }
];

const NAVIGATION_NAMES = [
  "Accueil",
  "Parcours lecture-écriture",
  "Volet écriture",
  "Ma progression",
  "Guide",
  "Aide vocale IA",
  "Admin"
];

function captureRuntimeErrors(page) {
  const errors = [];
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console.error: ${message.text()}`);
  });
  return errors;
}

async function expectNoHorizontalOverflow(page) {
  const metrics = await page.evaluate(() => ({
    viewport: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth
  }));
  expect(metrics.documentWidth, JSON.stringify(metrics)).toBeLessThanOrEqual(metrics.viewport + 2);
  expect(metrics.bodyWidth, JSON.stringify(metrics)).toBeLessThanOrEqual(metrics.viewport + 2);
}

async function expectInteractiveNames(page) {
  const unnamed = await page.locator("button, a[href]").evaluateAll((elements) => elements
    .filter((element) => {
      const style = window.getComputedStyle(element);
      return style.display !== "none" && style.visibility !== "hidden" && element.getClientRects().length > 0;
    })
    .filter((element) => {
      const text = (element.textContent || "").replace(/\s+/g, " ").trim();
      return !text && !element.getAttribute("aria-label") && !element.getAttribute("aria-labelledby") && !element.getAttribute("title");
    })
    .map((element) => element.outerHTML.slice(0, 240)));
  expect(unnamed, `Éléments interactifs sans nom accessible :\n${unnamed.join("\n")}`).toEqual([]);
}

async function unlabeledFields(page) {
  return page.locator("input, select, textarea").evaluateAll((elements) => elements
    .filter((element) => {
      if (element.type === "hidden") return false;
      const style = window.getComputedStyle(element);
      return style.display !== "none" && style.visibility !== "hidden" && element.getClientRects().length > 0;
    })
    .filter((element) => {
      const hasLabel = Boolean(element.labels?.length);
      const hasAria = Boolean(element.getAttribute("aria-label") || element.getAttribute("aria-labelledby"));
      return !hasLabel && !hasAria;
    })
    .map((element) => ({
      tag: element.tagName.toLowerCase(),
      id: element.id,
      name: element.getAttribute("name"),
      type: element.getAttribute("type"),
      placeholder: element.getAttribute("placeholder")
    })));
}

async function expectFormLabels(page) {
  await expect.poll(async () => (await unlabeledFields(page)).length, {
    message: "les champs visibles doivent recevoir leur libellé sémantique",
    timeout: 4_000
  }).toBe(0);
  const unlabeled = await unlabeledFields(page);
  expect(unlabeled, `Champs visibles sans libellé associé :\n${JSON.stringify(unlabeled, null, 2)}`).toEqual([]);
}

for (const route of PUBLIC_ROUTES) {
  test(`la route ${route.path} charge sans erreur et conserve sa navigation`, async ({ page }) => {
    const runtimeErrors = captureRuntimeErrors(page);
    const response = await page.goto(route.path, { waitUntil: "networkidle" });
    expect(response?.ok(), `Réponse HTTP de ${route.path}`).toBeTruthy();
    await expect(page.getByRole("main")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1, name: route.heading })).toBeVisible();
    const navigation = page.getByRole("navigation", { name: "Navigation principale" });
    await expect(navigation).toBeVisible();
    for (const name of NAVIGATION_NAMES) {
      await expect(navigation.getByRole("link", { name, exact: true })).toBeVisible();
    }
    await expectInteractiveNames(page);
    await expectFormLabels(page);
    await expectNoHorizontalOverflow(page);
    expect(runtimeErrors, runtimeErrors.join("\n")).toEqual([]);
  });
}

test("la navigation principale fonctionne entièrement au clavier", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  let focusedGuide = false;
  for (let index = 0; index < 12; index += 1) {
    await page.keyboard.press("Tab");
    const focused = await page.evaluate(() => ({
      text: (document.activeElement?.textContent || "").trim(),
      href: document.activeElement?.getAttribute?.("href") || ""
    }));
    if (focused.text === "Guide" && focused.href === "/guide") {
      focusedGuide = true;
      break;
    }
  }
  expect(focusedGuide).toBeTruthy();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/guide$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Utiliser l’application");
});

test("les choix principaux peuvent être activés au clavier", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const simulation = page.getByRole("button", { name: /^Simulation\b/i });
  await simulation.focus();
  await page.keyboard.press("Enter");
  await expect(simulation).toHaveAttribute("aria-pressed", "true");

  const chooseReading = page.getByRole("button", { name: "Choisir une lecture" });
  await chooseReading.focus();
  await page.keyboard.press("Space");
  await expect(page.getByRole("heading", { level: 1, name: /Choisir une lecture/i })).toBeVisible();
});

test("l’admin demeure protégé et les erreurs de connexion sont annoncées", async ({ page }) => {
  await page.goto("/admin", { waitUntil: "networkidle" });
  await expect(page).toHaveURL(/\/admin\/login$/);
  await expect(page.getByLabel("Mot de passe administrateur")).toBeVisible();

  await page.getByLabel("Mot de passe administrateur").fill("mot-de-passe-incorrect");
  await page.getByRole("button", { name: "Ouvrir l’espace admin" }).click();
  await expect(page).toHaveURL(/error=invalid/);
  await expect(page.getByText("Mot de passe incorrect.", { exact: true })).toBeVisible();

  await page.getByLabel("Mot de passe administrateur").fill("block17-browser-password");
  await page.getByRole("button", { name: "Ouvrir l’espace admin" }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("heading", { level: 1, name: "Tableau de bord" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Se déconnecter" })).toBeVisible();
});

test("la sauvegarde administrative reste locale dans le navigateur", async ({ page }) => {
  await page.goto("/admin/login", { waitUntil: "networkidle" });
  await page.getByLabel("Mot de passe administrateur").fill("block17-browser-password");
  await page.getByRole("button", { name: "Ouvrir l’espace admin" }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("heading", { level: 1, name: "Tableau de bord" })).toBeVisible();

  const dataRequests = [];
  page.on("request", (request) => {
    if (["fetch", "xhr"].includes(request.resourceType())) dataRequests.push(request.url());
  });

  const backupSection = page.getByRole("region", { name: "Sauvegarde, restauration et transfert local" });
  await expect(backupSection).toBeVisible();
  await backupSection.getByRole("button", { name: "Créer une sauvegarde datée" }).click();
  await expect(backupSection).toContainText("Sauvegarde datée créée localement");
  const savedHistory = await page.evaluate(() => localStorage.getItem("lecture_local_exercise_backups_v1"));
  expect(savedHistory).toBeTruthy();
  expect(dataRequests, `Appels fetch/xhr inattendus : ${dataRequests.join(", ")}`).toEqual([]);
});

test("la lecture en simulation masque les aides de contenu du module", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /^Simulation\b/i }).click();
  await page.getByRole("button", { name: "Choisir une lecture" }).click();
  await page.getByRole("button", { name: /Commencer en mode simulation/i }).first().click();
  await page.getByRole("button", { name: /3\. Répondre/i }).click();
  await expect(page.getByText("Aucun indice n’est affiché en mode simulation.", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Aide vocale IA" })).toHaveCount(0);
  await expect(page.getByText(/Début de réponse/i)).toHaveCount(0);
});

test("l’écriture en simulation affiche seulement les cinq autoévaluations", async ({ page }) => {
  await page.goto("/ecriture", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Mode entraînement : texte visible" }).click();
  await page.getByRole("button", { name: "Étape 5", exact: true }).click();
  await expect(page.getByRole("heading", { level: 2, name: "Étape 5 — Je vérifie mon texte de façon autonome" })).toBeVisible();
  const checklist = page.getByRole("region", { name: "Liste de vérification ministérielle en simulation" });
  await expect(checklist).toBeVisible();
  await expect(checklist.getByRole("checkbox")).toHaveCount(5);
  await expect(page.getByText("Tableau de bord de révision", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Actions de révision possibles", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Révision propre au type de texte", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Analyser mon brouillon/i })).toHaveCount(0);
});

test("le guide ne crée aucun lien vers une route inexistante", async ({ page, request }) => {
  await page.goto("/guide", { waitUntil: "networkidle" });
  await expect(page.locator('a[href="/lecture"]')).toHaveCount(0);
  const hrefs = await page.locator('main a[href^="/"]').evaluateAll((links) => [...new Set(links.map((link) => link.getAttribute("href")))].filter(Boolean));
  for (const href of hrefs) {
    const response = await request.get(href);
    expect(response.status(), `Route liée depuis le guide : ${href}`).toBeLessThan(400);
  }
});

test("les routes principales restent utilisables sur un écran mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of PUBLIC_ROUTES) {
    await page.goto(route.path, { waitUntil: "networkidle" });
    await expect(page.getByRole("main")).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Navigation principale" })).toBeVisible();
    await expectNoHorizontalOverflow(page);
    const firstPrimaryAction = page.locator("main button:visible, main a.buttonLink:visible").first();
    if (await firstPrimaryAction.count()) {
      const box = await firstPrimaryAction.boundingBox();
      expect(box).not.toBeNull();
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(392);
    }
  }
});
