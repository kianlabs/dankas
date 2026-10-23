import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { createClient } from "@/lib/supabase/client";

// Setelah masuk/daftar, arahkan sesuai peran staf:
// kasir langsung ke layar Kasir, pemilik/admin ke Beranda.
export async function redirectByRole(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  router: AppRouterInstance
) {
  const { data } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  router.push(data?.role === "kasir" ? "/kasir" : "/dashboard");
  router.refresh();
}
