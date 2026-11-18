'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';

export default function Footer() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const L = (p: string) => `/${locale}${p}`;
  const links = [
    [L('/about'), t('about')], [L('/categories'), t('categories')], [L('/nominees'), t('nominees')],
    [L('/vote'), t('vote')], [L('/archives'), 'Archives'], [L('/faq'), t('faq')], [L('/createurs'), t('team')],
  ];
  return (
    <footer style={{ background: 'var(--ink)', color: 'var(--paper)', borderTop: '2px solid var(--paper)' }}>
      <div className="z-wrap flex flex-wrap items-end gap-x-12 gap-y-8" style={{ paddingBlock: 56 }}>
        <div>
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 40, lineHeight: 1 }}>全快 Zenkai</p>
          <p className="mt-3" style={{ color: 'var(--mute-on-ink)', fontSize: 15 }}>
            {locale === 'fr' ? 'Anime Awards, deuxième édition. Voté par les fans.' : 'Anime Awards, second edition. Voted by the fans.'}
          </p>
        </div>
        <ul className="flex flex-wrap gap-x-6 gap-y-2 text-[15px]">
          {links.map(([href, label]) => (
            <li key={href}><Link href={href} className="hover:underline underline-offset-[6px]">{label}</Link></li>
          ))}
        </ul>
        <div className="ml-auto text-[14px]" style={{ color: 'var(--mute-on-ink)' }}>
          <p>© 2027 Zenkai Anime Awards</p>
          <Link href={L('/admin/login')} className="hover:underline underline-offset-[6px]">{locale === 'fr' ? 'Connexion admin' : 'Admin sign-in'}</Link>
        </div>
      </div>
    </footer>
  );
}
