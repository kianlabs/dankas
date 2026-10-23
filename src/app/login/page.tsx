"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import AuthShell from "@/components/AuthShell";
import { createClient } from "@/lib/supabase/client";
import { redirectByRole } from "@/lib/auth-redirect";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { data, error: signInError } =
      await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      // Pesan generik — jangan bocorkan bagian mana yang salah.
      setError(
        signInError.message.toLowerCase().includes("invalid")
          ? "Email atau kata sandi salah. Periksa lagi, ya."
          : `Gagal masuk: ${signInError.message}`
      );
      setLoading(false);
      return;
    }
    if (data.user) {
      await redirectByRole(supabase, data.user.id, router);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <AuthShell>
      <h1 className="font-display text-[22px] font-bold tracking-[-0.01em]">
        Masuk ke DanKas
      </h1>
      <p className="mt-1 text-sm text-ink-2">
        Kelola keuangan toko DAN&apos;S LABEL.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
              className="input h-[52px] pl-11"
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
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan kata sandi"
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

        <button
          type="submit"
          disabled={loading}
          className="btn-primary h-[52px] w-full text-[15px]"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? "Memproses..." : "Masuk"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-2">
        Belum punya akun?{" "}
        <Link
          href="/register"
          className="font-semibold text-primary-pressed hover:underline"
        >
          Daftar di sini
        </Link>
      </p>
    </AuthShell>
  );
}
