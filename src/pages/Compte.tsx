import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Icone } from '../components/Icones';
import { comptesActifs, supabase } from '../lib/supabase';
import { supprimerCompte, synchroniser, useEtatSynchro, useSession } from '../lib/sync';
import { useCarnet } from '../lib/hooks';
import { oublierToutLocal } from '../lib/storage';

const MESSAGES: Record<string, string> = {
  'Invalid login credentials': 'E-mail ou mot de passe incorrect.',
  'User already registered': 'Un compte existe déjà avec cet e-mail : connectez-vous.',
  'Email not confirmed': 'Ce compte n’a pas encore été confirmé.',
};
const traduire = (m: string) =>
  MESSAGES[m] ?? (/password/i.test(m) && /6|least/i.test(m) ? 'Le mot de passe doit faire au moins 6 caractères.' : m);

function heure(iso?: string) {
  if (!iso) return 'jamais';
  return new Date(iso).toLocaleString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
}

function Formulaire() {
  const [mode, setMode] = useState<'connexion' | 'inscription'>('inscription');
  const [email, setEmail] = useState('');
  const [mdp, setMdp] = useState('');
  const [attente, setAttente] = useState(false);
  const [erreur, setErreur] = useState<string>();
  const [info, setInfo] = useState<string>();

  async function valider(ev: FormEvent) {
    ev.preventDefault();
    if (!supabase) return;
    setAttente(true);
    setErreur(undefined);
    setInfo(undefined);
    const r =
      mode === 'inscription'
        ? await supabase.auth.signUp({ email: email.trim(), password: mdp })
        : await supabase.auth.signInWithPassword({ email: email.trim(), password: mdp });
    setAttente(false);
    if (r.error) return setErreur(traduire(r.error.message));
    if (mode === 'inscription' && !r.data.session) setInfo('Compte créé : il doit encore être confirmé avant la première connexion.');
  }

  return (
    <form className="bloc formulaire-compte" onSubmit={valider}>
      <div className="segment" role="group" aria-label="Choix">
        <button type="button" className={mode === 'inscription' ? 'actif' : ''} onClick={() => setMode('inscription')}>Créer un compte</button>
        <button type="button" className={mode === 'connexion' ? 'actif' : ''} onClick={() => setMode('connexion')}>J’ai déjà un compte</button>
      </div>
      <label>
        E-mail
        <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </label>
      <label>
        Mot de passe
        <input
          type="password"
          autoComplete={mode === 'inscription' ? 'new-password' : 'current-password'}
          minLength={8}
          value={mdp}
          onChange={(e) => setMdp(e.target.value)}
          required
        />
        {mode === 'inscription' && <span className="petit">8 caractères minimum.</span>}
      </label>
      {erreur && <p className="erreur" role="alert">{erreur}</p>}
      {info && <p className="alerte" role="status">{info}</p>}
      <button className="bouton principal large" disabled={attente}>
        {attente ? 'Un instant…' : mode === 'inscription' ? 'Créer mon compte' : 'Me connecter'}
      </button>
      <p className="petit">
        Votre carnet actuel est conservé et envoyé dans votre compte. Données hébergées en Europe par Supabase ; vous pouvez supprimer votre compte à tout moment.
      </p>
    </form>
  );
}

export default function Compte() {
  const session = useSession();
  const synchro = useEtatSynchro();
  const carnet = useCarnet();
  const [confirmer, setConfirmer] = useState(false);
  const [erreur, setErreur] = useState<string>();

  if (!comptesActifs) {
    return (
      <div className="page">
        <h1 className="titre-section">Mon compte</h1>
        <p className="vide">Les comptes ne sont pas encore activés dans cette version.</p>
      </div>
    );
  }

  return (
    <div className="page">
      <section className="hero">
        <div className="hero-texte">
          <p className="hero-salut">Mon compte</p>
          <h1>{session ? 'Votre collection est sauvegardée' : 'Ne perdez jamais votre collection'}</h1>
          <div className="hero-chiffres">
            {session ? <span>{session.user.email}</span> : <span>Retrouvez-la sur tous vos téléphones</span>}
          </div>
        </div>
        <span className="hero-icone"><Icone nom="carnet" taille={40} /></span>
      </section>

      {session === undefined && <p className="petit">Chargement…</p>}
      {session === null && <Formulaire />}

      {session && (
        <>
          <section className="bloc">
            <h2>Sauvegarde</h2>
            <p>
              <span className={`pastille ${synchro.statut === 'erreur' ? 'ab-rare' : synchro.statut === 'en-cours' ? 'ab-peu-commune' : 'ab-commune'}`}>
                {synchro.statut === 'en-cours' ? 'Synchronisation…' : synchro.statut === 'erreur' ? 'À réessayer' : 'À jour'}
              </span>{' '}
              {carnet.length} observation{carnet.length > 1 ? 's' : ''} · dernière sauvegarde : {heure(synchro.derniere)}
            </p>
            {synchro.statut === 'erreur' && synchro.message && <p className="erreur">{synchro.message}</p>}
            <p className="petit">La sauvegarde est automatique à chaque observation et à chaque ouverture de l’application.</p>
            <div className="actions">
              <button className="bouton secondaire" onClick={() => void synchroniser()} disabled={synchro.statut === 'en-cours'}>
                Synchroniser maintenant
              </button>
              <button
                className="bouton secondaire"
                onClick={async () => {
                  await synchroniser(); // envoie les dernières observations avant de partir
                  await supabase!.auth.signOut({ scope: 'local' });
                  oublierToutLocal();
                }}
              >
                Se déconnecter
              </button>
            </div>
            <p className="petit">À la déconnexion, le carnet est retiré de ce téléphone ; il reste dans votre compte.</p>
          </section>

          <section className="bloc donnees">
            <h2>Supprimer mon compte</h2>
            <p className="petit">Supprime définitivement votre compte, vos observations et vos photos en ligne.</p>
            {!confirmer ? (
              <button className="bouton danger" onClick={() => setConfirmer(true)}>Supprimer mon compte…</button>
            ) : (
              <div className="actions">
                <button
                  className="bouton danger"
                  onClick={async () => {
                    try {
                      await supprimerCompte();
                      oublierToutLocal();
                    } catch (e) {
                      setErreur((e as Error).message);
                    }
                  }}
                >
                  Oui, tout supprimer définitivement
                </button>
                <button className="bouton secondaire" onClick={() => setConfirmer(false)}>Annuler</button>
              </div>
            )}
            {erreur && <p className="erreur">{erreur}</p>}
          </section>
        </>
      )}

      <p className="petit"><Link to="/carnet">Voir mon carnet</Link></p>
    </div>
  );
}
