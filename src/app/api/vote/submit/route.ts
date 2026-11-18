import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { submitVote, hasVotedByEmail, deleteVoteAccess, getVoteAccessByToken, getActiveEvent } from '@/lib/firestore';
import { sendRecapEmail } from '@/lib/email';
import { db } from '@/lib/firebase';

function getIpHash(req: NextRequest): string {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';
  return createHash('sha256').update(ip).digest('hex');
}

export async function POST(req: NextRequest) {
  try {
    if (process.env.VOTE_OPEN !== 'true') {
      return NextResponse.json({ error: 'Les votes ne sont pas ouverts.' }, { status: 403 });
    }
    const { voterName, voterEmail, answers, token } = await req.json();

    if (!voterName?.trim() || !voterEmail?.trim()) {
      return NextResponse.json({ error: 'Données manquantes.' }, { status: 400 });
    }
    if (!Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json({ error: 'Aucun vote fourni.' }, { status: 400 });
    }

    const email = voterEmail.trim().toLowerCase();

    // Sans Firebase : mode démo, uniquement en développement
    if (!db) {
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Service indisponible.' }, { status: 503 });
      }
      sendRecapEmail(email, voterName.trim(), answers);
      return NextResponse.json({ success: true, mode: 'dev' });
    }

    // Le lien d'accès doit exister, être valide et correspondre à cet e-mail
    const access = token ? await getVoteAccessByToken(token) : null;
    if (!access || access.voterEmail.toLowerCase() !== email) {
      return NextResponse.json({ error: 'Lien d’accès invalide. Redemande un lien depuis la page de vote.' }, { status: 403 });
    }
    if (new Date(access.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'Ce lien a expiré. Redemande un lien depuis la page de vote.' }, { status: 410 });
    }

    const event = await getActiveEvent();
    if (!event) {
      return NextResponse.json({ error: 'Aucune édition en cours.' }, { status: 409 });
    }

    // Une réponse par catégorie au maximum
    const seen = new Set<string>();
    const cleanAnswers = answers.filter((a: { categoryId?: string; nomineeId?: string }) => {
      if (!a?.categoryId || !a?.nomineeId || seen.has(a.categoryId)) return false;
      seen.add(a.categoryId); return true;
    });

    // Check already voted (pour cette édition)
    const alreadyVoted = await hasVotedByEmail(email, event.id);
    if (alreadyVoted) {
      return NextResponse.json(
        { error: 'Tu as déjà voté avec cet email.' },
        { status: 429 }
      );
    }

    const ipHash = getIpHash(req);

    // Save vote
    await submitVote({
      eventId: event.id,
      voterName: voterName.trim(),
      voterEmail: email,
      answers: cleanAnswers,
      ipHash,
    });

    // Le lien ne sert qu'une fois
    try { await deleteVoteAccess(access.docId); } catch { /* non bloquant */ }

    // Send recap email (awaited so Vercel doesn't kill it before it sends)
    await sendRecapEmail(email, voterName.trim(), cleanAnswers);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Submit vote error:', error);
    return NextResponse.json({ error: 'Erreur interne.' }, { status: 500 });
  }
}
