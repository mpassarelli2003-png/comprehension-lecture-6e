const modules = [
  {
    id: "lecture",
    number: "1",
    title: "Lecture — page d’accueil",
    href: "/",
    summary: "Choisir un niveau, un texte et un mode, puis lire et répondre aux questions.",
    steps: [
      "Choisir 6e année, secondaire 1 ou secondaire 2.",
      "Choisir Entraînement pour apprendre avec des aides, ou Simulation pour travailler de façon autonome.",
      "Ouvrir un texte et progresser dans les étapes de lecture.",
      "Répondre à la question en cours et sélectionner une preuve lorsque la consigne l’exige.",
      "Utiliser la rétroaction pour améliorer la réponse sans obtenir la réponse attendue."
    ],
    watch: "La page de lecture est la page d’accueil (/). Il n’existe pas de route séparée /lecture."
  },
  {
    id: "ecriture",
    number: "2",
    title: "Écriture",
    href: "/ecriture",
    summary: "Planifier, rédiger, réviser et corriger un texte en plusieurs étapes visibles.",
    steps: [
      "Choisir le type de texte et lire la situation d’écriture.",
      "Compléter le plan avant de rédiger le brouillon.",
      "En entraînement, lancer l’analyse formative seulement lorsque le brouillon est prêt à être relu.",
      "Réviser selon les cinq critères ministériels, puis effectuer les balayages de correction.",
      "En simulation, utiliser uniquement la liste autonome des cinq critères."
    ],
    watch: "L’analyse indique des zones à relire. Elle ne corrige pas le texte, ne le réécrit pas et ne donne aucune note."
  },
  {
    id: "parcours",
    number: "3",
    title: "Parcours lecture-écriture",
    href: "/parcours",
    summary: "Lire un texte, retenir des informations, puis les réinvestir dans une tâche d’écriture liée.",
    steps: [
      "Choisir un parcours correspondant au niveau de l’élève.",
      "Effectuer la lecture et les questions dans le module de lecture existant.",
      "Revenir au parcours et préparer « Ce que je garde pour écrire ».",
      "Organiser la feuille de notes locale, puis passer à la planification et à l’écriture.",
      "Atteindre la révision pour terminer le parcours et enregistrer un bilan minimal."
    ],
    watch: "La feuille de notes active peut contenir du travail scolaire. Elle reste locale et n’entre jamais dans l’historique administratif minimal."
  },
  {
    id: "progression",
    number: "4",
    title: "Progression",
    href: "/progression",
    summary: "Consulter les tendances de travail enregistrées uniquement dans le navigateur actuel.",
    steps: [
      "Observer les dimensions de lecture les plus travaillées.",
      "Consulter les activités récentes sans réponses complètes.",
      "Voir l’historique minimal de révision d’écriture.",
      "Repérer une prochaine priorité générale.",
      "Effacer les historiques locaux lorsque cela est nécessaire."
    ],
    watch: "La progression n’est ni un bulletin, ni une note ministérielle, ni un dossier scolaire officiel."
  },
  {
    id: "admin",
    number: "5",
    title: "Administration",
    href: "/admin/login",
    summary: "Créer, vérifier, publier, sauvegarder et transférer les contenus locaux.",
    steps: [
      "Ouvrir Admin et utiliser les outils dans l’ordre : création, audits, publication, sauvegarde.",
      "Valider l’audit automatique puis compléter l’audit pédagogique manuel.",
      "Vérifier l’aperçu final et confirmer la relecture avant publication.",
      "Créer une sauvegarde datée avant une modification importante ou un transfert.",
      "Utiliser les exports administratifs minimaux sans contenu scolaire sensible."
    ],
    watch: "L’administration locale ne remplace pas une plateforme institutionnelle, un système de comptes ou une base de données partagée."
  }
];

const roles = [
  {
    title: "Enseignant ou intervenant",
    actions: [
      "Choisir le niveau et le mode selon l’objectif de la séance.",
      "Présenter une seule étape à la fois lorsque l’élève a besoin d’un cadre plus léger.",
      "Observer les stratégies utilisées plutôt que chercher seulement une bonne réponse.",
      "Relire humainement toute production avant d’interpréter la progression."
    ]
  },
  {
    title: "Parent ou personne accompagnatrice",
    actions: [
      "Laisser l’élève lire la consigne et tenter une première réponse.",
      "Aider à retrouver l’étape ou la question, sans dicter la réponse.",
      "Demander : « Quelle partie du texte t’aide? » ou « Qu’est-ce que tu veux vérifier? »",
      "Privilégier de courtes séances et arrêter avant la surcharge."
    ]
  },
  {
    title: "Élève autonome",
    actions: [
      "Commencer en entraînement pour apprendre la démarche.",
      "Utiliser la simulation seulement lorsque les étapes sont connues.",
      "Conserver ses propres mots dans les réponses et les textes.",
      "Demander une vérification humaine lorsqu’un doute demeure."
    ]
  }
];

const privacyRows = [
  ["Travail de lecture en cours", "Peut contenir des réponses et preuves", "Stockage local de reprise du travail"],
  ["Travail d’écriture en cours", "Peut contenir plan, brouillon et version finale", "Stockage local de reprise du travail"],
  ["Feuille de notes du parcours", "Peut contenir des éléments choisis par l’élève", "Clé locale séparée"],
  ["Progression et historiques minimaux", "Métadonnées, compteurs, critères et états", "Aucun texte complet de l’élève"],
  ["Exports administratifs minimaux", "Identifiants, dates, niveaux, états et compteurs", "Aucune réponse, preuve, note active, brouillon ou version finale"]
];

export const metadata = {
  title: "Guide d’utilisation — Compréhension de lecture et écriture",
  description: "Guide intégré pour enseignant, parent, intervenant et élève accompagnant l’utilisation de l’application."
};

export default function GuidePage() {
  return (
    <main className="page guidePage">
      <section className="card hero guideHero">
        <p className="eyebrow">Bloc 16 — Guide intégré</p>
        <h1>Utiliser l’application sans connaître son architecture technique</h1>
        <p className="guideLead">
          Ce guide explique quoi choisir, dans quel ordre utiliser les modules et quelles limites respecter. Il s’adresse aux enseignants, parents, intervenants et personnes qui accompagnent un élève.
        </p>
        <div className="guideQuickLinks" aria-label="Raccourcis du guide">
          <a href="#demarrage">Démarrage rapide</a>
          <a href="#modes">Modes</a>
          <a href="#modules">Modules</a>
          <a href="#confidentialite">Confidentialité</a>
          <a href="#sauvegarde">Sauvegarde</a>
          <a href="#limites">Limites</a>
        </div>
      </section>

      <section className="card" id="demarrage">
        <p className="eyebrow">Commencer</p>
        <h2>Démarrage rapide en cinq décisions</h2>
        <ol className="guideSteps">
          <li><b>Déterminer l’objectif :</b> pratiquer la lecture, écrire, réaliser un parcours complet ou consulter la progression.</li>
          <li><b>Choisir le niveau :</b> 6e année, secondaire 1 ou secondaire 2.</li>
          <li><b>Choisir le mode :</b> entraînement pour apprendre; simulation pour vérifier l’autonomie.</li>
          <li><b>Protéger le travail :</b> rester sur le même appareil ou créer une sauvegarde locale avant un transfert.</li>
          <li><b>Conclure par une vérification humaine :</b> l’application soutient la démarche, mais ne remplace pas le jugement pédagogique.</li>
        </ol>
        <div className="guideActionRow">
          <a className="buttonLink blue" href="/">Commencer une lecture</a>
          <a className="buttonLink yellow" href="/ecriture">Commencer une écriture</a>
          <a className="buttonLink violet" href="/parcours">Ouvrir un parcours complet</a>
        </div>
      </section>

      <section id="modes">
        <p className="eyebrow">Choisir le bon cadre</p>
        <h2>Entraînement ou simulation</h2>
        <div className="guideModeGrid">
          <article className="card guideTraining">
            <h3>Entraînement</h3>
            <p><b>But :</b> apprendre une démarche et recevoir une aide progressive.</p>
            <ul>
              <li>aides de lecture et rappels de stratégie;</li>
              <li>rétroaction formative sur la structure de la réponse;</li>
              <li>feuille de notes guidée dans le parcours;</li>
              <li>analyse d’écriture limitée à des zones à relire;</li>
              <li>possibilité de relancer la révision.</li>
            </ul>
            <p className="statusBox successBox"><b>À utiliser lorsque :</b> l’élève apprend, reprend une stratégie ou a besoin d’un cadre visible.</p>
          </article>
          <article className="card guideSimulation">
            <h3>Simulation</h3>
            <p><b>But :</b> vérifier si l’élève peut utiliser ses stratégies de façon autonome.</p>
            <ul>
              <li>aucune aide de contenu ajoutée;</li>
              <li>aucune réponse attendue révélée;</li>
              <li>feuille de notes limitée à ce que l’élève a déjà constitué;</li>
              <li>cinq autoévaluations ministérielles seulement en écriture;</li>
              <li>aucune correction ou réécriture automatisée.</li>
            </ul>
            <p className="statusBox simulationBox"><b>À utiliser lorsque :</b> la démarche a déjà été enseignée et que l’objectif est l’autonomie.</p>
          </article>
        </div>
        <p className="card warningBox"><b>Règle simple :</b> la simulation ne doit jamais servir à enseigner une nouvelle stratégie. Revenir en entraînement lorsque l’élève ne sait pas comment commencer.</p>
      </section>

      <section className="card" id="niveau">
        <p className="eyebrow">Niveau</p>
        <h2>Comment choisir le niveau</h2>
        <div className="guideLevelGrid">
          <div><b>6e année</b><span>Consignes directes, démarches visibles et priorités limitées.</span></div>
          <div><b>Secondaire 1</b><span>Réponses plus précises, liens mieux expliqués et textes plus longs.</span></div>
          <div><b>Secondaire 2</b><span>Nuance, cohérence, contre-argument et autonomie accrue.</span></div>
        </div>
        <p>Choisir le niveau scolaire actuel comme point de départ. Un niveau plus bas peut servir temporairement à travailler la démarche; il ne constitue pas une évaluation du potentiel de l’élève.</p>
      </section>

      <section id="modules">
        <p className="eyebrow">Procédures</p>
        <h2>Utiliser chaque module</h2>
        <div className="guideModuleGrid">
          {modules.map((module) => (
            <article className="card guideModuleCard" id={module.id} key={module.id}>
              <div className="guideModuleHeading">
                <span aria-hidden="true">{module.number}</span>
                <div>
                  <h3>{module.title}</h3>
                  <p>{module.summary}</p>
                </div>
              </div>
              <ol>
                {module.steps.map((step) => <li key={step}>{step}</li>)}
              </ol>
              <p className="statusBox warningBox"><b>Point de vigilance :</b> {module.watch}</p>
              <a className="buttonLink" href={module.href}>Ouvrir {module.title.toLowerCase()}</a>
            </article>
          ))}
        </div>
      </section>

      <section id="roles">
        <p className="eyebrow">Accompagnement</p>
        <h2>Repères selon votre rôle</h2>
        <div className="guideRoleGrid">
          {roles.map((role) => (
            <article className="card" key={role.title}>
              <h3>{role.title}</h3>
              <ul>{role.actions.map((action) => <li key={action}>{action}</li>)}</ul>
            </article>
          ))}
        </div>
      </section>

      <section className="card" id="progression-guide">
        <p className="eyebrow">Interprétation</p>
        <h2>Lire la progression sans la transformer en note</h2>
        <div className="guideDoDont">
          <div className="successBox">
            <h3>Ce que la progression peut indiquer</h3>
            <ul>
              <li>les dimensions et critères souvent travaillés;</li>
              <li>la fréquence des analyses et simulations;</li>
              <li>une priorité générale à reprendre;</li>
              <li>l’étape atteinte dans un parcours.</li>
            </ul>
          </div>
          <div className="errorBox">
            <h3>Ce qu’elle ne permet pas de conclure</h3>
            <ul>
              <li>une note scolaire ou une cote ministérielle;</li>
              <li>un diagnostic ou un niveau de compétence officiel;</li>
              <li>la qualité complète des idées ou de la langue;</li>
              <li>la progression d’un élève sur plusieurs appareils.</li>
            </ul>
          </div>
        </div>
      </section>

      <section id="confidentialite">
        <p className="eyebrow">Données locales</p>
        <h2>Comprendre ce qui est conservé</h2>
        <p className="card warningBox"><b>Distinction essentielle :</b> les notes actives servent uniquement à reprendre le travail local. Elles ne sont pas incluses dans l’historique minimal ni dans l’export administratif.</p>
        <div className="card guideTableWrap">
          <table className="guideTable">
            <thead>
              <tr><th>Zone</th><th>Contenu possible</th><th>Limite</th></tr>
            </thead>
            <tbody>
              {privacyRows.map(([area, content, limit]) => (
                <tr key={area}><td><b>{area}</b></td><td>{content}</td><td>{limit}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="card">
          <li>Les données restent dans le navigateur et sur l’appareil utilisé.</li>
          <li>Aucun compte élève n’est créé.</li>
          <li>Il n’existe aucune synchronisation automatique entre appareils.</li>
          <li>Effacer les données du navigateur peut supprimer le travail et les historiques locaux.</li>
          <li>La navigation privée peut supprimer les données à la fermeture de la session.</li>
        </ul>
      </section>

      <section className="card" id="sauvegarde">
        <p className="eyebrow">Admin</p>
        <h2>Sauvegarder et transférer les exercices locaux</h2>
        <ol className="guideSteps">
          <li>Ouvrir <a href="/admin/login">Admin</a>, puis la section <b>Sauvegarde, restauration et transfert local</b>.</li>
          <li>Créer une sauvegarde datée avant une restauration, un remplacement ou un changement d’appareil.</li>
          <li>Télécharger le fichier JSON et le conserver dans un emplacement contrôlé.</li>
          <li>Sur l’autre appareil, inspecter le fichier avant de choisir Fusionner ou Remplacer.</li>
          <li>Résoudre explicitement les doublons et conflits d’identifiants.</li>
          <li>Réviser puis republier les exercices restaurés, puisqu’ils reviennent toujours comme brouillons.</li>
        </ol>
        <p className="statusBox successBox"><b>Protection :</b> une copie locale est créée avant chaque restauration. La somme de contrôle détecte une altération accidentelle, mais n’est pas une signature cryptographique.</p>
      </section>

      <section id="limites">
        <p className="eyebrow">Cadre d’utilisation</p>
        <h2>Ce que l’application fait et ne fait pas</h2>
        <div className="guideDoDont">
          <article className="card successBox">
            <h3>L’application peut</h3>
            <ul>
              <li>structurer les étapes de lecture et d’écriture;</li>
              <li>rappeler les stratégies et les critères;</li>
              <li>vérifier des éléments observables de forme;</li>
              <li>indiquer une prochaine action de révision;</li>
              <li>conserver localement le travail en cours;</li>
              <li>produire des historiques minimaux sans texte complet.</li>
            </ul>
          </article>
          <article className="card errorBox">
            <h3>L’application ne peut pas</h3>
            <ul>
              <li>confirmer seule qu’une réponse est juste sur le fond;</li>
              <li>corriger entièrement l’orthographe ou la syntaxe;</li>
              <li>réécrire le texte à la place de l’élève;</li>
              <li>attribuer une note, une cote ou un diagnostic;</li>
              <li>remplacer l’enseignement ou le jugement professionnel;</li>
              <li>récupérer des données locales supprimées sans sauvegarde.</li>
            </ul>
          </article>
        </div>
      </section>

      <section className="card" id="depannage">
        <p className="eyebrow">Dépannage</p>
        <h2>Vérifications simples</h2>
        <details>
          <summary>Une modification récente n’apparaît pas</summary>
          <p>Faire un rechargement complet avec Ctrl + F5. Vérifier ensuite que le bon niveau, le bon mode et le bon appareil sont utilisés.</p>
        </details>
        <details>
          <summary>Le travail local a disparu</summary>
          <p>Vérifier si les données du navigateur ont été effacées, si la navigation privée était active ou si un autre appareil est utilisé. Sans sauvegarde exportée, les données locales supprimées ne peuvent pas être restaurées.</p>
        </details>
        <details>
          <summary>Un exercice restauré n’apparaît pas pour l’élève</summary>
          <p>Les exercices restaurés reviennent volontairement comme brouillons. Compléter les audits, vérifier l’aperçu final et franchir de nouveau la porte de publication.</p>
        </details>
        <details>
          <summary>La simulation semble trop difficile</summary>
          <p>Revenir en entraînement. Enseigner ou reprendre la stratégie, puis utiliser la simulation lors d’une séance distincte.</p>
        </details>
      </section>

      <section className="card guideClosing">
        <h2>Principe directeur</h2>
        <p><b>L’application rend la démarche visible. L’élève demeure l’auteur de ses réponses et de ses textes. La personne qui accompagne demeure responsable du jugement pédagogique.</b></p>
        <div className="guideActionRow">
          <a className="buttonLink blue" href="/">Lecture</a>
          <a className="buttonLink yellow" href="/ecriture">Écriture</a>
          <a className="buttonLink violet" href="/parcours">Parcours complet</a>
          <a className="buttonLink green" href="/progression">Progression</a>
        </div>
      </section>
    </main>
  );
}
