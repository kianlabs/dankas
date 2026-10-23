"use client";

import { useEffect, useState } from "react";
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
      if (mode === "pengeluaran") {
        const { data: expense, error: expError } = await supabase
          .from("expenses")
          .insert({
            user_id: null, // tanpa login: pengeluaran tidak terikat user mana pun
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

  if (loading) return <p className="text-sm text-zinc-500">Memuat transaksi...</p>;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Transaksi</h1>
        <p className="text-sm text-zinc-500">
          Catat pengeluaran operasional dan pemasukan lain di luar kasir.
          Semuanya langsung masuk buku kas.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setMode("pengeluaran")}
          className={`rounded-lg py-2.5 text-sm font-semibold ${
            mode === "pengeluaran"
              ? "bg-rose-600 text-white"
              : "bg-white text-zinc-600 shadow-sm"
          }`}
        >
          Pengeluaran
        </button>
        <button
          onClick={() => setMode("pemasukan")}
          className={`rounded-lg py-2.5 text-sm font-semibold ${
            mode === "pemasukan"
              ? "bg-emerald-600 text-white"
              : "bg-white text-zinc-600 shadow-sm"
          }`}
        >
          Pemasukan Lain
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl bg-white p-4 shadow-sm">
        <div>
          <label htmlFor="t-title" className="text-sm font-medium">
            {mode === "pengeluaran" ? "Nama Pengeluaran" : "Keterangan Pemasukan"}
          </label>
          <input
            id="t-title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
            placeholder={
              mode === "pengeluaran" ? "cth. Bayar sewa toko bulan ini" : "cth. Penjualan via WhatsApp"
            }
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="t-cat" className="text-sm font-medium">Kategori</label>
            <select
              id="t-cat"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
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
            <label htmlFor="t-date" className="text-sm font-medium">Tanggal</label>
            <input
              id="t-date"
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
            />
          </div>
          <div>
            <label htmlFor="t-amount" className="text-sm font-medium">Nominal (Rp)</label>
            <input
              id="t-amount"
              type="number"
              min={1}
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
              placeholder="0"
            />
          </div>
          <div>
            <label htmlFor="t-method" className="text-sm font-medium">Metode</label>
            <select
              id="t-method"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
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
          <label htmlFor="t-notes" className="text-sm font-medium">Catatan (opsional)</label>
          <input
            id="t-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
            placeholder="Catatan tambahan"
          />
        </div>
        {error && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
        )}
        {success && (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p>
        )}
        <button
          type="submit"
          disabled={saving}
          className={`w-full rounded-lg py-2.5 text-sm font-semibold text-white disabled:opacity-50 ${
            mode === "pengeluaran" ? "bg-rose-600" : "bg-emerald-600"
          }`}
        >
          {saving ? "Menyimpan..." : mode === "pengeluaran" ? "Simpan Pengeluaran" : "Simpan Pemasukan"}
        </button>
      </form>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="font-semibold">Riwayat Terakhir</h2>
        {recent.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-400">Belum ada transaksi tercatat.</p>
        ) : (
          <ul className="mt-3 divide-y divide-zinc-100">
            {recent.map((r) => (
              <li key={r.id} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-sm font-medium">{r.description}</p>
                  <p className="text-xs text-zinc-400">{formatTanggal(r.transaction_date)}</p>
                </div>
                <p
                  className={`money text-sm font-semibold ${
                    r.type === "in" ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {r.type === "in" ? "+" : "−"} {formatRupiah(r.amount)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
