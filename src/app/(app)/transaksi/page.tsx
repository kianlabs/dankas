"use client";

import { useEffect, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  HandCoins,
  ReceiptText,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { appendLedger } from "@/lib/ledger";
import { formatRupiah, formatTanggal, todayISO } from "@/lib/format";
import { PAYMENT_METHODS, type CashLedgerEntry, type Category } from "@/lib/types";

type Mode = "pengeluaran" | "pemasukan";

export default function TransaksiPage() {
  const [mode, setMode] = useState<Mode>("pengeluaran");
  const [categories, setCategories] = useState<Category[]>([]);
  const [recent, setRecent] = useState<CashLedgerEntry[]>([]);
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayISO());
  const [method, setMethod] = useState<string>("Tunai");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    const supabase = createClient();
    const [catRes, ledgerRes] = await Promise.all([
      supabase.from("categories").select("*").order("name"),
      supabase
        .from("cash_ledger")
        .select("*")
        .order("transaction_date", { ascending: false })
        .order("id", { ascending: false })
        .limit(10),
    ]);
    setCategories((catRes.data ?? []) as Category[]);
    setRecent((ledgerRes.data ?? []) as CashLedgerEntry[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // Aksi cepat dari Beranda: /transaksi?mode=pemasukan|pengeluaran
    const preset = new URLSearchParams(window.location.search).get("mode");
    if (preset === "pemasukan" || preset === "pengeluaran") setMode(preset);
  }, []);

  const visibleCategories = categories.filter((c) =>
    mode === "pengeluaran" ? c.type === "pengeluaran" : c.type === "pemasukan"
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const nominal = Number(amount) || 0;
    if (nominal <= 0) {
      setError("Nominal harus lebih besar dari 0.");
      return;
    }
    if (!title.trim()) {
      setError("Keterangan wajib diisi.");
      return;
    }

    setSaving(true);
    const supabase = createClient();

    try {
      // Pengeluaran dicatat atas nama staf yang sedang login.
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (mode === "pengeluaran") {
        const { data: expense, error: expError } = await supabase
          .from("expenses")
          .insert({
            user_id: user?.id ?? null,
            category_id: categoryId ? Number(categoryId) : null,
            title: title.trim(),
            amount: nominal,
            expense_date: date,
            payment_method: method,
            notes: notes.trim() || null,
          })
          .select("id")
          .single();
        if (expError || !expense) throw new Error(expError?.message ?? "Gagal menyimpan pengeluaran.");

        const categoryName = categories.find((c) => c.id === Number(categoryId))?.name;
        const { error: ledgerError } = await appendLedger(supabase, {
          ref_type: "expense",
          ref_id: expense.id,
          type: "out",
          amount: nominal,
          description: `Pengeluaran: ${title.trim()}${categoryName ? ` (${categoryName})` : ""}`,
          transaction_date: date,
        });
        if (ledgerError) throw new Error(ledgerError);
        setSuccess("Pengeluaran berhasil dicatat ke buku kas.");
      } else {
        const categoryName = categories.find((c) => c.id === Number(categoryId))?.name;
        const { error: ledgerError } = await appendLedger(supabase, {
          ref_type: "manual_income",
          type: "in",
          amount: nominal,
          description: `Pemasukan: ${title.trim()}${categoryName ? ` (${categoryName})` : ""}${notes.trim() ? ` — ${notes.trim()}` : ""}`,
          transaction_date: date,
        });
        if (ledgerError) throw new Error(ledgerError);
        setSuccess("Pemasukan berhasil dicatat ke buku kas.");
      }

      setTitle("");
      setAmount("");
      setNotes("");
      setCategoryId("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan.");
    } finally {
      setSaving(false);
    }
  }

  if (loading)
    return (
      <div className="space-y-4">
        <div className="h-8 w-36 animate-pulse rounded-xl bg-surface-2" />
        <div className="h-80 animate-pulse rounded-2xl bg-surface-2" />
      </div>
    );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-[22px] font-bold tracking-[-0.01em]">Transaksi</h1>
        <p className="mt-0.5 text-sm text-ink-2">
          Catat pengeluaran operasional dan pemasukan lain di luar kasir.
          Semuanya langsung masuk buku kas.
        </p>
      </div>

      {/* Segmented control mode */}
      <div className="grid grid-cols-2 gap-1 rounded-full bg-surface-2 p-1">
        <button
          onClick={() => setMode("pengeluaran")}
          className={`inline-flex h-11 items-center justify-center gap-2 rounded-full text-sm font-semibold transition active:scale-[0.98] ${
            mode === "pengeluaran" ? "bg-white text-ink" : "text-ink-2"
          }`}
        >
          <TrendingDown className="h-4 w-4 text-keluar" />
          Pengeluaran
        </button>
        <button
          onClick={() => setMode("pemasukan")}
          className={`inline-flex h-11 items-center justify-center gap-2 rounded-full text-sm font-semibold transition active:scale-[0.98] ${
            mode === "pemasukan" ? "bg-white text-ink" : "text-ink-2"
          }`}
        >
          <TrendingUp className="h-4 w-4 text-masuk" />
          Pemasukan Lain
        </button>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label htmlFor="t-title" className="label">
            {mode === "pengeluaran" ? "Nama Pengeluaran" : "Keterangan Pemasukan"}
          </label>
          <input
            id="t-title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input"
            placeholder={
              mode === "pengeluaran" ? "cth. Bayar sewa toko bulan ini" : "cth. Penjualan via WhatsApp"
            }
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="t-cat" className="label">Kategori</label>
            <select
              id="t-cat"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="input"
            >
              <option value="">— Pilih kategori —</option>
              {visibleCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="t-date" className="label">Tanggal</label>
            <input
              id="t-date"
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label htmlFor="t-amount" className="label">Nominal (Rp)</label>
            <input
              id="t-amount"
              type="number"
              min={1}
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input"
              placeholder="0"
            />
          </div>
          <div>
            <label htmlFor="t-method" className="label">Metode</label>
            <select
              id="t-method"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="input"
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="t-notes" className="label">Catatan (opsional)</label>
          <input
            id="t-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="input"
            placeholder="Catatan tambahan"
          />
        </div>
        {error && (
          <p className="rounded-xl bg-keluar-tint px-3.5 py-2.5 text-sm text-keluar">{error}</p>
        )}
        {success && (
          <p className="rounded-xl bg-masuk-tint px-3.5 py-2.5 text-sm text-masuk">{success}</p>
        )}
        <button
          type="submit"
          disabled={saving}
          className="btn-primary h-12 w-full text-[15px]"
        >
          {saving ? "Menyimpan..." : mode === "pengeluaran" ? "Simpan Pengeluaran" : "Simpan Pemasukan"}
        </button>
      </form>

      <section>
        <h2 className="mb-3 font-display text-base font-semibold">Riwayat Terakhir</h2>
        <div className="card !p-0">
          {recent.length === 0 ? (
            <div className="flex flex-col items-center px-4 py-8 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-2 text-ink-3">
                <ReceiptText className="h-6 w-6" strokeWidth={1.8} />
              </span>
              <p className="mt-3 text-sm text-ink-2">Belum ada transaksi tercatat.</p>
            </div>
          ) : (
            <ul>
              {recent.map((r, i) => (
                <li key={r.id} className="relative">
                  {i > 0 && (
                    <span className="absolute left-[68px] right-0 top-0 h-px bg-line" />
                  )}
                  <div className="flex min-h-16 items-center gap-3 px-4 py-3">
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        r.ref_type === "sale"
                          ? "bg-primary-tint text-primary-pressed"
                          : r.ref_type === "manual_income"
                            ? "bg-masuk-tint text-masuk"
                            : r.ref_type === "expense"
                              ? "bg-keluar-tint text-keluar"
                              : r.type === "in"
                                ? "bg-masuk-tint text-masuk"
                                : "bg-keluar-tint text-keluar"
                      }`}
                    >
                      {r.ref_type === "manual_income" ? (
                        <HandCoins className="h-5 w-5" strokeWidth={2} />
                      ) : r.ref_type === "sale" ? (
                        <ReceiptText className="h-5 w-5" strokeWidth={2} />
                      ) : r.type === "in" ? (
                        <ArrowDownLeft className="h-5 w-5" strokeWidth={2} />
                      ) : (
                        <ArrowUpRight className="h-5 w-5" strokeWidth={2} />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-semibold">{r.description}</p>
                      <p className="text-xs text-ink-2">{formatTanggal(r.transaction_date)}</p>
                    </div>
                    <p
                      className={`money shrink-0 text-[15px] font-semibold ${
                        r.type === "in" ? "text-masuk" : "text-keluar"
                      }`}
                    >
                      {r.type === "in" ? "+" : "−"} {formatRupiah(r.amount)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
