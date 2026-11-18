import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Palmares from '@/components/resultats/Palmares';

export default async function Palmares2026Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <>
      <Navbar />
      <main style={{ background: 'var(--ink)', minHeight: '100vh' }}>
        <Palmares locale={locale} />
      </main>
      <Footer />
    </>
  );
}
