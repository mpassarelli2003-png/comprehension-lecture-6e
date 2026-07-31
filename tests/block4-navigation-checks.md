# Vérifications ciblées — Bloc 4

Scénarios vérifiés avant fusion :

- le mot-question `qui` n’est pas détecté à l’intérieur de mots comme `équipe`;
- `Qu’est-ce que…` est classé comme `quoi`;
- `où`, `quand`, `combien`, `comment`, `pourquoi` et `quel` sont détectés séparément;
- plusieurs preuves pour une même question comptent comme un seul appui;
- les preuves d’un autre texte ou d’un autre mode ne comptent pas;
- une preuve vide ne compte pas;
- le passage à la question suivante reste bloqué sans appui du texte;
- l’accès à l’étape 5 reste bloqué sans appui du texte;
- la remise finale calcule les preuves depuis le travail réel sauvegardé, et non depuis un ancien état du guide;
- un travail réinitialisé ne conserve plus artificiellement l’autorisation de progresser.

Résultat local : 24 assertions ciblées réussies.
