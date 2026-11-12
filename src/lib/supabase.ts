import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Projet Supabase de Birdex. La clé « publishable » est faite pour être intégrée à l'application :
// la sécurité repose sur les règles d'accès (RLS) définies dans supabase/birdex.sql.
// Ne jamais mettre ici la clé « secret » / « service_role ».
export const SUPABASE_URL = 'https://itsxeyuiwdgwgjlfdfne.supabase.co';
export const SUPABASE_CLE_PUBLIQUE: string = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? 'sb_publishable_wFtaDzlbvee3WtIA1_9vxw_WcWpEZA4';

// Interrupteur : activé seulement une fois la base (supabase/birdex.sql) installée et testée de bout en bout
const COMPTES_OUVERTS = false;

export const comptesActifs = COMPTES_OUVERTS && SUPABASE_CLE_PUBLIQUE.length > 0;

export const supabase: SupabaseClient | null = comptesActifs
  ? createClient(SUPABASE_URL, SUPABASE_CLE_PUBLIQUE, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: 'birdex:session' },
    })
  : null;

export const BUCKET_PHOTOS = 'photos-observations';
