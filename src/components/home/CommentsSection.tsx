'use client';

import { useEffect, useState } from 'react';

interface Comment { id: string; name: string; text: string; createdAt: string }

const PAGE = 5;

export default function CommentsSection({ locale }: { locale: string }) {
  const fr = locale === 'fr';
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState(false);
  const [shown, setShown] = useState(PAGE);

  useEffect(() => {
    fetch('/api/comments').then((r) => r.json()).then((d) => setComments(d.comments ?? [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const fmt = (iso: string) => (iso ? new Date(iso).toLocaleDateString(fr ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '');

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setOk(false);
    if (!name.trim() || !text.trim()) { setError(fr ? 'Il faut un pseudo et un message.' : 'A name and a message are needed.'); return; }
    setSending(true);
    try {
      const res = await fetch('/api/comments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: name.trim(), text: text.trim() }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error ?? (fr ? 'Ton message n’est pas passé. Réessaie.' : 'Your message didn’t go through. Try again.')); return; }
      setComments((p) => [{ id: data.id ?? String(Date.now()), name: name.trim(), text: text.trim(), createdAt: new Date().toISOString() }, ...p]);
      setName(''); setText(''); setOk(true);
    } catch { setError(fr ? 'Pas de connexion. Réessaie.' : 'No connection. Try again.'); }
    finally { setSending(false); }
  }

  return (
    <section className="z-sec" aria-labelledby="avis" style={{ borderTop: '2px solid var(--paper)' }}>
      <div className="grid lg:grid-cols-[minmax(0,480px)_1fr] gap-x-16 gap-y-12">
        <div>
          <h2 id="avis" style={{ fontSize: 'clamp(40px, 5.2vw, 72px)', lineHeight: 1 }}>{fr ? 'Ton avis' : 'Your say'}</h2>
          <p className="mt-4" style={{ color: '#C9C9C4' }}>{fr ? 'Une idée pour améliorer l’événement ? Écris-la ici.' : 'An idea to improve the event? Write it here.'}</p>
          <form onSubmit={submit} className="mt-8 grid gap-7" noValidate>
            <div className="z-field"><label htmlFor="c-name">{fr ? 'Pseudo' : 'Name'}</label>
              <input id="c-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} autoComplete="nickname" /></div>
            <div className="z-field"><label htmlFor="c-text">Message</label>
              <textarea id="c-text" value={text} onChange={(e) => setText(e.target.value.slice(0, 500))} rows={4} aria-describedby="c-count" />
              <p id="c-count" className="num mt-2 text-[14px] text-right" style={{ color: 'var(--mute-on-ink)' }}>{text.length} / 500</p></div>
            {error && <p className="z-error" role="alert">{error}</p>}
            {ok && <p role="status" className="font-bold">{fr ? 'Merci, ton message est publié.' : 'Thanks, your message is posted.'}</p>}
            <div><button type="submit" className="z-btn" disabled={sending}>{sending ? (fr ? 'Publication…' : 'Posting…') : (fr ? 'Publier mon avis' : 'Post my message')}</button></div>
          </form>
        </div>
        <div aria-live="polite">
          {loading ? (
            <p style={{ color: 'var(--mute-on-ink)' }}>{fr ? 'Chargement des avis…' : 'Loading messages…'}</p>
          ) : comments.length === 0 ? (
            <p style={{ color: 'var(--mute-on-ink)' }}>{fr ? 'Aucun avis pour l’instant. Le premier est pour toi.' : 'No messages yet. Be the first.'}</p>
          ) : (
            <>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {comments.slice(0, shown).map((c) => (
                  <li key={c.id} className="py-5" style={{ borderBottom: '1px solid var(--rule-on-ink)' }}>
                    <p className="flex flex-wrap items-baseline gap-x-3"><strong style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 20 }}>{c.name}</strong>
                      <span className="text-[14px]" style={{ color: 'var(--mute-on-ink)' }}>{fmt(c.createdAt)}</span></p>
                    <p className="mt-2" style={{ color: '#C9C9C4' }}>{c.text}</p>
                  </li>
                ))}
              </ul>
              {shown < comments.length && <button type="button" className="z-link mt-3" onClick={() => setShown((s) => s + PAGE)}>{fr ? 'Voir plus d’avis' : 'More messages'}</button>}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
