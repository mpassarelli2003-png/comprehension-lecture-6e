# Bloc 5 — Matrice de validation

## Classification automatique

- mots-question détectés avec frontières de mots;
- `qui` ne doit pas être détecté dans `équipe`;
- `Qu’est-ce que…` doit être classé comme `quoi`;
- distinction entre comprendre, inférer, interpréter, réagir et apprécier;
- distinction entre explicite, implicite, opinion justifiée et jugement critique;
- traitement prudent de `selon toi` selon le contexte;
- détection des nombres minimaux demandés : deux, trois, quatre ou chiffres.

## Cohérence pédagogique

- une question explicite demande une réponse directe et un passage court;
- une inférence demande une déduction, un indice et un lien;
- une interprétation demande un sens, des indices et une explication;
- une réaction demande une réaction personnelle et un lien avec le texte;
- une appréciation demande une opinion, un critère et un exemple;
- le niveau cible est normalisé en 6e, sec1 ou sec2;
- la preuve et la justification peuvent être obligatoires ou facultatives;
- le mode simulation conserve uniquement les exigences de procédure.

## Fiabilité des preuves

- une preuve vide ne compte pas;
- plusieurs preuves pour une question ne comptent qu’une fois à la remise;
- une preuve d’un autre texte ne compte pas;
- une preuve d’un autre mode ne compte pas;
- seules les questions classées `preuve requise` sont considérées dans le blocage final.

## Exécution

Le script `tests/block5-question-classification.mjs` est exécuté par `prebuild` avant `next build`. Toute assertion échouée bloque le déploiement Vercel.
