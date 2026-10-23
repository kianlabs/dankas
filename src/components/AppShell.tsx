"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeftRight,
  BarChart3,
  BookOpenText,
  LayoutDashboard,
  LogOut,
  MoreHorizontal,
  Package,
  ShoppingCart,
  Store,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  ownerOnly?: boolean; // disembunyikan dari peran kasir
}

const MENU: NavItem[] = [
  { href: "/dashboard", label: "Beranda", icon: LayoutDashboard },
  { href: "/kasir", label: "Kasir", icon: ShoppingCart },
  { href: "/transaksi", label: "Transaksi", icon: ArrowLeftRight },
  { href: "/produk", label: "Produk", icon: Package },
  { href: "/buku-kas", label: "Buku Kas", icon: BookOpenText, ownerOnly: true },
  { href: "/laporan", label: "Laporan", icon: BarChart3, ownerOnly: true },
];

// Slot bar bawah mobile: Beranda · Transaksi · [Kasir] · Produk · Lainnya
const SLOT_LEFT: NavItem[] = [MENU[0], MENU[2]];
const SLOT_RIGHT: NavItem[] = [MENU[3]];
const SHEET_ITEMS: NavItem[] = [MENU[4], MENU[5]];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [email, setEmail] = useState<string>("");
  const [role, setRole] = useState<string>("");
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      setEmail(data.user.email ?? "");
      const { data: profile } = await supabase
        .from("users")
        .select("role")
        .eq("id", data.user.id)
        .maybeSingle();
      if (profile?.role) setRole(profile.role);
    });
  }, []);

  // Sheet "Lainnya" tertutup otomatis setiap pindah halaman.
  useEffect(() => {
    setSheetOpen(false);
  }, [pathname]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const visibleMenu = MENU.filter((m) => !m.ownerOnly || role !== "kasir");
  const visibleSheet = SHEET_ITEMS.filter(
    (m) => !m.ownerOnly || role !== "kasir"
  );
  const initial = (email.trim()[0] ?? "D").toUpperCase();
  const roleLabel = role
    ? role === "pemilik"
      ? "Pemilik toko"
      : role === "admin"
        ? "Admin"
        : "Kasir"
    : "Staf toko";
  const sheetActive = visibleSheet.some((m) => pathname.startsWith(m.href));

  const slotClass = (active: boolean) =>
    `flex h-full flex-col items-center justify-center gap-0.5 rounded-full text-xs font-medium transition active:scale-95 ${
      active ? "text-ink" : "text-ink-2"
    }`;
  const slotIconClass = (active: boolean) =>
    `flex items-center justify-center rounded-full px-3.5 py-1 transition ${
      active ? "bg-primary-tint text-primary-pressed" : "text-ink-3"
    }`;

  return (
    <div className="min-h-screen">
      {/* ===== Sidebar desktop (≥1024px): 240px, semua menu ===== */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col bg-ink text-on-hero lg:flex">
        <div className="flex items-center gap-3 px-5 pb-2 pt-6">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-hero-surface">
            <Store className="h-5 w-5 text-on-hero" strokeWidth={2} />
          </span>
          <span>
            <span className="block font-display text-lg font-bold leading-tight">
              DanKas
            </span>
            <span className="block text-xs tracking-wide text-on-hero-muted">
              DAN&apos;S LABEL
            </span>
          </span>
        </div>

        <nav className="mt-4 flex-1 space-y-1 px-3">
          {visibleMenu.map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-white/10 text-on-hero"
                    : "text-on-hero-muted hover:bg-white/5 hover:text-on-hero"
                }`}
              >
                <Icon
                  className={`h-5 w-5 ${active ? "text-primary" : ""}`}
                  strokeWidth={2}
                />
                {item.label}
                {active && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-tint text-sm font-bold text-primary-pressed">
              {initial}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-on-hero">
                {email || "Staf"}
              </p>
              <p className="text-xs text-on-hero-muted">{roleLabel}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-white/5 py-2.5 text-sm font-medium text-on-hero transition hover:bg-white/10 active:scale-[0.98]"
          >
            <LogOut className="h-4 w-4" />
            Keluar
          </button>
        </div>
      </aside>

      {/* ===== Header mobile ===== */}
      <header className="sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur lg:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink">
              <Store className="h-4 w-4 text-on-hero" strokeWidth={2} />
            </span>
            <span className="font-display text-base font-bold">DanKas</span>
            <span className="text-xs text-ink-3">DAN&apos;S LABEL</span>
          </div>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-tint text-sm font-bold text-primary-pressed">
            {initial}
          </span>
        </div>
      </header>

      {/* ===== Konten ===== */}
      <div className="lg:pl-60">
        <main className="mx-auto w-full max-w-[1200px] px-4 pb-32 pt-5 lg:px-6 lg:pb-10">
          {children}
        </main>
      </div>

      {/* ===== Bar bawah mobile: pill melayang ===== */}
      <nav className="fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(12px,env(safe-area-inset-bottom))] lg:hidden">
        <div className="relative grid h-[68px] grid-cols-5 items-stretch rounded-[28px] border border-line bg-white px-1.5 shadow-float">
          {SLOT_LEFT.map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className={slotClass(active)}>
                <span className={slotIconClass(active)}>
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </span>
                {item.label}
              </Link>
            );
          })}

          {/* Kasir: tombol tengah cobalt 56px menonjol */}
          <div className="relative flex flex-col items-center justify-end pb-2">
            <Link
              href="/kasir"
              aria-label="Kasir"
              className={`absolute -top-4 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-float ring-4 ring-paper transition active:scale-95 ${
                pathname.startsWith("/kasir")
                  ? "bg-primary-pressed"
                  : "bg-primary"
              }`}
            >
              <ShoppingCart className="h-6 w-6" strokeWidth={2} />
            </Link>
            <span
              className={`text-xs ${
                pathname.startsWith("/kasir")
                  ? "font-semibold text-primary-pressed"
                  : "font-medium text-ink-2"
              }`}
            >
              Kasir
            </span>
          </div>

          {SLOT_RIGHT.map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className={slotClass(active)}>
                <span className={slotIconClass(active)}>
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </span>
                {item.label}
              </Link>
            );
          })}

          <button
            onClick={() => setSheetOpen(true)}
            className={slotClass(sheetActive)}
            aria-label="Menu lainnya"
          >
            <span className={slotIconClass(sheetActive)}>
              <MoreHorizontal className="h-5 w-5" strokeWidth={2} />
            </span>
            Lainnya
          </button>
        </div>
      </nav>

      {/* ===== Sheet "Lainnya" ===== */}
      {sheetOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-ink/40"
            onClick={() => setSheetOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white p-4 pb-[max(16px,env(safe-area-inset-bottom))]">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line" />
            <div className="mb-1 flex items-center justify-between px-1">
              <p className="font-display text-base font-bold">Menu Lainnya</p>
              <button
                onClick={() => setSheetOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-2 text-ink-2"
                aria-label="Tutup"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {visibleSheet.map((item) => {
              const Icon = item.icon;
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex h-14 items-center gap-3 rounded-2xl px-2 transition hover:bg-surface-2"
                >
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                      active
                        ? "bg-primary-tint text-primary-pressed"
                        : "bg-surface-2 text-ink-2"
                    }`}
                  >
                    <Icon className="h-5 w-5" strokeWidth={2} />
                  </span>
                  <span className="text-[15px] font-medium">{item.label}</span>
                </Link>
              );
            })}
            <div className="mt-2 border-t border-line pt-3">
              <div className="flex items-center gap-3 px-2">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-tint text-sm font-bold text-primary-pressed">
                  {initial}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {email || "Staf"}
                  </p>
                  <p className="text-xs text-ink-2">{roleLabel}</p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-1.5 rounded-full bg-keluar-tint px-4 py-2.5 text-sm font-semibold text-keluar transition active:scale-95"
                >
                  <LogOut className="h-4 w-4" />
                  Keluar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
