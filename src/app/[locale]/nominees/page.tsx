import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { getActiveEvent, getCategories, getNominees } from '@/lib/firestore';
import type { Category, Nominee } from '@/lib/types';

export default async function NomineesPage({ params, searchParams }: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string }>;
}) {
  const { locale } = await params;
  const { category } = await searchParams;
  const fr = locale === 'fr';
  let categories: Category[] = [];
  let nominees: Nominee[] = [];
  let votingOpen = false;
  try {
    const ev = await getActiveEvent();
    if (ev) { votingOpen = ev.status === 'voting_open'; categories = await getCategories(ev.id); }
  } catch {}
  const active = (category ? categories.find((c) => c.id === category) : null) ?? categories[0] ?? null;
  if (active) { try { nominees = (await getNominees(active.id)).sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' })); } catch {} }
  const i = active ? categories.findIndex((c) => c.id === active.id) : -1;
  const next = i >= 0 && i < categories.length - 1 ? categories[i + 1] : null;
  const prev = i > 0 ? categories[i - 1] : null;
  const title = (c: Category) => (fr ? c.titleFr || c.title : c.titleEn || c.title);

  return (
    <>
      <Navbar />
      <main className="z-sec" style={{ minHeight: '80vh' }}>
        {!active ? (
          <div className="max-w-2xl">
            <h1 style={{ fontSize: 'clamp(44px, 6vw, 88px)', lineHeight: 1 }}>{fr ? 'Nominés' : 'Nominees'}</h1>
            <p className="mt-5" style={{ color: '#C9C9C4' }}>{fr ? 'Les nominés 2027 ne sont pas encore publiés.' : 'The 2027 nominees are not published yet.'}</p>
            <Link href={`/${locale}/archives`} className="z-link mt-3 inline-block">{fr ? 'Voir les nominés et gagnants 2026' : 'See the 2026 nominees and winners'}</Link>
          </div>
        ) : (
          <>
            <nav aria-label={fr ? 'Catégories' : 'Categories'} className="flex gap-2 overflow-x-auto pb-2">
              {categories.map((c) => (
                <Link key={c.id} href={`/${locale}/nominees?category=${c.id}`} aria-current={c.id === active.id ? 'page' : undefined}
                  className="z-tab shrink-0 inline-flex items-center" data-current={c.id === active.id}>{title(c)}</Link>
              ))}
            </nav>
            <h1 className="mt-10" style={{ fontSize: 'clamp(40px, 5.2vw, 72px)', lineHeight: 1 }}>{title(active)}</h1>
            {nominees.length === 0 ? (
              <p className="mt-6" style={{ color: 'var(--mute-on-ink)' }}>{fr ? 'Pas encore de nominés dans cette catégorie.' : 'No nominees in this category yet.'}</p>
            ) : (
              <ul className="mt-10 grid gap-3" style={{ listStyle: 'none', padding: 0, gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
                {nominees.map((n) => (
                  <li key={n.id} className="border-2 flex flex-col" style={{ borderColor: 'var(--paper)' }}>
                    <div className="z-poster" style={{ height: 260 }} aria-hidden="true">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {n.imageUrl && <img src={n.imageUrl} alt="" loading="lazy" />}
                    </div>
                    <div className="p-4">
                      <p style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 22, lineHeight: 1.15 }}>{n.name}</p>
                      {n.anime && n.anime !== n.name && <p className="mt-1 text-[15px]" style={{ color: 'var(--mute-on-ink)' }}>{n.anime}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
              {prev ? <Link className="z-link" href={`/${locale}/nominees?category=${prev.id}`}>{fr ? 'Précédente' : 'Previous'} : {title(prev)}</Link> : <span />}
              <div className="flex flex-wrap items-center gap-6">
                {votingOpen && <Link className="z-btn" href={`/${locale}/vote`}>{fr ? 'Voter' : 'Vote'}</Link>}
                {next && <Link className="z-link" href={`/${locale}/nominees?category=${next.id}`}>{fr ? 'Suivante' : 'Next'} : {title(next)}</Link>}
              </div>
            </div>
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
