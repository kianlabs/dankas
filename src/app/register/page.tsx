"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    setLoading(false);
    if (error) {
      setError(`Gagal mendaftar: ${error.message}`);
      return;
    }
    if (data.session) {
      // Profil di tabel users dibuat otomatis oleh trigger database.
      router.push("/dashboard");
      router.refresh();
    } else {
      setInfo(
        "Pendaftaran berhasil. Silakan periksa email Anda untuk verifikasi, lalu masuk."
      );
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-10">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <p className="text-2xl font-bold tracking-tight">
          Dan<span className="text-amber-500">Kas</span>
        </p>
        <p className="mt-1 text-sm text-zinc-500">
          Daftar akun staf DAN&apos;S LABEL
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="name" className="text-sm font-medium">
              Nama Lengkap
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm outline-none focus:border-zinc-900"
              placeholder="Nama Anda"
            />
          </div>
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
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm outline-none focus:border-zinc-900"
              placeholder="Minimal 6 karakter"
            />
          </div>
          {error && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </p>
          )}
          {info && (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {info}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-zinc-900 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loading ? "Memproses..." : "Daftar"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-zinc-500">
          Sudah punya akun?{" "}
          <Link href="/login" className="font-semibold text-zinc-900 underline">
            Masuk di sini
          </Link>
        </p>
        <p className="mt-3 text-center text-xs text-zinc-400">
          Akun baru otomatis berperan sebagai Kasir. Pemilik dapat mengubah
          peran lewat dashboard Supabase (tabel users).
        </p>
      </div>
    </main>
  );
}
