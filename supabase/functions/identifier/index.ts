// ═══════════════════════════════════════════════════════════════════
// Birdex : identification d'un oiseau sur une photo (fonction serveur Supabase)
// FICHIER GÉNÉRÉ par scripts/build-fonction-identifier.mjs à partir de modele.ts : ne pas modifier index.ts à la main.
//
// - Réservée aux utilisateurs connectés (jeton vérifié par Supabase).
// - Limite : 20 identifications par 24 h et par utilisateur (table public.identifications).
// - La clé Anthropic est un secret de la fonction (ANTHROPIC_API_KEY), jamais envoyé au téléphone.
// - Claude ne peut répondre qu'avec des espèces de Birdex ; le résultat est une suggestion.
// ═══════════════════════════════════════════════════════════════════
import { withSupabase } from 'npm:@supabase/server@1';
import Anthropic from 'npm:@anthropic-ai/sdk@1.8.0';

/** [nom scientifique, nom français] des espèces de Birdex */
const ESPECES: [string, string][] = [["Acanthis flammea","Sizerin flammé"],["Accipiter gentilis","Autour des palombes"],["Accipiter nisus","Épervier d'Europe"],["Acrocephalus arundinaceus","Rousserolle turdoïde"],["Acrocephalus melanopogon","Lusciniole à moustaches"],["Acrocephalus palustris","Rousserolle verderolle"],["Acrocephalus schoenobaenus","Phragmite des joncs"],["Acrocephalus scirpaceus","Rousserolle effarvatte"],["Actitis hypoleucos","Chevalier guignette"],["Aegithalos caudatus","Mésange à longue queue"],["Aegolius funereus","Nyctale de Tengmalm"],["Aegypius monachus","Vautour moine"],["Aix galericulata","Canard mandarin"],["Alauda arvensis","Alouette des champs"],["Alca torda","Petit Pingouin"],["Alcedo atthis","Martin-pêcheur d'Europe"],["Alectoris graeca","Perdrix bartavelle"],["Alectoris rufa","Perdrix rouge"],["Alopochen aegyptiaca","Ouette d'Égypte"],["Anas acuta","Canard pilet"],["Anas crecca","Sarcelle d'hiver"],["Anas platyrhynchos","Canard colvert"],["Anser albifrons","Oie rieuse"],["Anser anser","Oie cendrée"],["Anser brachyrhynchus","Oie à bec court"],["Anser serrirostris","Oie de la toundra"],["Anthus campestris","Pipit rousseline"],["Anthus petrosus","Pipit maritime"],["Anthus pratensis","Pipit farlouse"],["Anthus richardi","Pipit de Richard"],["Anthus spinoletta","Pipit spioncelle"],["Anthus trivialis","Pipit des arbres"],["Apus apus","Martinet noir"],["Apus pallidus","Martinet pâle"],["Aquila chrysaetos","Aigle royal"],["Aquila clanga","Aigle criard"],["Aquila fasciata","Aigle de Bonelli"],["Aquila pomarina","Aigle pomarin"],["Ardea alba","Grande aigrette"],["Ardea cinerea","Héron cendré"],["Ardea purpurea","Héron pourpré"],["Ardenna gravis","Puffin majeur"],["Ardenna grisea","Puffin fuligineux"],["Ardeola ralloides","Crabier chevelu"],["Arenaria interpres","Tournepierre à collier"],["Asio flammeus","Hibou des marais"],["Asio otus","Hibou moyen-duc"],["Athene noctua","Chevêche d'Athéna"],["Aythya affinis","Petit Fuligule"],["Aythya collaris","Fuligule à collier"],["Aythya ferina","Fuligule milouin"],["Aythya fuligula","Fuligule morillon"],["Aythya marila","Fuligule milouinan"],["Aythya nyroca","Fuligule nyroca"],["Botaurus stellaris","Butor étoilé"],["Branta bernicla","Bernache cravant"],["Branta canadensis","Bernache du Canada"],["Branta leucopsis","Bernache nonnette"],["Bubo bubo","Hibou grand-duc"],["Bubulcus ibis","Héron garde-bœufs"],["Bucephala clangula","Garrot à œil d'or"],["Burhinus oedicnemus","Œdicnème criard"],["Buteo buteo","Buse variable"],["Calandrella brachydactyla","Alouette calandrelle"],["Calcarius lapponicus","Bruant lapon"],["Calidris alba","Bécasseau sanderling"],["Calidris alpina","Bécasseau variable"],["Calidris canutus","Bécasseau maubèche"],["Calidris falcinellus","Bécasseau falcinelle"],["Calidris ferruginea","Bécasseau cocorli"],["Calidris maritima","Bécasseau violet"],["Calidris minuta","Bécasseau minute"],["Calidris pugnax","Combattant varié"],["Calidris temminckii","Bécasseau de Temminck"],["Calonectris diomedea","Puffin de Scopoli"],["Caprimulgus europaeus","Engoulevent d'Europe"],["Carduelis carduelis","Chardonneret élégant"],["Cecropis daurica","Hirondelle rousseline"],["Certhia brachydactyla","Grimpereau des jardins"],["Certhia familiaris","Grimpereau des bois"],["Cettia cetti","Bouscarle de Cetti"],["Charadrius alexandrinus","Pluvier à collier interrompu"],["Charadrius dubius","Petit Gravelot"],["Charadrius hiaticula","Pluvier grand-gravelot"],["Charadrius morinellus","Pluvier guignard"],["Chlidonias hybrida","Guifette moustac"],["Chlidonias niger","Guifette noire"],["Chloris chloris","Verdier d'Europe"],["Chroicocephalus genei","Goéland railleur"],["Chroicocephalus ridibundus","Mouette rieuse"],["Ciconia ciconia","Cigogne blanche"],["Ciconia nigra","Cigogne noire"],["Cinclus cinclus","Cincle plongeur"],["Circaetus gallicus","Circaète Jean-le-Blanc"],["Circus aeruginosus","Busard des roseaux"],["Circus cyaneus","Busard Saint-Martin"],["Circus pygargus","Busard cendré"],["Cisticola juncidis","Cisticole des joncs"],["Clamator glandarius","Coucou geai"],["Clangula hyemalis","Harelde de Miquelon"],["Coccothraustes coccothraustes","Gros-bec casse-noyaux"],["Coloeus monedula","Choucas des tours"],["Columba livia","Pigeon biset"],["Columba oenas","Pigeon colombin"],["Columba palumbus","Pigeon ramier"],["Coracias garrulus","Rollier d'Europe"],["Corvus corax","Grand corbeau"],["Corvus cornix","Corneille mantelée"],["Corvus corone","Corneille noire"],["Corvus frugilegus","Corbeau freux"],["Coturnix coturnix","Caille des blés"],["Crex crex","Râle des genêts"],["Cuculus canorus","Coucou gris"],["Curruca communis","Fauvette grisette"],["Curruca conspicillata","Fauvette à lunettes"],["Curruca curruca","Fauvette babillarde"],["Curruca hortensis","Fauvette orphée"],["Curruca iberiae","Fauvette passerinette"],["Curruca melanocephala","Fauvette mélanocéphale"],["Curruca sarda","Fauvette sarde"],["Curruca subalpina","Fauvette de Moltoni"],["Curruca undata","Fauvette pitchou"],["Cyanistes caeruleus","Mésange bleue"],["Cygnus atratus","Cygne noir"],["Cygnus columbianus","Cygne siffleur"],["Cygnus cygnus","Cygne chanteur"],["Cygnus olor","Cygne tuberculé"],["Delichon urbicum","Hirondelle de fenêtre"],["Dendrocopos leucotos","Pic à dos blanc"],["Dendrocopos major","Pic épeiche"],["Dendrocoptes medius","Pic mar"],["Dryobates minor","Pic épeichette"],["Dryocopus martius","Pic noir"],["Egretta garzetta","Aigrette garzette"],["Elanus caeruleus","Élanion blanc"],["Emberiza calandra","Bruant proyer"],["Emberiza cia","Bruant fou"],["Emberiza cirlus","Bruant zizi"],["Emberiza citrinella","Bruant jaune"],["Emberiza hortulana","Bruant ortolan"],["Emberiza schoeniclus","Bruant des roseaux"],["Eremophila alpestris","Alouette hausse-col"],["Erithacus rubecula","Rougegorge familier"],["Falco columbarius","Faucon émerillon"],["Falco eleonorae","Faucon d'Éléonore"],["Falco naumanni","Faucon crécerellette"],["Falco peregrinus","Faucon pèlerin"],["Falco subbuteo","Faucon hobereau"],["Falco tinnunculus","Faucon crécerelle"],["Falco vespertinus","Faucon kobez"],["Ficedula albicollis","Gobemouche à collier"],["Ficedula hypoleuca","Gobemouche noir"],["Fratercula arctica","Macareux moine"],["Fringilla coelebs","Pinson des arbres"],["Fringilla montifringilla","Pinson du Nord"],["Fulica atra","Foulque macroule"],["Fulmarus glacialis","Fulmar boréal"],["Galerida cristata","Cochevis huppé"],["Galerida theklae","Cochevis de Thékla"],["Gallinago gallinago","Bécassine des marais"],["Gallinula chloropus","Gallinule poule-d'eau"],["Garrulus glandarius","Geai des chênes"],["Gavia arctica","Plongeon arctique"],["Gavia immer","Plongeon imbrin"],["Gavia stellata","Plongeon catmarin"],["Gelochelidon nilotica","Sterne hansel"],["Glareola pratincola","Glaréole à collier"],["Glaucidium passerinum","Chevêchette d'Europe"],["Grus grus","Grue cendrée"],["Gypaetus barbatus","Gypaète barbu"],["Gyps fulvus","Vautour fauve"],["Haematopus ostralegus","Huîtrier pie"],["Haliaeetus albicilla","Pygargue à queue blanche"],["Hieraaetus pennatus","Aigle botté"],["Himantopus himantopus","Échasse blanche"],["Hippolais icterina","Hypolaïs ictérine"],["Hippolais polyglotta","Hypolaïs polyglotte"],["Hirundo rustica","Hirondelle rustique"],["Hydrobates leucorhous","Océanite cul-blanc"],["Hydrobates pelagicus","Océanite tempête"],["Hydrocoloeus minutus","Mouette pygmée"],["Hydroprogne caspia","Sterne caspienne"],["Ichthyaetus audouinii","Goéland d'Audouin"],["Ichthyaetus melanocephalus","Mouette mélanocéphale"],["Ixobrychus minutus","Blongios nain"],["Jynx torquilla","Torcol fourmilier"],["Lagopus muta","Lagopède alpin"],["Lanius collurio","Pie-grièche écorcheur"],["Lanius excubitor","Pie-grièche grise"],["Lanius meridionalis","Pie-grièche méridionale"],["Lanius minor","Pie-grièche à poitrine rose"],["Lanius senator","Pie-grièche à tête rousse"],["Larus argentatus","Goéland argenté"],["Larus cachinnans","Goéland pontique"],["Larus canus","Goéland cendré"],["Larus fuscus","Goéland brun"],["Larus marinus","Goéland marin"],["Larus michahellis","Goéland leucophée"],["Leiothrix lutea","Léiothrix jaune"],["Limosa lapponica","Barge rousse"],["Limosa limosa","Barge à queue noire"],["Linaria cannabina","Linotte mélodieuse"],["Linaria flavirostris","Linotte à bec jaune"],["Locustella luscinioides","Locustelle luscinioïde"],["Locustella naevia","Locustelle tachetée"],["Lophophanes cristatus","Mésange huppée"],["Loxia curvirostra","Bec-croisé des sapins"],["Lullula arborea","Alouette lulu"],["Luscinia megarhynchos","Rossignol philomèle"],["Luscinia svecica","Gorgebleue à miroir"],["Lymnocryptes minimus","Bécassine sourde"],["Lyrurus tetrix","Tétras lyre"],["Mareca penelope","Canard siffleur"],["Mareca strepera","Canard chipeau"],["Melanitta fusca","Macreuse brune"],["Melanitta nigra","Macreuse noire"],["Melanocorypha calandra","Alouette calandre"],["Mergellus albellus","Harle piette"],["Mergus merganser","Harle bièvre"],["Mergus serrator","Harle huppé"],["Merops apiaster","Guêpier d'Europe"],["Milvus migrans","Milan noir"],["Milvus milvus","Milan royal"],["Monticola saxatilis","Monticole merle-de-roche"],["Monticola solitarius","Monticole merle-bleu"],["Montifringilla nivalis","Niverolle alpine"],["Morus bassanus","Fou de Bassan"],["Motacilla alba","Bergeronnette grise"],["Motacilla cinerea","Bergeronnette des ruisseaux"],["Motacilla flava","Bergeronnette printanière"],["Muscicapa striata","Gobemouche gris"],["Muscicapa tyrrhenica","Gobemouche tyrrhénien"],["Neophron percnopterus","Percnoptère"],["Netta rufina","Nette rousse"],["Nucifraga caryocatactes","Cassenoix moucheté"],["Numenius arquata","Courlis cendré"],["Numenius phaeopus","Courlis corlieu"],["Nycticorax nycticorax","Bihoreau gris"],["Oenanthe hispanica","Traquet oreillard"],["Oenanthe oenanthe","Traquet motteux"],["Oriolus oriolus","Loriot d'Europe"],["Otus scops","Petit-duc scops"],["Oxyura jamaicensis","Érismature rousse"],["Pandion haliaetus","Balbuzard pêcheur"],["Panurus biarmicus","Panure à moustaches"],["Parus major","Mésange charbonnière"],["Passer domesticus","Moineau domestique"],["Passer italiae","Moineau cisalpin"],["Passer montanus","Moineau friquet"],["Perdix perdix","Perdrix grise"],["Periparus ater","Mésange noire"],["Pernis apivorus","Bondrée apivore"],["Petronia petronia","Moineau soulcie"],["Phalacrocorax aristotelis","Cormoran huppé"],["Phalacrocorax carbo","Grand Cormoran"],["Phalaropus fulicarius","Phalarope à bec large"],["Phalaropus lobatus","Phalarope à bec étroit"],["Phasianus colchicus","Faisan de Colchide"],["Phoenicopterus roseus","Flamant rose"],["Phoenicurus ochruros","Rougequeue noir"],["Phoenicurus phoenicurus","Rougequeue à front blanc"],["Phylloscopus bonelli","Pouillot de Bonelli"],["Phylloscopus collybita","Pouillot véloce"],["Phylloscopus sibillatrix","Pouillot siffleur"],["Phylloscopus trochilus","Pouillot fitis"],["Pica pica","Pie bavarde"],["Picoides tridactylus","Pic tridactyle"],["Picus canus","Pic cendré"],["Picus sharpei","Pic de Sharpe"],["Picus viridis","Pic vert"],["Platalea leucorodia","Spatule blanche"],["Plectrophenax nivalis","Bruant des neiges"],["Plegadis falcinellus","Ibis falcinelle"],["Pluvialis apricaria","Pluvier doré"],["Pluvialis squatarola","Pluvier argenté"],["Podiceps auritus","Grèbe esclavon"],["Podiceps cristatus","Grèbe huppé"],["Podiceps grisegena","Grèbe jougris"],["Podiceps nigricollis","Grèbe à cou noir"],["Poecile montanus","Mésange boréale"],["Poecile palustris","Mésange nonnette"],["Porphyrio porphyrio","Talève sultane"],["Porzana porzana","Marouette ponctuée"],["Prunella collaris","Accenteur alpin"],["Prunella modularis","Accenteur mouchet"],["Psittacula krameri","Perruche à collier"],["Pterocles alchata","Ganga cata"],["Ptyonoprogne rupestris","Hirondelle de rochers"],["Puffinus mauretanicus","Puffin des Baléares"],["Puffinus puffinus","Puffin des Anglais"],["Puffinus yelkouan","Puffin yelkouan"],["Pyrrhocorax graculus","Chocard à bec jaune"],["Pyrrhocorax pyrrhocorax","Crave à bec rouge"],["Pyrrhula pyrrhula","Bouvreuil pivoine"],["Rallus aquaticus","Râle d'eau"],["Recurvirostra avosetta","Avocette élégante"],["Regulus ignicapilla","Roitelet à triple bandeau"],["Regulus regulus","Roitelet huppé"],["Remiz pendulinus","Rémiz penduline"],["Riparia riparia","Hirondelle de rivage"],["Rissa tridactyla","Mouette tridactyle"],["Saxicola rubetra","Tarier des prés"],["Saxicola rubicola","Tarier pâtre"],["Scolopax rusticola","Bécasse des bois"],["Serinus citrinella","Venturon montagnard"],["Serinus corsicanus","Venturon corse"],["Serinus serinus","Serin cini"],["Sitta europaea","Sittelle torchepot"],["Sitta whiteheadi","Sittelle corse"],["Somateria mollissima","Eider à duvet"],["Spatula clypeata","Canard souchet"],["Spatula querquedula","Sarcelle d'été"],["Spinus spinus","Tarin des aulnes"],["Stercorarius parasiticus","Labbe parasite"],["Stercorarius pomarinus","Labbe pomarin"],["Stercorarius skua","Grand Labbe"],["Sterna dougallii","Sterne de Dougall"],["Sterna hirundo","Sterne pierregarin"],["Sterna paradisaea","Sterne arctique"],["Sternula albifrons","Sterne naine"],["Streptopelia decaocto","Tourterelle turque"],["Streptopelia turtur","Tourterelle des bois"],["Strix aluco","Chouette hulotte"],["Sturnus unicolor","Étourneau unicolore"],["Sturnus vulgaris","Étourneau sansonnet"],["Sylvia atricapilla","Fauvette à tête noire"],["Sylvia borin","Fauvette des jardins"],["Tachybaptus ruficollis","Grèbe castagneux"],["Tachymarptis melba","Martinet à ventre blanc"],["Tadorna ferruginea","Tadorne casarca"],["Tadorna tadorna","Tadorne de Belon"],["Tetrao urogallus","Grand Tétras"],["Tetrastes bonasia","Gélinotte des bois"],["Tetrax tetrax","Outarde canepetière"],["Thalasseus sandvicensis","Sterne caugek"],["Threskiornis aethiopicus","Ibis sacré"],["Tichodroma muraria","Tichodrome échelette"],["Tringa erythropus","Chevalier arlequin"],["Tringa glareola","Chevalier sylvain"],["Tringa nebularia","Chevalier aboyeur"],["Tringa ochropus","Chevalier cul-blanc"],["Tringa stagnatilis","Chevalier stagnatile"],["Tringa totanus","Chevalier gambette"],["Troglodytes troglodytes","Troglodyte mignon"],["Turdus iliacus","Grive mauvis"],["Turdus merula","Merle noir"],["Turdus philomelos","Grive musicienne"],["Turdus pilaris","Grive litorne"],["Turdus torquatus","Merle à plastron"],["Turdus viscivorus","Grive draine"],["Tyto alba","Effraie des clochers"],["Upupa epops","Huppe fasciée"],["Uria aalge","Guillemot de Troïl"],["Vanellus vanellus","Vanneau huppé"],["Xema sabini","Mouette de Sabine"]];
const NOMS = new Map(ESPECES);
const LIMITE_PAR_JOUR = 20;
const TAILLE_MAX_IMAGE = 1_500_000; // caractères base64 (~1,1 Mo)
const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') });

// Partie fixe de la consigne (mise en cache côté Anthropic : seules la photo et le contexte changent)
const CONSIGNE = `Tu es un ornithologue expert des oiseaux de France métropolitaine. On te montre une photo prise par un utilisateur de l'application Birdex.

Ta mission : proposer les espèces les plus probables, UNIQUEMENT parmi la liste ci-dessous (nom scientifique — nom français).

Règles :
- Base-toi d'abord sur ce qui est visible : silhouette, taille relative, bec, couleurs et motifs du plumage, pattes, milieu.
- La région et le mois indiqués sont des indices secondaires : ils départagent des espèces proches, ils ne remplacent jamais l'image.
- Propose de 1 à 3 espèces, de la plus probable à la moins probable, avec une confiance honnête de 0 à 100. Si deux espèces se ressemblent beaucoup, propose les deux.
- Pour chaque espèce, donne en une phrase courte (en français) les critères visibles qui la désignent.
- "etat" vaut "identifie" si la photo montre clairement un oiseau reconnaissable, "incertain" si l'oiseau est trop loin, flou, de dos, partiellement caché ou si tu hésites fortement, et "pas_oiseau" s'il n'y a pas d'oiseau sur la photo (alors propositions est vide).
- "conseil" : une phrase en français, utile à l'utilisateur (par exemple ce qu'il faudrait vérifier pour trancher, ou comment mieux photographier).

Liste des espèces :
${ESPECES.map(([sci, nom]) => `${sci} — ${nom}`).join('\n')}`;

const SCHEMA = {
  type: 'object',
  properties: {
    etat: { type: 'string', enum: ['identifie', 'incertain', 'pas_oiseau'] },
    propositions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          nomScientifique: { type: 'string', enum: ESPECES.map(([sci]) => sci) },
          confiance: { type: 'integer' },
          criteres: { type: 'string' },
        },
        required: ['nomScientifique', 'confiance', 'criteres'],
        additionalProperties: false,
      },
    },
    conseil: { type: 'string' },
  },
  required: ['etat', 'propositions', 'conseil'],
  additionalProperties: false,
};

const erreur = (message: string, status: number) => Response.json({ erreur: message }, { status });

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    if (req.method !== 'POST') return erreur('Méthode non autorisée.', 405);
    const userId = ctx.userClaims?.id;
    if (!userId) return erreur('Connexion requise.', 401);

    let corps: { image?: unknown; mois?: unknown; region?: unknown; probables?: unknown };
    try {
      corps = await req.json();
    } catch {
      return erreur('Requête invalide.', 400);
    }
    const image = typeof corps.image === 'string' ? corps.image : '';
    if (!image || image.length > TAILLE_MAX_IMAGE || !/^[A-Za-z0-9+/=]+$/.test(image)) return erreur('Photo invalide ou trop lourde.', 400);
    const mois = Number.isInteger(corps.mois) && (corps.mois as number) >= 1 && (corps.mois as number) <= 12 ? (corps.mois as number) : null;
    const region = typeof corps.region === 'string' ? corps.region.slice(0, 60) : null;
    const probables = Array.isArray(corps.probables) ? corps.probables.filter((s): s is string => typeof s === 'string' && NOMS.has(s)).slice(0, 400) : [];

    // Limite par utilisateur (protège la facture)
    const depuis = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const { count, error: errCompte } = await ctx.supabase.from('identifications').select('id', { count: 'exact', head: true }).gte('cree_le', depuis);
    if (errCompte) return erreur('Service momentanément indisponible.', 503);
    if ((count ?? 0) >= LIMITE_PAR_JOUR) return erreur(`Limite atteinte : ${LIMITE_PAR_JOUR} identifications par 24 heures.`, 429);
    const { error: errAjout } = await ctx.supabase.from('identifications').insert({});
    if (errAjout) return erreur('Service momentanément indisponible.', 503);

    const contexte = [
      region ? `Région de l'observation : ${region}.` : 'Région inconnue.',
      mois ? `Mois : ${MOIS[mois - 1]}.` : '',
      probables.length ? `Espèces régulièrement observées dans cette région à cette période (indice secondaire) : ${probables.join(', ')}.` : '',
      'Quelles espèces de la liste correspondent à cet oiseau ?',
    ].filter(Boolean).join('\n');

    try {
      const reponse = await anthropic.beta.messages.create({
        model: 'claude-opus-5-5',
        max_tokens: 16000,
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        output_config: { effort: 'medium', format: { type: 'json_schema', schema: SCHEMA } },
        system: [{ type: 'text', text: CONSIGNE, cache_control: { type: 'ephemeral' } }],
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: image } },
              { type: 'text', text: contexte },
            ],
          },
        ],
      });

      if (reponse.stop_reason === 'refusal') return erreur('Cette photo n’a pas pu être analysée.', 422);
      const bloc = reponse.content.find((b) => b.type === 'text');
      if (!bloc || bloc.type !== 'text') return erreur('Réponse inattendue.', 502);
      const brut = JSON.parse(bloc.text) as { etat: string; propositions: { nomScientifique: string; confiance: number; criteres: string }[]; conseil: string };

      const vus = new Set<string>();
      const propositions = (brut.propositions ?? [])
        .filter((p) => NOMS.has(p.nomScientifique) && !vus.has(p.nomScientifique) && vus.add(p.nomScientifique))
        .map((p) => ({ nomScientifique: p.nomScientifique, confiance: Math.max(0, Math.min(100, Math.round(p.confiance))), criteres: String(p.criteres).slice(0, 300) }))
        .sort((a, b) => b.confiance - a.confiance)
        .slice(0, 3);
      const etat = ['identifie', 'incertain', 'pas_oiseau'].includes(brut.etat) ? brut.etat : 'incertain';

      return Response.json({ etat, propositions, conseil: String(brut.conseil ?? '').slice(0, 300), restant: Math.max(0, LIMITE_PAR_JOUR - (count ?? 0) - 1) });
    } catch (e) {
      if (e instanceof Anthropic.RateLimitError) return erreur('Service très demandé : réessayez dans un instant.', 503);
      if (e instanceof Anthropic.APIError) return erreur('Le service d’identification est indisponible.', 502);
      return erreur('Erreur lors de l’analyse de la photo.', 500);
    }
  }),
};
