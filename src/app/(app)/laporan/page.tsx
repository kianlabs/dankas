"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatRupiah, todayISO, monthValueOf } from "@/lib/format";

interface Report {
  salesTotal: number;
  hpp: number;
  grossProfit: number;
  expensesTotal: number;
  expensesByCategory: { name: string; amount: number }[];
  otherIncome: number;
  netProfit: number;
  cashIn: number;
  cashOut: number;
  cashNet: number;
  transactionCount: number;
}

const emptyReport: Report = {
  salesTotal: 0,
  hpp: 0,
  grossProfit: 0,
  expensesTotal: 0,
  expensesByCategory: [],
  otherIncome: 0,
  netProfit: 0,
  cashIn: 0,
  cashOut: 0,
  cashNet: 0,
  transactionCount: 0,
};

function Row({
  label,
  value,
  bold = false,
  muted = false,
}: {
  label: string;
  value: number;
  bold?: boolean;
  muted?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between py-1.5 ${
        bold ? "border-t border-zinc-200 text-base font-bold" : "text-sm"
      } ${muted ? "text-zinc-500" : ""}`}
    >
      <dt>{label}</dt>
      <dd className="money">{formatRupiah(value)}</dd>
    </div>
  );
}

export default function LaporanPage() {
  const [month, setMonth] = useState(monthValueOf(todayISO())); // yyyy-mm
  const [report, setReport] = useState<Report>(emptyReport);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const supabase = createClient();
      const from = `${month}-01`;
      const [y, m] = month.split("-").map(Number);
      const next = new Date(y, m, 1); // bulan berikutnya
      const toExclusive = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-01`;

      const [salesRes, expensesRes, ledgerRes, catRes] = await Promise.all([
        supabase
          .from("sales")
          .select("id, grand_total")
          .gte("sale_date", from)
          .lt("sale_date", toExclusive),
        supabase
          .from("expenses")
          .select("amount, category_id")
          .gte("expense_date", from)
          .lt("expense_date", toExclusive),
        supabase
          .from("cash_ledger")
          .select("type, amount, ref_type")
          .gte("transaction_date", from)
          .lt("transaction_date", toExclusive),
        supabase.from("categories").select("id, name"),
      ]);

      const sales = salesRes.data ?? [];
      const expenses = expensesRes.data ?? [];
      const ledger = ledgerRes.data ?? [];
      const categories = catRes.data ?? [];

      let hpp = 0;
      const saleIds = sales.map((s) => s.id);
      if (saleIds.length > 0) {
        const { data: items } = await supabase
          .from("sale_items")
          .select("qty, cost_price")
          .in("sale_id", saleIds);
        hpp = (items ?? []).reduce((acc, it) => acc + it.qty * it.cost_price, 0);
      }

      const salesTotal = sales.reduce((acc, s) => acc + s.grand_total, 0);
      const expensesTotal = expenses.reduce((acc, e) => acc + e.amount, 0);

      const byCategory = new Map<string, number>();
      for (const e of expenses) {
        const name =
          categories.find((c) => c.id === e.category_id)?.name ?? "Tanpa kategori";
        byCategory.set(name, (byCategory.get(name) ?? 0) + e.amount);
      }

      const otherIncome = ledger
        .filter((l) => l.type === "in" && l.ref_type === "manual_income")
        .reduce((acc, l) => acc + l.amount, 0);
      const cashIn = ledger
        .filter((l) => l.type === "in")
        .reduce((acc, l) => acc + l.amount, 0);
      const cashOut = ledger
        .filter((l) => l.type === "out")
        .reduce((acc, l) => acc + l.amount, 0);

      const grossProfit = salesTotal - hpp;
      setReport({
        salesTotal,
        hpp,
        grossProfit,
        expensesTotal,
        expensesByCategory: Array.from(byCategory.entries())
          .map(([name, amount]) => ({ name, amount }))
          .sort((a, b) => b.amount - a.amount),
        otherIncome,
        // Laba bersih = Penjualan - HPP - Pengeluaran + Pemasukan lain
        netProfit: grossProfit - expensesTotal + otherIncome,
        cashIn,
        cashOut,
        cashNet: cashIn - cashOut,
        transactionCount: sales.length,
      });
      setLoading(false);
    }
    load();
  }, [month]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Laporan</h1>
        <p className="text-sm text-zinc-500">
          Laba rugi dan arus kas per bulan, dihitung dari data yang tercatat.
        </p>
      </div>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <label htmlFor="lap-month" className="text-sm font-medium">
          Periode (bulan)
        </label>
        <input
          id="lap-month"
          type="month"
          value={month}
          onChange={(e) => e.target.value && setMonth(e.target.value)}
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
        />
      </section>

      {loading ? (
        <p className="text-sm text-zinc-500">Menghitung laporan...</p>
      ) : (
        <>
          <section className="rounded-2xl bg-white p-4 shadow-sm">
            <h2 className="font-semibold">Laba Rugi</h2>
            <p className="text-xs text-zinc-400">
              Dari {report.transactionCount} transaksi penjualan pada periode ini
            </p>
            <dl className="mt-3">
              <Row label="Total Penjualan" value={report.salesTotal} />
              <Row label="Harga Pokok Penjualan (HPP)" value={-report.hpp} muted />
              <Row label="Laba Kotor" value={report.grossProfit} bold />
              <Row label="Total Pengeluaran Operasional" value={-report.expensesTotal} muted />
              {report.expensesByCategory.map((c) => (
                <div
                  key={c.name}
                  className="flex items-center justify-between py-1 pl-4 text-xs text-zinc-400"
                >
                  <dt>{c.name}</dt>
                  <dd className="money">{formatRupiah(c.amount)}</dd>
                </div>
              ))}
              <Row label="Pemasukan Lain" value={report.otherIncome} muted />
              <div className="mt-2 flex items-center justify-between rounded-lg bg-zinc-900 px-3 py-2.5 text-white">
                <dt className="text-sm font-semibold">Laba Bersih</dt>
                <dd className="money text-base font-bold">
                  {formatRupiah(report.netProfit)}
                </dd>
              </div>
            </dl>
            <p className="mt-3 text-xs text-zinc-400">
              Rumus: Laba Bersih = Penjualan − HPP − Pengeluaran + Pemasukan Lain.
              Laba dihitung dari penjualan yang terjadi, sedangkan arus kas dari
              uang yang benar-benar berpindah — keduanya bisa berbeda.
            </p>
          </section>

          <section className="rounded-2xl bg-white p-4 shadow-sm">
            <h2 className="font-semibold">Arus Kas</h2>
            <dl className="mt-3">
              <Row label="Total Kas Masuk" value={report.cashIn} />
              <Row label="Total Kas Keluar" value={-report.cashOut} muted />
              <Row label="Arus Kas Bersih" value={report.cashNet} bold />
            </dl>
          </section>
        </>
      )}
    </div>
  );
}
