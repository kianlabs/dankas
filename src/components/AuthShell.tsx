import { ShieldCheck, ShoppingBag, Store, TrendingUp } from "lucide-react";

const FEATURES = [
  { icon: ShoppingBag, text: "Catat penjualan & stok otomatis" },
  { icon: TrendingUp, text: "Lihat laba tanpa rekap manual" },
  { icon: ShieldCheck, text: "Data tersimpan aman di cloud" },
];

// Kerangka halaman autentikasi (pola split SaaS):
// - Desktop (lg+): panel brand gelap 55% (headline + kartu saldo contoh)
//   dan formulir tanpa kartu (maks 360px) di sisi terang 45%.
// - Mobile: band brand gelap ±184px, lalu sheet putih yang menimpanya.
export default function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      {/* Band brand mobile */}
      <div className="bg-ink px-5 pb-16 pt-10 text-on-hero lg:hidden">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-hero-surface">
            <Store className="h-5 w-5" strokeWidth={2} />
          </span>
          <span>
            <span className="block font-display text-lg font-bold leading-tight">
              DanKas
            </span>
            <span className="block text-xs tracking-wide text-on-hero-muted">
              DAN&apos;S LABEL · SURAKARTA
            </span>
          </span>
        </div>
        <p className="mt-5 font-display text-xl font-semibold leading-snug">
          Kas toko, rapi setiap hari.
        </p>
      </div>

      <div className="lg:grid lg:min-h-screen lg:grid-cols-[55%_45%]">
        {/* Panel brand desktop */}
        <aside className="hidden flex-col justify-between bg-ink p-10 text-on-hero lg:flex xl:p-14">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-hero-surface">
              <Store className="h-5 w-5" strokeWidth={2} />
            </span>
            <span>
              <span className="block font-display text-lg font-bold leading-tight">
                DanKas
              </span>
              <span className="block text-xs tracking-wide text-on-hero-muted">
                DAN&apos;S LABEL · SURAKARTA
              </span>
            </span>
          </div>

          <div>
            <h1 className="font-display text-[32px] font-bold leading-tight tracking-[-0.01em]">
              Kas toko, rapi setiap hari.
            </h1>
            <ul className="mt-6 space-y-3.5">
              {FEATURES.map((f) => {
                const Icon = f.icon;
                return (
                  <li key={f.text} className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-hero-surface text-on-hero-muted">
                      <Icon className="h-4.5 w-4.5" strokeWidth={2} />
                    </span>
                    <span className="text-[15px] text-on-hero">{f.text}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Contoh kartu saldo (pratinjau produk) */}
          <div className="rounded-3xl bg-hero-surface p-5">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-on-hero-muted">
              Saldo Kas
            </p>
            <p className="money mt-1.5 font-display text-[28px] font-bold">
              Rp 4.250.000
            </p>
            <div className="mt-4 flex gap-6 border-t border-white/10 pt-3.5 text-sm">
              <span>
                <span className="text-on-hero-muted">Masuk hari ini </span>
                <span className="money font-semibold">+Rp 850.000</span>
              </span>
              <span>
                <span className="text-on-hero-muted">Keluar </span>
                <span className="money font-semibold">−Rp 200.000</span>
              </span>
            </div>
          </div>
        </aside>

        {/* Sisi formulir */}
        <main className="lg:flex lg:items-center lg:justify-center lg:p-10">
          <div className="relative z-10 mx-4 -mt-8 rounded-3xl border border-line bg-white p-5 pb-6 sm:mx-auto sm:max-w-[420px] lg:mx-0 lg:mt-0 lg:w-full lg:max-w-[360px] lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
