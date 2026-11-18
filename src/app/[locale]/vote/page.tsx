import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import SpeedLines from '@/components/z/SpeedLines';
import RequestAccessForm from '@/components/vote/RequestAccessForm';
import { getActiveEvent } from '@/lib/firestore';

const VOTE_OPEN = process.env.VOTE_OPEN === 'true';

export default async function VotePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const fr = locale === 'fr';
  let liveDate: string | undefined;
  try { liveDate = (await getActiveEvent())?.liveDate; } catch {}
  const live = liveDate && !Number.isNaN(new Date(liveDate).getTime())
    ? new Date(liveDate).toLocaleDateString(fr ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'long' }) : null;

  return (
    <>
      <Navbar />
      <main className="relative overflow-hidden z-sec" style={{ minHeight: '80vh' }}>
        <SpeedLines fx={0.95} fy={0.2} opacity={0.08} seed={91} />
        <div className="relative grid lg:grid-cols-[1fr_minmax(0,560px)] gap-12 items-start">
          <div>
            <h1 style={{ fontSize: 'clamp(44px, 6vw, 88px)', lineHeight: 1 }}>{fr ? 'Voter' : 'Vote'}</h1>
            <p className="mt-5 max-w-[30em]" style={{ color: '#C9C9C4' }}>
              {VOTE_OPEN
                ? (fr ? 'Donne ton pseudo et ton e-mail : tu reçois un lien personnel pour retourner tes plaques, catégorie par catégorie.'
                  : 'Give your name and e-mail: you get a personal link to flip your plaques, category by category.')
                : (fr ? 'Les votes de l’édition 2027 ne sont pas ouverts.' : 'Voting for the 2027 edition is not open.')}
            </p>
          </div>
          {VOTE_OPEN ? <RequestAccessForm /> : (
            <div className="border-2 p-8" style={{ borderColor: 'var(--paper)' }}>
              <h2 style={{ fontSize: 'clamp(28px, 3vw, 40px)', lineHeight: 1.1 }}>{fr ? 'Votes fermés' : 'Voting closed'}</h2>
              <p className="mt-4" style={{ color: '#C9C9C4' }}>
                {live ? (fr ? `Rendez-vous au live TikTok le ${live} pour l’ouverture des enveloppes.` : `See you at the TikTok live on ${live} for the envelopes.`)
                  : (fr ? 'Les dates de l’édition 2027 seront annoncées ici et sur TikTok.' : 'The 2027 dates will be announced here and on TikTok.')}
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
