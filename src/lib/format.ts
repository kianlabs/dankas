// Helper format Bahasa Indonesia untuk seluruh aplikasi.

const numberFormatter = new Intl.NumberFormat("id-ID", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

// Format baku aplikasi: "Rp 1.250.000" (spasi, tanpa desimal).
export function formatRupiah(value: number | null | undefined): string {
  return `Rp ${numberFormatter.format(value ?? 0)}`;
}

// Format ringkas untuk sumbu grafik & tooltip: "250 rb", "1,2 jt".
export function formatRingkas(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) {
    const jt = value / 1_000_000;
    return `${jt.toLocaleString("id-ID", { maximumFractionDigits: 1 })} jt`;
  }
  if (abs >= 1_000) return `${Math.round(value / 1_000)} rb`;
  return `${value}`;
}

export function formatTanggal(iso: string | null | undefined): string {
  if (!iso) return "-";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

// Tanggal hari ini dalam format yyyy-mm-dd (zona lokal browser).
export function todayISO(): string {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

export function firstDayOfMonthISO(iso: string): string {
  return `${iso.slice(0, 7)}-01`;
}

export function monthValueOf(iso: string): string {
  return iso.slice(0, 7); // yyyy-mm untuk <input type="month">
}
