import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import SpeedLines from '@/components/z/SpeedLines';
import { getActiveEvent } from '@/lib/firestore';

export default async function ResultatsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const fr = locale === 'fr';
  let liveDate: string | undefined;
  try { liveDate = (await getActiveEvent())?.liveDate; } catch {}
  const live = liveDate && !Number.isNaN(new Date(liveDate).getTime())
    ? new Date(liveDate).toLocaleDateString(fr ? 'fr-FR' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' }) : null;

  return (
    <>
      <Navbar />
      <main>
        <section className="relative overflow-hidden z-sec z-paper" style={{ minHeight: '70vh' }}>
          <SpeedLines fx={0.25} fy={0.6} color="#0B0B0C" opacity={0.07} count={80} seed={44} />
          <div className="relative max-w-3xl">
            <h1 style={{ fontSize: 'clamp(44px, 6vw, 88px)', lineHeight: 1 }}>{fr ? 'Palmarès 2027' : '2027 winners'}</h1>
            <p className="mt-6 text-[20px]" style={{ color: 'var(--mute-on-paper)' }}>
              {live
                ? (fr ? `Les enveloppes s’ouvrent pendant le live TikTok du ${live}. Le palmarès apparaîtra ici, catégorie par catégorie.` : `The envelopes open during the TikTok live on ${live}. The winners will appear here, category by category.`)
                : (fr ? 'Les enveloppes s’ouvriront pendant le live TikTok. Le palmarès apparaîtra ici, catégorie par catégorie.' : 'The envelopes will open during the TikTok live. The winners will appear here, category by category.')}
            </p>
            <Link className="z-btn mt-8" href={`/${locale}/archives/2026`}>{fr ? 'Revoir le palmarès 2026' : 'See the 2026 winners'}</Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
