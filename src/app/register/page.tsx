"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, Eye, EyeOff, Loader2, Lock, Mail, User } from "lucide-react";
import AuthShell from "@/components/AuthShell";
import { createClient } from "@/lib/supabase/client";
import { redirectByRole } from "@/lib/auth-redirect";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (password.length < 6) {
      setError("Kata sandi minimal 6 karakter.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (signUpError) {
      setError(`Gagal mendaftar: ${signUpError.message}`);
      setLoading(false);
      return;
    }
    if (data.session && data.user) {
      await redirectByRole(supabase, data.user.id, router);
      return;
    }
    // Konfirmasi email aktif: sesi belum terbentuk sampai tautan diklik.
    setSuccess(
      "Pendaftaran berhasil. Periksa kotak masuk email Anda untuk konfirmasi, lalu masuk dengan akun tersebut."
    );
    setLoading(false);
  }

  const fieldClass = "input h-[52px] pl-11";

  return (
    <AuthShell>
      <h1 className="font-display text-[22px] font-bold tracking-[-0.01em]">
        Daftar Akun Staf
      </h1>
      <p className="mt-1 text-sm text-ink-2">
        Akun untuk staf DAN&apos;S LABEL yang bertugas.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="name" className="label">
            Nama lengkap
          </label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-3" />
            <input
              id="name"
              type="text"
              required
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama Anda"
              className={fieldClass}
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="label">
            Email
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-3" />
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              className={fieldClass}
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="label">
            Kata sandi
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-3" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              minLength={6}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              className="input h-[52px] pl-11 pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-ink-3 transition hover:bg-surface-2"
              aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {error && (
          <p className="rounded-xl bg-keluar-tint px-4 py-3 text-sm text-keluar">
            {error}
          </p>
        )}
        {success && (
          <p className="flex items-start gap-2 rounded-xl bg-masuk-tint px-4 py-3 text-sm text-masuk">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            {success}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary h-[52px] w-full text-[15px]"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? "Memproses..." : "Daftar"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-2">
        Sudah punya akun?{" "}
        <Link
          href="/login"
          className="font-semibold text-primary-pressed hover:underline"
        >
          Masuk di sini
        </Link>
      </p>
    </AuthShell>
  );
}
