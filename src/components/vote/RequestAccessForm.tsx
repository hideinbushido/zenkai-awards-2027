'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';

function validateEmail(e: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim()); }

export default function RequestAccessForm() {
  const locale = useLocale();
  const fr = locale === 'fr';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState(false);

  const nameOk = name.trim().length >= 2;
  const emailOk = validateEmail(email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!nameOk || !emailOk) return;
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/vote/request-access', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voterName: name.trim(), voterEmail: email.trim(), locale }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || (fr ? 'Ça n’a pas marché. Réessaie.' : 'That didn’t work. Try again.')); return; }
      if (data.accessUrl) { window.location.href = data.accessUrl; return; }
      setSent(true);
    } catch {
      setError(fr ? 'Pas de connexion. Vérifie ton réseau et réessaie.' : 'No connection. Check your network and try again.');
    } finally { setLoading(false); }
  };

  if (sent) {
    return (
      <div className="border-2 p-8 max-w-xl" style={{ borderColor: 'var(--paper)' }} role="status">
        <h2 style={{ fontSize: 'clamp(28px, 3vw, 40px)', lineHeight: 1.1 }}>{fr ? 'Ton lien est parti.' : 'Your link is on its way.'}</h2>
        <p className="mt-4" style={{ color: '#C9C9C4' }}>
          {fr ? <>Ouvre l’e-mail envoyé à <strong className="text-[var(--paper)]">{email}</strong> et clique sur le lien pour voter. Il reste valable 24 heures. Pense à regarder dans les spams.</>
            : <>Open the e-mail sent to <strong className="text-[var(--paper)]">{email}</strong> and click the link to vote. It stays valid for 24 hours. Check your spam folder too.</>}
        </p>
        <button type="button" className="z-link mt-4" onClick={() => { setSent(false); }}>
          {fr ? 'Changer d’adresse' : 'Use another address'}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="max-w-xl grid gap-7">
      <div className="z-field">
        <label htmlFor="v-name">{fr ? 'Ton pseudo' : 'Your name'}</label>
        <input id="v-name" autoComplete="nickname" value={name} onChange={(e) => setName(e.target.value)}
          aria-invalid={touched && !nameOk} aria-describedby={touched && !nameOk ? 'v-name-err' : undefined} maxLength={40} />
        {touched && !nameOk && <p id="v-name-err" className="z-error mt-2 text-[16px]">{fr ? 'Au moins 2 caractères.' : 'At least 2 characters.'}</p>}
      </div>
      <div className="z-field">
        <label htmlFor="v-email">{fr ? 'Ton e-mail (pour recevoir ton lien de vote)' : 'Your e-mail (to receive your voting link)'}</label>
        <input id="v-email" type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)}
          aria-invalid={touched && !emailOk} aria-describedby={touched && !emailOk ? 'v-email-err' : undefined} />
        {touched && !emailOk && <p id="v-email-err" className="z-error mt-2 text-[16px]">{fr ? 'Cette adresse ne semble pas valide.' : 'This address doesn’t look valid.'}</p>}
      </div>
      {error && <p className="z-error" role="alert">{error}</p>}
      <div><button type="submit" className="z-btn" disabled={loading}>{loading ? (fr ? 'Envoi…' : 'Sending…') : (fr ? 'Recevoir mon lien de vote' : 'Get my voting link')}</button></div>
      <p className="text-[15px]" style={{ color: 'var(--mute-on-ink)' }}>
        {fr ? 'Un seul vote par personne et par édition. Ton e-mail sert uniquement à vérifier ton vote.' : 'One vote per person per edition. Your e-mail is only used to verify your vote.'}
      </p>
    </form>
  );
}
