"use client";

import { useEffect, useState } from "react";
import { Package, Pencil, Plus, Search, Shirt, Trash2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatRupiah } from "@/lib/format";
import type { Category, Product } from "@/lib/types";

const emptyForm = {
  sku: "",
  name: "",
  category_id: "",
  size: "",
  color: "",
  cost_price: "",
  sale_price: "",
  stock: "",
  min_stock: "3",
};

export default function ProdukPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState<"semua" | "menipis" | "habis">("semua");
  const [formOpen, setFormOpen] = useState(false);
  const [role, setRole] = useState<string>("");

  async function load() {
    const supabase = createClient();
    const [prodRes, catRes] = await Promise.all([
      supabase.from("products").select("*").order("name"),
      supabase.from("categories").select("*").eq("type", "produk").order("name"),
    ]);
    setProducts((prodRes.data ?? []) as Product[]);
    setCategories((catRes.data ?? []) as Category[]);
    setLoading(false);
  }

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: profile } = await supabase
        .from("users")
        .select("role")
        .eq("id", data.user.id)
        .maybeSingle();
      if (profile?.role) setRole(profile.role);
    });
  }, []);

  // Harga modal hanya ditampilkan untuk pengelola (bukan kasir).
  const canSeeCost = role !== "kasir";

  const filtered = products.filter((p) => {
    const matchesSearch = `${p.name} ${p.sku} ${p.size ?? ""} ${p.color ?? ""}`
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesStock =
      stockFilter === "semua"
        ? true
        : stockFilter === "habis"
          ? p.stock <= 0
          : p.stock > 0 && p.stock <= p.min_stock;
    return matchesSearch && matchesStock;
  });

  useEffect(() => {
    load();
  }, []);

  function setField(key: keyof typeof emptyForm, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function startEdit(p: Product) {
    setEditingId(p.id);
    setFormOpen(true);
    setForm({
      sku: p.sku,
      name: p.name,
      category_id: p.category_id ? String(p.category_id) : "",
      size: p.size ?? "",
      color: p.color ?? "",
      cost_price: String(p.cost_price),
      sale_price: String(p.sale_price),
      stock: String(p.stock),
      min_stock: String(p.min_stock),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
    setFormOpen(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const supabase = createClient();
    const payload = {
      sku: form.sku.trim(),
      name: form.name.trim(),
      category_id: form.category_id ? Number(form.category_id) : null,
      size: form.size.trim() || null,
      color: form.color.trim() || null,
      cost_price: Number(form.cost_price) || 0,
      sale_price: Number(form.sale_price) || 0,
      stock: Number(form.stock) || 0,
      min_stock: Number(form.min_stock) || 0,
    };

    const { error } = editingId
      ? await supabase.from("products").update(payload).eq("id", editingId)
      : await supabase.from("products").insert(payload);

    setSaving(false);
    if (error) {
      setError(
        error.message.includes("duplicate")
          ? "SKU sudah dipakai produk lain. Gunakan SKU yang berbeda."
          : `Gagal menyimpan produk: ${error.message}`
      );
      return;
    }
    cancelEdit();
    await load();
  }

  async function handleDelete(p: Product) {
    if (!window.confirm(`Hapus produk "${p.name}"? Tindakan ini tidak dapat dibatalkan.`)) {
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.from("products").delete().eq("id", p.id);
    if (error) {
      setError(`Gagal menghapus: ${error.message}`);
      return;
    }
    await load();
  }

  if (loading)
    return (
      <div className="space-y-4">
        <div className="h-8 w-44 animate-pulse rounded-xl bg-surface-2" />
        <div className="h-72 animate-pulse rounded-2xl bg-surface-2" />
      </div>
    );

  const FILTERS = [
    { key: "semua", label: "Semua" },
    { key: "menipis", label: "Stok menipis" },
    { key: "habis", label: "Habis" },
  ] as const;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-[22px] font-bold tracking-[-0.01em]">
          Produk &amp; Stok
        </h1>
        <p className="mt-0.5 text-sm text-ink-2">
          {products.length} produk · kelola harga jual
          {canSeeCost ? ", harga modal," : ""} dan stok toko.
        </p>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-3" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari produk (nama, SKU, ukuran, warna)..."
          className="input h-12 pl-11"
        />
      </div>

      <div className="flex gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setStockFilter(f.key)}
            className={`h-9 rounded-full px-3.5 text-sm font-medium transition active:scale-95 ${
              stockFilter === f.key
                ? "bg-ink text-white"
                : "border border-line bg-white text-ink-2"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {formOpen && (
      <form onSubmit={handleSubmit} className="card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-semibold">
            {editingId ? "Ubah Produk" : "Tambah Produk Baru"}
          </h2>
          <button
            type="button"
            onClick={cancelEdit}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-2 text-ink-2"
            aria-label="Tutup formulir"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="label" htmlFor="p-name">Nama Produk</label>
            <input
              id="p-name"
              required
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              className="input"
              placeholder="cth. Kemeja Flanel Kotak"
            />
          </div>
          <div>
            <label className="label" htmlFor="p-sku">SKU / Kode</label>
            <input
              id="p-sku"
              required
              value={form.sku}
              onChange={(e) => setField("sku", e.target.value)}
              className="input"
              placeholder="cth. KMJ-FLN-001"
            />
          </div>
          <div>
            <label className="label" htmlFor="p-cat">Kategori (opsional)</label>
            <select
              id="p-cat"
              value={form.category_id}
              onChange={(e) => setField("category_id", e.target.value)}
              className="input"
            >
              <option value="">— Tanpa kategori —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="p-size">Ukuran</label>
            <input
              id="p-size"
              value={form.size}
              onChange={(e) => setField("size", e.target.value)}
              className="input"
              placeholder="S / M / L / XL / All Size"
            />
          </div>
          <div>
            <label className="label" htmlFor="p-color">Warna</label>
            <input
              id="p-color"
              value={form.color}
              onChange={(e) => setField("color", e.target.value)}
              className="input"
              placeholder="cth. Hitam"
            />
          </div>
          <div>
            <label className="label" htmlFor="p-cost">Harga Modal (Rp)</label>
            <input
              id="p-cost"
              type="number"
              min={0}
              required
              value={form.cost_price}
              onChange={(e) => setField("cost_price", e.target.value)}
              className="input"
              placeholder="0"
            />
          </div>
          <div>
            <label className="label" htmlFor="p-sale">Harga Jual (Rp)</label>
            <input
              id="p-sale"
              type="number"
              min={0}
              required
              value={form.sale_price}
              onChange={(e) => setField("sale_price", e.target.value)}
              className="input"
              placeholder="0"
            />
          </div>
          <div>
            <label className="label" htmlFor="p-stock">Stok</label>
            <input
              id="p-stock"
              type="number"
              min={0}
              required
              value={form.stock}
              onChange={(e) => setField("stock", e.target.value)}
              className="input"
              placeholder="0"
            />
          </div>
          <div>
            <label className="label" htmlFor="p-min">Batas Stok Menipis</label>
            <input
              id="p-min"
              type="number"
              min={0}
              required
              value={form.min_stock}
              onChange={(e) => setField("min_stock", e.target.value)}
              className="input"
              placeholder="3"
            />
          </div>
        </div>
        {error && (
          <p className="rounded-xl bg-keluar-tint px-3.5 py-2.5 text-sm text-keluar">{error}</p>
        )}
        <div className="flex gap-2">
          <button type="submit" disabled={saving} className="btn-primary h-12 flex-1 text-[15px]">
            {saving ? "Menyimpan..." : editingId ? "Simpan Perubahan" : "Tambah Produk"}
          </button>
          <button type="button" onClick={cancelEdit} className="btn-ghost h-12 px-5">
            Batal
          </button>
        </div>
      </form>
      )}

      <section>
        <h2 className="mb-3 font-display text-base font-semibold">
          Daftar Produk
          <span className="ml-2 rounded-full bg-surface-2 px-2 py-0.5 text-xs font-bold text-ink-2">
            {filtered.length}
          </span>
        </h2>
        <div className="card !p-0">
          {products.length === 0 ? (
            <div className="flex flex-col items-center px-4 py-10 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-2 text-ink-3">
                <Package className="h-6 w-6" strokeWidth={1.8} />
              </span>
              <p className="mt-3 max-w-xs text-sm text-ink-2">
                Belum ada produk. Tambahkan produk pertama Anda untuk mulai
                berjualan.
              </p>
              <button
                onClick={() => setFormOpen(true)}
                className="btn-primary mt-4 h-11 px-5"
              >
                <Plus className="h-4 w-4" />
                Tambah Produk
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-ink-2">
              Tidak ada produk yang cocok dengan pencarian/filter ini.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {filtered.map((p) => {
                const habis = p.stock <= 0;
                const menipis = !habis && p.stock <= p.min_stock;
                return (
                  <li key={p.id} className="flex gap-3 px-4 py-3.5">
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-ink-3">
                      <Shirt className="h-6 w-6" strokeWidth={1.6} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-semibold">{p.name}</p>
                      <p className="mt-0.5 truncate text-xs text-ink-2">
                        {p.sku}
                        {[p.size, p.color].filter(Boolean).length > 0 &&
                          ` · ${[p.size, p.color].filter(Boolean).join(" · ")}`}
                      </p>
                      {canSeeCost && (
                        <p className="money mt-1 text-xs text-ink-2">
                          Modal {formatRupiah(p.cost_price)}
                        </p>
                      )}
                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={() => startEdit(p)}
                          className="inline-flex h-8 items-center gap-1.5 rounded-full bg-surface-2 px-3 text-xs font-medium text-ink transition hover:bg-line active:scale-95"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Ubah
                        </button>
                        <button
                          onClick={() => handleDelete(p)}
                          className="inline-flex h-8 items-center gap-1.5 rounded-full bg-keluar-tint px-3 text-xs font-medium text-keluar transition active:scale-95"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Hapus
                        </button>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="money text-[15px] font-semibold">
                        {formatRupiah(p.sale_price)}
                      </p>
                      <span
                        className={`mt-1.5 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          habis
                            ? "bg-keluar-tint text-keluar"
                            : menipis
                              ? "bg-warn-tint text-warn"
                              : "bg-surface-2 text-ink-2"
                        }`}
                      >
                        {habis ? "Habis" : menipis ? `Sisa ${p.stock}` : `Stok ${p.stock}`}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      {/* FAB tambah produk */}
      {!formOpen && products.length > 0 && (
        <button
          onClick={() => {
            cancelEdit();
            setFormOpen(true);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="btn-primary fixed bottom-[calc(96px+env(safe-area-inset-bottom))] right-4 z-30 h-[52px] px-5 text-[15px] shadow-float lg:bottom-8 lg:right-8"
        >
          <Plus className="h-5 w-5" />
          Produk
        </button>
      )}
    </div>
  );
}
