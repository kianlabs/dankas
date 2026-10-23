"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  {
    href: "/dashboard",
    label: "Beranda",
    icon: <path d="M4 11l8-7 8 7M6 9.5V20h12V9.5" />,
  },
  {
    href: "/kasir",
    label: "Kasir",
    icon: (
      <>
        <circle cx="9" cy="20" r="1.4" />
        <circle cx="17" cy="20" r="1.4" />
        <path d="M3 4h2l2.4 11h10.2l2-8H7" />
      </>
    ),
  },
  {
    href: "/transaksi",
    label: "Transaksi",
    icon: <path d="M4 8h13l-3-3M20 16H7l3 3" />,
  },
  {
    href: "/produk",
    label: "Produk",
    icon: <path d="M4 8l8-4 8 4v8l-8 4-8-4zM4 8l8 4 8-4M12 12v8" />,
  },
  {
    href: "/buku-kas",
    label: "Buku Kas",
    icon: <path d="M6 3h12v18H6zM9 8h6M9 12h6" />,
  },
  {
    href: "/laporan",
    label: "Laporan",
    icon: <path d="M6 20v-6M12 20V6M18 20v-9M4 20h16" />,
  },
];

function TabIcon({ children }: { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

// Kerangka aplikasi: header atas, sidebar di desktop (md+),
// bottom tab bar di HP. Konten dibatasi max-w-md di mobile dan
// melebar di desktop (mobile-first).
export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-dvh md:flex">
      {/* Sidebar desktop */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col bg-zinc-900 text-zinc-100 md:flex">
        <div className="px-5 py-6">
          <p className="text-xl font-bold tracking-tight">
            Dan<span className="text-amber-400">Kas</span>
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            Keuangan DAN&apos;S LABEL Surakarta
          </p>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {TABS.map((tab) => {
            const active = pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                  active
                    ? "bg-zinc-800 text-amber-400"
                    : "text-zinc-300 hover:bg-zinc-800/60"
                }`}
              >
                <TabIcon>{tab.icon}</TabIcon>
                {tab.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-zinc-800 px-5 py-4">
          <p className="text-xs text-zinc-400">
            DAN&apos;S LABEL — Surakarta
          </p>
        </div>
      </aside>

      {/* Kolom konten */}
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col md:max-w-3xl lg:max-w-4xl">
        {/* Header mobile */}
        <header className="sticky top-0 z-20 flex items-center justify-between bg-zinc-900 px-4 py-3 text-zinc-50 md:hidden">
          <div>
            <p className="text-base font-bold leading-tight">
              Dan<span className="text-amber-400">Kas</span>
            </p>
            <p className="text-[11px] leading-tight text-zinc-400">
              DAN&apos;S LABEL — Surakarta
            </p>
          </div>
        </header>

        <main className="flex-1 px-4 pb-24 pt-4 md:px-6 md:pb-10 md:pt-6">
          {children}
        </main>

        {/* Bottom tab bar (HP) */}
        <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-zinc-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
          <div className="mx-auto grid max-w-md grid-cols-6">
            {TABS.map((tab) => {
              const active = pathname.startsWith(tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium ${
                    active ? "text-zinc-900" : "text-zinc-400"
                  }`}
                >
                  <TabIcon>{tab.icon}</TabIcon>
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
