-- ============================================================
-- DanKas — DATA CONTOH / DEMO untuk tampilan awal
-- ============================================================
-- File ini berisi data REKAAN (bukan data asli toko) supaya
-- dashboard, kasir, buku kas, dan laporan langsung terlihat
-- hidup saat pertama kali dicoba.
--
-- *** HAPUS data contoh ini sebelum aplikasi dipakai produksi ***
-- Cara menghapusnya ada di README (truncate tabel transaksi,
-- pembelian, pengeluaran, buku kas, dan produk).
--
-- Jalankan SATU KALI saja, SETELAH schema.sql dan seed.sql,
-- di Supabase SQL Editor. Menjalankannya dua kali akan gagal
-- di batas unik (SKU / nomor invoice) — itu disengaja.
--
-- Semua tanggal Oktober 2026 dan disusun kronologis. Setiap
-- peristiwa uang punya baris cash_ledger dengan balance_after
-- (saldo berjalan) yang dihitung benar dari awal sampai akhir:
--   Total kas masuk  : Rp7.318.000 (termasuk saldo awal)
--   Total kas keluar : Rp6.925.000
--   Saldo akhir      : Rp393.000
--
-- CATATAN STOK: kolom stock pada INSERT produk di bawah adalah
-- STOK AKHIR setelah seluruh transaksi contoh di file ini
-- (penjualan & pembelian contoh ditulis langsung via SQL,
-- sehingga stok tidak berubah sendiri seperti lewat aplikasi).
-- Stok awal sebelum transaksi = stok akhir + terjual - terbeli.
-- ============================================================

-- ---------- Kategori produk ----------
insert into public.categories (name, type) values
  ('Kaos', 'produk'),
  ('Kemeja', 'produk'),
  ('Celana', 'produk'),
  ('Dress', 'produk'),
  ('Hijab', 'produk'),
  ('Outer', 'produk')
on conflict (name, type) do nothing;

-- ---------- Supplier contoh ----------
insert into public.suppliers (name, phone, address, notes) values
  ('CV Garmen Sejahtera', '0812-3456-7890', 'Jl. Industri No. 12, Bandung', 'Supplier utama kaos & kemeja (contoh)'),
  ('UD Tekstil Makmur', '0857-1122-3344', 'Jl. Pasar Kliwon No. 8, Surakarta', 'Supplier hijab & dress (contoh)');

-- ---------- Produk contoh (stock = STOK AKHIR, lihat catatan di atas) ----------
-- Stok awal -> akhir: KS-001 40->57 (beli 20, jual 3) | KS-002 30->28 (jual 2)
-- KM-001 20->28 (beli 10, jual 2) | KM-002 15->14 | CL-001 25->23 | CL-002 20->19
-- DR-001 12->11 | HJ-001 50->77 (beli 30, jual 3) | HJ-002 45->42 | OT-001 10->9
insert into public.products (sku, name, category_id, size, color, cost_price, sale_price, stock, min_stock) values
  ('DL-KS-001', 'Kaos Polos Premium',   (select id from public.categories where name = 'Kaos'   and type = 'produk'), 'L',        'Hitam',      45000,  79000, 57, 5),
  ('DL-KS-002', 'Kaos Oversize Graphic',(select id from public.categories where name = 'Kaos'   and type = 'produk'), 'XL',       'Putih',      55000,  99000, 28, 5),
  ('DL-KM-001', 'Kemeja Flanel Kotak',  (select id from public.categories where name = 'Kemeja' and type = 'produk'), 'M',        'Merah Marun',95000, 169000, 28, 4),
  ('DL-KM-002', 'Kemeja Batik Slim Fit',(select id from public.categories where name = 'Kemeja' and type = 'produk'), 'L',        'Cokelat',   120000, 219000, 14, 4),
  ('DL-CL-001', 'Celana Chino Panjang', (select id from public.categories where name = 'Celana' and type = 'produk'), '32',       'Khaki',      85000, 159000, 23, 4),
  ('DL-CL-002', 'Jeans Slim Stretch',   (select id from public.categories where name = 'Celana' and type = 'produk'), '30',       'Biru Denim',110000, 199000, 19, 4),
  ('DL-DR-001', 'Dress Midi Floral',    (select id from public.categories where name = 'Dress'  and type = 'produk'), 'M',        'Sage',      130000, 239000, 11, 3),
  ('DL-HJ-001', 'Hijab Voal Premium',   (select id from public.categories where name = 'Hijab'  and type = 'produk'), 'All Size', 'Dusty Pink', 35000,  69000, 77, 8),
  ('DL-HJ-002', 'Pashmina Ceruty',      (select id from public.categories where name = 'Hijab'  and type = 'produk'), 'All Size', 'Mocca',      30000,  59000, 42, 8),
  ('DL-OT-001', 'Jaket Denim Trucker',  (select id from public.categories where name = 'Outer'  and type = 'produk'), 'L',        'Biru Washed',150000, 279000,  9, 3);

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

-- 5 Okt — Penjualan S1 (Tunai): 2x Kaos Polos Premium + 1x Hijab Voal Premium
insert into public.sales (invoice_no, user_id, customer_name, subtotal, discount, tax, grand_total, payment_method, amount_paid, change_amount, status, sale_date)
values ('INV-20261005-001', null, null, 227000, 0, 0, 227000, 'Tunai', 250000, 23000, 'selesai', '2026-10-05');
insert into public.sale_items (sale_id, product_id, qty, cost_price, sale_price, discount, subtotal)
select s.id, p.id, 2, 45000, 79000, 0, 158000 from public.sales s, public.products p
where s.invoice_no = 'INV-20261005-001' and p.sku = 'DL-KS-001';
insert into public.sale_items (sale_id, product_id, qty, cost_price, sale_price, discount, subtotal)
select s.id, p.id, 1, 35000, 69000, 0, 69000 from public.sales s, public.products p
where s.invoice_no = 'INV-20261005-001' and p.sku = 'DL-HJ-001';
insert into public.cash_ledger (ref_type, ref_id, type, amount, balance_after, description, transaction_date)
values ('sale', (select id from public.sales where invoice_no = 'INV-20261005-001'),
        'in', 227000, 3727000, 'Penjualan INV-20261005-001', '2026-10-05');

-- 7 Okt — Penjualan S2 (QRIS): 1x Kaos Oversize Graphic + 2x Pashmina Ceruty
insert into public.sales (invoice_no, user_id, customer_name, subtotal, discount, tax, grand_total, payment_method, amount_paid, change_amount, status, sale_date)
values ('INV-20261007-001', null, 'Rina (QRIS)', 217000, 0, 0, 217000, 'QRIS', 217000, 0, 'selesai', '2026-10-07');
insert into public.sale_items (sale_id, product_id, qty, cost_price, sale_price, discount, subtotal)
select s.id, p.id, 1, 55000, 99000, 0, 99000 from public.sales s, public.products p
where s.invoice_no = 'INV-20261007-001' and p.sku = 'DL-KS-002';
insert into public.sale_items (sale_id, product_id, qty, cost_price, sale_price, discount, subtotal)
select s.id, p.id, 2, 30000, 59000, 0, 118000 from public.sales s, public.products p
where s.invoice_no = 'INV-20261007-001' and p.sku = 'DL-HJ-002';
insert into public.cash_ledger (ref_type, ref_id, type, amount, balance_after, description, transaction_date)
values ('sale', (select id from public.sales where invoice_no = 'INV-20261007-001'),
        'in', 217000, 3944000, 'Penjualan INV-20261007-001 — Rina (QRIS)', '2026-10-07');

-- 9 Okt — Penjualan S3 (Transfer, diskon 19.000): 1x Kemeja Batik Slim Fit
insert into public.sales (invoice_no, user_id, customer_name, subtotal, discount, tax, grand_total, payment_method, amount_paid, change_amount, status, sale_date)
values ('INV-20261009-001', null, 'Bapak Andi', 219000, 19000, 0, 200000, 'Transfer', 200000, 0, 'selesai', '2026-10-09');
insert into public.sale_items (sale_id, product_id, qty, cost_price, sale_price, discount, subtotal)
select s.id, p.id, 1, 120000, 219000, 0, 219000 from public.sales s, public.products p
where s.invoice_no = 'INV-20261009-001' and p.sku = 'DL-KM-002';
insert into public.cash_ledger (ref_type, ref_id, type, amount, balance_after, description, transaction_date)
values ('sale', (select id from public.sales where invoice_no = 'INV-20261009-001'),
        'in', 200000, 4144000, 'Penjualan INV-20261009-001 — Bapak Andi', '2026-10-09');

-- 10 Okt — Pengeluaran: Listrik & Air
insert into public.expenses (user_id, category_id, title, amount, expense_date, payment_method, notes)
values (null, (select id from public.categories where name = 'Listrik & Air' and type = 'pengeluaran'),
        'Listrik & air bulan September', 350000, '2026-10-10', 'Transfer', 'Tagihan PLN & PDAM (contoh)');
insert into public.cash_ledger (ref_type, ref_id, type, amount, balance_after, description, transaction_date)
values ('expense',
        (select id from public.expenses where title = 'Listrik & air bulan September' and expense_date = '2026-10-10'),
        'out', 350000, 3794000, 'Pengeluaran: Listrik & air bulan September (Listrik & Air)', '2026-10-10');

-- 12 Okt — Pembelian stok dari CV Garmen Sejahtera (Transfer, lunas)
-- 20x Kaos Polos Premium @45.000 + 10x Kemeja Flanel Kotak @95.000 + 30x Hijab Voal Premium @35.000 = 2.900.000
insert into public.purchases (purchase_no, supplier_id, user_id, total, payment_method, due_date, status, purchase_date)
values ('PB-20261012-001', (select id from public.suppliers where name = 'CV Garmen Sejahtera'), null,
        2900000, 'Transfer', null, 'lunas', '2026-10-12');
insert into public.purchase_items (purchase_id, product_id, qty, cost_price, subtotal)
select pu.id, p.id, 20, 45000, 900000 from public.purchases pu, public.products p
where pu.purchase_no = 'PB-20261012-001' and p.sku = 'DL-KS-001';
insert into public.purchase_items (purchase_id, product_id, qty, cost_price, subtotal)
select pu.id, p.id, 10, 95000, 950000 from public.purchases pu, public.products p
where pu.purchase_no = 'PB-20261012-001' and p.sku = 'DL-KM-001';
insert into public.purchase_items (purchase_id, product_id, qty, cost_price, subtotal)
select pu.id, p.id, 30, 35000, 1050000 from public.purchases pu, public.products p
where pu.purchase_no = 'PB-20261012-001' and p.sku = 'DL-HJ-001';
insert into public.cash_ledger (ref_type, ref_id, type, amount, balance_after, description, transaction_date)
values ('purchase', (select id from public.purchases where purchase_no = 'PB-20261012-001'),
        'out', 2900000, 894000, 'Pembelian stok PB-20261012-001 — CV Garmen Sejahtera', '2026-10-12');

-- 13 Okt — Penjualan S4 (Tunai): 1x Celana Chino Panjang + 1x Kaos Polos Premium
insert into public.sales (invoice_no, user_id, customer_name, subtotal, discount, tax, grand_total, payment_method, amount_paid, change_amount, status, sale_date)
values ('INV-20261013-001', null, null, 238000, 0, 0, 238000, 'Tunai', 250000, 12000, 'selesai', '2026-10-13');
insert into public.sale_items (sale_id, product_id, qty, cost_price, sale_price, discount, subtotal)
select s.id, p.id, 1, 85000, 159000, 0, 159000 from public.sales s, public.products p
where s.invoice_no = 'INV-20261013-001' and p.sku = 'DL-CL-001';
insert into public.sale_items (sale_id, product_id, qty, cost_price, sale_price, discount, subtotal)
select s.id, p.id, 1, 45000, 79000, 0, 79000 from public.sales s, public.products p
where s.invoice_no = 'INV-20261013-001' and p.sku = 'DL-KS-001';
insert into public.cash_ledger (ref_type, ref_id, type, amount, balance_after, description, transaction_date)
values ('sale', (select id from public.sales where invoice_no = 'INV-20261013-001'),
        'in', 238000, 1132000, 'Penjualan INV-20261013-001', '2026-10-13');

-- 15 Okt — Penjualan S5 (E-Wallet, diskon 27.000): 1x Dress Midi Floral + 2x Hijab Voal Premium
insert into public.sales (invoice_no, user_id, customer_name, subtotal, discount, tax, grand_total, payment_method, amount_paid, change_amount, status, sale_date)
values ('INV-20261015-001', null, 'Dewi (online)', 377000, 27000, 0, 350000, 'E-Wallet', 350000, 0, 'selesai', '2026-10-15');
insert into public.sale_items (sale_id, product_id, qty, cost_price, sale_price, discount, subtotal)
select s.id, p.id, 1, 130000, 239000, 0, 239000 from public.sales s, public.products p
where s.invoice_no = 'INV-20261015-001' and p.sku = 'DL-DR-001';
insert into public.sale_items (sale_id, product_id, qty, cost_price, sale_price, discount, subtotal)
select s.id, p.id, 2, 35000, 69000, 0, 138000 from public.sales s, public.products p
where s.invoice_no = 'INV-20261015-001' and p.sku = 'DL-HJ-001';
insert into public.cash_ledger (ref_type, ref_id, type, amount, balance_after, description, transaction_date)
values ('sale', (select id from public.sales where invoice_no = 'INV-20261015-001'),
        'in', 350000, 1482000, 'Penjualan INV-20261015-001 — Dewi (online)', '2026-10-15');

-- 16 Okt — Pengeluaran: Marketing
insert into public.expenses (user_id, category_id, title, amount, expense_date, payment_method, notes)
values (null, (select id from public.categories where name = 'Marketing' and type = 'pengeluaran'),
        'Iklan Instagram & Shopee Ads', 250000, '2026-10-16', 'E-Wallet', 'Promosi koleksi baru (contoh)');
insert into public.cash_ledger (ref_type, ref_id, type, amount, balance_after, description, transaction_date)
values ('expense',
        (select id from public.expenses where title = 'Iklan Instagram & Shopee Ads' and expense_date = '2026-10-16'),
        'out', 250000, 1232000, 'Pengeluaran: Iklan Instagram & Shopee Ads (Marketing)', '2026-10-16');

-- 18 Okt — Penjualan S6 (QRIS): 1x Jeans Slim Stretch + 1x Kaos Oversize Graphic
insert into public.sales (invoice_no, user_id, customer_name, subtotal, discount, tax, grand_total, payment_method, amount_paid, change_amount, status, sale_date)
values ('INV-20261018-001', null, null, 298000, 0, 0, 298000, 'QRIS', 298000, 0, 'selesai', '2026-10-18');
insert into public.sale_items (sale_id, product_id, qty, cost_price, sale_price, discount, subtotal)
select s.id, p.id, 1, 110000, 199000, 0, 199000 from public.sales s, public.products p
where s.invoice_no = 'INV-20261018-001' and p.sku = 'DL-CL-002';
insert into public.sale_items (sale_id, product_id, qty, cost_price, sale_price, discount, subtotal)
select s.id, p.id, 1, 55000, 99000, 0, 99000 from public.sales s, public.products p
where s.invoice_no = 'INV-20261018-001' and p.sku = 'DL-KS-002';
insert into public.cash_ledger (ref_type, ref_id, type, amount, balance_after, description, transaction_date)
values ('sale', (select id from public.sales where invoice_no = 'INV-20261018-001'),
        'in', 298000, 1530000, 'Penjualan INV-20261018-001', '2026-10-18');

-- 20 Okt — Penjualan S7 (Tunai): 1x Jaket Denim Trucker + 1x Pashmina Ceruty
insert into public.sales (invoice_no, user_id, customer_name, subtotal, discount, tax, grand_total, payment_method, amount_paid, change_amount, status, sale_date)
values ('INV-20261020-001', null, 'Sinta', 338000, 0, 0, 338000, 'Tunai', 350000, 12000, 'selesai', '2026-10-20');
insert into public.sale_items (sale_id, product_id, qty, cost_price, sale_price, discount, subtotal)
select s.id, p.id, 1, 150000, 279000, 0, 279000 from public.sales s, public.products p
where s.invoice_no = 'INV-20261020-001' and p.sku = 'DL-OT-001';
insert into public.sale_items (sale_id, product_id, qty, cost_price, sale_price, discount, subtotal)
select s.id, p.id, 1, 30000, 59000, 0, 59000 from public.sales s, public.products p
where s.invoice_no = 'INV-20261020-001' and p.sku = 'DL-HJ-002';
insert into public.cash_ledger (ref_type, ref_id, type, amount, balance_after, description, transaction_date)
values ('sale', (select id from public.sales where invoice_no = 'INV-20261020-001'),
        'in', 338000, 1868000, 'Penjualan INV-20261020-001 — Sinta', '2026-10-20');

-- 21 Okt — Pengeluaran: Operasional
insert into public.expenses (user_id, category_id, title, amount, expense_date, payment_method, notes)
values (null, (select id from public.categories where name = 'Operasional' and type = 'pengeluaran'),
        'Plastik kemasan & alat tulis kasir', 125000, '2026-10-21', 'Tunai', 'Belanja kebutuhan toko (contoh)');
insert into public.cash_ledger (ref_type, ref_id, type, amount, balance_after, description, transaction_date)
values ('expense',
        (select id from public.expenses where title = 'Plastik kemasan & alat tulis kasir' and expense_date = '2026-10-21'),
        'out', 125000, 1743000, 'Pengeluaran: Plastik kemasan & alat tulis kasir (Operasional)', '2026-10-21');

-- 23 Okt — Penjualan S8 (Transfer, diskon 47.000): 2x Kemeja Flanel Kotak + 1x Celana Chino Panjang
insert into public.sales (invoice_no, user_id, customer_name, subtotal, discount, tax, grand_total, payment_method, amount_paid, change_amount, status, sale_date)
values ('INV-20261023-001', null, 'Komunitas Senam Bu Tuti', 497000, 47000, 0, 450000, 'Transfer', 450000, 0, 'selesai', '2026-10-23');
insert into public.sale_items (sale_id, product_id, qty, cost_price, sale_price, discount, subtotal)
select s.id, p.id, 2, 95000, 169000, 0, 338000 from public.sales s, public.products p
where s.invoice_no = 'INV-20261023-001' and p.sku = 'DL-KM-001';
insert into public.sale_items (sale_id, product_id, qty, cost_price, sale_price, discount, subtotal)
select s.id, p.id, 1, 85000, 159000, 0, 159000 from public.sales s, public.products p
where s.invoice_no = 'INV-20261023-001' and p.sku = 'DL-CL-001';
insert into public.cash_ledger (ref_type, ref_id, type, amount, balance_after, description, transaction_date)
values ('sale', (select id from public.sales where invoice_no = 'INV-20261023-001'),
        'in', 450000, 2193000, 'Penjualan INV-20261023-001 — Komunitas Senam Bu Tuti', '2026-10-23');

-- 25 Okt — Pengeluaran: Gaji
insert into public.expenses (user_id, category_id, title, amount, expense_date, payment_method, notes)
values (null, (select id from public.categories where name = 'Gaji' and type = 'pengeluaran'),
        'Gaji karyawan bulan Oktober', 1800000, '2026-10-25', 'Transfer', 'Gaji 2 orang staf toko (contoh)');
insert into public.cash_ledger (ref_type, ref_id, type, amount, balance_after, description, transaction_date)
values ('expense',
        (select id from public.expenses where title = 'Gaji karyawan bulan Oktober' and expense_date = '2026-10-25'),
        'out', 1800000, 393000, 'Pengeluaran: Gaji karyawan bulan Oktober (Gaji)', '2026-10-25');

-- ============================================================
-- RINGKASAN FILE INI (sudah dicek ulang penjumlahannya)
--   Saldo awal            : Rp5.000.000 (masuk)
--   Total penjualan (8)   : Rp2.318.000 (masuk)
--   Total pembelian (1)   : Rp2.900.000 (keluar)
--   Total pengeluaran (5) : Rp4.025.000 (keluar)
--   -----------------------------------------------
--   Total kas masuk       : Rp7.318.000
--   Total kas keluar      : Rp6.925.000
--   SALDO AKHIR           : Rp393.000  (= balance_after baris terakhir)
--   HPP penjualan contoh  : Rp1.310.000
--   Laba kotor contoh     : Rp2.318.000 - Rp1.310.000 = Rp1.008.000
-- ============================================================
