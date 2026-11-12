import { useEffect, useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabase';

const traduire = (m: string) =>
  /expired|invalid/i.test(m)
    ? 'Code incorrect ou expiré. Vérifiez les 6 chiffres, ou demandez un nouveau code.'
    : /rate|limit|seconds/i.test(m)
      ? 'Merci de patienter une minute avant de demander un nouveau code.'
      : /password/i.test(m)
        ? 'Le mot de passe doit faire au moins 8 caractères.'
        : 'Une erreur est survenue. Vérifiez votre connexion et réessayez.';

/** Mot de passe oublié : code à 6 chiffres reçu par e-mail, puis nouveau mot de passe. */
export default function MotDePasseOublie({ emailInitial }: { emailInitial: string }) {
  const [etape, setEtape] = useState<'email' | 'code' | 'fini'>('email');
  const [email, setEmail] = useState(emailInitial);
  const [modifie, setModifie] = useState(false);
  // Reprend l'e-mail tapé dans le formulaire de connexion, tant qu'il n'a pas été changé ici
  useEffect(() => {
    if (!modifie) setEmail(emailInitial);
  }, [emailInitial, modifie]);
  const [code, setCode] = useState('');
  const [mdp, setMdp] = useState('');
  const [voir, setVoir] = useState(false);
  const [attente, setAttente] = useState(false);
  const [erreur, setErreur] = useState<string>();

  async function envoyerCode(ev?: FormEvent) {
    ev?.preventDefault();
    if (!supabase) return;
    setAttente(true);
    setErreur(undefined);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    setAttente(false);
    if (error) return setErreur(traduire(error.message));
    setEtape('code');
  }

  async function changer(ev: FormEvent) {
    ev.preventDefault();
    if (!supabase) return;
    setAttente(true);
    setErreur(undefined);
    const v = await supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'recovery' });
    if (v.error) {
      setAttente(false);
      return setErreur(traduire(v.error.message));
    }
    const u = await supabase.auth.updateUser({ password: mdp });
    setAttente(false);
    if (u.error) return setErreur(traduire(u.error.message));
    setEtape('fini');
  }

  if (etape === 'fini') return <p className="alerte" role="status">✅ Mot de passe changé : vous êtes connectée. Pensez à le noter !</p>;

  return etape === 'email' ? (
    <form className="mdp-oublie" onSubmit={envoyerCode}>
      <p>Indiquez votre e-mail : vous allez recevoir un code à 6 chiffres.</p>
      <label>
        E-mail
        <input type="email" autoComplete="email" value={email} onChange={(e) => { setModifie(true); setEmail(e.target.value); }} required />
      </label>
      {erreur && <p className="erreur" role="alert">{erreur}</p>}
      <button className="bouton principal large" disabled={attente}>{attente ? 'Envoi…' : 'Recevoir un code'}</button>
    </form>
  ) : (
    <form className="mdp-oublie" onSubmit={changer}>
      <p>Un code a été envoyé à <strong>{email}</strong>. Regardez vos e-mails (et les courriers indésirables).</p>
      <label>
        Code à 6 chiffres
        <input
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          value={code}
          // on garde les chiffres (un code collé « 123 456 » fonctionne), 6 au maximum
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          required
          className="champ-code"
        />
      </label>
      <label>
        Nouveau mot de passe
        <input type={voir ? 'text' : 'password'} autoComplete="new-password" minLength={8} value={mdp} onChange={(e) => setMdp(e.target.value)} required />
      </label>
      <label className="case">
        <input type="checkbox" checked={voir} onChange={(e) => setVoir(e.target.checked)} /> Afficher le mot de passe
      </label>
      {erreur && <p className="erreur" role="alert">{erreur}</p>}
      <button className="bouton principal large" disabled={attente}>{attente ? 'Un instant…' : 'Changer mon mot de passe'}</button>
      <button type="button" className="lien-discret" onClick={() => void envoyerCode()} disabled={attente}>Renvoyer un code</button>
    </form>
  );
}
