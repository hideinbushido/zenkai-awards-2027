'use client';

import { useEffect, useState } from 'react';
import { getAllComments, deleteComment } from '@/lib/firestore';
import { Trash2, Search } from 'lucide-react';
import toast from 'react-hot-toast';

interface Comment {
  id: string;
  name: string;
  text: string;
  createdAt: string;
}

export default function CommentsAdmin() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const c = await getAllComments();
      setComments(c);
    } catch {
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer ce commentaire ?')) return;
    setDeletingId(id);
    try {
      await deleteComment(id);
      setComments((prev) => prev.filter((c) => c.id !== id));
      toast.success('Commentaire supprimé');
    } catch {
      toast.error('Erreur lors de la suppression');
    } finally {
      setDeletingId(null);
    }
  }

  const filtered = comments.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.text.toLowerCase().includes(search.toLowerCase())
  );

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
            <span className="gradient-text">Commentaires</span>
          </h1>
          <p className="text-[#8C8C88] text-sm mt-1">{comments.length} commentaires</p>
        </div>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C8C88]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par nom ou texte..."
          className="w-full bg-[#1B1B1C] border border-[#3A3A38] rounded-none pl-10 pr-4 py-3 text-white text-sm placeholder-[#8C8C88] focus:outline-none focus:border-[#F4F4F1]"
        />
      </div>

      <div className="space-y-2">
        {filtered.map((c) => (
          <div
            key={c.id}
            className="bg-[#1B1B1C] border border-[#3A3A38] rounded-none p-4 flex items-start justify-between gap-4"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-white text-sm">{c.name}</span>
                {c.createdAt && (
                  <span className="text-xs text-[#8C8C88]">
                    {new Date(c.createdAt).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                )}
              </div>
              <p className="text-sm text-[#8C8C88] break-words">{c.text}</p>
            </div>
            <button
              onClick={() => handleDelete(c.id)}
              disabled={deletingId === c.id}
              className="flex-shrink-0 p-2 rounded-none text-[#8C8C88] hover:text-red-400 hover:bg-red-400/10 transition-all disabled:opacity-50"
              title="Supprimer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-[#8C8C88]">Aucun commentaire trouvé.</div>
        )}
      </div>
    </div>
  );
}
