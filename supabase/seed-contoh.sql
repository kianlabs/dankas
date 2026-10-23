-- ============================================================
-- DanKas — DATA CONTOH / DEMO versi 2 untuk tampilan awal
-- ============================================================
-- Kategori mengikuti daftar barang ASLI toko DAN'S LABEL:
-- daster, oneset, atasan, celana, piyama, jilbab, cardigan.
-- Nama produk, harga, dan transaksinya tetap REKAAN (bukan data
-- penjualan asli) supaya dashboard, kasir, buku kas, dan laporan
-- langsung terlihat hidup saat pertama kali dicoba.
--
-- File ini MENGGANTI data contoh lama: bagian awal file
-- menghapus data contoh sebelumnya (semua transaksi, produk,
-- supplier contoh, dan kategori produk lama).
--
-- Jalankan SATU KALI di Supabase SQL Editor, SETELAH schema.sql
-- dan seed.sql. Dapat dijalankan di database yang sudah berisi
-- data contoh v1 (akan dibersihkan dulu di bagian awal file).
--
-- *** JANGAN jalankan di database yang sudah berisi data ASLI
-- toko — bagian pembersih di bawah akan MENGHAPUS seluruh
-- transaksi, produk, dan supplier yang ada. ***
--
-- Semua tanggal Oktober 2026 dan disusun kronologis. Setiap
-- peristiwa uang punya baris cash_ledger dengan balance_after
-- (saldo berjalan) yang dihitung benar dari awal sampai akhir:
--   Total kas masuk  : Rp6.550.000 (termasuk saldo awal)
--   Total kas keluar : Rp6.125.000
--   Saldo akhir      : Rp425.000
--
-- CATATAN STOK: kolom stock pada INSERT produk di bawah adalah
-- STOK AKHIR setelah seluruh transaksi contoh di file ini
-- (penjualan & pembelian contoh ditulis langsung via SQL,
-- sehingga stok tidak berubah sendiri seperti lewat aplikasi).
-- Stok awal sebelum transaksi = stok akhir + terjual - terbeli.
-- ============================================================

-- ============================================================
-- BAGIAN BERSIH — menghapus data contoh sebelumnya (v1)
-- users & kategori pemasukan/pengeluaran TIDAK disentuh.
-- ============================================================
truncate public.sale_items, public.purchase_items, public.sales, public.purchases, public.expenses, public.cash_ledger, public.products, public.suppliers restart identity cascade;
delete from public.categories where type = 'produk';

-- ---------- Kategori produk ----------
insert into public.categories (name, type) values
  ('Daster', 'produk'),
  ('Oneset', 'produk'),
  ('Atasan', 'produk'),
  ('Celana', 'produk'),
  ('Piyama', 'produk'),
  ('Jilbab', 'produk'),
  ('Cardigan', 'produk')
on conflict (name, type) do nothing;

-- ---------- Supplier contoh ----------
insert into public.suppliers (name, phone, address, notes) values
  ('CV Garmen Sejahtera', '0812-3456-7890', 'Jl. Industri No. 12, Bandung', 'Supplier utama kaos & kemeja (contoh)'),
  ('UD Tekstil Makmur', '0857-1122-3344', 'Jl. Pasar Kliwon No. 8, Surakarta', 'Supplier hijab & dress (contoh)');

-- ---------- Produk contoh (stock = STOK AKHIR, lihat catatan di atas) ----------
-- Stok awal -> akhir: DS-001 25->42 (beli 20, jual 3) | DS-002 20->19 (jual 1)
-- OS-001 15->22 (beli 10, jual 3) | OS-002 12->11 | AT-001 18->17 | AT-002 14->13
-- CL-001 22->20 (jual 2) | PY-001 16->15 | JB-001 40->68 (beli 30, jual 2)
-- JB-002 35->33 (jual 2) | CD-001 10->9 | CD-002 8->7 (di bawah min_stock, sengaja)
insert into public.products (sku, name, category_id, size, color, cost_price, sale_price, stock, min_stock) values
  ('DL-DS-001', 'Daster Batik Pekalongan',    (select id from public.categories where name = 'Daster'   and type = 'produk'), 'All Size', 'Marun',      38000,  65000, 42, 5),
  ('DL-DS-002', 'Daster Rayon Motif Bunga',   (select id from public.categories where name = 'Daster'   and type = 'produk'), 'All Size', 'Sage',       32000,  55000, 19, 5),
  ('DL-OS-001', 'Oneset Rayon Premium',       (select id from public.categories where name = 'Oneset'   and type = 'produk'), 'L',        'Dusty Pink', 68000, 115000, 22, 4),
  ('DL-OS-002', 'Oneset Crinkle Airflow',     (select id from public.categories where name = 'Oneset'   and type = 'produk'), 'XL',       'Mocca',      72000, 125000, 11, 4),
  ('DL-AT-001', 'Atasan Blouse Crinkle',      (select id from public.categories where name = 'Atasan'   and type = 'produk'), 'M',        'Putih',      48000,  85000, 17, 4),
  ('DL-AT-002', 'Atasan Tunik Rayon',         (select id from public.categories where name = 'Atasan'   and type = 'produk'), 'L',        'Navy',       58000,  95000, 13, 4),
  ('DL-CL-001', 'Celana Kulot Rayon',         (select id from public.categories where name = 'Celana'   and type = 'produk'), 'All Size', 'Hitam',      42000,  75000, 20, 5),
  ('DL-PY-001', 'Piyama Rayon Lengan Panjang',(select id from public.categories where name = 'Piyama'   and type = 'produk'), 'L',        'Biru Muda',  62000, 105000, 15, 4),
  ('DL-JB-001', 'Jilbab Segi Empat Voal',     (select id from public.categories where name = 'Jilbab'   and type = 'produk'), 'All Size', 'Cream',      22000,  39000, 68, 10),
  ('DL-JB-002', 'Pashmina Ceruty Babydoll',   (select id from public.categories where name = 'Jilbab'   and type = 'produk'), 'All Size', 'Dusty Pink', 20000,  35000, 33, 10),
  ('DL-CD-001', 'Cardigan Rajut Premium',     (select id from public.categories where name = 'Cardigan' and type = 'produk'), 'All Size', 'Latte',      78000, 135000,  9, 4),
  ('DL-CD-002', 'Cardigan Outer Panjang',     (select id from public.categories where name = 'Cardigan' and type = 'produk'), 'All Size', 'Charcoal',   88000, 150000,  7, 8);

-- ============================================================
-- TRANSAKSI CONTOH (kronologis)
-- ============================================================

-- 1 Okt — Saldo awal kas toko
insert into public.cash_ledger (ref_type, ref_id, type, amount, balance_after, description, transaction_date)
values ('saldo_awal', null, 'in', 5000000, 5000000, 'Saldo awal kas toko (modal awal Oktober 2026)', '2026-10-01');

-- 2 Okt — Pengeluaran: Sewa toko
insert into public.expenses (user_id, category_id, title, amount, expense_date, payment_method, notes)
values (null, (select id from public.categories where name = 'Sewa' and type = 'pengeluaran'),
        'Sewa toko bulan Oktober 2026', 1500000, '2026-10-02', 'Transfer', 'Pembayaran sewa ruko (contoh)');
insert into public.cash_ledger (ref_type, ref_id, type, amount, balance_after, description, transaction_date)
values ('expense',
        (select id from public.expenses where title = 'Sewa toko bulan Oktober 2026' and expense_date = '2026-10-02'),
        'out', 1500000, 3500000, 'Pengeluaran: Sewa toko bulan Oktober 2026 (Sewa)', '2026-10-02');

-- 5 Okt — Penjualan S1 (Tunai): 2x Daster Batik Pekalongan + 1x Oneset Rayon Premium
insert into public.sales (invoice_no, user_id, customer_name, subtotal, discount, tax, grand_total, payment_method, amount_paid, change_amount, status, sale_date)
values ('INV-20261005-001', null, null, 245000, 0, 0, 245000, 'Tunai', 250000, 5000, 'selesai', '2026-10-05');
insert into public.sale_items (sale_id, product_id, qty, cost_price, sale_price, discount, subtotal)
select s.id, p.id, 2, 38000, 65000, 0, 130000 from public.sales s, public.products p
where s.invoice_no = 'INV-20261005-001' and p.sku = 'DL-DS-001';
insert into public.sale_items (sale_id, product_id, qty, cost_price, sale_price, discount, subtotal)
select s.id, p.id, 1, 68000, 115000, 0, 115000 from public.sales s, public.products p
where s.invoice_no = 'INV-20261005-001' and p.sku = 'DL-OS-001';
insert into public.cash_ledger (ref_type, ref_id, type, amount, balance_after, description, transaction_date)
values ('sale', (select id from public.sales where invoice_no = 'INV-20261005-001'),
        'in', 245000, 3745000, 'Penjualan INV-20261005-001', '2026-10-05');

-- 7 Okt — Penjualan S2 (QRIS): 1x Piyama Rayon Lengan Panjang + 2x Pashmina Ceruty Babydoll
insert into public.sales (invoice_no, user_id, customer_name, subtotal, discount, tax, grand_total, payment_method, amount_paid, change_amount, status, sale_date)
values ('INV-20261007-001', null, 'Rina (QRIS)', 175000, 0, 0, 175000, 'QRIS', 175000, 0, 'selesai', '2026-10-07');
insert into public.sale_items (sale_id, product_id, qty, cost_price, sale_price, discount, subtotal)
select s.id, p.id, 1, 62000, 105000, 0, 105000 from public.sales s, public.products p
where s.invoice_no = 'INV-20261007-001' and p.sku = 'DL-PY-001';
insert into public.sale_items (sale_id, product_id, qty, cost_price, sale_price, discount, subtotal)
select s.id, p.id, 2, 20000, 35000, 0, 70000 from public.sales s, public.products p
where s.invoice_no = 'INV-20261007-001' and p.sku = 'DL-JB-002';
insert into public.cash_ledger (ref_type, ref_id, type, amount, balance_after, description, transaction_date)
values ('sale', (select id from public.sales where invoice_no = 'INV-20261007-001'),
        'in', 175000, 3920000, 'Penjualan INV-20261007-001 — Rina (QRIS)', '2026-10-07');

-- 9 Okt — Penjualan S3 (Transfer, diskon 10.000): 1x Cardigan Outer Panjang
insert into public.sales (invoice_no, user_id, customer_name, subtotal, discount, tax, grand_total, payment_method, amount_paid, change_amount, status, sale_date)
values ('INV-20261009-001', null, 'Bapak Andi', 150000, 10000, 0, 140000, 'Transfer', 140000, 0, 'selesai', '2026-10-09');
insert into public.sale_items (sale_id, product_id, qty, cost_price, sale_price, discount, subtotal)
select s.id, p.id, 1, 88000, 150000, 0, 150000 from public.sales s, public.products p
where s.invoice_no = 'INV-20261009-001' and p.sku = 'DL-CD-002';
insert into public.cash_ledger (ref_type, ref_id, type, amount, balance_after, description, transaction_date)
values ('sale', (select id from public.sales where invoice_no = 'INV-20261009-001'),
        'in', 140000, 4060000, 'Penjualan INV-20261009-001 — Bapak Andi', '2026-10-09');

-- 10 Okt — Pengeluaran: Listrik & Air
insert into public.expenses (user_id, category_id, title, amount, expense_date, payment_method, notes)
values (null, (select id from public.categories where name = 'Listrik & Air' and type = 'pengeluaran'),
        'Listrik & air bulan September', 350000, '2026-10-10', 'Transfer', 'Tagihan PLN & PDAM (contoh)');
insert into public.cash_ledger (ref_type, ref_id, type, amount, balance_after, description, transaction_date)
values ('expense',
        (select id from public.expenses where title = 'Listrik & air bulan September' and expense_date = '2026-10-10'),
        'out', 350000, 3710000, 'Pengeluaran: Listrik & air bulan September (Listrik & Air)', '2026-10-10');

-- 12 Okt — Pembelian stok dari CV Garmen Sejahtera (Transfer, lunas)
-- 20x Daster Batik Pekalongan @38.000 + 10x Oneset Rayon Premium @68.000 + 30x Jilbab Segi Empat Voal @22.000 = 2.100.000
insert into public.purchases (purchase_no, supplier_id, user_id, total, payment_method, due_date, status, purchase_date)
values ('PB-20261012-001', (select id from public.suppliers where name = 'CV Garmen Sejahtera'), null,
        2100000, 'Transfer', null, 'lunas', '2026-10-12');
insert into public.purchase_items (purchase_id, product_id, qty, cost_price, subtotal)
select pu.id, p.id, 20, 38000, 760000 from public.purchases pu, public.products p
where pu.purchase_no = 'PB-20261012-001' and p.sku = 'DL-DS-001';
insert into public.purchase_items (purchase_id, product_id, qty, cost_price, subtotal)
select pu.id, p.id, 10, 68000, 680000 from public.purchases pu, public.products p
where pu.purchase_no = 'PB-20261012-001' and p.sku = 'DL-OS-001';
insert into public.purchase_items (purchase_id, product_id, qty, cost_price, subtotal)
select pu.id, p.id, 30, 22000, 660000 from public.purchases pu, public.products p
where pu.purchase_no = 'PB-20261012-001' and p.sku = 'DL-JB-001';
insert into public.cash_ledger (ref_type, ref_id, type, amount, balance_after, description, transaction_date)
values ('purchase', (select id from public.purchases where purchase_no = 'PB-20261012-001'),
        'out', 2100000, 1610000, 'Pembelian stok PB-20261012-001 — CV Garmen Sejahtera', '2026-10-12');

-- 13 Okt — Penjualan S4 (Tunai): 1x Celana Kulot Rayon + 1x Daster Rayon Motif Bunga
insert into public.sales (invoice_no, user_id, customer_name, subtotal, discount, tax, grand_total, payment_method, amount_paid, change_amount, status, sale_date)
values ('INV-20261013-001', null, null, 130000, 0, 0, 130000, 'Tunai', 150000, 20000, 'selesai', '2026-10-13');
insert into public.sale_items (sale_id, product_id, qty, cost_price, sale_price, discount, subtotal)
select s.id, p.id, 1, 42000, 75000, 0, 75000 from public.sales s, public.products p
where s.invoice_no = 'INV-20261013-001' and p.sku = 'DL-CL-001';
insert into public.sale_items (sale_id, product_id, qty, cost_price, sale_price, discount, subtotal)
select s.id, p.id, 1, 32000, 55000, 0, 55000 from public.sales s, public.products p
where s.invoice_no = 'INV-20261013-001' and p.sku = 'DL-DS-002';
insert into public.cash_ledger (ref_type, ref_id, type, amount, balance_after, description, transaction_date)
values ('sale', (select id from public.sales where invoice_no = 'INV-20261013-001'),
        'in', 130000, 1740000, 'Penjualan INV-20261013-001', '2026-10-13');

-- 15 Okt — Penjualan S5 (E-Wallet, diskon 15.000): 1x Oneset Crinkle Airflow + 2x Jilbab Segi Empat Voal
insert into public.sales (invoice_no, user_id, customer_name, subtotal, discount, tax, grand_total, payment_method, amount_paid, change_amount, status, sale_date)
values ('INV-20261015-001', null, 'Dewi (online)', 203000, 15000, 0, 188000, 'E-Wallet', 188000, 0, 'selesai', '2026-10-15');
insert into public.sale_items (sale_id, product_id, qty, cost_price, sale_price, discount, subtotal)
select s.id, p.id, 1, 72000, 125000, 0, 125000 from public.sales s, public.products p
where s.invoice_no = 'INV-20261015-001' and p.sku = 'DL-OS-002';
insert into public.sale_items (sale_id, product_id, qty, cost_price, sale_price, discount, subtotal)
select s.id, p.id, 2, 22000, 39000, 0, 78000 from public.sales s, public.products p
where s.invoice_no = 'INV-20261015-001' and p.sku = 'DL-JB-001';
insert into public.cash_ledger (ref_type, ref_id, type, amount, balance_after, description, transaction_date)
values ('sale', (select id from public.sales where invoice_no = 'INV-20261015-001'),
        'in', 188000, 1928000, 'Penjualan INV-20261015-001 — Dewi (online)', '2026-10-15');

-- 16 Okt — Pengeluaran: Marketing
insert into public.expenses (user_id, category_id, title, amount, expense_date, payment_method, notes)
values (null, (select id from public.categories where name = 'Marketing' and type = 'pengeluaran'),
        'Iklan Instagram & Shopee Ads', 250000, '2026-10-16', 'E-Wallet', 'Promosi koleksi baru (contoh)');
insert into public.cash_ledger (ref_type, ref_id, type, amount, balance_after, description, transaction_date)
values ('expense',
        (select id from public.expenses where title = 'Iklan Instagram & Shopee Ads' and expense_date = '2026-10-16'),
        'out', 250000, 1678000, 'Pengeluaran: Iklan Instagram & Shopee Ads (Marketing)', '2026-10-16');

-- 18 Okt — Penjualan S6 (QRIS): 1x Atasan Blouse Crinkle + 1x Atasan Tunik Rayon
insert into public.sales (invoice_no, user_id, customer_name, subtotal, discount, tax, grand_total, payment_method, amount_paid, change_amount, status, sale_date)
values ('INV-20261018-001', null, null, 180000, 0, 0, 180000, 'QRIS', 180000, 0, 'selesai', '2026-10-18');
insert into public.sale_items (sale_id, product_id, qty, cost_price, sale_price, discount, subtotal)
select s.id, p.id, 1, 48000, 85000, 0, 85000 from public.sales s, public.products p
where s.invoice_no = 'INV-20261018-001' and p.sku = 'DL-AT-001';
insert into public.sale_items (sale_id, product_id, qty, cost_price, sale_price, discount, subtotal)
select s.id, p.id, 1, 58000, 95000, 0, 95000 from public.sales s, public.products p
where s.invoice_no = 'INV-20261018-001' and p.sku = 'DL-AT-002';
insert into public.cash_ledger (ref_type, ref_id, type, amount, balance_after, description, transaction_date)
values ('sale', (select id from public.sales where invoice_no = 'INV-20261018-001'),
        'in', 180000, 1858000, 'Penjualan INV-20261018-001', '2026-10-18');

-- 20 Okt — Penjualan S7 (Tunai): 1x Cardigan Rajut Premium + 1x Daster Batik Pekalongan
insert into public.sales (invoice_no, user_id, customer_name, subtotal, discount, tax, grand_total, payment_method, amount_paid, change_amount, status, sale_date)
values ('INV-20261020-001', null, 'Sinta', 200000, 0, 0, 200000, 'Tunai', 200000, 0, 'selesai', '2026-10-20');
insert into public.sale_items (sale_id, product_id, qty, cost_price, sale_price, discount, subtotal)
select s.id, p.id, 1, 78000, 135000, 0, 135000 from public.sales s, public.products p
where s.invoice_no = 'INV-20261020-001' and p.sku = 'DL-CD-001';
insert into public.sale_items (sale_id, product_id, qty, cost_price, sale_price, discount, subtotal)
select s.id, p.id, 1, 38000, 65000, 0, 65000 from public.sales s, public.products p
where s.invoice_no = 'INV-20261020-001' and p.sku = 'DL-DS-001';
insert into public.cash_ledger (ref_type, ref_id, type, amount, balance_after, description, transaction_date)
values ('sale', (select id from public.sales where invoice_no = 'INV-20261020-001'),
        'in', 200000, 2058000, 'Penjualan INV-20261020-001 — Sinta', '2026-10-20');

-- 21 Okt — Pengeluaran: Operasional
insert into public.expenses (user_id, category_id, title, amount, expense_date, payment_method, notes)
values (null, (select id from public.categories where name = 'Operasional' and type = 'pengeluaran'),
        'Plastik kemasan & alat tulis kasir', 125000, '2026-10-21', 'Tunai', 'Belanja kebutuhan toko (contoh)');
insert into public.cash_ledger (ref_type, ref_id, type, amount, balance_after, description, transaction_date)
values ('expense',
        (select id from public.expenses where title = 'Plastik kemasan & alat tulis kasir' and expense_date = '2026-10-21'),
        'out', 125000, 1933000, 'Pengeluaran: Plastik kemasan & alat tulis kasir (Operasional)', '2026-10-21');

-- 23 Okt — Penjualan S8 (Transfer, diskon 13.000): 2x Oneset Rayon Premium + 1x Celana Kulot Rayon
insert into public.sales (invoice_no, user_id, customer_name, subtotal, discount, tax, grand_total, payment_method, amount_paid, change_amount, status, sale_date)
values ('INV-20261023-001', null, 'Komunitas Senam Bu Tuti', 305000, 13000, 0, 292000, 'Transfer', 292000, 0, 'selesai', '2026-10-23');
insert into public.sale_items (sale_id, product_id, qty, cost_price, sale_price, discount, subtotal)
select s.id, p.id, 2, 68000, 115000, 0, 230000 from public.sales s, public.products p
where s.invoice_no = 'INV-20261023-001' and p.sku = 'DL-OS-001';
insert into public.sale_items (sale_id, product_id, qty, cost_price, sale_price, discount, subtotal)
select s.id, p.id, 1, 42000, 75000, 0, 75000 from public.sales s, public.products p
where s.invoice_no = 'INV-20261023-001' and p.sku = 'DL-CL-001';
insert into public.cash_ledger (ref_type, ref_id, type, amount, balance_after, description, transaction_date)
values ('sale', (select id from public.sales where invoice_no = 'INV-20261023-001'),
        'in', 292000, 2225000, 'Penjualan INV-20261023-001 — Komunitas Senam Bu Tuti', '2026-10-23');

-- 25 Okt — Pengeluaran: Gaji
insert into public.expenses (user_id, category_id, title, amount, expense_date, payment_method, notes)
values (null, (select id from public.categories where name = 'Gaji' and type = 'pengeluaran'),
        'Gaji karyawan bulan Oktober', 1800000, '2026-10-25', 'Transfer', 'Gaji 2 orang staf toko (contoh)');
insert into public.cash_ledger (ref_type, ref_id, type, amount, balance_after, description, transaction_date)
values ('expense',
        (select id from public.expenses where title = 'Gaji karyawan bulan Oktober' and expense_date = '2026-10-25'),
        'out', 1800000, 425000, 'Pengeluaran: Gaji karyawan bulan Oktober (Gaji)', '2026-10-25');

-- ============================================================
-- RINGKASAN FILE INI (sudah dicek ulang penjumlahannya)
--   Saldo awal            : Rp5.000.000 (masuk)
--   Total penjualan (8)   : Rp1.550.000 (masuk)
--   Total pembelian (1)   : Rp2.100.000 (keluar)
--   Total pengeluaran (5) : Rp4.025.000 (keluar)
--   -----------------------------------------------
--   Total kas masuk       : Rp6.550.000
--   Total kas keluar      : Rp6.125.000
--   SALDO AKHIR           : Rp425.000  (= balance_after baris terakhir)
--   HPP penjualan contoh  : Rp924.000
--   Laba kotor contoh     : Rp1.550.000 - Rp924.000 = Rp626.000
-- ============================================================
