import AppShell from "@/components/AppShell";

// Layout untuk semua halaman aplikasi (terbuka langsung, tanpa login).
export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <AppShell>{children}</AppShell>;
}
