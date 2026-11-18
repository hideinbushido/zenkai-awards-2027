import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import SpeedLines from '@/components/z/SpeedLines';
import { getActiveEvent, getCategories } from '@/lib/firestore';
import type { Category } from '@/lib/types';

export default async function CategoriesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const fr = locale === 'fr';
  let categories: Category[] = [];
  try { const ev = await getActiveEvent(); if (ev) categories = await getCategories(ev.id); } catch {}
  const title = (c: Category) => (fr ? c.titleFr || c.title : c.titleEn || c.title);
  const desc = (c: Category) => (fr ? c.descriptionFr || c.description : c.descriptionEn || c.description);
  const grand = categories.find((c) => c.id === 'p-annee');
  const others = categories.filter((c) => c !== grand);

  return (
    <>
      <Navbar />
      <main>
        <section className="relative overflow-hidden z-sec">
          <SpeedLines fx={0.05} fy={0.9} opacity={0.07} seed={12} />
          <h1 className="relative" style={{ fontSize: 'clamp(44px, 6vw, 88px)', lineHeight: 1 }}>{fr ? 'Catégories' : 'Categories'}</h1>
          <p className="relative mt-5 max-w-[34em]" style={{ color: '#C9C9C4' }}>
            {fr ? 'Chaque catégorie est un combat. Le Grand Prix se joue en dernier, au live.' : 'Each category is a fight. The Grand Prix is decided last, at the live.'}
          </p>
        </section>
        {categories.length === 0 ? (
          <section className="z-sec z-paper">
            <h2 style={{ fontSize: 'clamp(30px, 3.4vw, 44px)' }}>{fr ? 'Annonce à venir' : 'Coming soon'}</h2>
            <p className="mt-4 max-w-[36em]" style={{ color: 'var(--mute-on-paper)' }}>
              {fr ? 'Les catégories 2027 seront publiées ici. Les catégories et le palmarès 2026 restent dans les archives.' : 'The 2027 categories will be published here. The 2026 ones stay in the archives.'}
            </p>
            <Link href={`/${locale}/archives`} className="z-link mt-3 inline-block">{fr ? 'Voir les archives 2026' : 'See the 2026 archives'}</Link>
          </section>
        ) : (
          <section className="z-sec z-paper">
            {grand && (
              <Link href={`/${locale}/nominees?category=${grand.id}`} className="block border-2 p-8 mb-10 z-case-link" style={{ borderColor: 'var(--ink)' }}>
                <p className="font-black text-[15px]">Grand Prix</p>
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 'clamp(36px, 4.4vw, 60px)', lineHeight: 1.02 }}>{title(grand)}</p>
                {desc(grand) && <p className="mt-3" style={{ color: 'var(--mute-on-paper)' }}>{desc(grand)}</p>}
              </Link>
            )}
            <ul className="grid md:grid-cols-2 gap-x-12" style={{ listStyle: 'none', padding: 0 }}>
              {others.map((c) => (
                <li key={c.id} style={{ borderBottom: '1px solid var(--rule-on-paper)' }}>
                  <Link href={`/${locale}/nominees?category=${c.id}`} className="block py-5 group">
                    <span className="block group-hover:underline underline-offset-[6px] decoration-2" style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 28, lineHeight: 1.1 }}>{title(c)}</span>
                    {desc(c) && <span className="block mt-1 text-[16px]" style={{ color: 'var(--mute-on-paper)' }}>{desc(c)}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
