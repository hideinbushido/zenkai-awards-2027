import nodemailer from 'nodemailer';
import { getActiveEvent, getCategories, getNominees } from './firestore';
import type { VoteAnswer } from './types';

// ─── Transport ────────────────────────────────────────────────────────────────

function getTransport() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, '');
  if (!user || !pass) return null;
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
}

async function sendMail(to: string, subject: string, html: string): Promise<boolean> {
  const transport = getTransport();
  if (!transport) return false;
  try {
    await transport.sendMail({
      from: `"Zenkai Anime Awards" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    });
    return true;
  } catch (err) {
    console.error('Email error:', err);
    return false;
  }
}

// ─── Name resolution ──────────────────────────────────────────────────────────

async function resolveVotes(answers: VoteAnswer[]) {
  try {
    const ev = await getActiveEvent();
    if (!ev) throw new Error('no event');
    const cats = await getCategories(ev.id);
    const rows: { category: string; nominee: string }[] = [];
    for (const cat of cats) {
      const answer = answers.find((a) => a.categoryId === cat.id);
      if (!answer) continue;
      const nom = (await getNominees(cat.id)).find((n) => n.id === answer.nomineeId);
      rows.push({ category: cat.titleFr || cat.title, nominee: nom?.name ?? answer.nomineeId });
    }
    return rows;
  } catch {
    return answers.map((a) => ({ category: a.categoryId, nominee: a.nomineeId }));
  }
}

function esc(t: string) { return t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string)); }

async function recapRows(answers: VoteAnswer[]): Promise<string> {
  return (await resolveVotes(answers)).map((row) => `
    <tr>
      <td style="padding:10px 16px;color:#5A5A55;font-size:14px;border-bottom:1px solid rgba(11,11,12,0.18);">${esc(row.category)}</td>
      <td style="padding:10px 16px;color:#0B0B0C;font-size:14px;font-weight:700;text-align:right;border-bottom:1px solid rgba(11,11,12,0.18);">${esc(row.nominee)}</td>
    </tr>`).join('');
}

// ─── Email : accès au vote ────────────────────────────────────────────────────

export async function sendAccessEmail(
  to: string,
  voterName: string,
  accessUrl: string
): Promise<boolean> {
  const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0B0B0C;font-family:system-ui,-apple-system,sans-serif;">
<div style="max-width:520px;margin:0 auto;padding:40px 20px;">

  <div style="text-align:center;margin-bottom:28px;">
    <div style="display:inline-flex;align-items:center;justify-content:center;width:64px;height:64px;background:linear-gradient(135deg,#F4F4F1,#8C8C88);border-radius:16px;margin-bottom:14px;">
      <span style="font-size:28px;">🏆</span>
    </div>
    <h1 style="margin:0;color:#F4F4F1;font-size:22px;font-weight:900;">Anime Awards 2026</h1>
    <p style="margin:4px 0 0;color:#8C8C88;font-size:13px;">La communauté anime</p>
  </div>

  <div style="background:#1B1B1C;border:1px solid rgba(244,244,241,0.25);border-radius:20px;padding:32px;">
    <h2 style="margin:0 0 12px;color:#F4F4F1;font-size:20px;font-weight:900;line-height:1.3;">
      C'est l'heure de voter, <span style="color:#F4F4F1;">${voterName}</span>&nbsp;!
    </h2>
    <p style="margin:0 0 28px;color:#8C8C88;font-size:14px;line-height:1.7;">
      Ton accès aux Anime Awards 2026 est prêt. Clique sur le bouton ci-dessous pour commencer à voter pour tes animés préférés de l'année.
    </p>

    <div style="text-align:center;margin:0 0 28px;">
      <a href="${accessUrl}"
        style="display:inline-block;background:linear-gradient(135deg,#F4F4F1,#8C8C88);color:#000;text-decoration:none;font-weight:900;font-size:16px;padding:18px 52px;border-radius:14px;letter-spacing:0.3px;">
        Accéder aux votes →
      </a>
    </div>

    <p style="margin:0;color:#8C8C88;font-size:12px;text-align:center;line-height:1.6;">
      Ce lien est valide pendant <strong style="color:#8C8C88;">24 heures</strong>.<br>
      Si tu n'as pas demandé cet accès, ignore cet email.
    </p>
  </div>

  <p style="text-align:center;color:#3A3A38;font-size:11px;margin-top:20px;">
    Anime Awards 2026 — Les récompenses de la communauté anime
  </p>
</div>
</body>
</html>`;

  return sendMail(to, `${voterName}, accède aux votes — Anime Awards 2026`, html);
}

// ─── Email : récapitulatif après vote ─────────────────────────────────────────

export async function sendRecapEmail(
  to: string,
  voterName: string,
  answers: VoteAnswer[]
): Promise<boolean> {
  const rows = await recapRows(answers);

  const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0B0B0C;font-family:system-ui,-apple-system,sans-serif;">
<div style="max-width:520px;margin:0 auto;padding:40px 20px;">

  <div style="text-align:center;margin-bottom:28px;">
    <div style="display:inline-flex;align-items:center;justify-content:center;width:64px;height:64px;background:linear-gradient(135deg,#F4F4F1,#8C8C88);border-radius:16px;margin-bottom:14px;">
      <span style="font-size:28px;">✅</span>
    </div>
    <h1 style="margin:0;color:#F4F4F1;font-size:22px;font-weight:900;">Anime Awards 2026</h1>
    <p style="margin:4px 0 0;color:#8C8C88;font-size:13px;">La communauté anime</p>
  </div>

  <div style="background:#1B1B1C;border:1px solid rgba(244,244,241,0.25);border-radius:20px;overflow:hidden;">

    <div style="padding:28px 28px 0;">
      <h2 style="margin:0 0 10px;color:#F4F4F1;font-size:20px;font-weight:900;">
        Votes enregistrés, <span style="color:#F4F4F1;">${voterName}</span>&nbsp;! 🎉
      </h2>
      <p style="margin:0 0 4px;color:#8C8C88;font-size:14px;line-height:1.6;">
        Merci d'avoir participé aux Anime Awards 2026. Voici le récapitulatif officiel de tes votes.
      </p>
    </div>

    <div style="margin:24px 0 0;">
      <div style="padding:0 28px 10px;">
        <p style="margin:0;color:#F4F4F1;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">
          Récapitulatif de tes votes
        </p>
      </div>
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="background:rgba(244,244,241,0.06);">
            <th style="padding:10px 16px;text-align:left;color:#8C8C88;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;">Catégorie</th>
            <th style="padding:10px 16px;text-align:right;color:#8C8C88;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;">Ton vote</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>

    <div style="padding:24px 28px;">
      <div style="background:rgba(244,244,241,0.06);border:1px solid rgba(244,244,241,0.15);border-radius:12px;padding:16px;text-align:center;">
        <p style="margin:0;color:#F4F4F1;font-weight:900;font-size:15px;">📅 Résultats en direct</p>
        <p style="margin:6px 0 0;color:#8C8C88;font-size:13px;">
          Les résultats seront annoncés le <strong style="color:#F4F4F1;">2 mai 2026</strong> en direct sur TikTok
        </p>
      </div>
    </div>
  </div>

  <p style="text-align:center;color:#3A3A38;font-size:11px;margin-top:20px;">
    Anime Awards 2026 — Les récompenses de la communauté anime
  </p>
</div>
</body>
</html>`;

  return sendMail(to, `✅ Récapitulatif de tes votes — Anime Awards 2026`, html);
}
