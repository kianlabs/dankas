// Helper format Bahasa Indonesia untuk seluruh aplikasi.

const rupiahFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatRupiah(value: number | null | undefined): string {
  return rupiahFormatter.format(value ?? 0);
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
