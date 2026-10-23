-- ============================================================
-- DanKas — Migrasi 003: LOGIN DIPAKAI LAGI (policy khusus user login)
-- Jalankan file ini SATU KALI di Supabase SQL Editor pada
-- database live yang sekarang memakai policy TERBUKA
-- (migration-002: "akses terbuka ...", role anon + authenticated).
--
-- Isi: menghapus 44 policy terbuka, lalu membuat 44 policy
-- "staf login boleh ..." khusus role authenticated di semua
-- 11 tabel — setelah migrasi ini, data hanya bisa diakses oleh
-- staf yang sudah login lewat Supabase Auth.
-- Aman dijalankan ulang: semua drop memakai IF EXISTS dan
-- policy baru di-drop dulu sebelum dibuat lagi (idempotent,
-- kedua generasi nama policy dibersihkan).
--
-- Instalasi BARU tidak butuh file ini: schema.sql sudah
-- langsung memakai policy khusus user login yang sama.
-- ============================================================


-- ---------- users ----------
drop policy if exists "akses terbuka membaca users" on public.users;
drop policy if exists "staf login boleh membaca users" on public.users;
create policy "staf login boleh membaca users" on public.users
  for select to authenticated using (true);
drop policy if exists "akses terbuka menambah users" on public.users;
drop policy if exists "staf login boleh menambah users" on public.users;
create policy "staf login boleh menambah users" on public.users
  for insert to authenticated with check (true);
drop policy if exists "akses terbuka mengubah users" on public.users;
drop policy if exists "staf login boleh mengubah users" on public.users;
create policy "staf login boleh mengubah users" on public.users
  for update to authenticated using (true) with check (true);
drop policy if exists "akses terbuka menghapus users" on public.users;
drop policy if exists "staf login boleh menghapus users" on public.users;
create policy "staf login boleh menghapus users" on public.users
  for delete to authenticated using (true);

-- ---------- categories ----------
drop policy if exists "akses terbuka membaca categories" on public.categories;
drop policy if exists "staf login boleh membaca categories" on public.categories;
create policy "staf login boleh membaca categories" on public.categories
  for select to authenticated using (true);
drop policy if exists "akses terbuka menambah categories" on public.categories;
drop policy if exists "staf login boleh menambah categories" on public.categories;
create policy "staf login boleh menambah categories" on public.categories
  for insert to authenticated with check (true);
drop policy if exists "akses terbuka mengubah categories" on public.categories;
drop policy if exists "staf login boleh mengubah categories" on public.categories;
create policy "staf login boleh mengubah categories" on public.categories
  for update to authenticated using (true) with check (true);
drop policy if exists "akses terbuka menghapus categories" on public.categories;
drop policy if exists "staf login boleh menghapus categories" on public.categories;
create policy "staf login boleh menghapus categories" on public.categories
  for delete to authenticated using (true);

-- ---------- suppliers ----------
drop policy if exists "akses terbuka membaca suppliers" on public.suppliers;
drop policy if exists "staf login boleh membaca suppliers" on public.suppliers;
create policy "staf login boleh membaca suppliers" on public.suppliers
  for select to authenticated using (true);
drop policy if exists "akses terbuka menambah suppliers" on public.suppliers;
drop policy if exists "staf login boleh menambah suppliers" on public.suppliers;
create policy "staf login boleh menambah suppliers" on public.suppliers
  for insert to authenticated with check (true);
drop policy if exists "akses terbuka mengubah suppliers" on public.suppliers;
drop policy if exists "staf login boleh mengubah suppliers" on public.suppliers;
create policy "staf login boleh mengubah suppliers" on public.suppliers
  for update to authenticated using (true) with check (true);
drop policy if exists "akses terbuka menghapus suppliers" on public.suppliers;
drop policy if exists "staf login boleh menghapus suppliers" on public.suppliers;
create policy "staf login boleh menghapus suppliers" on public.suppliers
  for delete to authenticated using (true);

-- ---------- products ----------
drop policy if exists "akses terbuka membaca products" on public.products;
drop policy if exists "staf login boleh membaca products" on public.products;
create policy "staf login boleh membaca products" on public.products
  for select to authenticated using (true);
drop policy if exists "akses terbuka menambah products" on public.products;
drop policy if exists "staf login boleh menambah products" on public.products;
create policy "staf login boleh menambah products" on public.products
  for insert to authenticated with check (true);
drop policy if exists "akses terbuka mengubah products" on public.products;
drop policy if exists "staf login boleh mengubah products" on public.products;
create policy "staf login boleh mengubah products" on public.products
  for update to authenticated using (true) with check (true);
drop policy if exists "akses terbuka menghapus products" on public.products;
drop policy if exists "staf login boleh menghapus products" on public.products;
create policy "staf login boleh menghapus products" on public.products
  for delete to authenticated using (true);

-- ---------- sales ----------
drop policy if exists "akses terbuka membaca sales" on public.sales;
drop policy if exists "staf login boleh membaca sales" on public.sales;
create policy "staf login boleh membaca sales" on public.sales
  for select to authenticated using (true);
drop policy if exists "akses terbuka menambah sales" on public.sales;
drop policy if exists "staf login boleh menambah sales" on public.sales;
create policy "staf login boleh menambah sales" on public.sales
  for insert to authenticated with check (true);
drop policy if exists "akses terbuka mengubah sales" on public.sales;
drop policy if exists "staf login boleh mengubah sales" on public.sales;
create policy "staf login boleh mengubah sales" on public.sales
  for update to authenticated using (true) with check (true);
drop policy if exists "akses terbuka menghapus sales" on public.sales;
drop policy if exists "staf login boleh menghapus sales" on public.sales;
create policy "staf login boleh menghapus sales" on public.sales
  for delete to authenticated using (true);

-- ---------- sale_items ----------
drop policy if exists "akses terbuka membaca sale_items" on public.sale_items;
drop policy if exists "staf login boleh membaca sale_items" on public.sale_items;
create policy "staf login boleh membaca sale_items" on public.sale_items
  for select to authenticated using (true);
drop policy if exists "akses terbuka menambah sale_items" on public.sale_items;
drop policy if exists "staf login boleh menambah sale_items" on public.sale_items;
create policy "staf login boleh menambah sale_items" on public.sale_items
  for insert to authenticated with check (true);
drop policy if exists "akses terbuka mengubah sale_items" on public.sale_items;
drop policy if exists "staf login boleh mengubah sale_items" on public.sale_items;
create policy "staf login boleh mengubah sale_items" on public.sale_items
  for update to authenticated using (true) with check (true);
drop policy if exists "akses terbuka menghapus sale_items" on public.sale_items;
drop policy if exists "staf login boleh menghapus sale_items" on public.sale_items;
create policy "staf login boleh menghapus sale_items" on public.sale_items
  for delete to authenticated using (true);

-- ---------- purchases ----------
drop policy if exists "akses terbuka membaca purchases" on public.purchases;
drop policy if exists "staf login boleh membaca purchases" on public.purchases;
create policy "staf login boleh membaca purchases" on public.purchases
  for select to authenticated using (true);
drop policy if exists "akses terbuka menambah purchases" on public.purchases;
drop policy if exists "staf login boleh menambah purchases" on public.purchases;
create policy "staf login boleh menambah purchases" on public.purchases
  for insert to authenticated with check (true);
drop policy if exists "akses terbuka mengubah purchases" on public.purchases;
drop policy if exists "staf login boleh mengubah purchases" on public.purchases;
create policy "staf login boleh mengubah purchases" on public.purchases
  for update to authenticated using (true) with check (true);
drop policy if exists "akses terbuka menghapus purchases" on public.purchases;
drop policy if exists "staf login boleh menghapus purchases" on public.purchases;
create policy "staf login boleh menghapus purchases" on public.purchases
  for delete to authenticated using (true);

-- ---------- purchase_items ----------
drop policy if exists "akses terbuka membaca purchase_items" on public.purchase_items;
drop policy if exists "staf login boleh membaca purchase_items" on public.purchase_items;
create policy "staf login boleh membaca purchase_items" on public.purchase_items
  for select to authenticated using (true);
drop policy if exists "akses terbuka menambah purchase_items" on public.purchase_items;
drop policy if exists "staf login boleh menambah purchase_items" on public.purchase_items;
create policy "staf login boleh menambah purchase_items" on public.purchase_items
  for insert to authenticated with check (true);
drop policy if exists "akses terbuka mengubah purchase_items" on public.purchase_items;
drop policy if exists "staf login boleh mengubah purchase_items" on public.purchase_items;
create policy "staf login boleh mengubah purchase_items" on public.purchase_items
  for update to authenticated using (true) with check (true);
drop policy if exists "akses terbuka menghapus purchase_items" on public.purchase_items;
drop policy if exists "staf login boleh menghapus purchase_items" on public.purchase_items;
create policy "staf login boleh menghapus purchase_items" on public.purchase_items
  for delete to authenticated using (true);

-- ---------- expenses ----------
drop policy if exists "akses terbuka membaca expenses" on public.expenses;
drop policy if exists "staf login boleh membaca expenses" on public.expenses;
create policy "staf login boleh membaca expenses" on public.expenses
  for select to authenticated using (true);
drop policy if exists "akses terbuka menambah expenses" on public.expenses;
drop policy if exists "staf login boleh menambah expenses" on public.expenses;
create policy "staf login boleh menambah expenses" on public.expenses
  for insert to authenticated with check (true);
drop policy if exists "akses terbuka mengubah expenses" on public.expenses;
drop policy if exists "staf login boleh mengubah expenses" on public.expenses;
create policy "staf login boleh mengubah expenses" on public.expenses
  for update to authenticated using (true) with check (true);
drop policy if exists "akses terbuka menghapus expenses" on public.expenses;
drop policy if exists "staf login boleh menghapus expenses" on public.expenses;
create policy "staf login boleh menghapus expenses" on public.expenses
  for delete to authenticated using (true);

-- ---------- cash_ledger ----------
drop policy if exists "akses terbuka membaca cash_ledger" on public.cash_ledger;
drop policy if exists "staf login boleh membaca cash_ledger" on public.cash_ledger;
create policy "staf login boleh membaca cash_ledger" on public.cash_ledger
  for select to authenticated using (true);
drop policy if exists "akses terbuka menambah cash_ledger" on public.cash_ledger;
drop policy if exists "staf login boleh menambah cash_ledger" on public.cash_ledger;
create policy "staf login boleh menambah cash_ledger" on public.cash_ledger
  for insert to authenticated with check (true);
drop policy if exists "akses terbuka mengubah cash_ledger" on public.cash_ledger;
drop policy if exists "staf login boleh mengubah cash_ledger" on public.cash_ledger;
create policy "staf login boleh mengubah cash_ledger" on public.cash_ledger
  for update to authenticated using (true) with check (true);
drop policy if exists "akses terbuka menghapus cash_ledger" on public.cash_ledger;
drop policy if exists "staf login boleh menghapus cash_ledger" on public.cash_ledger;
create policy "staf login boleh menghapus cash_ledger" on public.cash_ledger
  for delete to authenticated using (true);

-- ---------- payables_receivables ----------
drop policy if exists "akses terbuka membaca payables_receivables" on public.payables_receivables;
drop policy if exists "staf login boleh membaca payables_receivables" on public.payables_receivables;
create policy "staf login boleh membaca payables_receivables" on public.payables_receivables
  for select to authenticated using (true);
drop policy if exists "akses terbuka menambah payables_receivables" on public.payables_receivables;
drop policy if exists "staf login boleh menambah payables_receivables" on public.payables_receivables;
create policy "staf login boleh menambah payables_receivables" on public.payables_receivables
  for insert to authenticated with check (true);
drop policy if exists "akses terbuka mengubah payables_receivables" on public.payables_receivables;
drop policy if exists "staf login boleh mengubah payables_receivables" on public.payables_receivables;
create policy "staf login boleh mengubah payables_receivables" on public.payables_receivables
  for update to authenticated using (true) with check (true);
drop policy if exists "akses terbuka menghapus payables_receivables" on public.payables_receivables;
drop policy if exists "staf login boleh menghapus payables_receivables" on public.payables_receivables;
create policy "staf login boleh menghapus payables_receivables" on public.payables_receivables
  for delete to authenticated using (true);
