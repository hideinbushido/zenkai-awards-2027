import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import SpeedLines from '@/components/z/SpeedLines';
import CommentsSection from '@/components/home/CommentsSection';
import { getActiveEvent, getCategories } from '@/lib/firestore';
import type { AnimeEvent, Category } from '@/lib/types';

function fmtDate(iso: string | undefined, locale: string) {
  if (!iso) return locale === 'fr' ? 'À annoncer' : 'To be announced';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const tStatus = await getTranslations('status');
  const fr = locale === 'fr';
  const L = (p: string) => `/${locale}${p}`;

  let event: AnimeEvent | null = null;
  let categories: Category[] = [];
  try {
    event = await getActiveEvent();
    if (event) categories = await getCategories(event.id);
  } catch {
    // Firebase pas encore configuré : la page reste lisible
  }

  const status = event?.status ?? 'preparation';
  const statusLabel = status === 'draft' ? tStatus('preparation') : tStatus(status);
  const voting = status === 'voting_open';
  const title = (c: Category) => (fr ? c.titleFr || c.title : c.titleEn || c.title);
  const grand = categories.find((c) => c.id === 'p-annee') ?? categories[categories.length - 1];
  const others = categories.filter((c) => c !== grand);

  return (
    <>
      <header className="relative isolate overflow-hidden grid lg:grid-cols-[60%_40%]" style={{ background: 'var(--ink)', minHeight: 'min(900px, 100svh)' }}>
        <div aria-hidden="true" className="relative row-start-1 col-start-1 min-h-[600px] lg:min-h-0">
          <SpeedLines fx={0.98} fy={0.45} />
        </div>
        <div aria-hidden="true" className="relative hidden lg:block row-start-1 col-start-2" style={{ background: 'var(--paper)' }}>
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(var(--ink) 32%, transparent 34%)', backgroundSize: '14px 14px',
            WebkitMaskImage: 'linear-gradient(200deg, #000, transparent 58%)', maskImage: 'linear-gradient(200deg, #000, transparent 58%)',
          }} />
        </div>

        <Navbar variant="overlay" />

        <div aria-hidden="true" className="absolute z-[2] pointer-events-none whitespace-nowrap"
          style={{
            left: 'calc(var(--pad) - .06em)', top: 'clamp(96px, 13vh, 150px)', fontFamily: 'var(--font-display)', fontWeight: 900,
            fontSize: 'clamp(64px, 16vw, 236px)', lineHeight: 0.9, color: 'var(--paper)', mixBlendMode: 'difference',
          }}>ZENKAI</div>

        <div className="relative z-[3] row-start-1 col-start-1 self-end max-w-[640px] z-wrap" style={{ paddingBottom: 'clamp(48px, 7vh, 80px)', paddingTop: 300 }}>
          <h1 style={{ fontSize: 'clamp(34px, 4vw, 56px)', lineHeight: 1.05 }}>Zenkai Anime Awards 2027</h1>
          <p className="mt-4 max-w-[30em]" style={{ color: '#C9C9C4' }}>
            {fr
              ? 'Deuxième édition. Les fans votent, un vote par personne. Le live TikTok révèle les gagnants, enveloppe après enveloppe.'
              : 'Second edition. Fans vote, one vote per person. The TikTok live reveals the winners, envelope after envelope.'}
          </p>
          <div className="flex flex-wrap items-center gap-x-7 gap-y-3 mt-8">
            {voting
              ? <Link className="z-btn" href={L('/vote')}>{fr ? 'Voter maintenant' : 'Vote now'}</Link>
              : <Link className="z-btn" href={L('/categories')}>{fr ? 'Voir les catégories' : 'See the categories'}</Link>}
            <Link className="z-link" href={L('/archives/2026')}>{fr ? 'Le palmarès 2026' : 'The 2026 winners'}</Link>
          </div>
        </div>

        <aside aria-label={fr ? 'État de l’édition' : 'Edition status'}
          className="relative z-[3] row-start-2 lg:row-start-1 col-start-1 lg:col-start-2 self-end lg:justify-self-end lg:m-[0_var(--pad)_clamp(48px,7vh,80px)_24px] lg:w-[360px] lg:border-2"
          style={{ background: 'var(--paper)', color: 'var(--ink)', borderColor: 'var(--ink)', padding: '22px 24px' }}>
          <h2 style={{ fontSize: 28, lineHeight: 1.1 }}>{statusLabel}</h2>
          <dl className="mt-4 grid grid-cols-[1fr_auto] gap-y-2 text-[16px] num">
            <dt className="font-bold">{fr ? 'Fin des votes' : 'Voting closes'}</dt><dd>{fmtDate(event?.voteCloseDate, locale)}</dd>
            <dt className="font-bold">Live TikTok</dt><dd>{fmtDate(event?.liveDate, locale)}</dd>
            <dt className="font-bold">{fr ? 'Catégories' : 'Categories'}</dt><dd>{categories.length || (fr ? 'À annoncer' : 'TBA')}</dd>
          </dl>
        </aside>
      </header>

      <main>
        <section className="z-sec z-paper" aria-labelledby="deroule">
          <h2 id="deroule" style={{ fontSize: 'clamp(40px, 5.2vw, 72px)', lineHeight: 1 }}>{fr ? 'Comment ça se passe' : 'How it works'}</h2>
          <ol className="mt-10 grid md:grid-cols-3 gap-3" style={{ listStyle: 'none', padding: 0 }}>
            {[
              [fr ? 'Tu reçois ton lien' : 'Get your link', fr ? 'Ton pseudo et ton e-mail, et un lien de vote personnel arrive dans ta boîte. Un vote par personne.' : 'Your name and e-mail, and a personal voting link lands in your inbox. One vote per person.'],
              [fr ? 'Tu retournes tes plaques' : 'Flip your plaques', fr ? 'Dans chaque catégorie, tu retournes la plaque de ton favori. Tu peux changer d’avis jusqu’à l’envoi.' : 'In each category, flip the plaque of your favourite. Change your mind until you send.'],
              [fr ? 'Le live ouvre les enveloppes' : 'The live opens the envelopes', fr ? 'Chaque catégorie est révélée par un créateur de la communauté, en direct sur TikTok.' : 'Each category is revealed by a community creator, live on TikTok.'],
            ].map(([h, p], i) => (
              <li key={h} className="border-2 p-6" style={{ borderColor: 'var(--ink)' }}>
                <p className="num" style={{ fontWeight: 900, fontSize: 15 }}>{fr ? 'Étape' : 'Step'} {i + 1}</p>
                <h3 className="mt-3" style={{ fontSize: 30, lineHeight: 1.1 }}>{h}</h3>
                <p className="mt-3" style={{ color: 'var(--mute-on-paper)' }}>{p}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="z-sec" aria-labelledby="cats">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <h2 id="cats" style={{ fontSize: 'clamp(40px, 5.2vw, 72px)', lineHeight: 1 }}>{fr ? 'Les catégories' : 'The categories'}</h2>
            <Link className="z-link" href={L('/categories')}>{fr ? 'Toutes les catégories' : 'All categories'}</Link>
          </div>
          {categories.length === 0 ? (
            <p className="mt-8 max-w-[36em]" style={{ color: 'var(--mute-on-ink)' }}>
              {fr ? 'Les catégories de l’édition 2027 seront annoncées ici. En attendant, revois le palmarès 2026 dans les archives.'
                : 'The 2027 categories will be announced here. Meanwhile, see the 2026 winners in the archives.'}
            </p>
          ) : (
            <div className="mt-10 grid lg:grid-cols-[minmax(0,520px)_1fr] gap-x-16 gap-y-8">
              {grand && (
                <div className="border-2 p-7 self-start" style={{ borderColor: 'var(--paper)' }}>
                  <p style={{ fontWeight: 900, fontSize: 15 }}>Grand Prix</p>
                  <p className="mt-2" style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 'clamp(32px, 3.4vw, 44px)', lineHeight: 1.05 }}>{title(grand)}</p>
                </div>
              )}
              <ul className="grid sm:grid-cols-2 gap-x-10" style={{ listStyle: 'none', padding: 0 }}>
                {others.map((c) => (
                  <li key={c.id} className="py-4" style={{ borderBottom: '1px solid var(--rule-on-ink)', fontWeight: 900, fontSize: 22 }}>{title(c)}</li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <CommentsSection locale={locale} />
      </main>
      <Footer />
    </>
  );
}
