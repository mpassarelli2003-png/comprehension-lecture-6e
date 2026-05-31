export const exercises = [
  {
    id: 'aurores-boreales',
    title: 'Les aurores boréales',
    level: '6e année',
    textType: 'informatif',
    category: 'texte explicatif',
    intention: "Comprendre l'origine des aurores boréales, leurs couleurs, leur impact et leur importance culturelle.",
    description: 'Texte informatif sur la formation des aurores boréales, les légendes et la recherche scientifique.',
    text: `Les aurores boréales, ou lumières du nord, sont des phénomènes lumineux naturels qui illuminent principalement les régions polaires de la Terre. Elles trouvent leur origine dans l'interaction des particules chargées du vent solaire avec la haute atmosphère terrestre.

Le vent solaire est composé de particules électriquement chargées, comme des protons et des électrons. Lorsque ces particules atteignent la haute atmosphère, elles entrent en collision avec les gaz atmosphériques, notamment l'oxygène et l'azote. Cette interaction provoque l'apparition de bandes de lumière qui semblent danser dans le ciel.

Les aurores boréales présentent plusieurs couleurs : vert, rose, rouge et violet. Le vert est la couleur la plus courante. Il apparaît souvent lorsque les particules interagissent avec l'oxygène à environ 100 km d'altitude. Les couleurs rouges sont plus rares et proviennent d'interactions à une altitude plus élevée.

Ces phénomènes sont devenus une destination recherchée par les touristes. Dans plusieurs régions polaires, des lieux d'observation permettent aux visiteurs d'admirer ce spectacle naturel tout en découvrant la science qui l'explique.

Les aurores boréales ont aussi inspiré des légendes. Dans la culture inuite, elles sont parfois vues comme les esprits des ancêtres qui dansent dans le ciel. Certains peuples de Scandinavie racontent qu'elles sont causées par des renards polaires qui font jaillir des étincelles avec leur queue. Les Samis y voient le reflet des âmes des défunts.

Aujourd'hui, les aurores boréales fascinent encore les scientifiques, les touristes et les amoureux de la nature. Elles rappellent que notre planète contient des merveilles, de la beauté et des mystères qui méritent d'être explorés. Les chercheurs les étudient aussi parce qu'elles peuvent influencer les communications radio, les réseaux électriques et les systèmes de navigation.`,
    questions: [
      q('q1','Quels sont les deux gaz atmosphériques qui sont ionisés pour créer des aurores boréales ?','comprendre',1,"L'oxygène et l'azote.",false,'explicite'),
      q('q2','Quelles couleurs peut-on observer dans les aurores boréales ?','comprendre',2,'Le vert, le rose, le rouge et le violet. Le vert est la couleur la plus courante.',false,'explicite'),
      q('q3','Qu’est-ce qui cause les aurores boréales ?','comprendre',1,"L'interaction des particules chargées du vent solaire avec la haute atmosphère terrestre.",false,'explicite'),
      q('q4','Où peut-on observer des aurores boréales ?','comprendre',1,'Dans les régions polaires de la Terre.',false,'explicite'),
      q('q5','Pourquoi les aurores boréales fascinent-elles encore les gens aujourd’hui ?','interpreter',2,'Elles fascinent par leur beauté, leur rareté, leur complexité scientifique et les mystères qu’elles conservent.',false,'inference'),
      q('q6','Cite une légende associée aux aurores boréales.','comprendre',1,'Exemple : dans la culture inuite, elles sont les esprits des ancêtres qui dansent dans le ciel.',false,'explicite'),
      q('q7','Qu’est-ce qui t’a le plus intéressé dans ce texte ? Explique.','apprecier',2,'Réponse personnelle appuyée sur un élément du texte.',true,'reaction')
    ]
  },
  {
    id: 'm-vadeboncoeur', title: 'M. Vadeboncoeur', level: '6e année', textType: 'narratif', category: 'texte littéraire',
    intention: 'Comprendre comment des gestes de bonté peuvent transformer une communauté.', description: 'Récit d’un facteur qui réconforte les habitants de son quartier par des lettres.',
    text: `Dans le quartier Des Saules, M. Vadeboncoeur est facteur depuis plus de trente ans. Il connaît chaque habitant et chaque histoire cachée derrière les boîtes aux lettres. À l'approche de sa retraite, il décide d'offrir un peu de douceur aux voisins qui vivent de la solitude ou de la tristesse.

Chaque jour, il glisse dans sa sacoche des lettres ordinaires, mais aussi des mots rédigés de sa main. Mme Dubois, triste depuis la mort de son chien Filou, reçoit une carte avec un chiot et des mots de réconfort. Mme Lavoie, ancienne enseignante, reçoit une lettre ornée de dessins d'enfants. Dr Bergeron, médecin solitaire, reçoit une invitation à un événement communautaire. Juliette reçoit une carte qui l'invite à ralentir et à écouter son rêve de fonder une famille.

Après le départ de M. Vadeboncoeur, le quartier change. Mme Dubois partage son souvenir de Filou avec ses voisins. Mme Lavoie retrouve d’anciens élèves. Dr Bergeron se rend à la fête de quartier. Juliette ralentit son rythme pour réaliser son projet de famille.

Les résidents découvrent que M. Vadeboncoeur était derrière ces lettres. Ils installent une boîte aux lettres spéciale sous le grand chêne et la nomment La Boîte de M. Vadeboncoeur. Cette boîte ne sert pas à recevoir du courrier, mais à envoyer des mots doux aux gens qui en ont besoin.

Le quartier n’est plus seulement un ensemble de maisons : il devient une famille. Lorsque M. Vadeboncoeur revient quelques années plus tard, il comprend que sa vie de facteur a été plus qu’une distribution de courrier. Il a distribué de l’espoir.`,
    questions: [
      q('q1','Quelle est la profession de M. Vadeboncoeur ?','comprendre',1,'Il est facteur.',false,'explicite'),
      q('q2','Pourquoi M. Vadeboncoeur est-il important pour les habitants du quartier Des Saules ?','comprendre',2,'Il est important parce qu’il réconforte les habitants, connaît leurs besoins et aide les voisins à se rapprocher.',false,'inference'),
      q('q3','Décris un acte de gentillesse que M. Vadeboncoeur a fait pour Mme Dubois.','comprendre',1,'Il lui a envoyé une carte avec un chiot et des mots de réconfort pour Filou.',false,'explicite'),
      q('q4','Comment ses actions ont-elles influencé la vie des résidents après sa retraite ?','interpreter',2,'Elles ont créé plus de liens, de réconfort, de rencontres et de solidarité dans le quartier.',false,'inference'),
      q('q5','Que symbolise la Boîte de M. Vadeboncoeur ?','interpreter',1,'Elle symbolise l’héritage de M. Vadeboncoeur et la continuation de sa gentillesse.',false,'important'),
      q('q6','Que penses-tu de la décision de Juliette à la fin de l’histoire ? Explique.','reagir',2,'Réponse personnelle appuyée sur le thème du récit.',true,'reaction'),
      q('q7','Comment l’histoire aurait-elle été différente si M. Vadeboncoeur n’avait pas écrit ces lettres ?','interpreter',1,'Les habitants seraient probablement restés plus isolés et le quartier aurait été moins uni.',false,'inference')
    ]
  },
  {
    id: 'mille-et-un-flocons', title: 'Mille et un flocons', level: '6e année', textType: 'narratif', category: 'texte littéraire',
    intention: 'Comprendre l’imaginaire d’Alice et le sens de sa tradition hivernale.', description: 'Récit poétique où Alice goûte les premiers flocons de neige.',
    text: `Alice attend avec impatience la première tombée de neige. Selon elle, seuls les premiers flocons de la saison offrent une explosion de saveurs. Elle enfile son habit de neige et observe le ciel par la fenêtre.

Lorsque les sapins commencent à danser au loin, Alice comprend que les flocons arrivent. Elle sort avec sa lampe de poche et chuchote : À table mes papilles ! Le premier flocon se pose sur sa lèvre et la fait grimacer : il a l’acidité d’un citron. Le deuxième lui fait sourire, car il goûte la vanille. Puis elle découvre des saveurs de chocolat, de confiture aux fraises, de crème glacée napolitaine, de macaron au caramel et de marron chaud.

Les flocons tombent comme des bonbons venus du ciel. Alice réalise que ces moments sont éphémères, comme les bons moments de la vie, et qu’il faut les savourer. La nuit avance, les lampadaires brillent et les flocons ralentissent leur danse. Alice retourne se coucher en rêvant d’un monde où chaque flocon est une promesse de douceur. Chaque hiver, elle revivra cette tradition avec la même joie.`,
    questions: [
      q('q1','Où se trouve Alice avant la tombée de neige ?','comprendre',1,'Elle se trouve dans la maison, devant la fenêtre.',false,'explicite'),
      q('q2','Durant quelle période de l’année se déroule cette histoire ?','comprendre',1,'En hiver, au moment de la première tombée de neige.',false,'explicite'),
      q('q3','Quel talent d’Alice est souligné ?','comprendre',1,'Elle est une experte en dégustation des flocons de neige.',false,'explicite'),
      q('q4','Pourquoi grimace-t-elle pendant la dégustation ?','comprendre',2,'Parce que le premier flocon est acide comme un citron.',false,'explicite'),
      q('q5','Donne deux saveurs qu’Alice découvre.','comprendre',1,'Exemples : citron, vanille, chocolat, fraise, crème glacée, caramel, marron chaud.',false,'explicite'),
      q('q6','Selon toi, quelle saveur serait la plus populaire ? Explique.','reagir',2,'Réponse personnelle justifiée.',true,'reaction'),
      q('q7','Comment Alice se sent-elle à l’idée de revivre cette tradition chaque hiver ?','interpreter',2,'Elle semble enthousiaste et émerveillée, car elle attend les flocons avec joie.',false,'inference')
    ]
  },
  {
    id: 'pattes-dans-leau', title: 'Pattes dans l’eau', level: '6e année', textType: 'narratif', category: 'texte littéraire',
    intention: 'Comprendre comment l’entraide transforme une difficulté en apprentissage.', description: 'Récit d’un ours polaire qui apprend l’humilité et la natation grâce à sa communauté.',
    text: `Au pays des glaçons, le soleil transforme le village des manchots en parc aquatique. Un ours polaire arrive avec son maillot, sa serviette et ses lunettes fumées. Il veut impressionner les autres, mais il ne sait pas nager.

Dans la piscine à vagues, une vague le soulève et il panique parce qu’il ne touche plus le fond. Un renard se moque de lui, mais un morse plonge pour l’aider. Les pingouins se joignent au sauvetage et forment un cercle autour de lui pour le guider jusqu’à la rive.

L’ours avoue qu’il voulait impressionner les autres. Son ami morse lui rappelle que l’apprentissage n’a pas d’âge. L’ours accepte alors de rejoindre les blanchons dans la zone peu profonde pour apprendre à nager. Il apprend à flotter, à battre des pattes et à plonger la tête sous l’eau.

Peu à peu, l’ours devient un symbole de persévérance. La communauté comprend que la peur et l’humiliation peuvent se transformer en occasions de solidarité.`,
    questions: [
      q('q1','Pourquoi l’ours s’est-il retrouvé en difficulté dans la piscine à vagues ?','comprendre',1,'Il ne savait pas nager et une vague l’a empêché de toucher le sol.',false,'explicite'),
      q('q2','Nomme les animaux qui lui sont venus en aide.','comprendre',1,'Le morse et les pingouins.',false,'explicite'),
      q('q3','Dans le texte, le mot blanchons fait référence à quoi ?','comprendre',1,'À des petits manchots.',false,'explicite'),
      q('q4','Comment la communauté a-t-elle réagi face à la détresse de l’ours ?','comprendre',1,'Elle a collaboré pour le sauver.',false,'important'),
      q('q5','Que révèle le comportement de l’ours lorsqu’il rejoint les blanchons ?','interpreter',1,'Il veut surmonter sa peur et apprendre à nager malgré son humiliation.',false,'inference'),
      q('q6','Quelle leçon l’ours a-t-il apprise ?','comprendre',2,'Il a appris l’importance de l’apprentissage, de l’humilité et de la solidarité.',false,'important'),
      q('q7','Comment te sentirais-tu si tu étais l’ours dans cette situation ?','reagir',2,'Réponse personnelle appuyée sur la peur, la gêne ou la reconnaissance.',true,'reaction')
    ]
  },
  {
    id: 'pirouette-dans-les-airs', title: 'Pirouette dans les airs', level: '6e année', textType: 'narratif', category: 'texte littéraire',
    intention: 'Comprendre les essais d’un personnage créatif qui cherche une solution.', description: 'Récit d’un écureuil inventif qui veut voler pour trouver une feuille précieuse.',
    text: `Pirouette rêve de la plus belle feuille d’érable, une feuille rubis aux pointes dorées. Il comprend qu’il n’arrivera pas à temps s’il doit grimper tous les arbres de la forêt. Il décide donc de fabriquer un casque volant.

Il utilise un fruit de chêne comme casque et des fruits d’érable comme hélices. Il demande conseil à Charlo la marmotte, qui propose de l’argile et de l’eau, mais le mélange brise les hélices. Une hirondelle propose ensuite une pâte de feuilles mâchées, mais les hélices deviennent trop mouillées.

Pirouette cherche encore. En appuyant sa tête contre un sapin, ses oreilles collent à la sève. Il a alors une idée : utiliser la sève pour fixer les hélices. Cette fois, son engin fonctionne. Il s’élance, vole au-dessus des sommets et aperçoit enfin la feuille rubis qu’il cherchait.`,
    questions: [
      q('q1','Quel est le rêve de Pirouette ?','comprendre',1,'Mettre la patte sur la feuille rubis.',false,'explicite'),
      q('q2','Où est l’atelier du bricoleur ?','comprendre',1,'Au pied de l’arbre où il vit.',false,'explicite'),
      q('q3','Décris un trait de personnalité de Pirouette avec une preuve.','comprendre',1,'Il est créatif ou persévérant, car il essaie plusieurs solutions.',false,'inference'),
      q('q4','Pourquoi va-t-il chez Charlo ?','comprendre',1,'Pour lui demander conseil.',false,'explicite'),
      q('q5','Que veut dire aller comme un gant ?','comprendre',1,'Cela signifie que quelque chose convient parfaitement.',false,'explicite'),
      q('q6','Qui dit « C’est elle ! » ?','comprendre',1,'Pirouette.',false,'explicite'),
      q('q7','Si Pirouette ne s’était pas collé les oreilles dans la sève, comment aurait-il trouvé une solution ?','interpreter',2,'Réponse plausible : il aurait essayé d’autres matériaux ou demandé d’autres conseils.',true,'inference')
    ]
  },
  {
    id: 'le-surf-au-quebec', title: 'Le surf au Québec', level: '6e année', textType: 'informatif', category: 'texte explicatif',
    intention: 'Comprendre ce qu’est le SUP, ses origines, ses bienfaits et ses lieux de pratique.', description: 'Texte informatif sur le surf à pagaie.',
    text: `Le surf à pagaie, ou stand up paddle (SUP), est un sport nautique de plus en plus populaire. Il consiste à se tenir debout sur une planche et à se déplacer avec une pagaie.

L’histoire du SUP remonte aux temps anciens, où il était utilisé comme moyen de transport par les rois polynésiens. Il a ensuite été redécouvert à Hawaï dans les années 40 et 50 et a joué un rôle dans l’évolution du surf moderne.

Le SUP a plusieurs bienfaits. Il renforce les muscles, améliore la coordination, favorise la posture et offre un entraînement cardiovasculaire. Il procure aussi du calme, car la personne se connecte à la nature et au rythme de l’eau. Le yoga sur planche à pagaie combine relaxation mentale et équilibre physique.

Le SUP peut se pratiquer dans plusieurs environnements : lacs, rivières, lagunes, eaux côtières et bassins urbains. Au Québec, il permet de varier les lieux et les expériences.`,
    questions: [
      q('q1','Quel est le nom complet du sport et son principe fondamental ?','comprendre',2,'Le surf à pagaie ou SUP; se déplacer debout sur une planche avec une pagaie.',false,'explicite'),
      q('q2','Donne deux bienfaits du SUP.','comprendre',1,'Renforcement musculaire, coordination, posture, cardio, relaxation.',false,'explicite'),
      q('q3','Où peut-on pratiquer le SUP ? Donne un exemple.','comprendre',1,'Sur un lac, une rivière, une lagune, en eaux côtières ou dans un bassin urbain.',false,'explicite'),
      q('q4','Quelle est l’idée principale du paragraphe sur les racines du SUP ?','comprendre',1,'Le SUP a des origines anciennes polynésiennes et a été redécouvert à Hawaï.',false,'important'),
      q('q5','Quel est l’effet positif du yoga sur planche à pagaie ?','comprendre',2,'Il unit relaxation mentale et entraînement physique.',false,'explicite'),
      q('q6','Comment expliquerais-tu que ce sport est devenu populaire ?','interpreter',2,'Il est polyvalent, accessible et combine nature, équilibre, activité physique et relaxation.',false,'inference'),
      q('q7','Si ton équilibre est mauvais, conseillerais-tu le SUP ? Pourquoi ?','jugement',2,'Réponse personnelle; on peut le conseiller graduellement pour travailler l’équilibre en sécurité.',true,'reaction')
    ]
  },
  {
    id: 'la-chasse-aux-noix', title: 'La chasse aux noix', level: '6e année', textType: 'narratif', category: 'texte littéraire',
    intention: 'Comprendre le rôle de la planification et du travail d’équipe.', description: 'Récit d’écureuils qui organisent une grande récolte.',
    text: `Chaque printemps, les écureuils attendent la chasse aux noix. Quand la neige fond, les noisettes cachées réapparaissent. Cacahouète, chef de son équipe, a préparé une carte des trésors à l’automne précédent.

Il veut remplir leur conteneur à ras bord. Il distribue les tâches : Pistache s’occupe du ruisseau, Cajou et Pacane couvrent la section des feuillus, et Cacahouète s’occupe des conifères. Grâce à la carte et au travail d’équipe, les paniers se remplissent rapidement.

De retour à la cabane, Cacahouète félicite chacun. Une équipe rivale menée par Noisettier tente de voler une partie de la récolte, mais Cacahouète avait prévu un stratagème. À la fin, l’équipe célèbre sa récolte, son amitié et sa détermination.`,
    questions: [
      q('q1','Quel événement est attendu par les écureuils chaque printemps ?','comprendre',1,'La chasse aux noix.',false,'explicite'),
      q('q2','Où se rassemble l’équipe de Cacahouète ?','comprendre',1,'Dans leur cabane secrète, dans les arbres.',false,'explicite'),
      q('q3','Décris un trait de personnalité de Cacahouète avec une preuve.','comprendre',2,'Il est prévoyant ou organisé, car il a préparé une carte et un plan.',false,'inference'),
      q('q4','Qui aurait été le plus tenté de manger des noix ?','comprendre',1,'Cajou, parce qu’il est le plus gourmand.',false,'explicite'),
      q('q5','Quelle est la raison principale de la réussite de l’équipe ?','comprendre',1,'La planification et le travail d’équipe.',false,'important'),
      q('q6','Que signifie à ras bord ?','comprendre',1,'Rempli jusqu’au bord.',false,'explicite'),
      q('q7','Sans carte, l’équipe aurait-elle ramassé autant de trésors ? Explique.','interpreter',2,'Probablement moins, car la carte aide à localiser les cachettes.',false,'inference')
    ]
  },
  {
    id: 'le-temps-des-pommes', title: 'Le temps des pommes', level: '6e année', textType: 'informatif', category: 'texte informatif',
    intention: 'Comprendre l’importance agricole, économique, culturelle et nutritive des pommes au Québec.', description: 'Texte informatif sur la saison des pommes.',
    text: `Au Québec, la saison des pommes est un moment très attendu. Elle permet de profiter de fruits frais et de découvrir des variétés locales. La culture de la pomme est importante pour l’agriculture québécoise.

Cultiver des pommes demande une planification minutieuse. Les producteurs doivent choisir les bonnes variétés, planter dans des sols appropriés, protéger les arbres contre les ravageurs et les maladies, puis les tailler régulièrement.

Parmi les variétés populaires, on trouve les McIntosh, Cortland, Spartan, Empire, Paula Red, Lobo et Honeycrisp. Les vergers offrent souvent la cueillette, des dégustations de cidre, des promenades en wagon, des tours de charrette à foin et des activités pour les enfants.

Les pommes peuvent être transformées en cidre, jus, tartes, compotes, beurres de pomme et gelées. Elles contiennent des fibres, de la vitamine C et des antioxydants. La saison des pommes soutient aussi l’économie, les emplois et l’agrotourisme.`,
    questions: [
      q('q1','Quelle est l’importance de la saison des pommes au Québec ?','comprendre',1,'Elle est importante pour l’agriculture, l’économie, la culture et l’agrotourisme.',false,'important'),
      q('q2','Donne trois étapes nécessaires pour cultiver des pommes.','comprendre',3,'Choisir les variétés, planter dans de bons sols, protéger les arbres, les tailler.',false,'explicite'),
      q('q3','Nomme quatre variétés de pommes populaires au Québec.','comprendre',4,'McIntosh, Cortland, Spartan, Empire, Paula Red, Lobo, Honeycrisp.',false,'explicite'),
      q('q4','Quelles activités sont proposées aux visiteurs dans les vergers ?','comprendre',1,'Dégustations de cidre, charrette à foin, wagon, activités pour enfants.',false,'explicite'),
      q('q5','Comment les pommes peuvent-elles contribuer à une meilleure santé ?','comprendre',2,'Elles contiennent des fibres, de la vitamine C et des antioxydants.',false,'explicite'),
      q('q6','Quels produits dérivés peut-on obtenir à partir des pommes ?','comprendre',2,'Cidre, jus, tartes, compotes, beurres de pomme, gelées.',false,'explicite'),
      q('q7','Que penses-tu de l’importance économique et culturelle des pommes ?','jugement',2,'Réponse personnelle appuyée sur le texte.',true,'reaction')
    ]
  },
  {
    id: 'legende-des-ombres-chinoises', title: 'La légende des ombres chinoises', level: '6e année', textType: 'narratif', category: 'texte littéraire',
    intention: 'Comprendre comment l’imagination de Shanshan devient une mission culturelle.', description: 'Récit fantastique autour des ombres et du zodiaque chinois.',
    text: `Shanshan vit dans un village en Chine. Elle est fascinée par les ombres et s’imagine que certaines prennent la forme des douze animaux du zodiaque chinois : rat, bœuf, tigre, lapin, dragon, serpent, cheval, chèvre, singe, coq, chien et cochon.

Un jour, une ombre de dragon prend vie. Le dragon dit à Shanshan qu’il a entendu parler de son amour pour les ombres et veut lui présenter les autres animaux. Ensemble, ils vivent un voyage extraordinaire à travers la Chine.

Le dragon explique à Shanshan qu’elle a un don pour donner vie à ses rêves et à son imagination. De retour chez elle, elle crée des marionnettes des animaux du zodiaque et raconte leur histoire aux enfants. Sa popularité grandit et elle est invitée au palais de l’Empereur.

L’Empereur l’accueille et l’emmène dans une grande salle. Shanshan raconte son histoire avec passion. À la fin, tout le monde applaudit. L’Empereur lui décerne le titre de Gardienne des Ombres. Shanshan est émue et fière.`,
    questions: [
      q('q1','Qui a accueilli Shanshan lors de son arrivée ?','comprendre',1,'L’Empereur lui-même.',false,'explicite'),
      q('q2','Où l’Empereur l’a-t-il emmenée ?','comprendre',1,'Dans une grande salle où des invités attendaient.',false,'explicite'),
      q('q3','Comment la foule a-t-elle réagi à la fin de l’histoire ?','comprendre',1,'Tout le monde a applaudi à l’unisson.',false,'explicite'),
      q('q4','Quel titre l’Empereur a-t-il décerné à Shanshan ?','comprendre',1,'Gardienne des Ombres.',false,'explicite'),
      q('q5','Qui dit : Tu es une enfant spéciale, Shanshan ?','comprendre',2,'Le dragon.',false,'explicite'),
      q('q6','Donne quatre animaux du zodiaque chinois.','comprendre',1,'Exemples : rat, bœuf, tigre, lapin, dragon, serpent, cheval, chèvre, singe, coq, chien, cochon.',false,'explicite'),
      q('q7','Qu’est-ce que cette légende t’inspire ? Explique.','reagir',2,'Réponse personnelle appuyée sur la créativité, les rêves ou la culture.',true,'reaction')
    ]
  },
  {
    id: 'avenir-de-la-planete', title: 'L’avenir de la planète', level: '6e année', textType: 'informatif', category: 'texte explicatif',
    intention: 'Comprendre les défis environnementaux et les actions possibles.', description: 'Texte informatif sur le changement climatique, la biodiversité, la pollution et les ressources naturelles.',
    text: `La Terre fait face à plusieurs défis environnementaux : changement climatique, perte de biodiversité, pollution, déforestation et mauvaise gestion des ressources naturelles.

Le changement climatique est urgent. Les températures moyennes mondiales ont augmenté d’environ 1 degré Celsius depuis l’époque préindustrielle. Les effets visibles comprennent les vagues de chaleur, les sécheresses, les tempêtes plus violentes, la hausse du niveau de la mer et la fonte des glaciers.

La biodiversité est essentielle, car les écosystèmes rendent des services vitaux : pollinisation, purification de l’eau et de l’air, régulation du climat. Pourtant, les activités humaines accélèrent l’extinction des espèces.

La pollution de l’air, de l’eau et du sol affecte les humains, les animaux et les écosystèmes. La déforestation menace aussi la planète, car les forêts produisent de l’oxygène, stockent du carbone et abritent de nombreuses espèces.

Pour agir, il faut réduire les émissions de gaz à effet de serre, utiliser des énergies renouvelables, protéger les forêts, adopter des pratiques durables et coopérer à l’échelle internationale.`,
    questions: [
      q('q1','Quelle est l’augmentation moyenne des températures depuis l’époque préindustrielle ?','comprendre',1,'Environ 1 degré Celsius.',false,'explicite'),
      q('q2','À quel rythme les espèces s’éteignent-elles selon le texte ?','comprendre',1,'De 100 à 1 000 fois plus rapidement que la normale.',false,'explicite'),
      q('q3','Donne deux effets visibles du changement climatique.','comprendre',1,'Vagues de chaleur, sécheresses, tempêtes, hausse du niveau de la mer, fonte des glaciers.',false,'explicite'),
      q('q4','Quels services les écosystèmes rendent-ils ? Donne deux exemples.','comprendre',2,'Pollinisation, purification de l’eau et de l’air, régulation du climat.',false,'explicite'),
      q('q5','Pourquoi faut-il réduire les émissions de gaz à effet de serre ?','jugement',1,'Pour lutter contre le changement climatique et éviter des conséquences graves.',false,'important'),
      q('q6','Pourquoi la coopération internationale est-elle essentielle ?','jugement',2,'Parce que plusieurs problèmes environnementaux dépassent les frontières.',false,'inference'),
      q('q7','Quelle action personnelle pourrais-tu entreprendre pour aider ?','reagir',2,'Réponse personnelle : réduire les déchets, économiser l’énergie, prendre le transport en commun, etc.',true,'reaction')
    ]
  }
];

const grid = [
  "J'ai compris l'idée principale et les éléments importants.",
  "J'ai trouvé les informations écrites clairement dans le texte.",
  "J'ai compris les informations qui ne sont pas dites directement.",
  "Mon interprétation est logique et fidèle au texte.",
  "J'ai donné mon avis ou ma réaction avec une preuve du texte.",
  "J'ai exprimé mon appréciation avec un exemple précis."
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
  const first = lower.includes('pourquoi') ? 'Le mot pourquoi te demande de trouver une raison.' : lower.includes('comment') ? 'Le mot comment te demande d’expliquer la façon ou le changement.' : lower.includes('où') ? 'Le mot où te demande de trouver un lieu.' : lower.includes('qui') ? 'Le mot qui te demande de trouver une personne ou un personnage.' : 'Relis la question et encercle les mots importants.';
  const second = proof === 'explicite' ? 'Cherche une phrase où la réponse est écrite clairement.' : proof === 'reaction' ? 'Choisis un passage du texte qui explique ton opinion ou ta réaction.' : 'Cherche un indice dans le texte et relie-le à ce que tu comprends.';
  const third = type === 'reagir' || type === 'apprecier' || type === 'jugement' ? 'Tu peux commencer par : Je pense que... parce que dans le texte...' : 'Tu peux commencer par reprendre les mots de la question.';
  return [first, second, third];
}

export function getAutoCorrectionGrid() { return grid; }
export default exercises;
