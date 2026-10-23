"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Minus,
  Plus,
  Search,
  Shirt,
  ShoppingCart,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { appendLedger } from "@/lib/ledger";
import { formatRupiah, todayISO } from "@/lib/format";
import { PAYMENT_METHODS, type Category, type Product } from "@/lib/types";

interface CartItem {
  product: Product;
  qty: number;
}

interface Receipt {
  invoiceNo: string;
  total: number;
  paid: number;
  change: number;
  method: string;
}

const CASH_CHIPS: { label: string; value: number | "pas" }[] = [
  { label: "Uang pas", value: "pas" },
  { label: "20 rb", value: 20000 },
  { label: "50 rb", value: 50000 },
  { label: "100 rb", value: 100000 },
  { label: "200 rb", value: 200000 },
];

export default function KasirPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("Semua");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<string>("Tunai");
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  async function loadProducts() {
    const supabase = createClient();
    const [{ data }, { data: cats }] = await Promise.all([
      supabase.from("products").select("*").order("name"),
      supabase
        .from("categories")
        .select("*")
        .eq("type", "produk")
        .order("name"),
    ]);
    setProducts((data ?? []) as Product[]);
    setCategories((cats ?? []) as Category[]);
    setLoading(false);
  }

  useEffect(() => {
    loadProducts();
  }, []);

  const categoryName = (p: Product) =>
    categories.find((c) => c.id === p.category_id)?.name ?? null;

  const chips = useMemo(() => {
    const used = new Set(
      products.map((p) => categoryName(p)).filter(Boolean) as string[]
    );
    return ["Semua", ...categories.map((c) => c.name).filter((n) => used.has(n))];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, categories]);

  const filtered = useMemo(
    () =>
      products.filter((p) => {
        const matchesSearch = `${p.name} ${p.sku} ${p.size ?? ""} ${p.color ?? ""}`
          .toLowerCase()
          .includes(search.toLowerCase());
        const matchesCategory =
          category === "Semua" || categoryName(p) === category;
        return matchesSearch && matchesCategory;
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [products, search, category, categories]
  );

  const subtotal = cart.reduce(
    (acc, item) => acc + item.qty * item.product.sale_price,
    0
  );
  const grandTotal = Math.max(subtotal - discount, 0);
  const totalQty = cart.reduce((acc, item) => acc + item.qty, 0);
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

  function qtyInCart(productId: number) {
    return cart.find((i) => i.product.id === productId)?.qty ?? 0;
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
      // Penjualan dicatat atas nama kasir yang sedang login.
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

  function resetAfterSuccess() {
    setReceipt(null);
    setSheetOpen(false);
    setError(null);
  }

  // ---------- Panel keranjang & pembayaran (dipakai di aside desktop & sheet mobile) ----------
  function cartPanel() {
    return (
      <div>
        {cart.length === 0 ? (
          <p className="text-sm text-ink-2">
            Keranjang kosong — ketuk produk untuk menambahkan.
          </p>
        ) : (
          <ul className="space-y-3">
            {cart.map((item) => (
              <li key={item.product.id} className="flex items-center gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-ink-3">
                  <Shirt className="h-5 w-5" strokeWidth={1.8} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {item.product.name}
                  </p>
                  <p className="money text-xs text-ink-2">
                    {formatRupiah(item.product.sale_price)} / pcs
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => setQty(item.product.id, item.qty - 1)}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-2 text-ink transition hover:bg-line active:scale-95"
                    aria-label="Kurangi"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="money w-7 text-center text-sm font-bold">
                    {item.qty}
                  </span>
                  <button
                    onClick={() => setQty(item.product.id, item.qty + 1)}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-2 text-ink transition hover:bg-line active:scale-95"
                    aria-label="Tambah"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <span className="money w-[92px] shrink-0 text-right text-sm font-bold">
                  {formatRupiah(item.qty * item.product.sale_price)}
                </span>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-5 space-y-4 border-t border-line pt-5">
          <div>
            <label htmlFor="customer" className="label">
              Nama Pelanggan (opsional)
            </label>
            <input
              id="customer"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="input"
              placeholder="Umum"
            />
          </div>
          <div>
            <label htmlFor="discount" className="label">
              Diskon (Rp)
            </label>
            <input
              id="discount"
              type="number"
              min={0}
              value={discount || ""}
              onChange={(e) => setDiscount(Number(e.target.value) || 0)}
              className="input"
              placeholder="0"
            />
          </div>

          <div>
            <span className="label">Metode Bayar</span>
            <div className="grid grid-cols-4 gap-1 rounded-full bg-surface-2 p-1">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m}
                  onClick={() => setPaymentMethod(m)}
                  className={`rounded-full px-1 py-2 text-sm transition ${
                    paymentMethod === m
                      ? "bg-white font-semibold text-ink"
                      : "font-medium text-ink-2"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {paymentMethod === "Tunai" && (
            <div>
              <label htmlFor="paid" className="label">
                Uang Diterima (Rp)
              </label>
              <input
                id="paid"
                type="number"
                min={0}
                value={amountPaid || ""}
                onChange={(e) => setAmountPaid(Number(e.target.value) || 0)}
                className="input money h-12 text-base"
                placeholder="0"
              />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {CASH_CHIPS.map((chip) => (
                  <button
                    key={chip.label}
                    onClick={() =>
                      setAmountPaid(chip.value === "pas" ? grandTotal : chip.value)
                    }
                    className="rounded-full border border-line bg-white px-3 py-1.5 text-[13px] font-medium text-ink-2 transition hover:border-ink-3 active:scale-95"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <dl className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-2">Subtotal</dt>
              <dd className="money">{formatRupiah(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-2">Diskon</dt>
              <dd className="money">− {formatRupiah(discount)}</dd>
            </div>
            <div className="flex justify-between border-t border-line pt-2 text-[17px] font-bold">
              <dt>Total</dt>
              <dd className="money">{formatRupiah(grandTotal)}</dd>
            </div>
          </dl>

          {paymentMethod === "Tunai" && cart.length > 0 && (
            <div className="rounded-2xl bg-surface-2 px-4 py-3">
              <p className="text-xs font-medium text-ink-2">Kembalian</p>
              <p
                className={`money font-display text-[28px] font-bold leading-tight ${
                  change >= 0 ? "text-masuk" : "text-keluar"
                }`}
              >
                {change >= 0
                  ? formatRupiah(change)
                  : `Kurang ${formatRupiah(Math.abs(change))}`}
              </p>
            </div>
          )}

          {error && (
            <p className="rounded-xl bg-keluar-tint px-3.5 py-2.5 text-sm text-keluar">
              {error}
            </p>
          )}

          <button
            onClick={handleCheckout}
            disabled={saving || cart.length === 0}
            className="btn-primary h-[52px] w-full text-[15px]"
          >
            {saving ? "Memproses..." : `Selesai · ${formatRupiah(grandTotal)}`}
          </button>
        </div>
      </div>
    );
  }

  // ---------- Panel sukses ----------
  function successPanel() {
    if (!receipt) return null;
    return (
      <div className="text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-masuk-tint">
          <CheckCircle2 className="h-8 w-8 text-masuk" strokeWidth={2} />
        </span>
        <h3 className="mt-4 font-display text-lg font-bold">
          Pembayaran Berhasil
        </h3>
        <p className="mt-0.5 text-sm text-ink-2">{receipt.invoiceNo}</p>
        <dl className="mt-5 space-y-2 text-left text-sm">
          <div className="flex justify-between">
            <dt className="text-ink-2">Total</dt>
            <dd className="money font-semibold">{formatRupiah(receipt.total)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-2">Dibayar ({receipt.method})</dt>
            <dd className="money">{formatRupiah(receipt.paid)}</dd>
          </div>
          <div className="flex justify-between border-t border-line pt-2">
            <dt className="text-ink-2">Kembalian</dt>
            <dd className="money font-display text-lg font-bold text-masuk">
              {formatRupiah(receipt.change)}
            </dd>
          </div>
        </dl>
        <button
          onClick={resetAfterSuccess}
          className="btn-primary mt-6 h-[52px] w-full text-[15px]"
        >
          Transaksi Baru
        </button>
      </div>
    );
  }

  if (loading)
    return (
      <div className="space-y-4">
        <div className="h-8 w-32 animate-pulse rounded-xl bg-surface-2" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-44 animate-pulse rounded-2xl bg-surface-2" />
          ))}
        </div>
      </div>
    );

  return (
    <div>
      <div>
        <h1 className="font-display text-[22px] font-bold tracking-[-0.01em]">
          Kasir
        </h1>
        <p className="mt-0.5 text-sm text-ink-2">
          Ketuk produk untuk menambahkan. Stok, HPP, dan buku kas tercatat
          otomatis.
        </p>
      </div>

      <div className="lg:flex lg:items-start lg:gap-6">
        {/* Kolom katalog */}
        <div className="min-w-0 flex-1">
          {/* Zona sticky: pencarian + chip kategori */}
          <div className="sticky top-14 z-20 -mx-4 bg-paper/95 px-4 py-2.5 backdrop-blur lg:top-0 lg:mx-0 lg:px-0">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-3" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari produk (nama, SKU, ukuran, warna)..."
                className="input h-12 pl-11"
              />
            </div>
            {chips.length > 1 && (
              <div className="mt-2.5 flex gap-1.5 overflow-x-auto pb-0.5">
                {chips.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className={`h-9 shrink-0 rounded-full px-3.5 text-sm font-medium transition active:scale-95 ${
                      category === c
                        ? "bg-ink text-white"
                        : "border border-line bg-white text-ink-2"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>

          {products.length === 0 ? (
            <div className="card mt-2 flex flex-col items-center py-10 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-2 text-ink-3">
                <ShoppingCart className="h-6 w-6" strokeWidth={1.8} />
              </span>
              <p className="mt-3 max-w-xs text-sm text-ink-2">
                Belum ada produk. Tambahkan produk terlebih dahulu di menu
                Produk.
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <p className="card mt-2 py-8 text-center text-sm text-ink-2">
              Tidak ada produk yang cocok dengan pencarian/kategori ini.
            </p>
          ) : (
            <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {filtered.map((p) => {
                const qty = qtyInCart(p.id);
                const habis = p.stock <= 0;
                const menipis = !habis && p.stock <= p.min_stock;
                return (
                  <div
                    key={p.id}
                    onClick={() => !habis && addToCart(p)}
                    className={`card !p-2.5 text-left transition active:scale-[0.98] ${
                      habis ? "opacity-60" : "cursor-pointer"
                    }`}
                  >
                    <div className="flex aspect-[4/3] items-center justify-center rounded-xl bg-surface-2">
                      <Shirt className="h-8 w-8 text-ink-3" strokeWidth={1.5} />
                    </div>
                    <p className="mt-2 line-clamp-2 min-h-10 text-sm font-semibold leading-snug">
                      {p.name}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-ink-2">
                      {[p.size, p.color].filter(Boolean).join(" • ") || p.sku}
                    </p>
                    <p className="money mt-1.5 text-[15px] font-bold">
                      {formatRupiah(p.sale_price)}
                    </p>
                    <div className="mt-2 flex items-center justify-between gap-1">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          habis
                            ? "bg-keluar-tint text-keluar"
                            : menipis
                              ? "bg-warn-tint text-warn"
                              : "bg-surface-2 text-ink-2"
                        }`}
                      >
                        {habis ? "Habis" : menipis ? `Sisa ${p.stock}` : `Stok ${p.stock}`}
                      </span>
                      {qty > 0 && (
                        <span className="money inline-flex items-center gap-1 rounded-full bg-primary-tint px-2 py-0.5 text-xs font-bold text-primary-pressed">
                          {qty} di keranjang
                        </span>
                      )}
                    </div>
                    {qty > 0 && (
                      <div
                        className="mt-2 flex items-center justify-between border-t border-line pt-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => setQty(p.id, qty - 1)}
                          className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-2 transition hover:bg-line active:scale-95"
                          aria-label="Kurangi"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="money text-sm font-bold">{qty}</span>
                        <button
                          onClick={() => addToCart(p)}
                          className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-2 transition hover:bg-line active:scale-95"
                          aria-label="Tambah"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Aside desktop: keranjang / sukses */}
        <aside className="sticky top-6 mt-4 hidden w-[380px] shrink-0 lg:mt-0 lg:block">
          <div className="card !p-5">
            {receipt ? (
              successPanel()
            ) : (
              <>
                <h2 className="mb-4 flex items-center gap-2 font-display text-base font-semibold">
                  <ShoppingCart className="h-5 w-5 text-ink-3" />
                  Keranjang
                </h2>
                {cartPanel()}
              </>
            )}
          </div>
        </aside>
      </div>

      {/* Bar keranjang sticky (mobile) */}
      {cart.length > 0 && !sheetOpen && (
        <div className="fixed inset-x-0 bottom-[calc(96px+env(safe-area-inset-bottom))] z-30 px-3 lg:hidden">
          <div className="flex items-center justify-between rounded-[20px] border border-line bg-white py-3 pl-4 pr-3 shadow-float">
            <div>
              <p className="text-xs text-ink-2">{totalQty} item</p>
              <p className="money text-[17px] font-bold leading-tight">
                {formatRupiah(grandTotal)}
              </p>
            </div>
            <button
              onClick={() => setSheetOpen(true)}
              className="btn-primary h-12 px-6 text-[15px]"
            >
              Bayar
            </button>
          </div>
        </div>
      )}

      {/* Sheet keranjang & pembayaran (mobile) */}
      {sheetOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-ink/40"
            onClick={() => !receipt && setSheetOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[90vh] overflow-y-auto rounded-t-3xl bg-white p-5 pb-[max(20px,env(safe-area-inset-bottom))]">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line" />
            {receipt ? (
              successPanel()
            ) : (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-display text-base font-semibold">
                    Keranjang & Pembayaran
                  </h2>
                  <button
                    onClick={() => setSheetOpen(false)}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-2 text-ink-2"
                    aria-label="Tutup"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                {cartPanel()}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
