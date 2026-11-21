"use client";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Clé publiable : faite pour être dans le navigateur. Les droits sont gardés par la base (RLS + fonctions).
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://ngqhmyiugcxosjalrjsl.supabase.co";
const CLE = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "sb_publishable_si9C7ApjTBcAwpde9R2_qA_BKMKky9U";

let client: SupabaseClient | null = null;

export function supabase(): SupabaseClient {
  if (!client) client = createClient(URL, CLE, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
  return client;
}
