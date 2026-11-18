import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import AudioPlayer from '@/components/layout/AudioPlayer';
import AdminFloatingPanel from '@/components/admin/AdminFloatingPanel';
import VisitTracker from '@/components/layout/VisitTracker';

const locales = ['fr', 'en'];

export const metadata: Metadata = {
  title: {
    default: 'Zenkai Anime Awards 2027',
    template: '%s | Zenkai Anime Awards 2027',
  },
  description: 'Les récompenses anime de la communauté — The community anime awards',
  openGraph: {
    title: 'Zenkai Anime Awards 2027',
    description: 'Votez pour vos animés préférés !',
    type: 'website',
  },
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!locales.includes(locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className="min-h-screen">
        <NextIntlClientProvider messages={messages}>
          {children}
          <VisitTracker />
          <AudioPlayer />
          <AdminFloatingPanel />
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: '#1B1B1C',
                color: '#F4F4F1',
                border: '1px solid #3A3A38',
              },
            }}
          />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
