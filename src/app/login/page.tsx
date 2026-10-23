"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) {
      setError(
        "Gagal masuk. Periksa kembali email dan kata sandi Anda."
      );
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-10">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <p className="text-2xl font-bold tracking-tight">
          Dan<span className="text-amber-500">Kas</span>
        </p>
        <p className="mt-1 text-sm text-zinc-500">
          Pencatatan keuangan DAN&apos;S LABEL Surakarta
        </p>

        {!isSupabaseConfigured() && (
          <div className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Supabase belum dihubungkan. Isi <code>.env.local</code> dari file{" "}
            <code>.env.example</code> terlebih dahulu (lihat README).
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm outline-none focus:border-zinc-900"
              placeholder="nama@email.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="text-sm font-medium">
              Kata Sandi
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm outline-none focus:border-zinc-900"
              placeholder="••••••••"
            />
          </div>
          {error && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-zinc-900 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loading ? "Memproses..." : "Masuk"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-zinc-500">
          Belum punya akun?{" "}
          <Link href="/register" className="font-semibold text-zinc-900 underline">
            Daftar di sini
          </Link>
        </p>
      </div>
    </main>
  );
}
