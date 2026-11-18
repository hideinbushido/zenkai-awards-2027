'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import VoteFlow from '@/components/vote/VoteFlow';
import type { Category, Nominee } from '@/lib/types';

interface State {
  status: 'loading' | 'ready' | 'error';
  voterName?: string;
  voterEmail?: string;
  error?: string;
  eventId?: string;
  categories?: Category[];
  nomineesByCategory?: Record<string, Nominee[]>;
}

function Access() {
  const sp = useSearchParams();
  const locale = useLocale();
  const fr = locale === 'fr';
  const [s, setS] = useState<State>({ status: 'loading' });
  const token = sp.get('token') ?? '';
  const isDev = sp.get('dev') === '1';

  useEffect(() => {
    if (!token) { setS({ status: 'error', error: fr ? 'Lien incomplet. Redemande un lien depuis la page de vote.' : 'Incomplete link. Request a new one from the vote page.' }); return; }
    const q = isDev
      ? `token=${encodeURIComponent(token)}&dev=1&name=${encodeURIComponent(sp.get('name') ?? '')}&email=${encodeURIComponent(sp.get('email') ?? '')}`
      : `token=${encodeURIComponent(token)}`;
    Promise.all([fetch(`/api/vote/validate-access?${q}`).then((r) => r.json()), fetch('/api/vote/ballot').then((r) => r.json())])
      .then(([acc, ballot]) => {
        if (!acc.success) { setS({ status: 'error', error: acc.error }); return; }
        setS({ status: 'ready', voterName: acc.voterName, voterEmail: acc.voterEmail, eventId: ballot.eventId,
          categories: ballot.categories ?? [], nomineesByCategory: ballot.nomineesByCategory ?? {} });
      })
      .catch(() => setS({ status: 'error', error: fr ? 'Pas de connexion. Recharge la page.' : 'No connection. Reload the page.' }));
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  if (s.status === 'loading') {
    return (
      <div aria-busy="true">
        <div className="h-[72px] w-[60%] max-w-[560px]" style={{ background: 'var(--ink-2)' }} />
        <div className="z-plates mt-14" aria-hidden="true">
          {Array.from({ length: 7 }).map((_, i) => <div key={i} className="z-plate" style={{ border: '2px solid var(--rule-on-ink)', background: 'var(--ink-2)' }} />)}
        </div>
        <p className="sr-only">{fr ? 'Vérification de ton lien…' : 'Checking your link…'}</p>
      </div>
    );
  }
  if (s.status === 'error') {
    return (
      <div className="border-2 p-8 max-w-xl" style={{ borderColor: 'var(--paper)' }} role="alert">
        <h1 style={{ fontSize: 'clamp(30px, 3.4vw, 44px)', lineHeight: 1.05 }}>{fr ? 'Ce lien ne marche pas.' : 'This link doesn’t work.'}</h1>
        <p className="mt-4" style={{ color: '#C9C9C4' }}>{s.error}</p>
        <a href={`/${locale}/vote`} className="z-btn mt-6">{fr ? 'Recevoir un nouveau lien' : 'Get a new link'}</a>
      </div>
    );
  }
  return (
    <>
      <p className="mb-6 text-[16px]" style={{ color: 'var(--mute-on-ink)' }}>
        {fr ? <>Bonjour <strong className="text-[var(--paper)]">{s.voterName}</strong>.</> : <>Hi <strong className="text-[var(--paper)]">{s.voterName}</strong>.</>}
      </p>
      <VoteFlow categories={s.categories!} nomineesByCategory={s.nomineesByCategory!} eventId={s.eventId ?? ''} locale={locale}
        voterName={s.voterName!} voterEmail={s.voterEmail!} accessToken={token} />
    </>
  );
}

export default function VoteAccessPage() {
  return (
    <>
      <Navbar />
      <main className="z-sec" style={{ minHeight: '80vh' }}>
        <Suspense fallback={null}><Access /></Suspense>
      </main>
      <Footer />
    </>
  );
}
