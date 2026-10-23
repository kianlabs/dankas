"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  Bell,
  ChevronRight,
  Eye,
  EyeOff,
  Landmark,
  Package,
  ReceiptText,
  ShoppingCart,
  Sparkles,
  Truck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  formatRingkas,
  formatRupiah,
  formatTanggal,
  todayISO,
} from "@/lib/format";
import type { CashLedgerEntry, Product } from "@/lib/types";

type ChartMode = "bersih" | "masuk" | "keluar";

interface DayFlow {
  label: string;
  dateLabel: string;
  fullLabel: string;
  inAmount: number;
  outAmount: number;
}

// Kotak ikon baris transaksi: warna hanya dari arah uang / jenis jurnal.
function ledgerIcon(refType: string, type: "in" | "out") {
  const base =
    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl";
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

function sapaan(): string {
  const h = new Date().getHours();
  if (h < 11) return "Selamat pagi";
  if (h < 15) return "Selamat siang";
  if (h < 19) return "Selamat sore";
  return "Selamat malam";
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("Staf");
  const [role, setRole] = useState("");
  const [balance, setBalance] = useState(0);
  const [inToday, setInToday] = useState(0);
  const [outToday, setOutToday] = useState(0);
  const [ledgerAll, setLedgerAll] = useState<CashLedgerEntry[]>([]);
  const [lowStock, setLowStock] = useState<Product[]>([]);
  const [isEmpty, setIsEmpty] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const [mode, setMode] = useState<ChartMode>("bersih");
  const [selectedDay, setSelectedDay] = useState(6);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const today = todayISO();

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("users")
          .select("name, role")
          .eq("id", user.id)
          .maybeSingle();
        if (profile?.name) setName(profile.name);
        else if (user.email) setName(user.email.split("@")[0]);
        if (profile?.role) setRole(profile.role);
      }

      const [ledgerRes, productsRes] = await Promise.all([
        supabase
          .from("cash_ledger")
          .select("*")
          .order("transaction_date", { ascending: false })
          .order("id", { ascending: false }),
        supabase.from("products").select("*").order("name"),
      ]);

      const ledger = (ledgerRes.data ?? []) as CashLedgerEntry[];
      const products = (productsRes.data ?? []) as Product[];

      setBalance(
        ledger.reduce(
          (acc, r) => acc + (r.type === "in" ? r.amount : -r.amount),
          0
        )
      );
      setInToday(
        ledger
          .filter((r) => r.transaction_date === today && r.type === "in")
          .reduce((acc, r) => acc + r.amount, 0)
      );
      setOutToday(
        ledger
          .filter((r) => r.transaction_date === today && r.type === "out")
          .reduce((acc, r) => acc + r.amount, 0)
      );
      setLedgerAll(ledger);
      setLowStock(products.filter((p) => p.stock <= p.min_stock));
      setIsEmpty(ledger.length === 0 && products.length === 0);
      setLoading(false);
    }
    load();
  }, []);

  const weekFlow: DayFlow[] = useMemo(() => {
    const days: DayFlow[] = [];
    const now = new Date(`${todayISO()}T00:00:00`);
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const rows = ledgerAll.filter((r) => r.transaction_date === iso);
      days.push({
        label: new Intl.DateTimeFormat("id-ID", { weekday: "short" }).format(d),
        dateLabel: String(d.getDate()),
        fullLabel: new Intl.DateTimeFormat("id-ID", {
          weekday: "long",
          day: "numeric",
          month: "long",
        }).format(d),
        inAmount: rows
          .filter((r) => r.type === "in")
          .reduce((acc, r) => acc + r.amount, 0),
        outAmount: rows
          .filter((r) => r.type === "out")
          .reduce((acc, r) => acc + r.amount, 0),
      });
    }
    return days;
  }, [ledgerAll]);

  const values = weekFlow.map((d) =>
    mode === "bersih"
      ? d.inAmount - d.outAmount
      : mode === "masuk"
        ? d.inAmount
        : d.outAmount
  );
  const maxPos = Math.max(0, ...values);
  const minNeg = Math.min(0, ...values);
  const range = Math.max(1, maxPos - minNeg);
  const zeroFromBottomPct = (Math.abs(minNeg) / range) * 100;
  const netWeek = weekFlow.reduce(
    (acc, d) => acc + d.inAmount - d.outAmount,
    0
  );
  const selected = weekFlow[selectedDay] ?? weekFlow[6];
  const barColor =
    mode === "masuk"
      ? "bg-masuk"
      : mode === "keluar"
        ? "bg-keluar"
        : "bg-primary";

  const quickActions =
    role === "kasir"
      ? [
          { href: "/kasir", label: "Kasir", icon: ShoppingCart },
          { href: "/transaksi?mode=pemasukan", label: "+ Masuk", icon: ArrowDownLeft },
          { href: "/transaksi?mode=pengeluaran", label: "+ Keluar", icon: ArrowUpRight },
          { href: "/produk", label: "Produk", icon: Package },
        ]
      : [
          { href: "/kasir", label: "Kasir", icon: ShoppingCart },
          { href: "/transaksi?mode=pemasukan", label: "+ Masuk", icon: ArrowDownLeft },
          { href: "/transaksi?mode=pengeluaran", label: "+ Keluar", icon: ArrowUpRight },
          { href: "/laporan", label: "Laporan", icon: BarChart3 },
        ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 animate-pulse rounded-full bg-surface-2" />
          <div className="space-y-2">
            <div className="h-3.5 w-36 animate-pulse rounded bg-surface-2" />
            <div className="h-4 w-24 animate-pulse rounded bg-surface-2" />
          </div>
        </div>
        <div className="h-44 animate-pulse rounded-3xl bg-ink/85" />
        <div className="h-48 animate-pulse rounded-2xl bg-surface-2" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sapaan */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-tint font-display text-base font-bold text-primary-pressed">
            {(name.trim()[0] ?? "D").toUpperCase()}
          </span>
          <div>
            <p className="text-[13px] text-ink-2">
              {sapaan()}, {name}
            </p>
            <p className="font-display text-base font-bold leading-tight">
              DAN&apos;S LABEL
            </p>
          </div>
        </div>
        <Link
          href="/produk"
          aria-label="Notifikasi stok"
          className="relative flex h-11 w-11 items-center justify-center rounded-full border border-line bg-white text-ink transition active:scale-95"
        >
          <Bell className="h-5 w-5" strokeWidth={2} />
          {lowStock.length > 0 && (
            <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-keluar" />
          )}
        </Link>
      </div>

      {isEmpty && (
        <section className="card">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-tint text-primary-pressed">
              <Sparkles className="h-5 w-5" strokeWidth={2} />
            </span>
            <p className="font-display font-semibold">Selamat datang di DanKas</p>
          </div>
          <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-ink-2">
            <li>
              Tambahkan produk baju pertama Anda di menu{" "}
              <Link href="/produk" className="font-semibold text-primary-pressed">
                Produk
              </Link>
              .
            </li>
            <li>
              Catat penjualan lewat{" "}
              <Link href="/kasir" className="font-semibold text-primary-pressed">
                Kasir
              </Link>{" "}
              — stok, HPP, dan buku kas tercatat otomatis.
            </li>
            <li>
              Catat pengeluaran (sewa, gaji, operasional) lewat aksi{" "}
              <span className="font-semibold text-ink">+ Keluar</span> di bawah,
              lalu pantau laba di{" "}
              <Link href="/laporan" className="font-semibold text-primary-pressed">
                Laporan
              </Link>
              .
            </li>
          </ol>
        </section>
      )}

      {/* Hero Saldo Kas — satu-satunya permukaan gelap */}
      <Link
        href="/buku-kas"
        className="block rounded-3xl bg-hero p-5 text-on-hero transition active:scale-[0.99]"
      >
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-on-hero-muted">
            Saldo Kas
          </p>
          <span
            role="button"
            aria-label={showBalance ? "Sembunyikan saldo" : "Tampilkan saldo"}
            onClick={(e) => {
              e.preventDefault();
              setShowBalance((v) => !v);
            }}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-hero-surface text-on-hero-muted transition active:scale-95"
          >
            {showBalance ? (
              <Eye className="h-4.5 w-4.5" strokeWidth={2} />
            ) : (
              <EyeOff className="h-4.5 w-4.5" strokeWidth={2} />
            )}
          </span>
        </div>
        <p className="money mt-1 font-display text-[32px] font-bold leading-tight tracking-[-0.02em]">
          {showBalance ? formatRupiah(balance) : "Rp ••••••••"}
        </p>
        <div className="mt-4 flex gap-8 border-t border-white/10 pt-4">
          <div>
            <p className="flex items-center gap-1.5 text-xs text-on-hero-muted">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Masuk hari ini
            </p>
            <p className="money mt-1 font-semibold">
              +{formatRupiah(inToday)}
            </p>
          </div>
          <div>
            <p className="flex items-center gap-1.5 text-xs text-on-hero-muted">
              <span className="h-2 w-2 rounded-full bg-rose-400" />
              Keluar hari ini
            </p>
            <p className="money mt-1 font-semibold">
              −{formatRupiah(outToday)}
            </p>
          </div>
        </div>
      </Link>

      {/* Aksi cepat */}
      <section className="grid grid-cols-4 gap-2">
        {quickActions.map((a) => {
          const Icon = a.icon;
          return (
            <Link
              key={a.label}
              href={a.href}
              className="flex flex-col items-center py-1 transition active:scale-95"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full border border-line bg-white text-ink">
                <Icon className="h-5 w-5" strokeWidth={2} />
              </span>
              <span className="mt-1.5 text-xs font-medium text-ink-2">
                {a.label}
              </span>
            </Link>
          );
        })}
      </section>

      {/* Arus Kas 7 hari */}
      <section className="card">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-sm text-ink-2">Bersih 7 hari</p>
            <p
              className={`money font-display text-xl font-semibold ${
                netWeek >= 0 ? "text-masuk" : "text-keluar"
              }`}
            >
              {netWeek >= 0 ? "+" : "−"}
              {formatRupiah(Math.abs(netWeek))}
            </p>
          </div>
          <div className="inline-flex rounded-full bg-surface-2 p-1">
            {(
              [
                { key: "bersih", label: "Bersih" },
                { key: "masuk", label: "Masuk" },
                { key: "keluar", label: "Keluar" },
              ] as { key: ChartMode; label: string }[]
            ).map((s) => (
              <button
                key={s.key}
                onClick={() => setMode(s.key)}
                className={`rounded-full px-3.5 py-1.5 text-[13px] transition ${
                  mode === s.key
                    ? "bg-white font-semibold text-ink"
                    : "font-medium text-ink-2"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Plot */}
        <div className="mt-4 flex gap-2">
          <div className="relative h-[120px] w-10 shrink-0 text-right">
            <span className="money absolute right-0 top-0 -translate-y-1/2 text-xs text-ink-3">
              {formatRingkas(maxPos)}
            </span>
            <span className="money absolute right-0 top-1/2 -translate-y-1/2 text-xs text-ink-3">
              {formatRingkas(Math.round((maxPos + minNeg) / 2))}
            </span>
            <span className="money absolute bottom-0 right-0 translate-y-1/2 text-xs text-ink-3">
              {minNeg < 0 ? `−${formatRingkas(Math.abs(minNeg))}` : "0"}
            </span>
          </div>
          <div className="relative h-[120px] flex-1">
            <div className="absolute inset-x-0 top-0 border-t border-dashed border-line" />
            <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-line" />
            <div className="absolute inset-x-0 bottom-0 border-t border-line" />
            <div className="relative flex h-full">
              {weekFlow.map((d, i) => {
                const v = values[i];
                const hPct = Math.max(v !== 0 ? 4 : 0, (Math.abs(v) / range) * 100);
                const isToday = i === 6;
                const isSelected = i === selectedDay;
                return (
                  <button
                    key={d.label + d.dateLabel}
                    onClick={() => setSelectedDay(i)}
                    className="relative flex-1"
                    aria-label={`${d.fullLabel}: masuk ${formatRupiah(d.inAmount)}, keluar ${formatRupiah(d.outAmount)}`}
                  >
                    {v >= 0 ? (
                      <span
                        className={`absolute left-1/2 w-7 -translate-x-1/2 rounded-t-md transition-all sm:w-9 ${barColor}`}
                        style={{
                          bottom: `${zeroFromBottomPct}%`,
                          height: `${hPct}%`,
                          opacity: isSelected || isToday ? 1 : 0.45,
                        }}
                      />
                    ) : (
                      <span
                        className="absolute left-1/2 w-7 -translate-x-1/2 rounded-b-md bg-keluar transition-all sm:w-9"
                        style={{
                          // menggantung dari garis nol ke bawah
                          top: `${100 - zeroFromBottomPct}%`,
                          height: `${hPct}%`,
                          opacity: isSelected || isToday ? 1 : 0.45,
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div className="mt-2 flex gap-2">
          <div className="w-10 shrink-0" />
          <div className="flex flex-1">
            {weekFlow.map((d, i) => (
              <p
                key={d.label + d.dateLabel}
                className={`flex-1 text-center text-xs ${
                  i === selectedDay
                    ? "font-semibold text-ink"
                    : "text-ink-3"
                }`}
              >
                {d.label} {d.dateLabel}
              </p>
            ))}
          </div>
        </div>

        {/* Tooltip hari terpilih */}
        {selected && (
          <p className="money mt-4 rounded-xl bg-surface-2 px-3.5 py-2.5 text-xs leading-relaxed text-ink-2">
            <span className="font-semibold text-ink">{selected.fullLabel}</span>
            {" — "}Masuk {formatRupiah(selected.inAmount)} · Keluar{" "}
            {formatRupiah(selected.outAmount)} · Bersih{" "}
            {selected.inAmount - selected.outAmount >= 0 ? "+" : "−"}
            {formatRupiah(Math.abs(selected.inAmount - selected.outAmount))}
          </p>
        )}
      </section>

      {/* Strip stok menipis */}
      {lowStock.length > 0 && (
        <Link
          href="/produk"
          className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-warn-tint px-4 py-3 transition active:scale-[0.99]"
        >
          <AlertTriangle className="h-5 w-5 shrink-0 text-warn" strokeWidth={2} />
          <p className="min-w-0 flex-1 truncate text-sm text-amber-900">
            <span className="font-semibold">
              {lowStock.length} produk stoknya menipis
            </span>{" "}
            —{" "}
            {lowStock
              .slice(0, 3)
              .map((p) => `${p.name} (${p.stock})`)
              .join(", ")}
            {lowStock.length > 3 ? ", …" : ""}
          </p>
          <ChevronRight className="h-5 w-5 shrink-0 text-warn" />
        </Link>
      )}

      {/* Transaksi terakhir */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-base font-semibold">
            Transaksi Terakhir
          </h2>
          <Link
            href="/buku-kas"
            className="text-[13px] font-semibold text-primary-pressed hover:underline"
          >
            Lihat semua
          </Link>
        </div>
        <div className="card !p-0">
          {ledgerAll.length === 0 ? (
            <div className="flex flex-col items-center px-4 py-8 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-2 text-ink-3">
                <ReceiptText className="h-6 w-6" strokeWidth={1.8} />
              </span>
              <p className="mt-3 text-sm text-ink-2">
                Belum ada transaksi tercatat.
              </p>
            </div>
          ) : (
            <ul>
              {ledgerAll.slice(0, 5).map((r, i) => (
                <li key={r.id} className="relative">
                  {i > 0 && (
                    <span className="absolute left-[68px] right-0 top-0 h-px bg-line" />
                  )}
                  <div className="flex min-h-16 items-center gap-3 px-4 py-3">
                    {ledgerIcon(r.ref_type, r.type)}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-semibold">
                        {r.description}
                      </p>
                      <p className="text-xs text-ink-2">
                        {formatTanggal(r.transaction_date)}
                      </p>
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
