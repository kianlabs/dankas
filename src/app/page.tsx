import { redirect } from "next/navigation";

// Halaman akar langsung menuju dashboard.
// (Proxy akan mengalihkan ke /login bila belum ada sesi.)
export default function HomePage() {
  redirect("/dashboard");
}
