import { createBrowserClient } from "@supabase/ssr";

// Client Supabase untuk komponen sisi browser (Client Components).
// Nilai placeholder dipakai hanya agar build tidak gagal saat env belum diisi;
// aplikasi tetap butuh .env.local yang benar untuk benar-benar terhubung.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder-anon-key"
  );
}

export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
