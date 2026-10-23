"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatRupiah, formatTanggal, todayISO, firstDayOfMonthISO } from "@/lib/format";
import type { CashLedgerEntry, Product } from "@/lib/types";

interface Summary {
  balance: number;
  inToday: number;
  outToday: number;
  inMonth: number;
  outMonth: number;
  netProfitMonth: number;
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<Summary>({
    balance: 0,
    inToday: 0,
    outToday: 0,
    inMonth: 0,
    outMonth: 0,
    netProfitMonth: 0,
  });
  const [recent, setRecent] = useState<CashLedgerEntry[]>([]);
  const [lowStock, setLowStock] = useState<Product[]>([]);
  const [isEmpty, setIsEmpty] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const today = todayISO();
      const monthStart = firstDayOfMonthISO(today);

      const [ledgerRes, salesRes, expensesRes, productsRes] = await Promise.all([
        supabase
          .from("cash_ledger")
          .select("*")
          .order("transaction_date", { ascending: false })
          .order("id", { ascending: false }),
        supabase.from("sales").select("id, grand_total").gte("sale_date", monthStart),
        supabase.from("expenses").select("amount").gte("expense_date", monthStart),
        supabase.from("products").select("*").order("name"),
      ]);

      const ledger = (ledgerRes.data ?? []) as CashLedgerEntry[];
      const monthSales = salesRes.data ?? [];
      const monthExpenses = expensesRes.data ?? [];
      const products = (productsRes.data ?? []) as Product[];

      // HPP bulan ini dari snapshot sale_items
      let hppMonth = 0;
      const saleIds = monthSales.map((s) => s.id);
      if (saleIds.length > 0) {
        const { data: items } = await supabase
          .from("sale_items")
          .select("qty, cost_price")
          .in("sale_id", saleIds);
        hppMonth = (items ?? []).reduce(
          (acc, it) => acc + it.qty * it.cost_price,
          0
        );
      }

      const sumLedger = (
        rows: CashLedgerEntry[],
        type: "in" | "out",
        filter: (r: CashLedgerEntry) => boolean
      ) =>
        rows
          .filter((r) => r.type === type && filter(r))
          .reduce((acc, r) => acc + r.amount, 0);

      const salesMonthTotal = monthSales.reduce(
        (acc, s) => acc + s.grand_total,
        0
      );
      const expensesMonthTotal = monthExpenses.reduce(
        (acc, e) => acc + e.amount,
        0
      );
      const otherIncomeMonth = sumLedger(
        ledger,
        "in",
        (r) => r.transaction_date >= monthStart && r.ref_type === "manual_income"
      );

      setSummary({
        balance: ledger.reduce(
          (acc, r) => acc + (r.type === "in" ? r.amount : -r.amount),
          0
        ),
        inToday: sumLedger(ledger, "in", (r) => r.transaction_date === today),
        outToday: sumLedger(ledger, "out", (r) => r.transaction_date === today),
        inMonth: sumLedger(ledger, "in", (r) => r.transaction_date >= monthStart),
        outMonth: sumLedger(ledger, "out", (r) => r.transaction_date >= monthStart),
        // Laba bersih = Penjualan - HPP - Pengeluaran + Pemasukan lain
        netProfitMonth:
          salesMonthTotal - hppMonth - expensesMonthTotal + otherIncomeMonth,
      });
      setRecent(ledger.slice(0, 5));
      setLowStock(products.filter((p) => p.stock <= p.min_stock));
      setIsEmpty(ledger.length === 0 && products.length === 0);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return <p className="text-sm text-zinc-500">Memuat dashboard...</p>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Beranda</h1>
        <p className="text-sm text-zinc-500">
          Ringkasan keuangan toko hari ini dan bulan ini.
        </p>
      </div>

      {isEmpty && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="font-semibold text-amber-900">Selamat datang di DanKas</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-amber-800">
            <li>
              Tambahkan produk baju pertama Anda di menu{" "}
              <Link href="/produk" className="font-semibold underline">
                Produk
              </Link>
              .
            </li>
            <li>
              Catat penjualan lewat menu{" "}
              <Link href="/kasir" className="font-semibold underline">
                Kasir
              </Link>{" "}
              — stok, HPP, dan buku kas tercatat otomatis.
            </li>
            <li>
              Catat pengeluaran (sewa, gaji, operasional) di menu{" "}
              <Link href="/transaksi" className="font-semibold underline">
                Transaksi
              </Link>
              , lalu pantau laba di{" "}
              <Link href="/laporan" className="font-semibold underline">
                Laporan
              </Link>
              .
            </li>
          </ol>
        </div>
      )}

      <section className="rounded-2xl bg-zinc-900 p-5 text-white">
        <p className="text-xs uppercase tracking-wide text-zinc-400">Saldo Kas</p>
        <p className="money mt-1 text-3xl font-bold">{formatRupiah(summary.balance)}</p>
        <p className="mt-2 text-xs text-zinc-400">
          Dari buku kas (total masuk dikurangi total keluar)
        </p>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-xs text-zinc-500">Pemasukan Hari Ini</p>
          <p className="money mt-1 font-bold text-emerald-600">
            {formatRupiah(summary.inToday)}
          </p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-xs text-zinc-500">Pengeluaran Hari Ini</p>
          <p className="money mt-1 font-bold text-rose-600">
            {formatRupiah(summary.outToday)}
          </p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-xs text-zinc-500">Pemasukan Bulan Ini</p>
          <p className="money mt-1 font-bold text-emerald-600">
            {formatRupiah(summary.inMonth)}
          </p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-xs text-zinc-500">Pengeluaran Bulan Ini</p>
          <p className="money mt-1 font-bold text-rose-600">
            {formatRupiah(summary.outMonth)}
          </p>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <p className="text-xs text-zinc-500">Laba Bersih Bulan Ini</p>
        <p
          className={`money mt-1 text-2xl font-bold ${
            summary.netProfitMonth >= 0 ? "text-emerald-600" : "text-rose-600"
          }`}
        >
          {formatRupiah(summary.netProfitMonth)}
        </p>
        <p className="mt-1 text-xs text-zinc-400">
          Penjualan − HPP − pengeluaran + pemasukan lain
        </p>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Transaksi Terakhir</h2>
          <Link href="/buku-kas" className="text-xs font-medium text-zinc-500 underline">
            Lihat buku kas
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-400">Belum ada transaksi tercatat.</p>
        ) : (
          <ul className="mt-3 divide-y divide-zinc-100">
            {recent.map((r) => (
              <li key={r.id} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-sm font-medium">{r.description}</p>
                  <p className="text-xs text-zinc-400">
                    {formatTanggal(r.transaction_date)}
                  </p>
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

      {lowStock.length > 0 && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <h2 className="font-semibold text-amber-900">Stok Menipis</h2>
          <ul className="mt-2 space-y-1 text-sm text-amber-800">
            {lowStock.map((p) => (
              <li key={p.id} className="flex justify-between">
                <span>
                  {p.name}
                  {p.size ? ` (${p.size})` : ""}
                </span>
                <span className="font-semibold">Sisa {p.stock}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
