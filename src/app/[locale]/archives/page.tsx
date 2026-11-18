import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { getLocale } from 'next-intl/server';
import { Trophy, Calendar, Users, Star } from 'lucide-react';

export default async function ArchivesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const editions = [
    {
      year: 2026,
      title: 'Zenkai Anime Awards 2026',
      date: '2 mai 2026',
      categories: 25,
      description: '1ère édition — la communauté anime francophone réunie pour la première fois autour de ses animés préférés de l\'année.',
      href: `/${locale}/archives/2026`,
      active: true,
    },
  ];

  return (
    <>
      <Navbar />
      <main className="pt-12 pb-20" style={{ background: '#0B0B0C', minHeight: '100vh' }}>
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[900px] h-[300px] pointer-events-none z-0"
          style={{ background: 'radial-gradient(ellipse at top, rgba(244,244,241,0.08) 0%, transparent 65%)' }} />

        <div className="container-mobile relative z-10">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#F4F4F1' }}>
              Zenkai Anime Awards
            </p>
            <h1 className="text-4xl sm:text-5xl font-black mb-4">
              <span className="gradient-text">Archives</span>
            </h1>
            <p className="text-lg" style={{ color: '#8C8C88' }}>
              L&apos;histoire des Zenkai Anime Awards, édition par édition
            </p>
          </div>

          <div className="space-y-6 max-w-2xl mx-auto">
            {editions.map((edition) => (
              <div key={edition.year} className="rounded-none overflow-hidden"
                style={{ background: '#1B1B1C', border: '1px solid rgba(244,244,241,0.25)' }}>
                {/* Header */}
                <div className="p-6 pb-0">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-none"
                      style={{ background: 'rgba(244,244,241,0.1)', color: '#F4F4F1', border: '1px solid rgba(244,244,241,0.2)' }}>
                      {edition.year}
                    </span>
                    <span className="text-xs font-semibold px-3 py-1 rounded-none"
                      style={{ background: 'rgba(244,244,241,0.06)', color: '#8C8C88' }}>
                      1ère édition
                    </span>
                  </div>
                  <h2 className="text-2xl font-black text-white mb-2">{edition.title}</h2>
                  <p className="text-sm leading-relaxed mb-5" style={{ color: '#8C8C88' }}>
                    {edition.description}
                  </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-px mx-6 mb-6 rounded-none overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.04)' }}>
                  {[
                    { icon: Calendar, label: 'Date du live', value: edition.date },
                    { icon: Trophy,   label: 'Catégories',   value: `${edition.categories}` },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-center gap-3 p-4"
                      style={{ background: '#1B1B1C' }}>
                      <div className="w-8 h-8 rounded-none flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(244,244,241,0.08)' }}>
                        <Icon className="w-4 h-4" style={{ color: '#F4F4F1' }} />
                      </div>
                      <div>
                        <p className="text-xs" style={{ color: '#8C8C88' }}>{label}</p>
                        <p className="text-sm font-black text-white">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <div className="px-6 pb-6">
                  <Link href={edition.href}
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-none font-black text-sm text-black transition-all hover:brightness-110"
                    style={{ background: 'linear-gradient(135deg, #F4F4F1, #8C8C88)' }}>
                    <Trophy className="w-4 h-4" />
                    Voir les résultats {edition.year}
                  </Link>
                </div>
              </div>
            ))}

            {/* Prochaine édition */}
            <div className="rounded-none p-8 text-center"
              style={{ background: 'rgba(244,244,241,0.03)', border: '1px dashed rgba(244,244,241,0.2)' }}>
              <Star className="w-8 h-8 mx-auto mb-3" style={{ color: '#8C8C88' }} />
              <p className="font-black text-white mb-1">????? Awards</p>
              <p className="text-sm" style={{ color: '#8C8C88' }}>Prochaine édition à venir…</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
