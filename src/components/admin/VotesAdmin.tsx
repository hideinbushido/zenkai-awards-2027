'use client';

import { useEffect, useState } from 'react';
import { getActiveEvent, getVotes, getAllCategories, getNominees } from '@/lib/firestore';
import type { Vote, Category, Nominee } from '@/lib/types';
import { Download, ChevronDown, ChevronRight, Search } from 'lucide-react';
import toast from 'react-hot-toast';

export default function VotesAdmin() {
  const [votes, setVotes] = useState<Vote[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [nomineesMap, setNomineesMap] = useState<Record<string, Nominee>>({});
  const [eventId, setEventId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedVote, setExpandedVote] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const event = await getActiveEvent();
      if (event) {
        setEventId(event.id);
        const [v, cats] = await Promise.all([getVotes(event.id), getAllCategories(event.id)]);
        setCategories(cats);
        setVotes(v.sort((a, b) => new Date(b.votedAt).getTime() - new Date(a.votedAt).getTime()));

        // Build nominees map
        const map: Record<string, Nominee> = {};
        for (const cat of cats) {
          const noms = await getNominees(cat.id);
          for (const nom of noms) {
            map[nom.id] = nom;
          }
        }
        setNomineesMap(map);
      }
    } catch {
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }

  const handleExport = async () => {
    if (!eventId) return;
    const res = await fetch(`/api/admin/export?eventId=${eventId}`);
    if (!res.ok) { toast.error('Erreur export'); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `votes-anime-awards-2026.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredVotes = votes.filter(
    (v) =>
      v.voterName.toLowerCase().includes(search.toLowerCase()) ||
      ((v as any).voterTiktok || '').toLowerCase().includes(search.toLowerCase())
  );

  const getCategoryTitle = (catId: string) =>
    categories.find((c) => c.id === catId)?.titleFr || catId;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#F4F4F1] border-t-transparent rounded-none animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            <span className="gradient-text">Votes</span>
          </h1>
          <p className="text-[#8C8C88] text-sm mt-1">{votes.length} votes enregistrés</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-[#F4F4F1] hover:bg-[#8C8C88] text-white rounded-none text-sm font-medium transition-all"
        >
          <Download className="w-4 h-4" />
          Exporter CSV
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C8C88]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par nom ou email..."
          className="w-full bg-[#1B1B1C] border border-[#3A3A38] rounded-none pl-10 pr-4 py-3 text-white text-sm placeholder-[#8C8C88] focus:outline-none focus:border-[#F4F4F1]"
        />
      </div>

      {/* Votes list */}
      <div className="space-y-2">
        {filteredVotes.map((vote) => (
          <div
            key={vote.id}
            className="bg-[#1B1B1C] border border-[#3A3A38] rounded-none overflow-hidden"
          >
            <button
              onClick={() => setExpandedVote(expandedVote === vote.id ? null : vote.id)}
              className="w-full flex items-center justify-between p-4 text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-none bg-gradient-to-br from-[#F4F4F1] to-[#8C8C88] flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">
                    {vote.voterName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-white text-sm">{vote.voterName}</p>
                  <div className="flex items-center gap-2 text-xs text-[#8C8C88]">
                    {(vote as any).voterTiktok && <span>@{(vote as any).voterTiktok.replace(/^@/, '')}</span>}
                    <span>·</span>
                    <span>
                      {new Date(vote.votedAt).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#8C8C88]">{vote.answers.length} votes</span>
                {expandedVote === vote.id ? (
                  <ChevronDown className="w-4 h-4 text-[#8C8C88]" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-[#8C8C88]" />
                )}
              </div>
            </button>

            {expandedVote === vote.id && (
              <div className="px-4 pb-4 border-t border-[#3A3A38] pt-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {vote.answers.map((answer) => {
                    const nominee = nomineesMap[answer.nomineeId];
                    return (
                      <div
                        key={answer.categoryId}
                        className="flex items-center justify-between bg-[#0B0B0C] rounded-none px-3 py-2"
                      >
                        <span className="text-xs text-[#8C8C88]">
                          {getCategoryTitle(answer.categoryId)}
                        </span>
                        <span className="text-xs text-white font-medium">
                          {nominee ? `${nominee.name} (${nominee.anime})` : answer.nomineeId}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
        {filteredVotes.length === 0 && (
          <div className="text-center py-16 text-[#8C8C88]">Aucun vote trouvé.</div>
        )}
      </div>
    </div>
  );
}
