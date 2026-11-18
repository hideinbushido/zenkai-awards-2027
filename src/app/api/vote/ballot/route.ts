import { NextResponse } from 'next/server';
import { getActiveEvent, getCategories, getNominees } from '@/lib/firestore';
import type { Nominee } from '@/lib/types';
import { db } from '@/lib/firebase';
import { PLACEHOLDER_CATEGORIES, PLACEHOLDER_NOMINEES } from '@/data/placeholders2026';

// Bulletin de l'édition en cours : catégories actives et leurs nominés.
export async function GET() {
  // Développement local sans Firebase : bulletin 2026 pour tester l'interface
  if (!db && process.env.NODE_ENV !== 'production') {
    return NextResponse.json({ eventId: 'dev', categories: PLACEHOLDER_CATEGORIES, nomineesByCategory: PLACEHOLDER_NOMINEES });
  }
  try {
    const event = await getActiveEvent();
    if (!event) return NextResponse.json({ eventId: null, categories: [], nomineesByCategory: {} });
    const categories = await getCategories(event.id);
    const lists = await Promise.all(categories.map((c) => getNominees(c.id)));
    const nomineesByCategory: Record<string, Nominee[]> = {};
    categories.forEach((c, i) => { nomineesByCategory[c.id] = lists[i]; });
    return NextResponse.json({ eventId: event.id, categories, nomineesByCategory });
  } catch (e) {
    console.error('ballot error', e);
    return NextResponse.json({ error: 'Impossible de charger le bulletin.' }, { status: 500 });
  }
}
