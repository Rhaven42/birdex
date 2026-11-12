// Critères de la recherche guidée « Quel est cet oiseau ? »
//
// Taille vue de loin : p = petit (jusqu'à un moineau), m = moyen (d'un merle à un pigeon),
// g = grand (canard, buse ou plus). Deux lettres = oiseau à la limite : il apparaît dans les deux classes.
//
// Milieux où on le voit le plus souvent :
//   J = jardin, parc, ville      F = forêt, bois
//   C = champs, prairies, haies, garrigue
//   E = lac, étang, rivière, marais
//   M = bord de mer (plage, côte, estuaire, salins, en mer)
//   R = montagne, rochers, falaises

export type Taille = 'p' | 'm' | 'g';
export type Habitat = 'J' | 'F' | 'C' | 'E' | 'M' | 'R';

const C: Record<string, string> = {
  // Rapaces diurnes
  'Hieraaetus pennatus': 'g FCR', 'Aquila clanga': 'g EC', 'Aquila fasciata': 'g RC', 'Aquila pomarina': 'g FC',
  'Aquila chrysaetos': 'g R', 'Accipiter gentilis': 'g F', 'Pernis apivorus': 'g FC', 'Circus pygargus': 'mg C',
  'Circus aeruginosus': 'g EC', 'Circus cyaneus': 'g C', 'Buteo buteo': 'g CF', 'Circaetus gallicus': 'g CRF',
  'Elanus caeruleus': 'm C', 'Accipiter nisus': 'm FJC', 'Gypaetus barbatus': 'g R', 'Milvus migrans': 'g EC',
  'Milvus milvus': 'g C', 'Neophron percnopterus': 'g R', 'Haliaeetus albicilla': 'g EM', 'Gyps fulvus': 'g R',
  'Aegypius monachus': 'g R', 'Pandion haliaetus': 'g EM',
  'Falco tinnunculus': 'm CJR', 'Falco naumanni': 'm CJ', 'Falco eleonorae': 'm RM', 'Falco columbarius': 'm CM',
  'Falco subbuteo': 'm CEF', 'Falco vespertinus': 'm C', 'Falco peregrinus': 'mg RJM',
  // Rousserolles, hypolaïs
  'Hippolais icterina': 'p FJ', 'Hippolais polyglotta': 'p CJ', 'Acrocephalus melanopogon': 'p E',
  'Acrocephalus schoenobaenus': 'p E', 'Acrocephalus scirpaceus': 'p E', 'Acrocephalus arundinaceus': 'pm E',
  'Acrocephalus palustris': 'p EC', 'Locustella luscinioides': 'p E', 'Locustella naevia': 'p CE',
  'Cettia cetti': 'p E', 'Cisticola juncidis': 'p CE', 'Panurus biarmicus': 'p E', 'Remiz pendulinus': 'p E',
  'Aegithalos caudatus': 'p FJ',
  // Alouettes
  'Melanocorypha calandra': 'pm C', 'Calandrella brachydactyla': 'p C', 'Alauda arvensis': 'p C',
  'Eremophila alpestris': 'p MR', 'Lullula arborea': 'p CF', 'Galerida theklae': 'p C', 'Galerida cristata': 'p C',
  'Alcedo atthis': 'p E',
  // Pingouins
  'Uria aalge': 'm M', 'Fratercula arctica': 'm M', 'Alca torda': 'm M',
  // Canards, oies, cygnes
  'Branta bernicla': 'g M', 'Branta canadensis': 'g ECJ', 'Branta leucopsis': 'g MCE', 'Mareca strepera': 'g E',
  'Anas platyrhynchos': 'g EJM', 'Aix galericulata': 'mg EJ', 'Anas acuta': 'g EM', 'Mareca penelope': 'mg EM',
  'Spatula clypeata': 'mg E', 'Cygnus cygnus': 'g EC', 'Cygnus atratus': 'g EJ', 'Cygnus columbianus': 'g EC',
  'Cygnus olor': 'g EJM', 'Somateria mollissima': 'g M', 'Oxyura jamaicensis': 'm E', 'Aythya collaris': 'mg E',
  'Aythya ferina': 'mg E', 'Aythya marila': 'mg ME', 'Aythya fuligula': 'mg EJ', 'Aythya nyroca': 'm E',
  'Bucephala clangula': 'mg EM', 'Clangula hyemalis': 'mg M', 'Mergus merganser': 'g E', 'Mergus serrator': 'g ME',
  'Mergellus albellus': 'm E', 'Melanitta fusca': 'mg M', 'Melanitta nigra': 'mg M', 'Netta rufina': 'g E',
  'Anser brachyrhynchus': 'g CEM', 'Anser anser': 'g EC', 'Anser serrirostris': 'g EC', 'Anser albifrons': 'g EC',
  'Alopochen aegyptiaca': 'g ECJ', 'Aythya affinis': 'm E', 'Spatula querquedula': 'm E', 'Anas crecca': 'm EM',
  'Tadorna ferruginea': 'g E', 'Tadorna tadorna': 'g ME',
  // Martinets, hirondelles
  'Tachymarptis melba': 'm RJ', 'Apus apus': 'pm J', 'Apus pallidus': 'pm JM',
  'Delichon urbicum': 'p J', 'Riparia riparia': 'p E', 'Ptyonoprogne rupestris': 'p R', 'Cecropis daurica': 'p CR',
  'Hirundo rustica': 'p CJE',
  // Hérons, cigognes, ibis, flamant, grue
  'Egretta garzetta': 'g EM', 'Nycticorax nycticorax': 'g E', 'Ixobrychus minutus': 'm E', 'Botaurus stellaris': 'g E',
  'Ardeola ralloides': 'mg E', 'Ardea alba': 'g E', 'Ardea cinerea': 'g EJC', 'Bubulcus ibis': 'mg CE',
  'Ardea purpurea': 'g E', 'Ciconia ciconia': 'g CE', 'Ciconia nigra': 'g FE', 'Plegadis falcinellus': 'g E',
  'Threskiornis aethiopicus': 'g EC', 'Platalea leucorodia': 'g EM', 'Phoenicopterus roseus': 'g EM', 'Grus grus': 'g CE',
  // Limicoles
  'Burhinus oedicnemus': 'mg C', 'Charadrius dubius': 'pm E', 'Charadrius alexandrinus': 'pm M',
  'Pluvialis squatarola': 'm M', 'Pluvialis apricaria': 'm CM', 'Charadrius hiaticula': 'pm M', 'Charadrius morinellus': 'm RC',
  'Vanellus vanellus': 'm CE', 'Glareola pratincola': 'm EC', 'Haematopus ostralegus': 'mg M',
  'Recurvirostra avosetta': 'mg EM', 'Himantopus himantopus': 'm EM',
  'Limosa limosa': 'mg EMC', 'Limosa lapponica': 'm M', 'Scolopax rusticola': 'm F', 'Calidris ferruginea': 'pm ME',
  'Calidris temminckii': 'p E', 'Calidris falcinellus': 'p M', 'Calidris canutus': 'm M', 'Calidris minuta': 'p ME',
  'Calidris alba': 'pm M', 'Calidris alpina': 'pm ME', 'Calidris maritima': 'pm M', 'Gallinago gallinago': 'm E',
  'Lymnocryptes minimus': 'pm E', 'Tringa nebularia': 'm EM', 'Tringa erythropus': 'm EM', 'Tringa ochropus': 'm E',
  'Tringa totanus': 'm ME', 'Actitis hypoleucos': 'pm EM', 'Tringa stagnatilis': 'm E', 'Tringa glareola': 'pm E',
  'Calidris pugnax': 'm ECM', 'Numenius arquata': 'g MCE', 'Numenius phaeopus': 'mg M', 'Phalaropus lobatus': 'p ME',
  'Phalaropus fulicarius': 'pm M', 'Arenaria interpres': 'm M',
  // Bruants
  'Plectrophenax nivalis': 'p MRC', 'Calcarius lapponicus': 'p MC', 'Emberiza schoeniclus': 'p E', 'Emberiza cia': 'p RC',
  'Emberiza citrinella': 'p C', 'Emberiza hortulana': 'p CR', 'Emberiza calandra': 'pm C', 'Emberiza cirlus': 'p CJ',
  // Divers
  'Caprimulgus europaeus': 'm FC', 'Certhia familiaris': 'p F', 'Certhia brachydactyla': 'p FJ', 'Cinclus cinclus': 'pm ER',
  'Coracias garrulus': 'm C', 'Merops apiaster': 'm CE', 'Upupa epops': 'm CJ', 'Oriolus oriolus': 'm F',
  'Psittacula krameri': 'mg J', 'Pterocles alchata': 'm C', 'Tetrax tetrax': 'mg C', 'Leiothrix lutea': 'p FJ',
  'Tichodroma muraria': 'p R', 'Troglodytes troglodytes': 'p JF',
  // Pigeons, tourterelles, coucous
  'Columba livia': 'm JRM', 'Columba oenas': 'm FC', 'Columba palumbus': 'm JFC', 'Streptopelia turtur': 'm CF',
  'Streptopelia decaocto': 'm JC', 'Clamator glandarius': 'm C', 'Cuculus canorus': 'm FCE',
  // Corvidés
  'Nucifraga caryocatactes': 'm FR', 'Pyrrhocorax graculus': 'm R', 'Pyrrhocorax pyrrhocorax': 'm RM',
  'Coloeus monedula': 'm JCR', 'Corvus frugilegus': 'mg C', 'Corvus cornix': 'mg CJ', 'Corvus corone': 'mg CJ',
  'Corvus corax': 'g RCM', 'Garrulus glandarius': 'm FJ', 'Pica pica': 'mg JC',
  // Fringilles
  'Loxia curvirostra': 'p F', 'Pyrrhula pyrrhula': 'p FJ', 'Carduelis carduelis': 'p JC', 'Coccothraustes coccothraustes': 'p FJ',
  'Linaria flavirostris': 'p MC', 'Linaria cannabina': 'p CJ', 'Fringilla coelebs': 'p JFC', 'Fringilla montifringilla': 'p FC',
  'Serinus serinus': 'p JC', 'Acanthis flammea': 'p F', 'Spinus spinus': 'p FJ', 'Serinus corsicanus': 'p RF',
  'Serinus citrinella': 'p RF', 'Chloris chloris': 'p JC',
  // Plongeons, grèbes, cormorans, oiseaux de mer
  'Gavia arctica': 'g ME', 'Gavia stellata': 'g M', 'Gavia immer': 'g M',
  'Podiceps nigricollis': 'm EM', 'Tachybaptus ruficollis': 'm EJ', 'Podiceps auritus': 'm ME', 'Podiceps cristatus': 'mg EM',
  'Podiceps grisegena': 'mg EM', 'Phalacrocorax aristotelis': 'g M', 'Phalacrocorax carbo': 'g EM',
  'Hydrobates leucorhous': 'pm M', 'Hydrobates pelagicus': 'p M', 'Morus bassanus': 'g M',
  'Fulmarus glacialis': 'mg M', 'Calonectris diomedea': 'g M', 'Puffinus puffinus': 'm M', 'Puffinus mauretanicus': 'm M',
  'Ardenna grisea': 'mg M', 'Ardenna gravis': 'mg M', 'Puffinus yelkouan': 'm M',
  'Stercorarius skua': 'g M', 'Stercorarius parasiticus': 'mg M', 'Stercorarius pomarinus': 'g M',
  // Goélands, mouettes, sternes
  'Larus argentatus': 'g MJ', 'Larus fuscus': 'g MEJ', 'Larus canus': 'mg MEC', 'Ichthyaetus audouinii': 'g M',
  'Larus michahellis': 'g MJE', 'Larus marinus': 'g M', 'Larus cachinnans': 'g EM', 'Chroicocephalus genei': 'mg M',
  'Chlidonias hybrida': 'm E', 'Chlidonias niger': 'm E', 'Xema sabini': 'm M', 'Ichthyaetus melanocephalus': 'm M',
  'Hydrocoloeus minutus': 'm EM', 'Chroicocephalus ridibundus': 'm EMJC', 'Rissa tridactyla': 'mg M',
  'Sterna paradisaea': 'm M', 'Hydroprogne caspia': 'g ME', 'Thalasseus sandvicensis': 'm M', 'Sterna dougallii': 'm M',
  'Gelochelidon nilotica': 'm ME', 'Sternula albifrons': 'pm ME', 'Sterna hirundo': 'm EM',
  // Pies-grièches
  'Lanius minor': 'pm C', 'Lanius senator': 'pm C', 'Lanius collurio': 'p C', 'Lanius excubitor': 'm C',
  'Lanius meridionalis': 'm C',
  // Bergeronnettes, pipits
  'Motacilla cinerea': 'p E', 'Motacilla alba': 'p JCE', 'Motacilla flava': 'p CE', 'Anthus richardi': 'pm C',
  'Anthus trivialis': 'p FC', 'Anthus pratensis': 'p C', 'Anthus petrosus': 'p M', 'Anthus campestris': 'pm C',
  'Anthus spinoletta': 'p RE',
  // Gobemouches, rougegorge, rossignols, rougequeues, tariers, traquets, monticoles
  'Ficedula albicollis': 'p F', 'Muscicapa striata': 'p JF', 'Ficedula hypoleuca': 'p F', 'Muscicapa tyrrhenica': 'p F',
  'Luscinia svecica': 'p E', 'Monticola solitarius': 'pm RMJ', 'Monticola saxatilis': 'pm R', 'Luscinia megarhynchos': 'p FC',
  'Erithacus rubecula': 'p JF', 'Phoenicurus phoenicurus': 'p JF', 'Phoenicurus ochruros': 'p JR', 'Saxicola rubetra': 'p C',
  'Saxicola rubicola': 'p C', 'Oenanthe oenanthe': 'p CRM', 'Oenanthe hispanica': 'p CR',
  // Mésanges
  'Cyanistes caeruleus': 'p JF', 'Poecile montanus': 'p FR', 'Parus major': 'p JF', 'Lophophanes cristatus': 'p F',
  'Periparus ater': 'p FJ', 'Poecile palustris': 'p FJ',
  // Moineaux
  'Passer italiae': 'p J', 'Passer domesticus': 'p JC', 'Passer montanus': 'p CJ', 'Petronia petronia': 'p RC',
  'Montifringilla nivalis': 'p R',
  // Gallinacés
  'Coturnix coturnix': 'p C', 'Phasianus colchicus': 'g CF', 'Tetrastes bonasia': 'm F', 'Tetrao urogallus': 'g FR',
  'Lagopus muta': 'm R', 'Alectoris graeca': 'm R', 'Perdix perdix': 'm C', 'Alectoris rufa': 'm C', 'Lyrurus tetrix': 'mg RF',
  // Pouillots, roitelets
  'Phylloscopus bonelli': 'p F', 'Phylloscopus trochilus': 'p FJ', 'Phylloscopus sibillatrix': 'p F',
  'Phylloscopus collybita': 'p JF', 'Regulus ignicapilla': 'p FJ', 'Regulus regulus': 'p FJ',
  // Pics
  'Dendrocopos leucotos': 'm F', 'Picus canus': 'm F', 'Picus sharpei': 'm FC', 'Dendrocopos major': 'm FJ',
  'Dryobates minor': 'p FJ', 'Dendrocoptes medius': 'm F', 'Dryocopus martius': 'mg F', 'Picoides tridactylus': 'm FR',
  'Picus viridis': 'm JCF', 'Jynx torquilla': 'p CJF',
  // Accenteurs
  'Prunella collaris': 'pm R', 'Prunella modularis': 'p JF',
  // Râles, foulques
  'Fulica atra': 'm EJ', 'Gallinula chloropus': 'm EJ', 'Porzana porzana': 'm E', 'Rallus aquaticus': 'm E',
  'Crex crex': 'm C', 'Porphyrio porphyrio': 'mg E',
  // Sittelles
  'Sitta whiteheadi': 'p FR', 'Sitta europaea': 'p FJ',
  // Rapaces nocturnes
  'Athene noctua': 'm CJ', 'Glaucidium passerinum': 'p FR', 'Strix aluco': 'm FJ', 'Asio flammeus': 'm CE',
  'Bubo bubo': 'g RF', 'Asio otus': 'm FC', 'Aegolius funereus': 'm FR', 'Otus scops': 'pm JC', 'Tyto alba': 'm CJ',
  // Étourneaux
  'Sturnus vulgaris': 'm JC', 'Sturnus unicolor': 'm JC',
  // Fauvettes
  'Curruca conspicillata': 'p C', 'Sylvia atricapilla': 'p JF', 'Curruca curruca': 'p CJ', 'Curruca subalpina': 'p CF',
  'Sylvia borin': 'p FJ', 'Curruca communis': 'p C', 'Curruca melanocephala': 'p CJ', 'Curruca hortensis': 'p CF',
  'Curruca iberiae': 'p C', 'Curruca undata': 'p C', 'Curruca sarda': 'p CM',
  // Grives, merles
  'Turdus viscivorus': 'm FCJ', 'Turdus pilaris': 'm CF', 'Turdus iliacus': 'm CFJ', 'Turdus philomelos': 'm JF',
  'Turdus torquatus': 'm R', 'Turdus merula': 'm JFC',
  // Espèces rares mais régulières (ajout de la vérification avec la liste officielle)
  'Anser fabalis': 'g CE', 'Zapornia parva': 'p E', 'Zapornia pusilla': 'p E', 'Stercorarius longicaudus': 'm M',
  'Phylloscopus ibericus': 'p F', 'Acrocephalus paludicola': 'p E', 'Larus hyperboreus': 'g M', 'Alle alle': 'p M',
  'Buteo lagopus': 'g C', 'Chlidonias leucopterus': 'm E', 'Carpodacus erythrinus': 'p CJ', 'Emberiza melanocephala': 'p C',
  'Passer hispaniolensis': 'p CJ', 'Anthus cervinus': 'p CEM', 'Microcarbo pygmaeus': 'mg E',
};

export interface Critere {
  tailles: Taille[];
  habitats: Habitat[];
}

export const CRITERES: Record<string, Critere> = Object.fromEntries(
  Object.entries(C).map(([sci, v]) => {
    const [t, h] = v.split(' ');
    return [sci, { tailles: t.split('') as Taille[], habitats: h.split('') as Habitat[] }];
  }),
);
