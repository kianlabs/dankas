"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { appendLedger } from "@/lib/ledger";
import { formatRupiah, todayISO } from "@/lib/format";
import { PAYMENT_METHODS, type Product } from "@/lib/types";

interface CartItem {
  product: Product;
  qty: number;
}

export default function KasirPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<string>("Tunai");
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<{
    invoiceNo: string;
    total: number;
    paid: number;
    change: number;
    method: string;
  } | null>(null);

  async function loadProducts() {
    const supabase = createClient();
    const { data } = await supabase
      .from("products")
      .select("*")
      .order("name");
    setProducts((data ?? []) as Product[]);
    setLoading(false);
  }

  useEffect(() => {
    loadProducts();
  }, []);

  const filtered = useMemo(
    () =>
      products.filter((p) =>
        `${p.name} ${p.sku} ${p.size ?? ""} ${p.color ?? ""}`
          .toLowerCase()
          .includes(search.toLowerCase())
      ),
    [products, search]
  );

  const subtotal = cart.reduce(
    (acc, item) => acc + item.qty * item.product.sale_price,
    0
  );
  const grandTotal = Math.max(subtotal - discount, 0);
  const change = paymentMethod === "Tunai" ? amountPaid - grandTotal : 0;

  // Untuk metode non-tunai, jumlah bayar dianggap pas.
  const effectivePaid = paymentMethod === "Tunai" ? amountPaid : grandTotal;

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        if (existing.qty >= product.stock) return prev;
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [...prev, { product, qty: 1 }];
    });
  }

  function setQty(productId: number, qty: number) {
    setCart((prev) =>
      prev
        .map((i) =>
          i.product.id === productId
            ? { ...i, qty: Math.max(0, Math.min(qty, i.product.stock)) }
            : i
        )
        .filter((i) => i.qty > 0)
    );
  }

  async function handleCheckout() {
    setError(null);
    if (cart.length === 0) {
      setError("Keranjang masih kosong. Pilih produk terlebih dahulu.");
      return;
    }
    if (paymentMethod === "Tunai" && amountPaid < grandTotal) {
      setError("Jumlah uang yang diterima kurang dari total belanja.");
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const today = todayISO();

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Nomor invoice: INV-YYYYMMDD-XXX (XXX = urutan penjualan hari ini)
      const { count } = await supabase
        .from("sales")
        .select("id", { count: "exact", head: true })
        .eq("sale_date", today);
      const seq = String((count ?? 0) + 1).padStart(3, "0");
      const invoiceNo = `INV-${today.replaceAll("-", "")}-${seq}`;

      const { data: sale, error: saleError } = await supabase
        .from("sales")
        .insert({
          invoice_no: invoiceNo,
          user_id: user?.id ?? null,
          customer_name: customerName.trim() || null,
          subtotal,
          discount,
          tax: 0,
          grand_total: grandTotal,
          payment_method: paymentMethod,
          amount_paid: effectivePaid,
          change_amount: paymentMethod === "Tunai" ? change : 0,
          status: "selesai",
          sale_date: today,
        })
        .select("id")
        .single();
      if (saleError || !sale) throw new Error(saleError?.message ?? "Gagal menyimpan penjualan.");

      // Detail item dengan harga snapshot (HPP & harga jual saat ini)
      const items = cart.map((item) => ({
        sale_id: sale.id,
        product_id: item.product.id,
        qty: item.qty,
        cost_price: item.product.cost_price,
        sale_price: item.product.sale_price,
        discount: 0,
        subtotal: item.qty * item.product.sale_price,
      }));
      const { error: itemsError } = await supabase.from("sale_items").insert(items);
      if (itemsError) throw new Error(itemsError.message);

      // Kurangi stok produk
      for (const item of cart) {
        const { error: stockError } = await supabase
          .from("products")
          .update({ stock: item.product.stock - item.qty })
          .eq("id", item.product.id);
        if (stockError) throw new Error(stockError.message);
      }

      // Tulis ke buku kas (kas masuk sebesar total penjualan)
      const { error: ledgerError } = await appendLedger(supabase, {
        ref_type: "sale",
        ref_id: sale.id,
        type: "in",
        amount: grandTotal,
        description: `Penjualan ${invoiceNo}${customerName ? ` — ${customerName}` : ""}`,
        transaction_date: today,
      });
      if (ledgerError) throw new Error(ledgerError);

      setReceipt({
        invoiceNo,
        total: grandTotal,
        paid: effectivePaid,
        change: paymentMethod === "Tunai" ? change : 0,
        method: paymentMethod,
      });
      setCart([]);
      setCustomerName("");
      setDiscount(0);
      setAmountPaid(0);
      await loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-zinc-500">Memuat produk...</p>;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Kasir</h1>
        <p className="text-sm text-zinc-500">
          Pilih produk, lalu selesaikan pembayaran. Stok, HPP, dan buku kas
          tercatat otomatis.
        </p>
      </div>

      {receipt && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="font-semibold text-emerald-900">Penjualan tersimpan</p>
          <dl className="mt-2 space-y-1 text-sm text-emerald-800">
            <div className="flex justify-between">
              <dt>Nomor invoice</dt>
              <dd className="font-semibold">{receipt.invoiceNo}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Total</dt>
              <dd className="money font-semibold">{formatRupiah(receipt.total)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Dibayar ({receipt.method})</dt>
              <dd className="money">{formatRupiah(receipt.paid)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Kembalian</dt>
              <dd className="money font-semibold">{formatRupiah(receipt.change)}</dd>
            </div>
          </dl>
          <button
            onClick={() => setReceipt(null)}
            className="mt-3 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white"
          >
            Tutup
          </button>
        </div>
      )}

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Cari produk (nama, SKU, ukuran, warna)..."
        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-zinc-900"
      />

      {products.length === 0 ? (
        <p className="rounded-2xl bg-white p-4 text-sm text-zinc-500 shadow-sm">
          Belum ada produk. Tambahkan produk terlebih dahulu di menu Produk.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {filtered.map((p) => (
            <button
              key={p.id}
              onClick={() => addToCart(p)}
              disabled={p.stock <= 0}
              className="rounded-2xl bg-white p-3 text-left shadow-sm disabled:opacity-40"
            >
              <p className="text-sm font-semibold leading-snug">{p.name}</p>
              <p className="mt-0.5 text-xs text-zinc-400">
                {[p.size, p.color].filter(Boolean).join(" • ") || p.sku}
              </p>
              <p className="money mt-2 text-sm font-bold">{formatRupiah(p.sale_price)}</p>
              <p className="text-xs text-zinc-400">Stok: {p.stock}</p>
            </button>
          ))}
        </div>
      )}

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="font-semibold">Keranjang</h2>
        {cart.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-400">Keranjang kosong.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {cart.map((item) => (
              <li key={item.product.id} className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{item.product.name}</p>
                  <p className="money text-xs text-zinc-400">
                    {formatRupiah(item.product.sale_price)} / pcs
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQty(item.product.id, item.qty - 1)}
                    className="h-8 w-8 rounded-lg bg-zinc-100 text-lg leading-none"
                    aria-label="Kurangi"
                  >
                    −
                  </button>
                  <span className="w-6 text-center text-sm font-semibold">{item.qty}</span>
                  <button
                    onClick={() => setQty(item.product.id, item.qty + 1)}
                    className="h-8 w-8 rounded-lg bg-zinc-100 text-lg leading-none"
                    aria-label="Tambah"
                  >
                    +
                  </button>
                  <span className="money w-24 text-right text-sm font-semibold">
                    {formatRupiah(item.qty * item.product.sale_price)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 space-y-3 border-t border-zinc-100 pt-4">
          <div>
            <label htmlFor="customer" className="text-sm font-medium">
              Nama Pelanggan (opsional)
            </label>
            <input
              id="customer"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
              placeholder="Umum"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="discount" className="text-sm font-medium">
                Diskon (Rp)
              </label>
              <input
                id="discount"
                type="number"
                min={0}
                value={discount || ""}
                onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
                placeholder="0"
              />
            </div>
            <div>
              <label htmlFor="method" className="text-sm font-medium">
                Metode Bayar
              </label>
              <select
                id="method"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {paymentMethod === "Tunai" && (
            <div>
              <label htmlFor="paid" className="text-sm font-medium">
                Uang Diterima (Rp)
              </label>
              <input
                id="paid"
                type="number"
                min={0}
                value={amountPaid || ""}
                onChange={(e) => setAmountPaid(Number(e.target.value) || 0)}
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
                placeholder="0"
              />
            </div>
          )}

          <dl className="space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-zinc-500">Subtotal</dt>
              <dd className="money">{formatRupiah(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-500">Diskon</dt>
              <dd className="money">− {formatRupiah(discount)}</dd>
            </div>
            <div className="flex justify-between text-base font-bold">
              <dt>Total</dt>
              <dd className="money">{formatRupiah(grandTotal)}</dd>
            </div>
            {paymentMethod === "Tunai" && amountPaid > 0 && (
              <div className="flex justify-between">
                <dt className="text-zinc-500">Kembalian</dt>
                <dd className="money font-semibold">
                  {formatRupiah(Math.max(change, 0))}
                </dd>
              </div>
            )}
          </dl>

          {error && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
          )}

          <button
            onClick={handleCheckout}
            disabled={saving || cart.length === 0}
            className="w-full rounded-lg bg-zinc-900 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? "Menyimpan..." : "Simpan Penjualan"}
          </button>
        </div>
      </section>
    </div>
  );
}
