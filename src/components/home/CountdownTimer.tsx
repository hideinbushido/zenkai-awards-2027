'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';

interface CountdownTimerProps {
  targetDate: string;
  label: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calculateTimeLeft(targetDate: string): TimeLeft | null {
  const diff = new Date(targetDate).getTime() - Date.now();
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
  };
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="rounded-none w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center pulse-glow"
        style={{ background: 'rgba(11,11,12,0.9)', border: '1px solid rgba(244,244,241,0.3)' }}
      >
        <span className="text-2xl sm:text-3xl font-bold tabular-nums" style={{ color: '#F4F4F1' }}>
          {String(value).padStart(2, '0')}
        </span>
      </div>
      <span className="text-xs mt-2 uppercase tracking-wider" style={{ color: '#8C8C88' }}>{label}</span>
    </div>
  );
}

export default function CountdownTimer({ targetDate, label }: CountdownTimerProps) {
  const t = useTranslations('home.countdown');
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTimeLeft(calculateTimeLeft(targetDate));
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft(targetDate)), 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  if (!mounted) return null;

  if (!timeLeft) {
    return (
      <div className="text-center">
        <p className="font-semibold text-lg" style={{ color: '#F4F4F1' }}>
          {label === 'vote' ? t('votingClosed') : t('liveStarted')}
        </p>
      </div>
    );
  }

  return (
    <div className="text-center">
      <p className="text-sm mb-4 uppercase tracking-wider" style={{ color: '#8C8C88' }}>{label}</p>
      <div className="flex items-center justify-center gap-3 sm:gap-4">
        <TimeUnit value={timeLeft.days} label={t('days')} />
        <span className="text-2xl font-bold mb-6" style={{ color: '#F4F4F1' }}>:</span>
        <TimeUnit value={timeLeft.hours} label={t('hours')} />
        <span className="text-2xl font-bold mb-6" style={{ color: '#F4F4F1' }}>:</span>
        <TimeUnit value={timeLeft.minutes} label={t('minutes')} />
        <span className="text-2xl font-bold mb-6" style={{ color: '#F4F4F1' }}>:</span>
        <TimeUnit value={timeLeft.seconds} label={t('seconds')} />
      </div>
    </div>
  );
}
