'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Category, Nominee } from '@/lib/types';

interface Props {
  categories: Category[];
  nomineesByCategory: Record<string, Nominee[]>;
  eventId: string;
  locale: string;
  voterName: string;
  voterEmail: string;
  accessToken?: string;
}

type Phase = 'voting' | 'sending' | 'done' | 'error';

export default function VoteFlow({ categories, nomineesByCategory, locale, voterName, voterEmail, accessToken }: Props) {
  const fr = locale === 'fr';
  const storageKey = accessToken ? `zenkai2027_vote_${accessToken}` : null;

  // Le Grand Prix se vote en dernier, comme au live
  const cats = useMemo(() => [...categories].sort((a, b) => (a.id === 'p-annee' ? 1 : b.id === 'p-annee' ? -1 : (a.order ?? 0) - (b.order ?? 0))), [categories]);
  const [cur, setCur] = useState(0);
  const [votes, setVotes] = useState<Record<string, string>>({});
  const [phase, setPhase] = useState<Phase>('voting');
  const [error, setError] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!storageKey) return;
    try { const s = localStorage.getItem(storageKey); if (s) setVotes(JSON.parse(s)); } catch {}
  }, [storageKey]);

  const save = (v: Record<string, string>) => { if (storageKey) { try { localStorage.setItem(storageKey, JSON.stringify(v)); } catch {} } };

  const stopAudio = useCallback(() => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    window.dispatchEvent(new Event('card-audio-stop'));
  }, []);
  useEffect(() => stopAudio, [stopAudio]);

  const cat = cats[cur];
  const nominees = cat ? nomineesByCategory[cat.id] ?? [] : [];
  const total = cats.length;
  const done = Object.keys(votes).filter((k) => cats.some((c) => c.id === k)).length;
  const last = cur === total - 1;
  const title = (c: Category) => (fr ? c.titleFr || c.title : c.titleEn || c.title);

  const pick = (n: Nominee) => {
    const v = { ...votes, [n.categoryId]: n.id };
    setVotes(v); save(v);
    if (n.audioUrl) {
      stopAudio();
      window.dispatchEvent(new Event('card-audio-start'));
      const a = new Audio(n.audioUrl); a.volume = 0.4; audioRef.current = a; a.play().catch(() => {});
    }
  };

  const go = (i: number) => {
    stopAudio(); setCur(i);
    requestAnimationFrame(() => titleRef.current?.focus());
  };

  const send = async () => {
    setPhase('sending'); setError('');
    try {
      const answers = cats.filter((c) => votes[c.id]).map((c) => ({ categoryId: c.id, nomineeId: votes[c.id] }));
      const res = await fetch('/api/vote/submit', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voterName, voterEmail, answers, token: accessToken }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error || (fr ? 'L’envoi a échoué. Réessaie.' : 'Sending failed. Try again.')); setPhase('error'); return; }
      if (storageKey) { try { localStorage.removeItem(storageKey); } catch {} }
      setPhase('done');
    } catch {
      setError(fr ? 'Pas de connexion. Tes plaques sont gardées : réessaie dans un instant.' : 'No connection. Your plaques are kept: try again shortly.');
      setPhase('error');
    }
  };

  if (total === 0) {
    return (
      <div className="border-2 p-8 max-w-xl" style={{ borderColor: 'var(--paper)' }}>
        <h2 style={{ fontSize: 'clamp(28px, 3vw, 40px)', lineHeight: 1.1 }}>{fr ? 'Les nominés arrivent bientôt.' : 'Nominees are coming soon.'}</h2>
        <p className="mt-4" style={{ color: '#C9C9C4' }}>{fr ? 'Ton lien reste valable 24 heures. Reviens quand les nominés sont publiés.' : 'Your link stays valid for 24 hours. Come back once the nominees are published.'}</p>
      </div>
    );
  }

  if (phase === 'done') {
    return (
      <div className="border-2 p-8 max-w-2xl" style={{ borderColor: 'var(--paper)' }} role="status">
        <div className="flex items-center gap-6">
          <span className="z-stamp" aria-hidden="true">票</span>
          <h2 style={{ fontSize: 'clamp(30px, 3.4vw, 44px)', lineHeight: 1.05 }}>{fr ? 'Ton vote est enregistré.' : 'Your vote is in.'}</h2>
        </div>
        <p className="mt-5" style={{ color: '#C9C9C4' }}>
          {fr ? `Merci ${voterName}. Un récapitulatif part sur ${voterEmail}. Rendez-vous au live TikTok pour l’ouverture des enveloppes.`
            : `Thanks ${voterName}. A summary is on its way to ${voterEmail}. See you at the TikTok live for the envelopes.`}
        </p>
        <a className="z-link mt-3 inline-block" href={`/${locale}`}>{fr ? 'Retour à l’accueil' : 'Back to home'}</a>
      </div>
    );
  }

  return (
    <section aria-labelledby="vote-cat">
      <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
        <div>
          <h2 id="vote-cat" ref={titleRef} tabIndex={-1} style={{ fontSize: 'clamp(40px, 5.2vw, 72px)', lineHeight: 1, outline: 'none' }}>{title(cat)}</h2>
          <p className="mt-3 max-w-[36em]" style={{ color: 'var(--mute-on-ink)' }}>
            {fr ? 'Retourne la plaque de ton favori. Une seule plaque par catégorie ; tu peux changer d’avis tant que tu n’as pas envoyé tes votes.'
              : 'Flip the plaque of your favourite. One plaque per category; you can change your mind until you send your votes.'}
          </p>
        </div>
        <p className="num font-bold text-[16px] whitespace-nowrap" aria-live="polite">{done} / {total} {fr ? 'catégories votées' : 'categories voted'}</p>
      </div>

      <div className="mt-7 flex gap-2 overflow-x-auto pb-2" role="group" aria-label={fr ? 'Catégories' : 'Categories'}>
        {cats.map((c, i) => (
          <button key={c.id} type="button" onClick={() => go(i)} aria-current={i === cur}
            className="z-tab shrink-0">{title(c)}{votes[c.id] && <span className="z-tick" aria-label={fr ? ' (votée)' : ' (voted)'} />}</button>
        ))}
      </div>

      <fieldset className="mt-9 min-w-0 border-0 p-0 m-0">
        <legend className="sr-only">{title(cat)} : {fr ? 'choisis un nominé' : 'choose a nominee'}</legend>
        {nominees.length === 0 ? (
          <p style={{ color: 'var(--mute-on-ink)' }}>{fr ? 'Pas encore de nominés dans cette catégorie.' : 'No nominees in this category yet.'}</p>
        ) : (
          <div className="z-plates">
            {nominees.map((n) => {
              const checked = votes[cat.id] === n.id;
              return (
                <label key={n.id} className="z-plate">
                  <input type="radio" name={`v-${cat.id}`} value={n.id} checked={checked} onChange={() => pick(n)}
                    aria-label={n.anime && n.anime !== n.name ? `${n.name}, ${n.anime}` : n.name} />
                  <span className="z-card">
                    <span className="z-face z-front">
                      <span className="z-poster" aria-hidden="true">
                        {n.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={n.imageUrl} alt="" loading="lazy" />
                        ) : null}
                      </span>
                      <span className="z-name"><span>{n.name}</span></span>
                      {n.anime && n.anime !== n.name && <span className="z-sub">{n.anime}</span>}
                    </span>
                    <span className="z-face z-back" aria-hidden="true">
                      <span className="z-stampwrap"><span className="z-stamp">票</span></span>
                      <span className="z-name"><span>{n.name}</span></span>
                      <span className="z-sub" style={{ fontWeight: 900 }}>{fr ? 'Ton vote' : 'Your vote'}</span>
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </fieldset>

      {phase === 'error' && <p className="z-error mt-6" role="alert">{error}</p>}

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        {cur > 0 ? <button type="button" className="z-link" onClick={() => go(cur - 1)}>{fr ? 'Catégorie précédente' : 'Previous category'}</button> : <span />}
        {last ? (
          <div className="flex flex-col items-end gap-2">
            <button type="button" className="z-btn" onClick={send} disabled={done < total || phase === 'sending'}>
              {phase === 'sending' ? (fr ? 'Envoi…' : 'Sending…') : (fr ? `Envoyer mes ${done} votes` : `Send my ${done} votes`)}
            </button>
            <p className="text-[15px]" style={{ color: 'var(--mute-on-ink)' }}>
              {done < total
                ? (fr ? `Il te reste ${total - done} catégorie${total - done > 1 ? 's' : ''} à voter.` : `${total - done} categor${total - done > 1 ? 'ies' : 'y'} left to vote.`)
                : (fr ? 'Après l’envoi, tes votes sont définitifs.' : 'Once sent, your votes are final.')}
            </p>
          </div>
        ) : (
          <button type="button" className="z-btn" onClick={() => go(cur + 1)}>{fr ? 'Suivante' : 'Next'} : {title(cats[cur + 1])}</button>
        )}
      </div>
    </section>
  );
}
