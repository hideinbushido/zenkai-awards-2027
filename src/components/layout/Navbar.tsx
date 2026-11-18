'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';

/** variant « overlay » : posée sur le hero, s'inverse sur la frontière encre / papier. */
export default function Navbar({ variant = 'bar' }: { variant?: 'bar' | 'overlay' }) {
  const t = useTranslations('nav');
  const locale = useLocale();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const otherLocale = locale === 'fr' ? 'en' : 'fr';
  const switchLocalePath = pathname.replace(`/${locale}`, `/${otherLocale}`);
  const L = (p: string) => `/${locale}${p}`;
  const links = [
    { href: L('/categories'), label: t('categories') },
    { href: L('/nominees'), label: t('nominees') },
    { href: L('/vote'), label: t('vote'), keep: true },
    { href: L('/resultats'), label: locale === 'fr' ? 'Résultats' : 'Results', keep: true },
    { href: L('/archives'), label: 'Archives' },
    { href: L('/faq'), label: t('faq') },
    { href: L('/createurs'), label: t('team') },
  ];
  const isActive = (href: string) => pathname.startsWith(href);

  const overlay = variant === 'overlay';
  return (
    <>
      <nav aria-label={locale === 'fr' ? 'Navigation principale' : 'Main navigation'}
        className={overlay ? 'absolute inset-x-0 top-0 z-50' : 'sticky top-0 z-50 border-b'}
        style={overlay
          ? { mixBlendMode: 'difference', color: 'var(--paper)' }
          : { background: 'var(--ink)', color: 'var(--paper)', borderColor: 'var(--rule-on-ink)' }}>
        <div className="flex items-center gap-7 z-wrap" style={{ paddingBlock: overlay ? 26 : 16 }}>
          <Link href={L('')} className="no-underline" style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 22 }}>
            全快 Zenkai
          </Link>
          <div className="ml-auto hidden lg:flex items-center gap-6 text-[15px] font-medium">
            {links.map((l) => (
              <Link key={l.href} href={l.href} aria-current={isActive(l.href) ? 'page' : undefined}
                className="hover:underline underline-offset-[6px] decoration-2"
                style={isActive(l.href) ? { textDecoration: 'underline', textDecorationThickness: 2, textUnderlineOffset: 6 } : undefined}>
                {l.label}
              </Link>
            ))}
            <Link href={switchLocalePath} lang={otherLocale} className="uppercase hover:underline underline-offset-[6px]">{otherLocale}</Link>
          </div>
          <div className="ml-auto flex lg:hidden items-center gap-5 text-[15px] font-medium">
            {links.filter((l) => l.keep).map((l) => (
              <Link key={l.href} href={l.href}>{l.label}</Link>
            ))}
            <button type="button" onClick={() => setOpen(true)} aria-expanded={open} aria-controls="menu-mobile"
              className="min-h-11 min-w-11 flex items-center justify-center" aria-label={locale === 'fr' ? 'Ouvrir le menu' : 'Open menu'}>
              <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true"><path d="M3 8h20M3 18h20" stroke="currentColor" strokeWidth="2.5" /></svg>
            </button>
          </div>
        </div>
      </nav>

      {open && (
        <div id="menu-mobile" role="dialog" aria-modal="true" aria-label="Menu"
          className="fixed inset-0 z-[60] flex flex-col" style={{ background: 'var(--ink)', color: 'var(--paper)' }}>
          <div className="flex items-center z-wrap" style={{ paddingBlock: 26 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 22 }}>全快 Zenkai</span>
            <button type="button" onClick={() => setOpen(false)} className="ml-auto min-h-11 min-w-11 flex items-center justify-center"
              aria-label={locale === 'fr' ? 'Fermer le menu' : 'Close menu'}>
              <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true"><path d="M5 5l16 16M21 5L5 21" stroke="currentColor" strokeWidth="2.5" /></svg>
            </button>
          </div>
          <ul className="z-wrap flex flex-col mt-6">
            {[{ href: L(''), label: t('home') }, ...links, { href: L('/about'), label: t('about') }].map((l) => (
              <li key={l.href} style={{ borderBottom: '1px solid var(--rule-on-ink)' }}>
                <Link href={l.href} onClick={() => setOpen(false)} className="block py-4"
                  style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 30 }}>{l.label}</Link>
              </li>
            ))}
            <li className="py-5"><Link href={switchLocalePath} lang={otherLocale} onClick={() => setOpen(false)} className="z-link">
              {otherLocale === 'en' ? 'English' : 'Français'}</Link></li>
          </ul>
        </div>
      )}
    </>
  );
}
