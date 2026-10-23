-- ============================================================
-- DanKas — Data awal (seed)
-- HANYA berisi kategori referensi bawaan. Tidak ada produk,
-- transaksi, atau data contoh apa pun — aplikasi mulai kosong.
-- Jalankan setelah schema.sql di Supabase SQL Editor.
-- Aman dijalankan ulang (on conflict do nothing).
-- ============================================================

insert into public.categories (name, type) values
  ('Penjualan Offline', 'pemasukan'),
  ('Penjualan Online', 'pemasukan'),
  ('Pembelian Stok', 'pengeluaran'),
  ('Operasional', 'pengeluaran'),
  ('Gaji', 'pengeluaran'),
  ('Sewa', 'pengeluaran'),
  ('Listrik & Air', 'pengeluaran'),
  ('Marketing', 'pengeluaran'),
  ('Lainnya', 'pengeluaran')
on conflict (name, type) do nothing;
