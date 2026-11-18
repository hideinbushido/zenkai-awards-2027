'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { clsx } from 'clsx';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function FAQPage() {
  const t = useTranslations('faq');
  const questions = t.raw('questions') as Array<{ q: string; a: string }>;
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <>
      <Navbar />
      <main className="pt-12 pb-20" style={{ background: '#0B0B0C', minHeight: '100vh' }}>
        {/* Projecteur */}
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[900px] h-[300px] pointer-events-none z-0"
          style={{ background: 'radial-gradient(ellipse at top, rgba(244,244,241,0.1) 0%, transparent 65%)' }} />

        <div className="container-mobile relative z-10">
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-black mb-4">
              <span className="gradient-text">{t('title')}</span>
            </h1>
            <div className="gold-divider w-32 mx-auto mb-4" />
            <p className="text-lg" style={{ color: '#8C8C88' }}>{t('subtitle')}</p>
          </div>

          <div className="max-w-3xl mx-auto space-y-3">
            {questions.map((item, i) => (
              <div key={i} className="rounded-none overflow-hidden"
                style={{
                  background: 'rgba(11,11,12,0.9)',
                  border: `1px solid ${openIdx === i ? 'rgba(244,244,241,0.35)' : 'rgba(244,244,241,0.12)'}`,
                  boxShadow: openIdx === i ? '0 0 20px rgba(244,244,241,0.08)' : 'none',
                  transition: 'border-color 0.3s, box-shadow 0.3s',
                }}
              >
                <button
                  onClick={() => setOpenIdx(openIdx === i ? null : i)}
                  className="w-full flex items-center justify-between p-6 text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-none flex items-center justify-center flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #F4F4F1, #8C8C88)' }}
                    >
                      <HelpCircle className="w-4 h-4 text-black" />
                    </div>
                    <span className={clsx('font-semibold', openIdx === i ? 'text-[#F4F4F1]' : 'text-white')}>
                      {item.q}
                    </span>
                  </div>
                  {openIdx === i
                    ? <ChevronUp className="w-5 h-5 flex-shrink-0 ml-4" style={{ color: '#F4F4F1' }} />
                    : <ChevronDown className="w-5 h-5 flex-shrink-0 ml-4" style={{ color: '#8C8C88' }} />
                  }
                </button>
                {openIdx === i && (
                  <div className="px-6 pb-6 pt-4" style={{ borderTop: '1px solid rgba(244,244,241,0.1)' }}>
                    <p className="leading-relaxed" style={{ color: '#8C8C88' }}>{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
