"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  BookOpenText,
  Download,
  Landmark,
  ReceiptText,
  Truck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatRupiah, formatTanggal, todayISO, firstDayOfMonthISO } from "@/lib/format";
import type { CashLedgerEntry } from "@/lib/types";

type Preset = "semua" | "hari-ini" | "bulan-ini" | "bulan-lalu" | "custom";

const PRESETS: { key: Preset; label: string }[] = [
  { key: "hari-ini", label: "Hari ini" },
  { key: "bulan-ini", label: "Bulan ini" },
  { key: "bulan-lalu", label: "Bulan lalu" },
  { key: "semua", label: "Semua" },
  { key: "custom", label: "Pilih tanggal" },
];

// Kotak ikon jurnal — sama dengan Beranda & Transaksi.
function ledgerIcon(refType: string, type: "in" | "out") {
  const base = "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl";
  switch (refType) {
    case "sale":
      return (
        <span className={`${base} bg-primary-tint text-primary-pressed`}>
          <ReceiptText className="h-5 w-5" strokeWidth={2} />
        </span>
      );
    case "expense":
      return (
        <span className={`${base} bg-keluar-tint text-keluar`}>
          <ArrowUpRight className="h-5 w-5" strokeWidth={2} />
        </span>
      );
    case "manual_income":
      return (
        <span className={`${base} bg-masuk-tint text-masuk`}>
          <ArrowDownLeft className="h-5 w-5" strokeWidth={2} />
        </span>
      );
    case "purchase":
      return (
        <span className={`${base} bg-surface-2 text-ink-2`}>
          <Truck className="h-5 w-5" strokeWidth={2} />
        </span>
      );
    case "saldo_awal":
      return (
        <span className={`${base} bg-surface-2 text-ink-2`}>
          <Landmark className="h-5 w-5" strokeWidth={2} />
        </span>
      );
    default:
      return type === "in" ? (
        <span className={`${base} bg-masuk-tint text-masuk`}>
          <ArrowDownLeft className="h-5 w-5" strokeWidth={2} />
        </span>
      ) : (
        <span className={`${base} bg-keluar-tint text-keluar`}>
          <ArrowUpRight className="h-5 w-5" strokeWidth={2} />
        </span>
      );
  }
}

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
  // Saldo awal periode = saldo sekarang dikurangi arus bersih periode ini
  // (jurnal tersusun kronologis & lengkap, jadi konsisten).
  const openingBalance = currentBalance - (totalIn - totalOut);
  const closingBalance = openingBalance + (totalIn - totalOut);

  // Kelompokkan jurnal per tanggal (terbaru dulu) untuk pemisah tanggal.
  const groups = useMemo(() => {
    const map = new Map<string, CashLedgerEntry[]>();
    for (const e of filtered) {
      const arr = map.get(e.transaction_date) ?? [];
      arr.push(e);
      map.set(e.transaction_date, arr);
    }
    return Array.from(map.entries());
  }, [filtered]);

  function exportCsv() {
    const rows = [...filtered].reverse(); // kronologis untuk arsip
    const esc = (s: string) => `"${s.replaceAll('"', '""')}"`;
    const lines = [
      "Tanggal,Keterangan,Masuk,Keluar,Saldo Setelah",
      ...rows.map((e) =>
        [
          e.transaction_date,
          esc(e.description),
          e.type === "in" ? e.amount : "",
          e.type === "out" ? e.amount : "",
          e.balance_after,
        ].join(",")
      ),
    ];
    const blob = new Blob([lines.join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `buku-kas-${preset}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading)
    return (
      <div className="space-y-4">
        <div className="h-8 w-36 animate-pulse rounded-xl bg-surface-2" />
        <div className="h-52 animate-pulse rounded-2xl bg-surface-2" />
        <div className="h-64 animate-pulse rounded-2xl bg-surface-2" />
      </div>
    );

  const emptyState = (
    <div className="card flex flex-col items-center px-5 py-10 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-2 text-ink-3">
        <BookOpenText className="h-6 w-6" strokeWidth={1.8} />
      </span>
      <p className="mt-3 text-sm text-ink-2">
        Tidak ada catatan kas pada periode ini.
      </p>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-[22px] font-bold tracking-[-0.01em]">
            Buku Kas
          </h1>
          <p className="mt-0.5 text-sm text-ink-2">
            Jurnal seluruh uang masuk dan keluar, lengkap dengan saldo
            berjalan.
          </p>
        </div>
        <button
          onClick={exportCsv}
          disabled={filtered.length === 0}
          className="btn-ghost h-11 shrink-0 px-4 disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          CSV
        </button>
      </div>

      {/* Chip periode */}
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPreset(p.key)}
            className={`h-9 rounded-full px-3.5 text-sm font-medium transition active:scale-95 ${
              preset === p.key
                ? "bg-ink text-white"
                : "border border-line bg-white text-ink-2"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {preset === "custom" && (
        <div className="card grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="bk-from" className="label">
              Dari tanggal
            </label>
            <input
              id="bk-from"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label htmlFor="bk-to" className="label">
              Sampai tanggal
            </label>
            <input
              id="bk-to"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="input"
            />
          </div>
        </div>
      )}

      {/* Strip saldo periode */}
      <section className="card">
        <dl className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <dt className="inline-flex items-center gap-2 text-ink-2">
              <ArrowDownLeft className="h-4 w-4 text-masuk" />
              Total Masuk
            </dt>
            <dd className="money font-semibold text-masuk">
              +{formatRupiah(totalIn)}
            </dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="inline-flex items-center gap-2 text-ink-2">
              <ArrowUpRight className="h-4 w-4 text-keluar" />
              Total Keluar
            </dt>
            <dd className="money font-semibold text-keluar">
              −{formatRupiah(totalOut)}
            </dd>
          </div>
          <div className="flex items-center justify-between border-t border-line pt-2.5">
            <dt className="text-ink-2">Saldo Awal Periode</dt>
            <dd className="money">{formatRupiah(openingBalance)}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="font-semibold">Saldo Akhir Periode</dt>
            <dd className="money font-display text-lg font-bold">
              {formatRupiah(closingBalance)}
            </dd>
          </div>
        </dl>
      </section>

      {filtered.length === 0 ? (
        emptyState
      ) : (
        <>
          {/* Daftar mobile: kelompok per tanggal */}
          <div className="space-y-5 md:hidden">
            {groups.map(([date, rows]) => {
              const dayNet = rows.reduce(
                (acc, e) => acc + (e.type === "in" ? e.amount : -e.amount),
                0
              );
              return (
                <section key={date}>
                  <div className="mb-2 flex items-center justify-between px-1">
                    <h2 className="font-display text-sm font-semibold">
                      {formatTanggal(date)}
                    </h2>
                    <span
                      className={`money text-xs font-medium ${
                        dayNet >= 0 ? "text-masuk" : "text-keluar"
                      }`}
                    >
                      {dayNet >= 0 ? "+" : "−"}
                      {formatRupiah(Math.abs(dayNet))}
                    </span>
                  </div>
                  <div className="card !p-0">
                    <ul>
                      {rows.map((e, i) => (
                        <li key={e.id} className="relative">
                          {i > 0 && (
                            <span className="absolute left-[68px] right-0 top-0 h-px bg-line" />
                          )}
                          <div className="flex items-center gap-3 px-4 py-3">
                            {ledgerIcon(e.ref_type, e.type)}
                            <div className="min-w-0 flex-1">
                              <p className="text-[15px] font-semibold leading-snug">
                                {e.description}
                              </p>
                              <p className="money mt-0.5 text-xs text-ink-2">
                                Saldo setelah: {formatRupiah(e.balance_after)}
                              </p>
                            </div>
                            <p
                              className={`money shrink-0 text-[15px] font-semibold ${
                                e.type === "in" ? "text-masuk" : "text-keluar"
                              }`}
                            >
                              {e.type === "in" ? "+" : "−"}{" "}
                              {formatRupiah(e.amount)}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>
              );
            })}
          </div>

          {/* Tabel ≥768px: gaya Stripe — hairline, angka rata kanan */}
          <div className="card !p-0 hidden overflow-hidden md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-ink-2">
                  <th className="px-4 py-3 font-medium">Tanggal</th>
                  <th className="px-4 py-3 font-medium">Keterangan</th>
                  <th className="px-4 py-3 text-right font-medium">Masuk</th>
                  <th className="px-4 py-3 text-right font-medium">Keluar</th>
                  <th className="px-4 py-3 text-right font-medium">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <tr key={e.id} className="border-t border-line">
                    <td className="whitespace-nowrap px-4 py-3 text-ink-2">
                      {formatTanggal(e.transaction_date)}
                    </td>
                    <td className="px-4 py-3 font-medium">{e.description}</td>
                    <td className="money px-4 py-3 text-right text-masuk">
                      {e.type === "in" ? formatRupiah(e.amount) : "—"}
                    </td>
                    <td className="money px-4 py-3 text-right text-keluar">
                      {e.type === "out" ? formatRupiah(e.amount) : "—"}
                    </td>
                    <td className="money px-4 py-3 text-right font-medium">
                      {formatRupiah(e.balance_after)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
