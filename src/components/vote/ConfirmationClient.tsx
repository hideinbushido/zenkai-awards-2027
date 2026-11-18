'use client';

import { Share2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ConfirmationClient({ shareLabel }: { shareLabel: string }) {
  const handleShare = async () => {
    const url = window.location.origin;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Anime Awards 2026',
          text: 'Vote for your favorite anime! ',
          url,
        });
      } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Lien copié !');
    }
  };

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-2 px-6 py-3 border border-[#3A3A38] hover:border-[#F4F4F1]/50 text-gray-300 hover:text-white font-semibold rounded-none transition-all"
    >
      <Share2 className="w-5 h-5" />
      {shareLabel}
    </button>
  );
}
