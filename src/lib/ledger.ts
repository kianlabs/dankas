import type { SupabaseClient } from "@supabase/supabase-js";

// Menghitung saldo kas saat ini dari cash_ledger:
// saldo = SUM(masuk) - SUM(keluar). cash_ledger adalah satu-satunya
// sumber kebenaran saldo (sesuai dokumen perancangan Bab 5).
export async function getCurrentBalance(
  supabase: SupabaseClient
): Promise<number> {
  const { data, error } = await supabase
    .from("cash_ledger")
    .select("type, amount");
  if (error || !data) return 0;
  return data.reduce(
    (acc, row) => acc + (row.type === "in" ? row.amount : -row.amount),
    0
  );
}

// Menulis satu baris jurnal ke buku kas, lengkap dengan saldo berjalan.
export async function appendLedger(
  supabase: SupabaseClient,
  entry: {
    ref_type: string;
    ref_id?: number | null;
    type: "in" | "out";
    amount: number;
    description: string;
    transaction_date: string;
  }
): Promise<{ error: string | null }> {
  const current = await getCurrentBalance(supabase);
  const balanceAfter =
    entry.type === "in" ? current + entry.amount : current - entry.amount;

  const { error } = await supabase.from("cash_ledger").insert({
    ref_type: entry.ref_type,
    ref_id: entry.ref_id ?? null,
    type: entry.type,
    amount: entry.amount,
    balance_after: balanceAfter,
    description: entry.description,
    transaction_date: entry.transaction_date,
  });

  return { error: error ? error.message : null };
}
