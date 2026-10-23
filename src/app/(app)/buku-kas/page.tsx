"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatRupiah, formatTanggal, todayISO, firstDayOfMonthISO } from "@/lib/format";
import type { CashLedgerEntry } from "@/lib/types";

type Preset = "semua" | "hari-ini" | "bulan-ini" | "bulan-lalu" | "custom";

export default function BukuKasPage() {
  const [entries, setEntries] = useState<CashLedgerEntry[]>([]);
  const [preset, setPreset] = useState<Preset>("bulan-ini");
  const [from, setFrom] = useState(firstDayOfMonthISO(todayISO()));
  const [to, setTo] = useState(todayISO());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("cash_ledger")
        .select("*")
        .order("transaction_date", { ascending: false })
        .order("id", { ascending: false });
      setEntries((data ?? []) as CashLedgerEntry[]);
      setLoading(false);
    }
    load();
  }, []);

  const range = useMemo(() => {
    const today = todayISO();
    const monthStart = firstDayOfMonthISO(today);
    switch (preset) {
      case "semua":
        return { from: "0001-01-01", to: "9999-12-31" };
      case "hari-ini":
        return { from: today, to: today };
      case "bulan-ini":
        return { from: monthStart, to: "9999-12-31" };
      case "bulan-lalu": {
        const d = new Date(`${monthStart}T00:00:00`);
        d.setMonth(d.getMonth() - 1);
        const prevStart = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
        const prevEndDate = new Date(`${monthStart}T00:00:00`);
        prevEndDate.setDate(0);
        const prevEnd = `${prevEndDate.getFullYear()}-${String(prevEndDate.getMonth() + 1).padStart(2, "0")}-${String(prevEndDate.getDate()).padStart(2, "0")}`;
        return { from: prevStart, to: prevEnd };
      }
      case "custom":
        return { from, to };
    }
  }, [preset, from, to]);

  const filtered = entries.filter(
    (e) => e.transaction_date >= range.from && e.transaction_date <= range.to
  );
  const totalIn = filtered
    .filter((e) => e.type === "in")
    .reduce((acc, e) => acc + e.amount, 0);
  const totalOut = filtered
    .filter((e) => e.type === "out")
    .reduce((acc, e) => acc + e.amount, 0);
  const currentBalance = entries.reduce(
    (acc, e) => acc + (e.type === "in" ? e.amount : -e.amount),
    0
  );

  if (loading) return <p className="text-sm text-zinc-500">Memuat buku kas...</p>;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Buku Kas</h1>
        <p className="text-sm text-zinc-500">
          Jurnal seluruh uang masuk dan keluar, lengkap dengan saldo berjalan.
        </p>
      </div>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <label htmlFor="bk-preset" className="text-sm font-medium">
          Periode
        </label>
        <select
          id="bk-preset"
          value={preset}
          onChange={(e) => setPreset(e.target.value as Preset)}
          className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
        >
          <option value="semua">Semua</option>
          <option value="hari-ini">Hari Ini</option>
          <option value="bulan-ini">Bulan Ini</option>
          <option value="bulan-lalu">Bulan Lalu</option>
          <option value="custom">Pilih Tanggal Sendiri</option>
        </select>
        {preset === "custom" && (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="bk-from" className="text-xs font-medium text-zinc-500">
                Dari tanggal
              </label>
              <input
                id="bk-from"
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
              />
            </div>
            <div>
              <label htmlFor="bk-to" className="text-xs font-medium text-zinc-500">
                Sampai tanggal
              </label>
              <input
                id="bk-to"
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
              />
            </div>
          </div>
        )}
        <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-emerald-50 px-2 py-2">
            <dt className="text-[11px] text-emerald-700">Masuk</dt>
            <dd className="money text-sm font-bold text-emerald-700">
              {formatRupiah(totalIn)}
            </dd>
          </div>
          <div className="rounded-lg bg-rose-50 px-2 py-2">
            <dt className="text-[11px] text-rose-700">Keluar</dt>
            <dd className="money text-sm font-bold text-rose-700">
              {formatRupiah(totalOut)}
            </dd>
          </div>
          <div className="rounded-lg bg-zinc-100 px-2 py-2">
            <dt className="text-[11px] text-zinc-500">Saldo Saat Ini</dt>
            <dd className="money text-sm font-bold">{formatRupiah(currentBalance)}</dd>
          </div>
        </dl>
      </section>

      <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
        {filtered.length === 0 ? (
          <p className="p-4 text-sm text-zinc-400">
            Tidak ada catatan kas pada periode ini.
          </p>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {filtered.map((e) => (
              <li key={e.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-snug">{e.description}</p>
                    <p className="mt-0.5 text-xs text-zinc-400">
                      {formatTanggal(e.transaction_date)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p
                      className={`money text-sm font-bold ${
                        e.type === "in" ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {e.type === "in" ? "+" : "−"} {formatRupiah(e.amount)}
                    </p>
                    <p className="money text-xs text-zinc-400">
                      Saldo: {formatRupiah(e.balance_after)}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
