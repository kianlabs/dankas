import { redirect } from "next/navigation";

// Halaman akar langsung menuju dashboard (middleware akan mengarahkan
// ke /login bila belum masuk).
export default function HomePage() {
  redirect("/dashboard");
}
