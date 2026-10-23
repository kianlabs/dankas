import AppShell from "@/components/AppShell";

// Layout untuk semua halaman aplikasi yang terproteksi login.
export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <AppShell>{children}</AppShell>;
}
