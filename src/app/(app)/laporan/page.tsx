"use client";

import { useEffect, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Scale,
  Shirt,
  TrendingUp,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatRingkas, formatRupiah, todayISO, monthValueOf } from "@/lib/format";

interface Report {
  salesTotal: number;
  returnsTotal: number;
  netSales: number;
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
  returnsTotal: 0,
  netSales: 0,
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

interface TrendPoint {
  key: string; // yyyy-mm
  label: string;
  total: number;
}

interface TopProduct {
  name: string;
  qty: number;
  revenue: number;
}

function monthLabel(monthStr: string, style: "long" | "short" = "long"): string {
  const [y, m] = monthStr.split("-").map(Number);
  return new Intl.DateTimeFormat("id-ID", {
    month: style,
    year: style === "long" ? "numeric" : undefined,
  }).format(new Date(y, m - 1, 1));
}

function shiftMonth(monthStr: string, delta: number): string {
  const [y, m] = monthStr.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// Hitung laporan satu bulan penuh (dipakai juga untuk bulan pembanding).
async function computeReport(
  supabase: ReturnType<typeof createClient>,
  month: string
): Promise<Report> {
  const from = `${month}-01`;
  const nextStr = shiftMonth(month, 1);
  const toExclusive = `${nextStr}-01`;

  const [salesRes, expensesRes, ledgerRes, catRes] = await Promise.all([
    supabase
      .from("sales")
      .select("id, grand_total, status")
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

  const allSales = salesRes.data ?? [];
  const expenses = expensesRes.data ?? [];
  const ledger = ledgerRes.data ?? [];
  const categories = catRes.data ?? [];

  const activeSales = allSales.filter((s) => s.status !== "retur");
  const returnsTotal = allSales
    .filter((s) => s.status === "retur")
    .reduce((acc, s) => acc + s.grand_total, 0);
  const salesTotal = activeSales.reduce((acc, s) => acc + s.grand_total, 0);

  let hpp = 0;
  const saleIds = activeSales.map((s) => s.id);
  if (saleIds.length > 0) {
    const { data: items } = await supabase
      .from("sale_items")
      .select("qty, cost_price")
      .in("sale_id", saleIds);
    hpp = (items ?? []).reduce((acc, it) => acc + it.qty * it.cost_price, 0);
  }

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

  const netSales = salesTotal - returnsTotal;
  const grossProfit = netSales - hpp;
  return {
    salesTotal,
    returnsTotal,
    netSales,
    hpp,
    grossProfit,
    expensesTotal,
    expensesByCategory: Array.from(byCategory.entries())
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount),
    otherIncome,
    // Laba bersih = Penjualan bersih - HPP - Pengeluaran + Pemasukan lain
    netProfit: grossProfit - expensesTotal + otherIncome,
    cashIn,
    cashOut,
    cashNet: cashIn - cashOut,
    transactionCount: activeSales.length,
  };
}

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
      className={`flex items-center justify-between py-2 ${
        bold ? "border-t border-line text-[15px] font-bold" : "text-sm"
      } ${muted ? "text-ink-2" : ""}`}
    >
      <dt>{label}</dt>
      <dd className="money">{formatRupiah(value)}</dd>
    </div>
  );
}

export default function LaporanPage() {
  const [month, setMonth] = useState(monthValueOf(todayISO())); // yyyy-mm
  const [report, setReport] = useState<Report>(emptyReport);
  const [prevNet, setPrevNet] = useState<number | null>(null);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const supabase = createClient();

      const [current, prev] = await Promise.all([
        computeReport(supabase, month),
        computeReport(supabase, shiftMonth(month, -1)),
      ]);
      setReport(current);
      setPrevNet(prev.netProfit);

      // Tren penjualan 6 bulan (termasuk bulan terpilih)
      const startMonth = shiftMonth(month, -5);
      const { data: trendSales } = await supabase
        .from("sales")
        .select("sale_date, grand_total, status")
        .gte("sale_date", `${startMonth}-01`)
        .lt("sale_date", `${shiftMonth(month, 1)}-01`);
      const points: TrendPoint[] = [];
      for (let i = 0; i < 6; i++) {
        const key = shiftMonth(startMonth, i);
        const total = (trendSales ?? [])
          .filter((s) => s.status !== "retur" && s.sale_date.startsWith(key))
          .reduce((acc, s) => acc + s.grand_total, 0);
        points.push({ key, label: monthLabel(key, "short"), total });
      }
      setTrend(points);

      // Produk terlaris bulan terpilih
      const { data: monthSales } = await supabase
        .from("sales")
        .select("id, status")
        .gte("sale_date", `${month}-01`)
        .lt("sale_date", `${shiftMonth(month, 1)}-01`);
      const activeIds = (monthSales ?? [])
        .filter((s) => s.status !== "retur")
        .map((s) => s.id);
      if (activeIds.length > 0) {
        const [{ data: items }, { data: prods }] = await Promise.all([
          supabase
            .from("sale_items")
            .select("product_id, qty, sale_price")
            .in("sale_id", activeIds),
          supabase.from("products").select("id, name"),
        ]);
        const agg = new Map<number, TopProduct>();
        for (const it of items ?? []) {
          const name =
            (prods ?? []).find((p) => p.id === it.product_id)?.name ??
            "Produk terhapus";
          const row = agg.get(it.product_id) ?? { name, qty: 0, revenue: 0 };
          row.qty += it.qty;
          row.revenue += it.qty * it.sale_price;
          agg.set(it.product_id, row);
        }
        setTopProducts(
          Array.from(agg.values())
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 3)
        );
      } else {
        setTopProducts([]);
      }

      setLoading(false);
    }
    load();
  }, [month]);

  const deltaPct =
    prevNet !== null && prevNet !== 0
      ? ((report.netProfit - prevNet) / Math.abs(prevNet)) * 100
      : null;
  const trendMax = Math.max(1, ...trend.map((t) => t.total));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-[22px] font-bold tracking-[-0.01em]">
          Laporan
        </h1>
        <p className="mt-0.5 text-sm text-ink-2">
          Laba rugi dan arus kas per bulan, dihitung dari data yang tercatat.
        </p>
      </div>

      <section className="card">
        <label htmlFor="lap-month" className="label">
          Periode (bulan)
        </label>
        <input
          id="lap-month"
          type="month"
          value={month}
          onChange={(e) => e.target.value && setMonth(e.target.value)}
          className="input"
        />
      </section>

      {loading ? (
        <div className="space-y-4">
          <div className="h-36 animate-pulse rounded-2xl bg-surface-2" />
          <div className="h-72 animate-pulse rounded-2xl bg-surface-2" />
          <div className="h-40 animate-pulse rounded-2xl bg-surface-2" />
        </div>
      ) : (
        <>
          {/* Ringkasan Laba Bersih — kartu terang, angka besar */}
          <section className="card">
            <p className="text-sm text-ink-2">
              {report.netProfit >= 0 ? "Laba Bersih" : "Rugi Bersih"} ·{" "}
              {monthLabel(month)}
            </p>
            <p
              className={`money mt-1 font-display text-[28px] font-bold leading-tight ${
                report.netProfit >= 0 ? "text-masuk" : "text-keluar"
              }`}
            >
              {formatRupiah(Math.abs(report.netProfit))}
            </p>
            <div className="mt-2.5">
              {deltaPct !== null ? (
                <span className="money inline-flex items-center gap-1 rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-ink-2">
                  {deltaPct >= 0 ? "▲" : "▼"} {Math.abs(deltaPct).toFixed(0)}%
                  vs {monthLabel(shiftMonth(month, -1), "short")}
                </span>
              ) : (
                <span className="inline-flex rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-ink-2">
                  Belum ada pembanding bulan lalu
                </span>
              )}
            </div>
          </section>

          {/* Ledger laba rugi berurutan */}
          <section className="card">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-tint text-primary-pressed">
                <TrendingUp className="h-5 w-5" strokeWidth={2} />
              </span>
              <div>
                <h2 className="font-display text-base font-semibold leading-tight">
                  Laba Rugi
                </h2>
                <p className="text-xs text-ink-2">
                  Dari {report.transactionCount} transaksi penjualan pada
                  periode ini
                </p>
              </div>
            </div>
            <dl className="mt-3">
              <Row label="Pendapatan Penjualan" value={report.salesTotal} />
              <Row label="Retur Penjualan" value={-report.returnsTotal} muted />
              <Row label="Pendapatan Bersih" value={report.netSales} bold />
              <Row
                label="Harga Pokok Penjualan (HPP)"
                value={-report.hpp}
                muted
              />
              <Row label="Laba Kotor" value={report.grossProfit} bold />
              <Row
                label="Biaya Operasional"
                value={-report.expensesTotal}
                muted
              />
              {report.expensesByCategory.map((c) => (
                <div
                  key={c.name}
                  className="flex items-center justify-between py-1 pl-4 text-xs text-ink-3"
                >
                  <dt className="flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-line" />
                    {c.name}
                  </dt>
                  <dd className="money">{formatRupiah(c.amount)}</dd>
                </div>
              ))}
              <Row label="Pemasukan Lain" value={report.otherIncome} muted />
              <Row label="Laba Bersih" value={report.netProfit} bold />
            </dl>
            <p className="mt-3 text-xs leading-relaxed text-ink-3">
              Laba dihitung dari penjualan yang terjadi, sedangkan arus kas
              dari uang yang benar-benar berpindah — keduanya bisa berbeda.
            </p>
          </section>

          {/* Tren penjualan 6 bulan — satu seri cobalt */}
          <section className="card">
            <h2 className="font-display text-base font-semibold">
              Penjualan 6 Bulan Terakhir
            </h2>
            <div className="mt-4 flex h-28 items-end gap-2 border-b border-line pb-0">
              {trend.map((t) => (
                <div
                  key={t.key}
                  className="flex flex-1 flex-col items-center justify-end gap-1.5 self-stretch"
                >
                  <span className="money text-xs text-ink-3">
                    {t.total > 0 ? formatRingkas(t.total) : ""}
                  </span>
                  <div
                    className={`w-full max-w-10 rounded-t-md bg-primary transition-all ${
                      t.key === month ? "opacity-100" : "opacity-45"
                    }`}
                    style={{
                      height: `${Math.max(t.total > 0 ? 6 : 0, (t.total / trendMax) * 72)}%`,
                    }}
                    title={`${monthLabel(t.key)}: ${formatRupiah(t.total)}`}
                  />
                </div>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              {trend.map((t) => (
                <p
                  key={t.key}
                  className={`flex-1 text-center text-xs ${
                    t.key === month ? "font-semibold text-ink" : "text-ink-3"
                  }`}
                >
                  {t.label}
                </p>
              ))}
            </div>
          </section>

          {/* Produk terlaris */}
          {topProducts.length > 0 && (
            <section className="card">
              <h2 className="font-display text-base font-semibold">
                Produk Terlaris Bulan Ini
              </h2>
              <ul className="mt-2 divide-y divide-line">
                {topProducts.map((p) => (
                  <li key={p.name} className="flex items-center gap-3 py-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-ink-3">
                      <Shirt className="h-5 w-5" strokeWidth={1.8} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-semibold">
                        {p.name}
                      </p>
                      <p className="text-xs text-ink-2">
                        Terjual {p.qty} pcs
                      </p>
                    </div>
                    <p className="money shrink-0 text-[15px] font-semibold">
                      {formatRupiah(p.revenue)}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Arus kas */}
          <section className="card">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-2 text-ink-2">
                <Scale className="h-5 w-5" strokeWidth={2} />
              </span>
              <h2 className="font-display text-base font-semibold">Arus Kas</h2>
            </div>
            <dl className="mt-2">
              <div className="flex items-center justify-between py-2 text-sm">
                <dt className="inline-flex items-center gap-2">
                  <ArrowDownLeft className="h-4 w-4 text-masuk" />
                  Total Kas Masuk
                </dt>
                <dd className="money font-semibold text-masuk">
                  {formatRupiah(report.cashIn)}
                </dd>
              </div>
              <div className="flex items-center justify-between py-2 text-sm text-ink-2">
                <dt className="inline-flex items-center gap-2">
                  <ArrowUpRight className="h-4 w-4 text-keluar" />
                  Total Kas Keluar
                </dt>
                <dd className="money">{formatRupiah(-report.cashOut)}</dd>
              </div>
              <Row label="Arus Kas Bersih" value={report.cashNet} bold />
            </dl>
          </section>
        </>
      )}
    </div>
  );
}
