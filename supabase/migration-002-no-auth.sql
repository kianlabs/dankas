-- ============================================================
-- DanKas — Migrasi 002: TANPA LOGIN (akses terbuka)
-- Jalankan file ini SATU KALI di Supabase SQL Editor pada
-- database yang SUDAH terlanjur dibuat dari schema.sql lama
-- (policy lama bernama "staf login boleh ...", khusus role
-- authenticated).
--
-- Isi: menghapus 44 policy lama, lalu membuat 44 policy baru
-- bernama "akses terbuka ..." untuk role anon + authenticated
-- di semua 11 tabel — supaya aplikasi berjalan tanpa login.
-- Aman dijalankan ulang: semua drop memakai IF EXISTS dan
-- policy baru di-drop dulu sebelum dibuat lagi (idempotent).
--
-- Instalasi BARU tidak butuh file ini: schema.sql sudah
-- langsung memakai policy terbuka yang sama.
-- ============================================================


-- ---------- users ----------
drop policy if exists "staf login boleh membaca users" on public.users;
drop policy if exists "akses terbuka membaca users" on public.users;
drop policy if exists "staf login boleh menambah users" on public.users;
drop policy if exists "akses terbuka menambah users" on public.users;
drop policy if exists "staf login boleh mengubah users" on public.users;
drop policy if exists "akses terbuka mengubah users" on public.users;
drop policy if exists "staf login boleh menghapus users" on public.users;
drop policy if exists "akses terbuka menghapus users" on public.users;
create policy "akses terbuka membaca users" on public.users
  for select to anon, authenticated using (true);
create policy "akses terbuka menambah users" on public.users
  for insert to anon, authenticated with check (true);
create policy "akses terbuka mengubah users" on public.users
  for update to anon, authenticated using (true) with check (true);
create policy "akses terbuka menghapus users" on public.users
  for delete to anon, authenticated using (true);

-- ---------- categories ----------
drop policy if exists "staf login boleh membaca categories" on public.categories;
drop policy if exists "akses terbuka membaca categories" on public.categories;
drop policy if exists "staf login boleh menambah categories" on public.categories;
drop policy if exists "akses terbuka menambah categories" on public.categories;
drop policy if exists "staf login boleh mengubah categories" on public.categories;
drop policy if exists "akses terbuka mengubah categories" on public.categories;
drop policy if exists "staf login boleh menghapus categories" on public.categories;
drop policy if exists "akses terbuka menghapus categories" on public.categories;
create policy "akses terbuka membaca categories" on public.categories
  for select to anon, authenticated using (true);
create policy "akses terbuka menambah categories" on public.categories
  for insert to anon, authenticated with check (true);
create policy "akses terbuka mengubah categories" on public.categories
  for update to anon, authenticated using (true) with check (true);
create policy "akses terbuka menghapus categories" on public.categories
  for delete to anon, authenticated using (true);

-- ---------- suppliers ----------
drop policy if exists "staf login boleh membaca suppliers" on public.suppliers;
drop policy if exists "akses terbuka membaca suppliers" on public.suppliers;
drop policy if exists "staf login boleh menambah suppliers" on public.suppliers;
drop policy if exists "akses terbuka menambah suppliers" on public.suppliers;
drop policy if exists "staf login boleh mengubah suppliers" on public.suppliers;
drop policy if exists "akses terbuka mengubah suppliers" on public.suppliers;
drop policy if exists "staf login boleh menghapus suppliers" on public.suppliers;
drop policy if exists "akses terbuka menghapus suppliers" on public.suppliers;
create policy "akses terbuka membaca suppliers" on public.suppliers
  for select to anon, authenticated using (true);
create policy "akses terbuka menambah suppliers" on public.suppliers
  for insert to anon, authenticated with check (true);
create policy "akses terbuka mengubah suppliers" on public.suppliers
  for update to anon, authenticated using (true) with check (true);
create policy "akses terbuka menghapus suppliers" on public.suppliers
  for delete to anon, authenticated using (true);

-- ---------- products ----------
drop policy if exists "staf login boleh membaca products" on public.products;
drop policy if exists "akses terbuka membaca products" on public.products;
drop policy if exists "staf login boleh menambah products" on public.products;
drop policy if exists "akses terbuka menambah products" on public.products;
drop policy if exists "staf login boleh mengubah products" on public.products;
drop policy if exists "akses terbuka mengubah products" on public.products;
drop policy if exists "staf login boleh menghapus products" on public.products;
drop policy if exists "akses terbuka menghapus products" on public.products;
create policy "akses terbuka membaca products" on public.products
  for select to anon, authenticated using (true);
create policy "akses terbuka menambah products" on public.products
  for insert to anon, authenticated with check (true);
create policy "akses terbuka mengubah products" on public.products
  for update to anon, authenticated using (true) with check (true);
create policy "akses terbuka menghapus products" on public.products
  for delete to anon, authenticated using (true);

-- ---------- sales ----------
drop policy if exists "staf login boleh membaca sales" on public.sales;
drop policy if exists "akses terbuka membaca sales" on public.sales;
drop policy if exists "staf login boleh menambah sales" on public.sales;
drop policy if exists "akses terbuka menambah sales" on public.sales;
drop policy if exists "staf login boleh mengubah sales" on public.sales;
drop policy if exists "akses terbuka mengubah sales" on public.sales;
drop policy if exists "staf login boleh menghapus sales" on public.sales;
drop policy if exists "akses terbuka menghapus sales" on public.sales;
create policy "akses terbuka membaca sales" on public.sales
  for select to anon, authenticated using (true);
create policy "akses terbuka menambah sales" on public.sales
  for insert to anon, authenticated with check (true);
create policy "akses terbuka mengubah sales" on public.sales
  for update to anon, authenticated using (true) with check (true);
create policy "akses terbuka menghapus sales" on public.sales
  for delete to anon, authenticated using (true);

-- ---------- sale_items ----------
drop policy if exists "staf login boleh membaca sale_items" on public.sale_items;
drop policy if exists "akses terbuka membaca sale_items" on public.sale_items;
drop policy if exists "staf login boleh menambah sale_items" on public.sale_items;
drop policy if exists "akses terbuka menambah sale_items" on public.sale_items;
drop policy if exists "staf login boleh mengubah sale_items" on public.sale_items;
drop policy if exists "akses terbuka mengubah sale_items" on public.sale_items;
drop policy if exists "staf login boleh menghapus sale_items" on public.sale_items;
drop policy if exists "akses terbuka menghapus sale_items" on public.sale_items;
create policy "akses terbuka membaca sale_items" on public.sale_items
  for select to anon, authenticated using (true);
create policy "akses terbuka menambah sale_items" on public.sale_items
  for insert to anon, authenticated with check (true);
create policy "akses terbuka mengubah sale_items" on public.sale_items
  for update to anon, authenticated using (true) with check (true);
create policy "akses terbuka menghapus sale_items" on public.sale_items
  for delete to anon, authenticated using (true);

-- ---------- purchases ----------
drop policy if exists "staf login boleh membaca purchases" on public.purchases;
drop policy if exists "akses terbuka membaca purchases" on public.purchases;
drop policy if exists "staf login boleh menambah purchases" on public.purchases;
drop policy if exists "akses terbuka menambah purchases" on public.purchases;
drop policy if exists "staf login boleh mengubah purchases" on public.purchases;
drop policy if exists "akses terbuka mengubah purchases" on public.purchases;
drop policy if exists "staf login boleh menghapus purchases" on public.purchases;
drop policy if exists "akses terbuka menghapus purchases" on public.purchases;
create policy "akses terbuka membaca purchases" on public.purchases
  for select to anon, authenticated using (true);
create policy "akses terbuka menambah purchases" on public.purchases
  for insert to anon, authenticated with check (true);
create policy "akses terbuka mengubah purchases" on public.purchases
  for update to anon, authenticated using (true) with check (true);
create policy "akses terbuka menghapus purchases" on public.purchases
  for delete to anon, authenticated using (true);

-- ---------- purchase_items ----------
drop policy if exists "staf login boleh membaca purchase_items" on public.purchase_items;
drop policy if exists "akses terbuka membaca purchase_items" on public.purchase_items;
drop policy if exists "staf login boleh menambah purchase_items" on public.purchase_items;
drop policy if exists "akses terbuka menambah purchase_items" on public.purchase_items;
drop policy if exists "staf login boleh mengubah purchase_items" on public.purchase_items;
drop policy if exists "akses terbuka mengubah purchase_items" on public.purchase_items;
drop policy if exists "staf login boleh menghapus purchase_items" on public.purchase_items;
drop policy if exists "akses terbuka menghapus purchase_items" on public.purchase_items;
create policy "akses terbuka membaca purchase_items" on public.purchase_items
  for select to anon, authenticated using (true);
create policy "akses terbuka menambah purchase_items" on public.purchase_items
  for insert to anon, authenticated with check (true);
create policy "akses terbuka mengubah purchase_items" on public.purchase_items
  for update to anon, authenticated using (true) with check (true);
create policy "akses terbuka menghapus purchase_items" on public.purchase_items
  for delete to anon, authenticated using (true);

-- ---------- expenses ----------
drop policy if exists "staf login boleh membaca expenses" on public.expenses;
drop policy if exists "akses terbuka membaca expenses" on public.expenses;
drop policy if exists "staf login boleh menambah expenses" on public.expenses;
drop policy if exists "akses terbuka menambah expenses" on public.expenses;
drop policy if exists "staf login boleh mengubah expenses" on public.expenses;
drop policy if exists "akses terbuka mengubah expenses" on public.expenses;
drop policy if exists "staf login boleh menghapus expenses" on public.expenses;
drop policy if exists "akses terbuka menghapus expenses" on public.expenses;
create policy "akses terbuka membaca expenses" on public.expenses
  for select to anon, authenticated using (true);
create policy "akses terbuka menambah expenses" on public.expenses
  for insert to anon, authenticated with check (true);
create policy "akses terbuka mengubah expenses" on public.expenses
  for update to anon, authenticated using (true) with check (true);
create policy "akses terbuka menghapus expenses" on public.expenses
  for delete to anon, authenticated using (true);

-- ---------- cash_ledger ----------
drop policy if exists "staf login boleh membaca cash_ledger" on public.cash_ledger;
drop policy if exists "akses terbuka membaca cash_ledger" on public.cash_ledger;
drop policy if exists "staf login boleh menambah cash_ledger" on public.cash_ledger;
drop policy if exists "akses terbuka menambah cash_ledger" on public.cash_ledger;
drop policy if exists "staf login boleh mengubah cash_ledger" on public.cash_ledger;
drop policy if exists "akses terbuka mengubah cash_ledger" on public.cash_ledger;
drop policy if exists "staf login boleh menghapus cash_ledger" on public.cash_ledger;
drop policy if exists "akses terbuka menghapus cash_ledger" on public.cash_ledger;
create policy "akses terbuka membaca cash_ledger" on public.cash_ledger
  for select to anon, authenticated using (true);
create policy "akses terbuka menambah cash_ledger" on public.cash_ledger
  for insert to anon, authenticated with check (true);
create policy "akses terbuka mengubah cash_ledger" on public.cash_ledger
  for update to anon, authenticated using (true) with check (true);
create policy "akses terbuka menghapus cash_ledger" on public.cash_ledger
  for delete to anon, authenticated using (true);

-- ---------- payables_receivables ----------
drop policy if exists "staf login boleh membaca payables_receivables" on public.payables_receivables;
drop policy if exists "akses terbuka membaca payables_receivables" on public.payables_receivables;
drop policy if exists "staf login boleh menambah payables_receivables" on public.payables_receivables;
drop policy if exists "akses terbuka menambah payables_receivables" on public.payables_receivables;
drop policy if exists "staf login boleh mengubah payables_receivables" on public.payables_receivables;
drop policy if exists "akses terbuka mengubah payables_receivables" on public.payables_receivables;
drop policy if exists "staf login boleh menghapus payables_receivables" on public.payables_receivables;
drop policy if exists "akses terbuka menghapus payables_receivables" on public.payables_receivables;
create policy "akses terbuka membaca payables_receivables" on public.payables_receivables
  for select to anon, authenticated using (true);
create policy "akses terbuka menambah payables_receivables" on public.payables_receivables
  for insert to anon, authenticated with check (true);
create policy "akses terbuka mengubah payables_receivables" on public.payables_receivables
  for update to anon, authenticated using (true) with check (true);
create policy "akses terbuka menghapus payables_receivables" on public.payables_receivables
  for delete to anon, authenticated using (true);
