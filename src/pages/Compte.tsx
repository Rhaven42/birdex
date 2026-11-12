import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Icone } from '../components/Icones';
import { comptesActifs, supabase } from '../lib/supabase';
import { supprimerCompte, synchroniser, useEtatSynchro, useSession } from '../lib/sync';
import { useCarnet } from '../lib/hooks';
import { oublierToutLocal } from '../lib/storage';
import MotDePasseOublie from '../components/MotDePasseOublie';

// Interrupteur : activé une fois l'envoi d'e-mails (Brevo) branché dans Supabase et testé
const RECUPERATION_MDP = true;
import { useTailleTexte, type TailleTexte } from '../lib/texte';

function ReglageTexte() {
  const [taille, setTaille] = useTailleTexte();
  const choix: [TailleTexte, string][] = [['normal', 'Normal'], ['grand', 'Grand'], ['tres-grand', 'Très grand']];
  return (
    <section className="bloc reglage-texte">
      <h2>Taille du texte</h2>
      <div className="segment" role="group" aria-label="Taille du texte">
        {choix.map(([v, l]) => (
          <button key={v} className={taille === v ? 'actif' : ''} aria-pressed={taille === v} onClick={() => setTaille(v)}>{l}</button>
        ))}
      </div>
    </section>
  );
}

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
  const [voir, setVoir] = useState(false);
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
    <>
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
          type={voir ? 'text' : 'password'}
          autoComplete={mode === 'inscription' ? 'new-password' : 'current-password'}
          minLength={8}
          value={mdp}
          onChange={(e) => setMdp(e.target.value)}
          required
        />
        {mode === 'inscription' && <span className="petit">8 caractères minimum.</span>}
      </label>
      <label className="case">
        <input type="checkbox" checked={voir} onChange={(e) => setVoir(e.target.checked)} /> Afficher le mot de passe
      </label>
      {mode === 'inscription' && (
        <p className="alerte">✍️ Notez bien votre e-mail et votre mot de passe sur un papier : ils ne pourront pas être récupérés en cas d’oubli.</p>
      )}
      {mode === 'connexion' && !RECUPERATION_MDP && (
        <details className="facultatif">
          <summary>Mot de passe oublié ?</summary>
          <p>
            Il ne peut malheureusement pas être récupéré. Essayez les mots de passe que vous utilisez d’habitude, en touchant
            « Afficher le mot de passe » pour vérifier ce que vous tapez. Sinon, vous pouvez créer un nouveau compte avec une
            autre adresse e-mail, mais la collection de l’ancien compte ne pourra pas être retrouvée.
          </p>
        </details>
      )}
      {erreur && <p className="erreur" role="alert">{erreur}</p>}
      {info && <p className="alerte" role="status">{info}</p>}
      <button className="bouton principal large" disabled={attente}>
        {attente ? 'Un instant…' : mode === 'inscription' ? 'Créer mon compte' : 'Me connecter'}
      </button>
      <p className="petit">
        Votre carnet actuel est conservé et envoyé dans votre compte. Données hébergées par Supabase ; vous pouvez supprimer votre compte à tout moment.
      </p>
    </form>
    {mode === 'connexion' && RECUPERATION_MDP && (
      <details className="bloc facultatif">
        <summary>Mot de passe oublié ?</summary>
        <MotDePasseOublie emailInitial={email} />
      </details>
    )}
    </>
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
        <h1 className="titre-section">Réglages</h1>
        <ReglageTexte />
      </div>
    );
  }

  return (
    <div className="page">
      <section className="hero">
        <div className="hero-texte">
          <p className="hero-salut">Mon compte et réglages</p>
          <h1>{session ? 'Votre collection est sauvegardée' : 'Ne perdez jamais votre collection'}</h1>
          <div className="hero-chiffres">
            {session ? <span>{session.user.email}</span> : <span>Retrouvez-la sur tous vos téléphones</span>}
          </div>
        </div>
        <span className="hero-icone"><Icone nom="carnet" taille={40} /></span>
      </section>

      <ReglageTexte />

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
                  if (!confirm('Se déconnecter ? Votre collection quittera ce téléphone. Pour la retrouver, il faudra votre e-mail et votre mot de passe : les avez-vous bien notés ?')) return;
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

      <Link to="/aide" className="bouton secondaire large aide-compte">Comment ça marche ?</Link>
    </div>
  );
}
