import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Proxy Next.js 16 (pengganti middleware lama): menjalankan updateSession
// untuk semua halaman aplikasi, kecuali aset statis & file PWA.
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icons|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
