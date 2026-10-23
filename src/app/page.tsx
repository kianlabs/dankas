import { redirect } from "next/navigation";

// Halaman akar langsung menuju dashboard. Aplikasi ini tanpa login:
// membuka alamat web langsung masuk ke dashboard.
export default function HomePage() {
  redirect("/dashboard");
}
