import type { Session } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { BUCKET_PHOTOS, supabase } from './supabase';
import { depuisLigne, estUuid, planifier, versLigne, type LigneObservation } from './fusion';
import { appliquerSynchro, chargerCarnet, chargerSupprimes, nouvelId, oublierSupprimes, surModificationUtilisateur } from './storage';
import type { Observation } from '../data/types';

export type EtatSynchro = { statut: 'inactif' | 'en-cours' | 'ok' | 'erreur'; message?: string; derniere?: string };

let etat: EtatSynchro = { statut: 'inactif', derniere: localStorage.getItem('birdex:derniere-synchro') ?? undefined };
const abonnes = new Set<(e: EtatSynchro) => void>();
const publier = (e: EtatSynchro) => {
  etat = e;
  abonnes.forEach((f) => f(e));
};

export function useEtatSynchro(): EtatSynchro {
  const [e, setE] = useState(etat);
  useEffect(() => {
    abonnes.add(setE);
    return () => void abonnes.delete(setE);
  }, []);
  return e;
}

export function useSession(): Session | null | undefined {
  const [s, setS] = useState<Session | null | undefined>(supabase ? undefined : null);
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setS(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, session) => setS(session));
    return () => data.subscription.unsubscribe();
  }, []);
  return s;
}

const versBlob = async (dataUrl: string) => (await fetch(dataUrl)).blob();
const versDataUrl = (b: Blob) =>
  new Promise<string>((ok, ko) => {
    const r = new FileReader();
    r.onload = () => ok(r.result as string);
    r.onerror = ko;
    r.readAsDataURL(b);
  });

let enCours: Promise<void> | null = null;
let encore = false;

/** Synchronise le carnet de l'appareil avec le compte en ligne (sans effet si l'on n'est pas connecté). */
export function synchroniser(): Promise<void> {
  if (enCours) {
    encore = true; // une modification est arrivée pendant la synchronisation : on relancera
    return enCours;
  }
  enCours = executer().finally(() => {
    enCours = null;
    if (encore) {
      encore = false;
      void synchroniser();
    }
  });
  return enCours;
}

async function executer(): Promise<void> {
  if (!supabase) return;
  const { data: sess } = await supabase.auth.getSession();
  const uid = sess.session?.user.id;
  if (!uid) return;
  if (!navigator.onLine) {
    publier({ ...etat, statut: 'erreur', message: 'Hors connexion : synchronisation au retour du réseau.' });
    return;
  }
  publier({ ...etat, statut: 'en-cours' });
  try {
    // Anciennes observations dont l'identifiant n'est pas un UUID : on leur en donne un
    const nonUuid = chargerCarnet().filter((o) => !estUuid(o.id));
    if (nonUuid.length) appliquerSynchro(nonUuid.map((o) => ({ ...o, id: nouvelId() })), nonUuid.map((o) => o.id));

    const { data: distant, error } = await supabase
      .from('observations')
      .select('id, espece_id, date, zone, lieu, note, photo_chemin, validation, cree_le, supprime');
    if (error) throw error;

    const supprimesIci = chargerSupprimes();
    const plan = planifier(chargerCarnet(), (distant ?? []) as LigneObservation[], supprimesIci);

    // 1. Propager les suppressions faites ici
    if (plan.aSupprimer.length) {
      const { error: e } = await supabase.from('observations').update({ supprime: true, modifie_le: new Date().toISOString() }).in('id', plan.aSupprimer);
      if (e) throw e;
      const chemins = (distant ?? []).filter((l) => plan.aSupprimer.includes(l.id) && l.photo_chemin).map((l) => l.photo_chemin!);
      if (chemins.length) await supabase.storage.from(BUCKET_PHOTOS).remove(chemins);
    }
    oublierSupprimes(supprimesIci);

    // 2. Envoyer les observations de ce téléphone (avec leur photo)
    const misesAJour = new Map<string, Partial<Observation>>();
    if (plan.aEnvoyer.length) {
      const lignes = [];
      for (const o of plan.aEnvoyer) {
        let chemin: string | null = o.photoChemin ?? null;
        if (o.photo && !chemin) {
          chemin = `${uid}/${o.id}.jpg`;
          const { error: e } = await supabase.storage.from(BUCKET_PHOTOS).upload(chemin, await versBlob(o.photo), { contentType: 'image/jpeg', upsert: true });
          if (e) chemin = null; // la photo reste sur l'appareil ; l'observation est quand même sauvegardée
          else misesAJour.set(o.id, { photoChemin: chemin });
        }
        lignes.push(versLigne(o, chemin));
      }
      const { error: e } = await supabase.from('observations').upsert(lignes, { onConflict: 'id', ignoreDuplicates: true });
      if (e) throw e;
    }

    // 3. Récupérer ce qui vient des autres appareils
    const ajouts: Observation[] = [];
    for (const l of plan.aRecevoir) {
      let photo: string | undefined;
      if (l.photo_chemin) {
        const { data } = await supabase.storage.from(BUCKET_PHOTOS).download(l.photo_chemin);
        if (data) photo = await versDataUrl(data);
      }
      ajouts.push(depuisLigne(l, photo));
    }
    appliquerSynchro(ajouts, plan.aRetirer, misesAJour);

    const derniere = new Date().toISOString();
    localStorage.setItem('birdex:derniere-synchro', derniere);
    publier({ statut: 'ok', derniere });
  } catch (e) {
    publier({ ...etat, statut: 'erreur', message: (e as Error).message || 'Synchronisation impossible.' });
  }
}

let minuteur: ReturnType<typeof setTimeout> | undefined;
/** Lance la synchronisation automatique : connexion, démarrage, modifications, retour du réseau. */
export function demarrerSynchroAuto(): void {
  if (!supabase) return;
  supabase.auth.onAuthStateChange((evenement) => {
    if (evenement === 'SIGNED_IN' || evenement === 'INITIAL_SESSION') setTimeout(() => void synchroniser(), 0);
  });
  surModificationUtilisateur(() => {
    clearTimeout(minuteur);
    minuteur = setTimeout(() => void synchroniser(), 1500);
  });
  window.addEventListener('online', () => void synchroniser());
  document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && void synchroniser());
}

/** Supprime définitivement le compte, ses observations et ses photos (RGPD). */
export async function supprimerCompte(): Promise<void> {
  if (!supabase) return;
  const { data: sess } = await supabase.auth.getSession();
  const uid = sess.session?.user.id;
  if (!uid) return;
  const { data: fichiers } = await supabase.storage.from(BUCKET_PHOTOS).list(uid, { limit: 1000 });
  if (fichiers?.length) await supabase.storage.from(BUCKET_PHOTOS).remove(fichiers.map((f) => `${uid}/${f.name}`));
  const { error } = await supabase.rpc('supprimer_mon_compte');
  if (error) throw error;
  await supabase.auth.signOut({ scope: 'local' });
}
