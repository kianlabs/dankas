import AppShell from "@/components/AppShell";

// Layout untuk semua halaman aplikasi (di balik login Supabase Auth).
export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <AppShell>{children}</AppShell>;
}
