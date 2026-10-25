import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Default environment variables if provided
const envSupabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const envSupabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(customUrl?: string, customKey?: string): SupabaseClient | null {
  const url = customUrl || localStorage.getItem('familykhata_supabase_url') || envSupabaseUrl;
  const key = customKey || localStorage.getItem('familykhata_supabase_key') || envSupabaseAnonKey;

  if (!url || !key) {
    return null;
  }

  try {
    if (!supabaseClient || customUrl || customKey) {
      supabaseClient = createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
    }
    return supabaseClient;
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    return null;
  }
}

export function saveSupabaseConfig(url: string, key: string) {
  localStorage.setItem('familykhata_supabase_url', url);
  localStorage.setItem('familykhata_supabase_key', key);
  supabaseClient = null; // reset client to reinitialize
}

export function clearSupabaseConfig() {
  localStorage.removeItem('familykhata_supabase_url');
  localStorage.removeItem('familykhata_supabase_key');
  supabaseClient = null;
}
