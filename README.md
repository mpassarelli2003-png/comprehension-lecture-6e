# Compréhension de lecture — 6e, secondaire 1 et 2

Application Next.js de pratique en compréhension de lecture avec deux parcours :

- **Entraînement** : étapes guidées, aide vocale, débuts de phrase et indices gradués.
- **Simulation** : aides pédagogiques retirées, travail autonome et remise finale.

## Développement

```bash
npm install
npm run dev
```

## Espace administrateur

L’espace `/admin` est protégé par une session HTTP signée. Configure ces variables d’environnement dans Vercel ou dans `.env.local` :

```bash
ADMIN_PASSWORD=un-mot-de-passe-fort
ADMIN_SESSION_SECRET=une-longue-chaine-aleatoire-differente-du-mot-de-passe
```

La session expire après huit heures. Le tableau de bord permet d’activer les niveaux 6e, secondaire 1 et secondaire 2, d’activer les modes entraînement et simulation, et de valider la structure JSON des exercices.

À cette étape, les réglages pédagogiques sont sauvegardés dans le navigateur utilisé par l’administrateur. Une base de données sera nécessaire pour synchroniser ces réglages entre plusieurs appareils.
