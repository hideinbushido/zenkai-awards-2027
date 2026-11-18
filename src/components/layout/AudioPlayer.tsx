'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocale } from 'next-intl';

// Musique d'ambiance : jamais lancée toute seule. Un bouton visible, volume bas.
export default function AudioPlayer() {
  const locale = useLocale();
  const fr = locale === 'fr';
  const audioRef = useRef<HTMLAudioElement>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.3;
    // Pause pendant qu'une plaque joue son extrait
    const onCardStart = () => { if (!audio.paused) audio.pause(); };
    const onCardStop = () => { if (on && audio.paused) audio.play().catch(() => {}); };
    window.addEventListener('card-audio-start', onCardStart);
    window.addEventListener('card-audio-stop', onCardStop);
    return () => {
      window.removeEventListener('card-audio-start', onCardStart);
      window.removeEventListener('card-audio-stop', onCardStop);
    };
  }, [on]);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (on) { audio.pause(); setOn(false); }
    else { audio.play().then(() => setOn(true)).catch(() => setOn(false)); }
  };

  return (
    <>
      <audio ref={audioRef} src="/music.mp3" loop preload="none" />
      <button type="button" onClick={toggle} aria-pressed={on}
        className="fixed left-4 bottom-4 z-40 flex items-center gap-2 min-h-11 px-4 text-[14px] font-bold"
        style={{ background: on ? 'var(--paper)' : 'var(--ink)', color: on ? 'var(--ink)' : 'var(--paper)', border: '2px solid var(--paper)' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 9v6h4l5 4V5L8 9H4z" />
          {on ? <path d="M16 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" /> : <path d="M17 9l5 6M22 9l-5 6" />}
        </svg>
        {on ? (fr ? 'Couper le son' : 'Mute') : (fr ? 'Activer le son' : 'Sound on')}
      </button>
    </>
  );
}
