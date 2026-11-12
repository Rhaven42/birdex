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
const ESPECES: [string, string][] = /*__ESPECES__*/[];
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
