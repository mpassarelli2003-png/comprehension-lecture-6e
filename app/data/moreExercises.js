const moreExercises = [
  {
    id: 'le-surf-au-quebec',
    title: 'Le surf au Québec',
    level: '6e année',
    textType: 'informatif',
    category: 'texte explicatif',
    intention: 'Lire pour comprendre ce qu’est le surf à pagaie, ses origines, ses bienfaits et ses lieux de pratique.',
    description: 'Texte informatif sur le surf à pagaie, aussi appelé SUP.',
    text: `Le surf à pagaie, ou stand up paddle, souvent abrégé SUP, est un sport nautique qui gagne en popularité au Québec. Il consiste à se tenir debout sur une grande planche et à se déplacer à l’aide d’une pagaie. Cette activité peut se pratiquer sur un lac calme, une rivière, une lagune, des eaux côtières ou même dans certains bassins urbains.

L’histoire du surf à pagaie remonte à des temps anciens. Des peuples polynésiens utilisaient déjà des embarcations semblables pour se déplacer sur l’eau. Plus tard, à Hawaï, des surfeurs et des instructeurs ont redécouvert cette façon de se tenir debout sur une planche afin d’observer les vagues et d’accompagner les élèves. Le SUP est ensuite devenu un sport moderne, accessible et apprécié dans plusieurs régions du monde.

Le surf à pagaie offre plusieurs bienfaits physiques. Il renforce les muscles des jambes, des bras et du tronc, améliore la coordination et développe l’équilibre. Comme il demande un effort constant, il peut aussi contribuer à l’endurance cardiovasculaire. Plusieurs personnes l’aiment parce qu’il permet de bouger tout en profitant du plein air.

Le SUP a aussi des effets positifs sur le bien-être. La personne qui pagaie doit suivre le rythme de l’eau, respirer calmement et observer son environnement. Certaines activités combinent même la planche à pagaie avec le yoga, ce qui unit la relaxation mentale, la concentration et l’équilibre physique.

Au Québec, les nombreux lacs et cours d’eau offrent des lieux variés pour pratiquer ce sport. Que l’on cherche une activité paisible ou un défi d’équilibre, le surf à pagaie permet de découvrir la nature autrement.`,
    questions: [
      q('q1','Quel est le nom complet du sport et quel est son principe fondamental ?','comprendre',2,'Le sport s’appelle surf à pagaie ou stand up paddle. Il consiste à se tenir debout sur une planche et à avancer avec une pagaie.',false,'explicite'),
      q('q2','Donne deux bienfaits physiques du surf à pagaie.','comprendre',1,'Il renforce les muscles, améliore la coordination, développe l’équilibre et peut améliorer l’endurance cardiovasculaire.',false,'explicite'),
      q('q3','Où peut-on pratiquer le SUP ? Donne un exemple.','comprendre',1,'On peut le pratiquer sur un lac, une rivière, une lagune, des eaux côtières ou un bassin urbain.',false,'explicite'),
      q('q4','Quelle est l’idée principale du paragraphe sur les origines du SUP ?','comprendre',1,'Le SUP a des origines anciennes et a été redécouvert à Hawaï avant de devenir un sport moderne.',false,'important'),
      q('q5','Quel effet positif le yoga sur planche à pagaie peut-il avoir ?','comprendre',2,'Il peut favoriser la relaxation, la concentration, l’équilibre et le bien-être physique.',false,'explicite'),
      q('q6','Pourquoi ce sport est-il devenu populaire selon toi ?','interpreter',2,'Il est probablement populaire parce qu’il combine activité physique, nature, détente et accessibilité.',false,'inference'),
      q('q7','Conseillerais-tu le SUP à une personne qui a peu d’équilibre ? Explique.','jugement',2,'Réponse personnelle. On peut le conseiller graduellement dans un endroit calme et sécuritaire, car il aide à développer l’équilibre.',true,'reaction')
    ]
  },
  {
    id: 'la-chasse-aux-noix',
    title: 'La chasse aux noix',
    level: '6e année',
    textType: 'narratif',
    category: 'texte littéraire',
    intention: 'Lire pour comprendre comment la planification et le travail d’équipe peuvent mener à la réussite.',
    description: 'Récit d’écureuils qui organisent une récolte de noix grâce à une carte et à la collaboration.',
    text: `Chaque printemps, lorsque la neige fond et que le sol redevient visible, les écureuils de la forêt attendent avec impatience la grande chasse aux noix. Les trésors cachés à l’automne précédent réapparaissent peu à peu sous les feuilles humides et les branches tombées.

Cacahouète, chef de son équipe, a tout prévu. À l’automne, il avait préparé une carte indiquant plusieurs cachettes remplies de noisettes et de glands. Il veut que son équipe remplisse le conteneur à ras bord. Pour y arriver, il distribue les tâches : Pistache doit fouiller près du ruisseau, Cajou et Pacane couvrent la section des feuillus, et Cacahouète s’occupe des conifères.

Grâce à la carte et à l’organisation du groupe, les paniers se remplissent rapidement. Les écureuils courent d’un arbre à l’autre, transportant les noix comme de véritables trésors. Même Cajou, le plus gourmand, résiste à la tentation d’en manger trop pendant la récolte.

De retour à la cabane, Cacahouète félicite ses compagnons. Une équipe rivale, menée par Noisettier, tente de s’approcher de la récolte, mais Cacahouète avait prévu un stratagème pour protéger les réserves. À la fin, l’équipe célèbre sa réussite, fière de son travail, de sa détermination et de son amitié.`,
    questions: [
      q('q1','Quel événement les écureuils attendent-ils chaque printemps ?','comprendre',1,'Ils attendent la grande chasse aux noix.',false,'explicite'),
      q('q2','Qui est le chef de l’équipe ?','comprendre',1,'Cacahouète est le chef de l’équipe.',false,'explicite'),
      q('q3','Que signifie l’expression à ras bord ?','comprendre',1,'Cela signifie rempli jusqu’au bord, à pleine capacité.',false,'explicite'),
      q('q4','Pourquoi la carte est-elle importante pour l’équipe ?','comprendre',2,'La carte est importante parce qu’elle aide l’équipe à localiser les cachettes et à récolter plus efficacement.',false,'important'),
      q('q5','Nomme les membres de l’équipe de Cacahouète.','comprendre',1,'Cacahouète, Cajou, Pistache et Pacane.',false,'explicite'),
      q('q6','Décris un trait de personnalité de Cacahouète avec une preuve du texte.','interpreter',2,'Il est organisé ou prévoyant, car il a préparé une carte et réparti les tâches.',false,'inference'),
      q('q7','Sans la carte, l’équipe aurait-elle ramassé autant de trésors ? Explique.','interpreter',2,'Probablement non, car la carte aidait à trouver les cachettes plus rapidement.',false,'inference'),
      q('q8','Aimerais-tu faire partie de cette équipe ? Explique ta réponse.','reagir',2,'Réponse personnelle appuyée sur l’esprit d’équipe, la stratégie ou l’aventure.',true,'reaction')
    ]
  },
  {
    id: 'le-temps-des-pommes',
    title: 'Le temps des pommes',
    level: '6e année',
    textType: 'informatif',
    category: 'texte informatif',
    intention: 'Lire pour comprendre l’importance agricole, économique, culturelle et nutritive des pommes au Québec.',
    description: 'Texte informatif sur la culture des pommes, les vergers, les produits dérivés et l’agrotourisme.',
    text: `Au Québec, la saison des pommes est un moment très attendu de l'année. C'est l'occasion de profiter de l'abondance de fruits frais et de découvrir les différentes variétés cultivées localement. La culture de la pomme est une activité importante pour l'agriculture québécoise, car elle représente une part significative de la production de fruits dans la région. Les producteurs de pommes locaux sont fiers de leur travail et de leur capacité à produire des pommes de qualité supérieure qui rivalisent avec celles cultivées dans d'autres régions du monde.

La culture de la pomme est une entreprise à long terme qui nécessite une planification minutieuse et une attention constante pour obtenir une récolte réussie. Les agriculteurs doivent sélectionner les meilleures variétés de pommes adaptées à leur région, les planter dans des sols appropriés et les protéger contre les ravageurs et les maladies. La taille régulière des arbres permet également de maximiser la production et d'obtenir des fruits de haute qualité.

Les variétés de pommes disponibles au Québec sont nombreuses, chacune ayant ses propres caractéristiques de goût et d'apparence. Parmi les variétés les plus populaires, on trouve les McIntosh, les Cortland, les Spartan, les Empire, les Paula Red, les Lobo et les Honeycrisp. Ces variétés sont disponibles dans de nombreux vergers locaux pendant la saison des pommes, offrant aux visiteurs la possibilité de cueillir leurs propres pommes et de découvrir les différentes variétés cultivées dans la région.

La cueillette des pommes est une activité populaire pendant la saison des pommes. Les vergers offrent souvent une gamme d'activités supplémentaires pour les visiteurs, telles que des dégustations de cidre, des tours de charrette à foin, des promenades en wagon et des activités pour les enfants. Les vergers sont également des endroits prisés pour les mariages et les événements spéciaux, offrant un cadre pittoresque et rustique pour les célébrations.

En plus d'être consommées fraîches, les pommes du Québec peuvent être transformées en une variété de produits dérivés tels que le cidre, le jus de pomme, les tartes, les compotes, les beurres de pomme et les gelées. Ces produits sont populaires auprès des consommateurs en raison de leur goût, de leur qualité et de leur origine locale. Les pommes sont également un ingrédient clé de la cuisine québécoise, utilisées dans des plats sucrés et salés.

Les pommes sont reconnues pour leur valeur nutritive. Elles sont riches en fibres, en vitamine C et en antioxydants, ce qui en fait un choix sain et pratique pour une collation. La saison des pommes revêt aussi une importance économique, car elle génère des emplois pour les agriculteurs, les cueilleurs, les travailleurs des vergers et les producteurs de produits dérivés. Elle contribue également à l’agrotourisme en attirant des visiteurs locaux et internationaux.`,
    questions: [
      q('q1','Quelle est l’importance de la saison des pommes au Québec ?','comprendre',1,'Elle est importante pour l’agriculture, l’économie, la culture locale et l’agrotourisme.',false,'important'),
      q('q2','Donne trois étapes nécessaires pour cultiver des pommes.','comprendre',3,'Choisir les variétés, planter dans de bons sols, protéger contre les ravageurs et maladies, tailler les arbres.',false,'explicite'),
      q('q3','Nomme quatre variétés de pommes populaires au Québec.','comprendre',4,'McIntosh, Cortland, Spartan, Empire, Paula Red, Lobo ou Honeycrisp.',false,'explicite'),
      q('q4','Quelles activités sont proposées dans les vergers ?','comprendre',1,'Cueillette, dégustations de cidre, tours de charrette à foin, promenades en wagon et activités pour enfants.',false,'explicite'),
      q('q5','Comment les pommes peuvent-elles contribuer à une meilleure santé ?','comprendre',2,'Elles contiennent des fibres, de la vitamine C et des antioxydants.',false,'explicite'),
      q('q6','Quels produits dérivés peut-on obtenir avec des pommes ?','comprendre',2,'Cidre, jus, tartes, compotes, beurres de pomme et gelées.',false,'explicite'),
      q('q7','Que penses-tu de l’importance économique et culturelle des pommes ?','jugement',2,'Réponse personnelle appuyée sur les emplois, l’agrotourisme, les vergers ou les traditions.',true,'reaction')
    ]
  },
  {
    id: 'legende-des-ombres-chinoises',
    title: 'La légende des ombres chinoises',
    level: '6e année',
    textType: 'narratif',
    category: 'texte littéraire',
    intention: 'Lire pour comprendre comment l’imagination de Shanshan devient un don reconnu par sa communauté.',
    description: 'Récit légendaire inspiré des ombres, du zodiaque chinois et de la transmission culturelle.',
    text: `Shanshan vit dans un village en Chine. Depuis son plus jeune âge, elle est fascinée par les ombres. Le soir, lorsqu’une lampe éclaire les murs de sa maison, elle imagine que les formes sombres prennent vie. Certaines lui rappellent les douze animaux du zodiaque chinois : le rat, le bœuf, le tigre, le lapin, le dragon, le serpent, le cheval, la chèvre, le singe, le coq, le chien et le cochon.

Un jour, une ombre de dragon semble se détacher du mur. À la grande surprise de Shanshan, le dragon lui parle : « J’ai entendu parler de toi et de ton amour pour les ombres. J’ai décidé de venir te rencontrer et de te présenter mes amis, les autres animaux du zodiaque. » Shanshan accepte de le suivre dans un voyage extraordinaire à travers les paysages de la Chine.

Au cours de ce voyage, elle rencontre les autres animaux. Chacun lui raconte une partie de son histoire et lui montre une qualité : la patience, la force, la ruse, la loyauté, le courage ou la sagesse. Le dragon explique alors à Shanshan qu’elle possède un don rare : celui de donner vie à ses rêves et à son imagination.

De retour dans son village, Shanshan fabrique des marionnettes représentant les animaux du zodiaque. Elle utilise la lumière, les gestes et les ombres pour raconter leurs histoires aux enfants. Sa popularité grandit rapidement, et bientôt, on l’invite au palais de l’Empereur.

L’Empereur l’accueille lui-même et l’emmène dans une grande salle où plusieurs invités attendent. Shanshan raconte l’histoire des animaux avec passion. À la fin de la représentation, la foule applaudit à l’unisson. Touché par son talent, l’Empereur lui décerne le titre de Gardienne des Ombres. Shanshan est émue et fière : son imagination est devenue une façon de transmettre la culture et de rassembler les gens.`,
    questions: [
      q('q1','Qui a accueilli Shanshan lors de son arrivée au palais ?','comprendre',1,'L’Empereur lui-même.',false,'explicite'),
      q('q2','Où l’Empereur l’a-t-il emmenée ?','comprendre',1,'Dans une grande salle où des invités attendaient.',false,'explicite'),
      q('q3','Comment la foule a-t-elle réagi à la fin de l’histoire ?','comprendre',1,'La foule a applaudi à l’unisson.',false,'explicite'),
      q('q4','Quel titre l’Empereur a-t-il décerné à Shanshan ?','comprendre',1,'Le titre de Gardienne des Ombres.',false,'explicite'),
      q('q5','Qui dit : « Tu es une enfant spéciale, Shanshan » ?','comprendre',2,'Le dragon.',false,'explicite'),
      q('q6','Donne quatre animaux du zodiaque chinois mentionnés dans le texte.','comprendre',1,'Exemples : rat, bœuf, tigre, lapin, dragon, serpent, cheval, chèvre, singe, coq, chien, cochon.',false,'explicite'),
      q('q7','Pourquoi Shanshan peut-elle être considérée comme une personne créative ?','interpreter',2,'Elle transforme les ombres en histoires et crée des marionnettes pour transmettre son imagination.',false,'inference'),
      q('q8','Qu’est-ce que cette légende t’inspire ? Explique.','reagir',2,'Réponse personnelle appuyée sur la créativité, les rêves, la culture ou le courage.',true,'reaction')
    ]
  },
  {
    id: 'avenir-de-la-planete',
    title: 'L’avenir de la planète',
    level: '6e année',
    textType: 'informatif',
    category: 'texte explicatif',
    intention: 'Lire pour comprendre les défis environnementaux et les actions possibles pour protéger la Terre.',
    description: 'Texte informatif sur le changement climatique, la biodiversité, la pollution, la déforestation et les ressources naturelles.',
    text: `La Terre est une planète unique et fascinante, mais elle est confrontée à de nombreux défis environnementaux qui menacent sa santé et sa durabilité. Parmi les défis les plus importants, on trouve le changement climatique, la perte de biodiversité, la pollution, la déforestation et la gestion des ressources naturelles.

Le changement climatique est l’un des défis les plus urgents. Les températures moyennes mondiales ont augmenté d’environ 1 degré Celsius depuis l’époque préindustrielle, et les experts estiment que la planète pourrait dépasser le seuil de 1,5 degré Celsius d’ici 2040. Les effets sont déjà visibles : vagues de chaleur plus fréquentes, sécheresses prolongées, tempêtes plus violentes, augmentation du niveau de la mer et fonte des glaciers et des calottes glaciaires.

La lutte contre le changement climatique nécessite une action concertée à l’échelle mondiale. Il faut réduire les émissions de gaz à effet de serre, investir dans les énergies renouvelables, protéger les forêts et s’adapter aux effets déjà inévitables. Des progrès ont été réalisés, mais il reste encore beaucoup à faire.

La perte de biodiversité est un autre défi majeur. La vie sur Terre dépend de la diversité des espèces et des écosystèmes. Ceux-ci fournissent des services essentiels, comme la pollinisation, la purification de l’eau et de l’air, ainsi que la régulation du climat. En raison des activités humaines, certaines espèces s’éteignent à un rythme beaucoup plus rapide que la normale.

La pollution de l’air, de l’eau et des sols menace aussi la planète. Elle affecte la santé des humains, des animaux et des écosystèmes. La déforestation aggrave la situation, car les forêts produisent de l’oxygène, stockent du carbone et abritent de nombreuses espèces. Pour lutter contre la déforestation, il faut encourager la gestion forestière durable et les pratiques agricoles durables.

L’utilisation excessive et la mauvaise gestion des ressources naturelles peuvent causer l’épuisement des ressources et d’autres problèmes environnementaux. L’avenir de la planète dépend donc de notre capacité à agir ensemble. La coopération internationale, la sensibilisation du public et l’adoption de pratiques durables sont essentielles pour garantir un avenir sain pour la Terre et les générations futures.`,
    questions: [
      q('q1','Quelle est l’augmentation moyenne des températures mondiales depuis l’époque préindustrielle ?','comprendre',1,'Environ 1 degré Celsius.',false,'explicite'),
      q('q2','Quels sont les effets visibles du changement climatique aujourd’hui ? Donne deux exemples.','comprendre',1,'Vagues de chaleur, sécheresses, tempêtes violentes, hausse du niveau de la mer, fonte des glaciers.',false,'explicite'),
      q('q3','Quels services les écosystèmes rendent-ils ? Cite deux exemples.','comprendre',2,'Pollinisation, purification de l’eau et de l’air, régulation du climat.',false,'explicite'),
      q('q4','Quels sont deux moyens mentionnés pour lutter contre la déforestation ?','comprendre',1,'Encourager la gestion forestière durable et les pratiques agricoles durables.',false,'explicite'),
      q('q5','Quelle est la conséquence de l’utilisation excessive et de la mauvaise gestion des ressources naturelles ?','comprendre',1,'Des problèmes environnementaux, comme l’épuisement des ressources.',false,'explicite'),
      q('q6','Pourquoi est-il important de sensibiliser le public à la valeur de la biodiversité ?','interpreter',2,'Parce que la biodiversité soutient la vie sur Terre et que mieux la comprendre peut encourager les gens à la protéger.',false,'inference'),
      q('q7','En quoi la coopération internationale est-elle essentielle pour lutter contre les problèmes environnementaux ?','jugement',2,'Parce que plusieurs problèmes environnementaux dépassent les frontières et demandent des actions communes.',false,'important'),
      q('q8','Pourquoi est-il nécessaire de réduire les émissions de gaz à effet de serre ?','jugement',2,'Pour limiter le changement climatique et éviter des conséquences graves pour la vie sur Terre.',false,'important'),
      q('q9','Que ressens-tu après avoir lu les impacts du changement climatique sur la Terre ? Explique ton opinion.','reagir',2,'Réponse personnelle appuyée sur les impacts mentionnés dans le texte.',true,'reaction'),
      q('q10','Quelle action personnelle pourrais-tu entreprendre pour contribuer à résoudre un des problèmes environnementaux mentionnés ?','reagir',2,'Réponse personnelle : réduire les déchets, économiser l’énergie, protéger la nature, utiliser le transport actif, etc.',true,'reaction')
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
    correctionUse: isPersonalAnswer ? 'exampleOnly' : 'teacherOnly',
    hints: buildHints(prompt, type, proofTypeSuggested)
  };
}

function buildHints(prompt, type, proof) {
  const lower = prompt.toLowerCase();
  const first = lower.includes('pourquoi') ? 'Le mot pourquoi te demande de trouver une raison.' : lower.includes('comment') ? 'Le mot comment te demande d’expliquer la façon, le changement ou les étapes.' : lower.includes('où') ? 'Le mot où te demande de trouver un lieu.' : lower.includes('qui') ? 'Le mot qui te demande de trouver une personne ou un personnage.' : lower.includes('combien') ? 'Le mot combien te demande de trouver un nombre ou une quantité.' : 'Relis la question et encercle les mots importants.';
  const second = proof === 'explicite' ? 'Cherche une phrase où la réponse est écrite clairement.' : proof === 'reaction' ? 'Choisis un passage du texte qui explique ton opinion ou ta réaction.' : proof === 'important' ? 'Cherche une idée importante qui aide à comprendre le message du texte.' : 'Cherche un indice dans le texte et relie-le à ce que tu comprends.';
  const third = type === 'reagir' || type === 'apprecier' || type === 'jugement' ? 'Tu peux commencer par : Je pense que... parce que dans le texte...' : 'Tu peux commencer par reprendre les mots de la question.';
  return [first, second, third];
}

export default moreExercises;
