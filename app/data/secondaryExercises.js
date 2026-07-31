const secondaryExercises = [
  {
    id: "sec1-bibliotheque-objets",
    title: "La bibliothèque des objets",
    level: "Secondaire 1",
    textType: "narratif",
    category: "texte littéraire",
    intention: "Lire pour comprendre comment un projet collectif transforme le regard des élèves sur les objets et les personnes.",
    description: "Récit original sur une classe qui crée une bibliothèque où l'on emprunte des objets accompagnés de leur histoire.",
    calibration: {
      version: "1.0",
      targetLevel: "sec1",
      reviewStatus: "approved",
      intendedReadingMinutes: 6,
      difficultyFeatures: ["chronologie non linéaire légère", "motivations implicites", "évolution d’un personnage", "symboles accessibles"]
    },
    text: `Au début de septembre, une étagère vide apparut près du local de français. Personne ne savait qui l’avait installée. Une affiche, attachée avec du ruban bleu, portait seulement ces mots : « Bibliothèque des objets — on prête une histoire autant qu’une chose. »

La plupart des élèves passaient devant sans ralentir. Malik, lui, s’arrêtait chaque matin. Il imaginait des écouteurs, des jeux vidéo ou des outils, mais l’étagère restait vide. Une semaine plus tard, Mme Beaulieu expliqua que chaque groupe devait y déposer un objet pouvant être emprunté pendant quelques jours. Il fallait aussi rédiger une courte fiche racontant pourquoi cet objet méritait d’être partagé.

Les propositions arrivèrent rapidement. Léa apporta un moule à biscuits qui appartenait à sa grand-mère. Thomas déposa une boussole utilisée lors d’une randonnée où il s’était perdu avec son père. Inès prêta un petit appareil photo instantané. Sur sa fiche, elle écrivit qu’elle voulait aider les autres à remarquer ce qu’ils oubliaient de regarder.

Malik ne proposa rien. Il disait qu’il ne possédait aucun objet intéressant. En réalité, il gardait dans son casier un vieux tournevis au manche rouge. Son oncle le lui avait donné lorsqu’ils avaient réparé ensemble une lampe abandonnée. Depuis le déménagement de son oncle, Malik n’avait plus utilisé l’outil, mais il refusait de le jeter.

Un vendredi, l’étagère fut déplacée près de la cafétéria. Les emprunts commencèrent. Des élèves qui se parlaient rarement se mirent à échanger des conseils. Léa expliqua comment éviter que la pâte colle au moule. Thomas montra à une équipe comment orienter une carte. Inès développa une série de photos montrant les petits gestes invisibles de l’école : une chaise replacée, une porte tenue, un crayon prêté.

Quelques jours plus tard, une patte de la table du conseil étudiant se détacha. Plusieurs personnes proposèrent de remplacer la table, mais Malik observa la vis tombée au sol. Il alla chercher son tournevis et répara la patte en quelques minutes. Quand Mme Beaulieu lui demanda pourquoi il gardait cet outil, il raconta enfin l’histoire de la lampe et de son oncle.

Le lundi suivant, le tournevis au manche rouge occupait une place sur l’étagère. Sa fiche disait : « Cet outil ne répare pas seulement les objets. Il me rappelle qu’on peut apprendre quelque chose avec une personne, puis continuer à s’en servir même quand elle est loin. »

À partir de ce moment, la bibliothèque changea. On y trouva encore des objets pratiques, mais aussi des choses modestes : un carnet presque rempli, une pierre ramassée au bord du fleuve, une recette tachée, une paire de jumelles. Chaque objet ouvrait une conversation.

À la fin de l’année, la direction proposa d’acheter une grande vitrine fermée pour protéger la collection. Les élèves refusèrent. Une bibliothèque, expliquèrent-ils, n’était pas faite pour garder les objets immobiles. Elle devait permettre aux histoires de circuler. L’étagère demeura donc ouverte, avec quelques traces d’usure et beaucoup de fiches nouvelles.`,
    questions: [
      q("s1bo-q1", "Quelle règle accompagne chaque objet déposé dans la bibliothèque?", "comprendre", 1, "L’objet doit pouvoir être emprunté et être accompagné d’une fiche racontant son histoire ou son importance.", false, "explicite"),
      q("s1bo-q2", "Quels changements observe-t-on lorsque les emprunts commencent? Donne deux éléments.", "comprendre", 2, "Les élèves échangent des conseils, se parlent davantage et découvrent les histoires liées aux objets.", false, "explicite"),
      q("s1bo-q3", "Pourquoi Malik affirme-t-il d’abord qu’il ne possède rien d’intéressant? Appuie ta réponse sur un indice du texte.", "inferer", 2, "Il croit probablement que son tournevis est trop ordinaire ou il hésite à partager une histoire personnelle liée à son oncle.", false, "inference"),
      q("s1bo-q4", "Que révèle la réparation de la table sur Malik? Explique à l’aide du texte.", "inferer", 2, "Elle révèle qu’il est observateur, compétent et capable de mettre un apprentissage personnel au service du groupe.", false, "inference"),
      q("s1bo-q5", "Que symbolise l’étagère ouverte à la fin du récit?", "interpreter", 2, "Elle symbolise la circulation des histoires, la confiance et le partage plutôt que la conservation immobile.", false, "inference"),
      q("s1bo-q6", "Comment aurais-tu réagi si on t’avait demandé de prêter un objet personnel? Justifie ta réaction en faisant un lien avec le récit.", "reagir", 2, "Réponse personnelle liée à un élément du récit.", true, "reaction"),
      q("s1bo-q7", "Quel objet de la bibliothèque trouves-tu le plus significatif? Nomme un critère et donne un exemple du texte.", "apprecier", 3, "Réponse personnelle avec un critère précis et un exemple du texte.", true, "reaction"),
      q("s1bo-q8", "Le titre « La bibliothèque des objets » est-il bien choisi? Donne ton jugement et justifie-le.", "apprecier", 3, "Le titre est pertinent parce que les objets circulent comme des livres et transmettent des histoires.", true, "reaction")
    ]
  },
  {
    id: "sec1-arbres-ville",
    title: "Pourquoi les villes plantent-elles davantage d’arbres?",
    level: "Secondaire 1",
    textType: "informatif",
    category: "texte explicatif",
    intention: "Lire pour comprendre les effets des arbres urbains, les limites de cette solution et les conditions de réussite d’un projet de verdissement.",
    description: "Texte original expliquant les avantages et les défis du verdissement urbain.",
    calibration: {
      version: "1.0",
      targetLevel: "sec1",
      reviewStatus: "approved",
      intendedReadingMinutes: 7,
      difficultyFeatures: ["relations de cause à effet", "limites d’une solution", "comparaison de points de vue", "vocabulaire scientifique contextualisé"]
    },
    text: `Dans plusieurs villes, les journées très chaudes sont devenues plus difficiles à supporter. Le béton, l’asphalte et les toits foncés absorbent l’énergie du soleil durant la journée, puis la relâchent lentement. Ce phénomène contribue à créer des îlots de chaleur : certains quartiers demeurent beaucoup plus chauds que les secteurs voisins, même après le coucher du soleil.

Planter des arbres constitue une réponse possible. Le feuillage crée de l’ombre sur les trottoirs, les bâtiments et les stationnements. Les arbres libèrent aussi de la vapeur d’eau par leurs feuilles. Ce processus, appelé évapotranspiration, aide à rafraîchir l’air autour d’eux. Un seul arbre ne transforme pas un quartier, mais un réseau d’arbres bien répartis peut réduire l’exposition directe au soleil et rendre les déplacements plus confortables.

Les arbres urbains jouent d’autres rôles. Leurs racines retiennent une partie de l’eau de pluie, ce qui diminue la quantité d’eau qui arrive rapidement dans les égouts. Leurs feuilles captent certaines particules présentes dans l’air. Les espaces verts peuvent également offrir un habitat à des oiseaux et à des insectes pollinisateurs. Enfin, plusieurs personnes disent se sentir plus calmes dans une rue végétalisée que dans un espace entièrement minéral.

Cependant, planter ne suffit pas. Un jeune arbre a besoin d’eau, d’un sol adapté et d’un espace suffisant pour ses racines. Lorsqu’on choisit une espèce trop grande pour l’endroit, ses branches peuvent entrer en conflit avec les fils électriques. Une espèce mal adaptée au climat risque de dépérir. Si tous les arbres appartiennent à la même espèce, une maladie peut détruire une grande partie du couvert végétal.

La répartition pose aussi une question d’équité. Les quartiers les plus chauds ne sont pas toujours ceux qui reçoivent les investissements les plus importants. Or, les personnes vivant dans des logements mal isolés ou sans climatisation sont particulièrement touchées par les vagues de chaleur. Pour être utile, un programme de plantation doit donc tenir compte des températures mesurées, de la vulnérabilité de la population et de l’accès réel aux espaces ombragés.

Certaines municipalités invitent les citoyens à choisir des lieux de plantation ou à adopter un jeune arbre. Cette participation peut améliorer l’entretien et renforcer l’attachement au projet. Elle ne remplace toutefois pas le travail des spécialistes. Des biologistes, des urbanistes et des équipes d’entretien doivent planifier la diversité des espèces, protéger les racines et prévoir les coûts à long terme.

Les arbres ne règlent pas seuls tous les problèmes liés à la chaleur. Les villes peuvent aussi installer des surfaces plus pâles, créer des zones d’eau, améliorer l’isolation des bâtiments et réduire les grandes étendues d’asphalte. Le verdissement devient donc plus efficace lorsqu’il fait partie d’un ensemble de mesures.`,
    questions: [
      q("s1av-q1", "Comment les surfaces foncées contribuent-elles aux îlots de chaleur?", "comprendre", 1, "Elles absorbent l’énergie du soleil et la relâchent lentement, ce qui garde certains quartiers plus chauds.", false, "explicite"),
      q("s1av-q2", "Nomme deux effets positifs des arbres urbains autres que l’ombre.", "comprendre", 2, "Exemples : évapotranspiration, rétention de l’eau, capture de particules, habitat pour la biodiversité, effet apaisant.", false, "explicite"),
      q("s1av-q3", "Pourquoi la diversité des espèces est-elle importante dans un projet de plantation?", "comprendre", 2, "Elle réduit le risque qu’une maladie détruise une grande partie des arbres.", false, "explicite"),
      q("s1av-q4", "Pourquoi un quartier très chaud pourrait-il demeurer peu végétalisé malgré ses besoins? Appuie ton inférence sur le texte.", "inferer", 2, "Les investissements ne sont pas toujours répartis selon les besoins ou la vulnérabilité des résidents.", false, "inference"),
      q("s1av-q5", "Que peut-on déduire de la phrase « planter ne suffit pas »? Donne deux conditions nécessaires à la réussite.", "inferer", 2, "Il faut entretenir, choisir les espèces et les lieux adéquats, prévoir les coûts et répartir les arbres équitablement.", false, "inference"),
      q("s1av-q6", "Quel message principal l’auteur veut-il transmettre au sujet du verdissement urbain?", "interpreter", 2, "Les arbres sont utiles, mais ils doivent être planifiés, entretenus, répartis équitablement et combinés à d’autres mesures.", false, "important"),
      q("s1av-q7", "Quelle mesure présentée te semble la plus utile pour ton milieu? Justifie ta réaction avec un élément du texte.", "reagir", 2, "Réponse personnelle liée à une mesure du texte.", true, "reaction"),
      q("s1av-q8", "Ce texte explique-t-il le sujet de façon équilibrée? Donne un critère et un exemple précis.", "apprecier", 3, "Réponse évaluant l’équilibre entre avantages, limites et conditions de réussite.", true, "reaction")
    ]
  },
  {
    id: "sec2-notifications-ecole",
    title: "Faut-il limiter les notifications pendant les heures d’école?",
    level: "Secondaire 2",
    textType: "opinion",
    category: "texte argumentatif",
    intention: "Lire pour analyser une prise de position nuancée, distinguer les arguments et évaluer leur solidité.",
    description: "Texte original d’opinion sur la gestion des notifications numériques à l’école.",
    calibration: {
      version: "1.0",
      targetLevel: "sec2",
      reviewStatus: "approved",
      intendedReadingMinutes: 8,
      difficultyFeatures: ["thèse nuancée", "contre-argument", "distinction interdiction et autorégulation", "jugement critique"]
    },
    text: `Une notification dure parfois moins d’une seconde : un son, une vibration, un symbole qui apparaît à l’écran. Pourtant, son effet peut se prolonger. L’élève détourne les yeux, se demande qui a écrit, puis tente de retrouver le fil de l’explication. C’est pourquoi certaines écoles envisagent de bloquer toutes les notifications durant les heures de classe.

Cette idée possède un avantage évident. En réduisant les interruptions, on protège les périodes de concentration. Les tâches qui demandent de lire, de résoudre un problème ou d’organiser une pensée deviennent particulièrement difficiles lorsque l’attention est constamment déplacée. Une règle commune peut aussi éviter que chaque enseignant doive négocier séparément l’usage des appareils.

Une interdiction totale soulève toutefois des problèmes. Plusieurs élèves utilisent un téléphone ou une tablette pour consulter un horaire, photographier des notes, accéder à un dictionnaire ou communiquer avec un parent après un changement imprévu. Certaines applications d’aide à l’organisation envoient elles-mêmes des rappels. Bloquer toutes les notifications sans distinction pourrait donc retirer des outils utiles en même temps que les distractions.

Il faut également éviter de présenter la technologie comme l’unique cause du manque d’attention. Le bruit, la fatigue, l’anxiété ou une consigne peu claire peuvent produire le même effet. Un appareil éteint ne garantit pas automatiquement une concentration parfaite. De plus, apprendre à gérer les sollicitations numériques fait partie de l’autonomie que les jeunes devront exercer ailleurs qu’à l’école.

Une solution plus équilibrée consisterait à établir des périodes protégées. Pendant une explication, une lecture ou une évaluation, les notifications non essentielles seraient désactivées. À d’autres moments, l’enseignant pourrait autoriser certains outils. Les élèves apprendraient aussi à utiliser les modes de concentration, à choisir les applications autorisées et à observer l’effet des interruptions sur leur propre travail.

Cette approche exige davantage qu’un règlement affiché au mur. Les adultes doivent expliquer le but des périodes protégées et appliquer les règles de façon cohérente. Les élèves doivent pouvoir signaler un besoin particulier, par exemple lorsqu’un appareil soutient une difficulté d’apprentissage ou une condition médicale. Enfin, l’école devrait évaluer la mesure : les élèves terminent-ils davantage de tâches? Se sentent-ils plus calmes? Les conflits diminuent-ils?

Limiter les notifications peut donc être utile, mais le verbe limiter est important. Il ne s’agit pas de prétendre que tous les usages numériques sont nuisibles. Il s’agit de protéger certains moments, d’enseigner des stratégies et de conserver des exceptions justifiées. Une bonne règle ne cherche pas seulement à empêcher un comportement; elle aide les personnes à comprendre quand et pourquoi elles doivent agir autrement.`,
    questions: [
      q("s2ne-q1", "Quel avantage principal l’auteur associe-t-il à la réduction des notifications?", "comprendre", 1, "La réduction protège les périodes de concentration et limite les interruptions.", false, "explicite"),
      q("s2ne-q2", "Pourquoi une interdiction totale pourrait-elle retirer des outils utiles? Donne deux exemples.", "comprendre", 2, "Les appareils peuvent servir à l’horaire, aux notes, au dictionnaire, aux communications ou à l’organisation.", false, "explicite"),
      q("s2ne-q3", "Que peut-on déduire de la distinction entre « bloquer » et « limiter »?", "inferer", 2, "L’auteur refuse une règle absolue et privilégie une gestion adaptée aux moments et aux besoins.", false, "inference"),
      q("s2ne-q4", "Comment le cinquième paragraphe modifie-t-il la thèse défendue au début du texte?", "interpreter", 2, "Il transforme l’idée d’un blocage général en solution nuancée fondée sur des périodes protégées.", false, "inference"),
      q("s2ne-q5", "Quel rôle l’auteur attribue-t-il à l’école dans le développement de l’autonomie numérique?", "interpreter", 2, "L’école doit enseigner à gérer les sollicitations, expliquer les règles et permettre une réflexion sur les usages.", false, "important"),
      q("s2ne-q6", "Quelle règle sur les notifications te semblerait juste dans une classe? Justifie ta réaction à partir du texte.", "reagir", 2, "Réponse personnelle liée aux périodes protégées, aux exceptions ou à l’autonomie.", true, "reaction"),
      q("s2ne-q7", "L’auteur considère-t-il suffisamment les élèves ayant des besoins particuliers? Évalue cet aspect avec un critère précis.", "apprecier", 3, "Réponse critique sur la prise en compte des exceptions et des mesures d’aide.", true, "reaction"),
      q("s2ne-q8", "Quel argument du texte est le plus convaincant selon toi? Nomme ton critère et explique ton choix.", "apprecier", 3, "Réponse personnelle avec critère de pertinence, logique, faisabilité ou équité.", true, "reaction"),
      q("s2ne-q9", "Le dernier paragraphe constitue-t-il une conclusion efficace? Justifie ton jugement avec deux éléments.", "apprecier", 3, "La conclusion reformule la nuance, précise le but de la règle et élargit la réflexion.", true, "reaction")
    ]
  },
  {
    id: "sec2-lettre-silence",
    title: "Lettre ouverte : redonner une place au silence",
    level: "Secondaire 2",
    textType: "lettre",
    category: "lettre d’opinion",
    intention: "Lire pour analyser la construction d’une lettre d’opinion, son destinataire, ses arguments et ses procédés de persuasion.",
    description: "Lettre ouverte originale proposant des périodes calmes dans les espaces scolaires communs.",
    calibration: {
      version: "1.0",
      targetLevel: "sec2",
      reviewStatus: "approved",
      intendedReadingMinutes: 8,
      difficultyFeatures: ["destinataire explicite", "arguments et concessions", "procédés de persuasion", "évaluation de faisabilité"]
    },
    text: `À la direction et au conseil des élèves,

Notre école offre des lieux pour parler, travailler en équipe, pratiquer un sport et participer à des activités. C’est une richesse. Pourtant, il devient difficile d’y trouver un endroit où rester quelques minutes sans musique, sans conversation forte et sans écran qui diffuse un message.

Je ne demande pas de transformer l’école en bibliothèque silencieuse. Les échanges font partie de la vie collective. Je propose plutôt que certaines zones deviennent calmes pendant des périodes clairement annoncées, notamment avant le début des cours et durant une partie de l’heure du dîner.

Cette mesure aiderait d’abord les élèves qui ont besoin d’un moment pour retrouver leur concentration. Après un cours exigeant ou une interaction stressante, quelques minutes de calme peuvent permettre de reprendre le contrôle de son attention. Il ne s’agit pas d’isoler les personnes, mais de leur offrir un choix supplémentaire.

Une zone calme pourrait aussi soutenir le travail scolaire. Plusieurs élèves tentent de lire ou de terminer une tâche dans des espaces où les discussions se croisent. Les écouteurs ne règlent pas tout : ils peuvent ajouter un autre son et couper l’élève de ce qui se passe autour de lui. Un lieu réellement calme serait plus simple et plus accessible.

Certains craignent qu’une telle zone soit difficile à faire respecter. Cette objection est raisonnable. Une règle vague créerait des conflits. Il faudrait donc choisir un espace limité, afficher les périodes et rappeler que le calme ne signifie pas un silence absolu. Une courte conversation à voix basse pourrait être permise, tandis que les appels, les vidéos et les discussions de groupe seraient déplacés ailleurs.

D’autres diront que l’école manque déjà d’espace. C’est vrai. C’est pourquoi je propose un projet pilote plutôt qu’un changement permanent. Pendant quatre semaines, une partie de la bibliothèque ou une salle disponible pourrait servir de zone calme. Un court questionnaire permettrait ensuite de savoir qui l’a utilisée, à quels moments et pour quelles raisons.

Cette proposition ne répondra pas à tous les besoins. Elle ne remplacera ni les services d’aide ni les mesures destinées aux élèves qui vivent une surcharge importante. Elle pourrait cependant améliorer le quotidien de plusieurs personnes sans retirer les espaces animés à celles qui les apprécient.

Une école accueillante ne se reconnaît pas seulement au nombre d’activités qu’elle organise. Elle se reconnaît aussi à la diversité des façons d’y être présent. Offrir un lieu pour parler et un lieu pour se recentrer, c’est reconnaître que les élèves n’apprennent pas tous dans les mêmes conditions.

Je vous invite donc à essayer cette mesure, à l’évaluer honnêtement et à la modifier selon les résultats. Le silence ne devrait pas être imposé partout. Il devrait simplement être possible quelque part.

Une élève de deuxième secondaire`,
    questions: [
      q("s2ls-q1", "À qui cette lettre est-elle adressée et quelle mesure propose-t-elle?", "comprendre", 2, "Elle s’adresse à la direction et au conseil des élèves et propose des zones calmes à certains moments.", false, "explicite"),
      q("s2ls-q2", "Quelles règles précises permettraient de distinguer une zone calme d’un silence absolu?", "comprendre", 2, "Conversation à voix basse possible; appels, vidéos et discussions de groupe déplacés ailleurs; périodes affichées.", false, "explicite"),
      q("s2ls-q3", "Pourquoi l’autrice propose-t-elle un projet pilote plutôt qu’une mesure permanente?", "inferer", 2, "Elle veut tenir compte du manque d’espace, vérifier l’utilité de la mesure et l’ajuster avant de la rendre permanente.", false, "inference"),
      q("s2ls-q4", "Quel effet produit la phrase « Cette objection est raisonnable » sur le ton de la lettre?", "interpreter", 2, "Elle montre que l’autrice reconnaît un contre-argument et adopte un ton ouvert plutôt que rigide.", false, "inference"),
      q("s2ls-q5", "Comment le dernier paragraphe résume-t-il la position de l’autrice sans répéter exactement les arguments?", "interpreter", 2, "Il oppose l’imposition générale du silence à la possibilité d’un lieu calme et reformule la thèse de manière concise.", false, "important"),
      q("s2ls-q6", "Aurais-tu utilisé une zone calme dans ton école? Justifie ta réaction avec un élément de la lettre.", "reagir", 2, "Réponse personnelle liée aux besoins de concentration, de récupération ou de travail.", true, "reaction"),
      q("s2ls-q7", "La proposition est-elle réaliste? Évalue sa faisabilité à l’aide d’un critère précis et d’un exemple.", "apprecier", 3, "Réponse critique fondée sur l’espace, les règles, le projet pilote ou l’évaluation.", true, "reaction"),
      q("s2ls-q8", "Quel procédé de persuasion te semble le plus efficace dans cette lettre? Explique ton jugement.", "apprecier", 3, "Réponse sur les exemples, les concessions, le ton, la proposition pilote ou la conclusion.", true, "reaction"),
      q("s2ls-q9", "Le titre « Redonner une place au silence » représente-t-il fidèlement la lettre? Justifie avec deux éléments.", "apprecier", 3, "Le titre est fidèle puisqu’il ne demande pas le silence partout, mais une possibilité limitée et organisée.", true, "reaction")
    ]
  }
];

function q(id, prompt, type, points, expectedAnswer, isPersonalAnswer, proofTypeSuggested) {
  return {
    id,
    prompt,
    type,
    points,
    expectedAnswer,
    acceptableAnswers: [],
    isPersonalAnswer,
    proofTypeSuggested,
    correctionUse: isPersonalAnswer ? "exampleOnly" : "teacherOnly",
    hints: buildHints(prompt, type, proofTypeSuggested)
  };
}

function buildHints(prompt, type, proof) {
  const lower = prompt.toLowerCase();
  const first = lower.includes("pourquoi")
    ? "Le mot pourquoi demande une cause, une raison ou une intention."
    : lower.includes("comment")
      ? "Le mot comment demande d’expliquer une manière, une évolution ou un lien."
      : lower.includes("deux")
        ? "La question demande deux éléments distincts."
        : "Repère les mots importants et toutes les parties de la question.";
  const second = proof === "explicite"
    ? "Choisis un passage où l’information est formulée clairement."
    : proof === "reaction"
      ? "Relie ton opinion à un exemple ou à un passage précis du texte."
      : proof === "important"
        ? "Repère l’idée qui organise plusieurs paragraphes."
        : "Réunis au moins un indice du texte et explique le lien avec ton idée.";
  const third = ["reagir", "apprecier", "jugement"].includes(type)
    ? "Formule ton point de vue, nomme ton critère et justifie-le avec le texte."
    : "Réponds avec une idée complète, puis explique comment le texte la soutient.";
  return [first, second, third];
}

export default secondaryExercises;
