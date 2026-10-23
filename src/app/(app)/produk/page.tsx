"use client";

import { useEffect, useState } from "react";
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
    load();
  }, []);

  function setField(key: keyof typeof emptyForm, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function startEdit(p: Product) {
    setEditingId(p.id);
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

  if (loading) return <p className="text-sm text-zinc-500">Memuat produk...</p>;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Produk &amp; Stok</h1>
        <p className="text-sm text-zinc-500">
          Kelola produk baju beserta harga modal, harga jual, dan stoknya.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-3 rounded-2xl bg-white p-4 shadow-sm"
      >
        <h2 className="font-semibold">
          {editingId ? "Ubah Produk" : "Tambah Produk Baru"}
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="text-sm font-medium" htmlFor="p-name">Nama Produk</label>
            <input
              id="p-name"
              required
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
              placeholder="cth. Kemeja Flanel Kotak"
            />
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="p-sku">SKU / Kode</label>
            <input
              id="p-sku"
              required
              value={form.sku}
              onChange={(e) => setField("sku", e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
              placeholder="cth. KMJ-FLN-001"
            />
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="p-cat">Kategori (opsional)</label>
            <select
              id="p-cat"
              value={form.category_id}
              onChange={(e) => setField("category_id", e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
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
            <label className="text-sm font-medium" htmlFor="p-size">Ukuran</label>
            <input
              id="p-size"
              value={form.size}
              onChange={(e) => setField("size", e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
              placeholder="S / M / L / XL / All Size"
            />
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="p-color">Warna</label>
            <input
              id="p-color"
              value={form.color}
              onChange={(e) => setField("color", e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
              placeholder="cth. Hitam"
            />
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="p-cost">Harga Modal (Rp)</label>
            <input
              id="p-cost"
              type="number"
              min={0}
              required
              value={form.cost_price}
              onChange={(e) => setField("cost_price", e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
              placeholder="0"
            />
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="p-sale">Harga Jual (Rp)</label>
            <input
              id="p-sale"
              type="number"
              min={0}
              required
              value={form.sale_price}
              onChange={(e) => setField("sale_price", e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
              placeholder="0"
            />
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="p-stock">Stok</label>
            <input
              id="p-stock"
              type="number"
              min={0}
              required
              value={form.stock}
              onChange={(e) => setField("stock", e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
              placeholder="0"
            />
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="p-min">Batas Stok Menipis</label>
            <input
              id="p-min"
              type="number"
              min={0}
              required
              value={form.min_stock}
              onChange={(e) => setField("min_stock", e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
              placeholder="3"
            />
          </div>
        </div>
        {error && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
        )}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 rounded-lg bg-zinc-900 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? "Menyimpan..." : editingId ? "Simpan Perubahan" : "Tambah Produk"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded-lg bg-zinc-100 px-4 py-2.5 text-sm font-medium"
            >
              Batal
            </button>
          )}
        </div>
      </form>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="font-semibold">Daftar Produk ({products.length})</h2>
        {products.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-400">
            Belum ada produk. Tambahkan produk pertama Anda lewat formulir di atas.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-zinc-100">
            {products.map((p) => (
              <li key={p.id} className="py-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">{p.name}</p>
                    <p className="text-xs text-zinc-400">
                      {p.sku}
                      {[p.size, p.color].filter(Boolean).length > 0 &&
                        ` • ${[p.size, p.color].filter(Boolean).join(" • ")}`}
                    </p>
                    <p className="money mt-1 text-xs text-zinc-500">
                      Modal {formatRupiah(p.cost_price)} • Jual {formatRupiah(p.sale_price)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm font-bold ${
                        p.stock <= p.min_stock ? "text-amber-600" : ""
                      }`}
                    >
                      Stok {p.stock}
                    </p>
                    {p.stock <= p.min_stock && (
                      <p className="text-[11px] font-medium text-amber-600">Menipis</p>
                    )}
                  </div>
                </div>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => startEdit(p)}
                    className="rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-medium"
                  >
                    Ubah
                  </button>
                  <button
                    onClick={() => handleDelete(p)}
                    className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-600"
                  >
                    Hapus
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
