-- ============================================================
-- DanKas — Skema Database PostgreSQL (Supabase)
-- Sistem Pencatatan Keuangan Toko Baju DAN'S LABEL Surakarta
-- Jalankan file ini di Supabase SQL Editor (sekali saja).
-- 11 tabel sesuai ERD dokumen perancangan. Nominal uang memakai
-- BIGINT (rupiah bulat, tanpa sen) agar perhitungan selalu pas.
-- ============================================================

-- ---------- 1. users (profil staf, terhubung ke auth.users) ----------
create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  email text not null unique,
  role text not null default 'kasir' check (role in ('pemilik', 'admin', 'kasir')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Profil otomatis dibuat setiap ada user baru mendaftar via Supabase Auth.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.email,
    'kasir'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- 2. categories ----------
create table if not exists public.categories (
  id bigint generated always as identity primary key,
  name text not null,
  type text not null check (type in ('produk', 'pemasukan', 'pengeluaran')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (name, type)
);

-- ---------- 3. suppliers ----------
create table if not exists public.suppliers (
  id bigint generated always as identity primary key,
  name text not null,
  phone text,
  address text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- 4. products ----------
create table if not exists public.products (
  id bigint generated always as identity primary key,
  sku text not null unique,
  name text not null,
  category_id bigint references public.categories (id) on delete set null,
  size text,
  color text,
  cost_price bigint not null default 0 check (cost_price >= 0),
  sale_price bigint not null default 0 check (sale_price >= 0),
  stock integer not null default 0,
  min_stock integer not null default 3,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_products_category on public.products (category_id);
create index if not exists idx_products_stock on public.products (stock);

-- ---------- 5. sales (penjualan / kasir) ----------
create table if not exists public.sales (
  id bigint generated always as identity primary key,
  invoice_no text not null unique,
  user_id uuid references public.users (id) on delete set null,
  customer_name text,
  subtotal bigint not null default 0,
  discount bigint not null default 0,
  tax bigint not null default 0,
  grand_total bigint not null default 0,
  payment_method text not null default 'Tunai'
    check (payment_method in ('Tunai', 'QRIS', 'Transfer', 'E-Wallet', 'Tempo')),
  amount_paid bigint not null default 0,
  change_amount bigint not null default 0,
  status text not null default 'selesai' check (status in ('selesai', 'retur', 'tempo')),
  sale_date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_sales_date on public.sales (sale_date);
create index if not exists idx_sales_user on public.sales (user_id);

-- ---------- 6. sale_items (detail penjualan, harga = snapshot) ----------
create table if not exists public.sale_items (
  id bigint generated always as identity primary key,
  sale_id bigint not null references public.sales (id) on delete cascade,
  product_id bigint references public.products (id) on delete set null,
  qty integer not null check (qty > 0),
  cost_price bigint not null default 0, -- snapshot HPP saat transaksi
  sale_price bigint not null default 0, -- snapshot harga jual saat transaksi
  discount bigint not null default 0,
  subtotal bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_sale_items_sale on public.sale_items (sale_id);
create index if not exists idx_sale_items_product on public.sale_items (product_id);

-- ---------- 7. purchases (pembelian stok dari supplier) ----------
create table if not exists public.purchases (
  id bigint generated always as identity primary key,
  purchase_no text not null unique,
  supplier_id bigint references public.suppliers (id) on delete set null,
  user_id uuid references public.users (id) on delete set null,
  total bigint not null default 0,
  payment_method text not null default 'Tunai'
    check (payment_method in ('Tunai', 'QRIS', 'Transfer', 'E-Wallet', 'Tempo')),
  due_date date,
  status text not null default 'lunas' check (status in ('lunas', 'tempo')),
  purchase_date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_purchases_supplier on public.purchases (supplier_id);
create index if not exists idx_purchases_date on public.purchases (purchase_date);

-- ---------- 8. purchase_items ----------
create table if not exists public.purchase_items (
  id bigint generated always as identity primary key,
  purchase_id bigint not null references public.purchases (id) on delete cascade,
  product_id bigint references public.products (id) on delete set null,
  qty integer not null check (qty > 0),
  cost_price bigint not null default 0,
  subtotal bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_purchase_items_purchase on public.purchase_items (purchase_id);
create index if not exists idx_purchase_items_product on public.purchase_items (product_id);

-- ---------- 9. expenses (pengeluaran operasional) ----------
create table if not exists public.expenses (
  id bigint generated always as identity primary key,
  user_id uuid references public.users (id) on delete set null,
  category_id bigint references public.categories (id) on delete set null,
  title text not null,
  amount bigint not null check (amount >= 0),
  expense_date date not null default current_date,
  payment_method text not null default 'Tunai'
    check (payment_method in ('Tunai', 'QRIS', 'Transfer', 'E-Wallet')),
  notes text,
  attachment text, -- URL bukti/struk (opsional)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_expenses_date on public.expenses (expense_date);
create index if not exists idx_expenses_category on public.expenses (category_id);

-- ---------- 10. cash_ledger (buku kas — satu-satunya sumber saldo) ----------
-- Saldo kas = SUM(amount where type='in') - SUM(amount where type='out').
-- balance_after adalah saldo berjalan setelah baris ini ditulis.
create table if not exists public.cash_ledger (
  id bigint generated always as identity primary key,
  ref_type text not null, -- 'sale' | 'purchase' | 'expense' | 'manual_income' | 'payable_payment' | 'receivable_payment' | 'saldo_awal'
  ref_id bigint,          -- id baris di tabel sumber (polimorfik, tanpa FK keras)
  type text not null check (type in ('in', 'out')),
  amount bigint not null check (amount >= 0),
  balance_after bigint not null default 0,
  description text not null,
  transaction_date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_ledger_date on public.cash_ledger (transaction_date);
create index if not exists idx_ledger_ref on public.cash_ledger (ref_type, ref_id);

-- ---------- 11. payables_receivables (utang & piutang) ----------
create table if not exists public.payables_receivables (
  id bigint generated always as identity primary key,
  type text not null check (type in ('utang', 'piutang')),
  ref_type text, -- 'purchase' | 'sale' | 'manual'
  ref_id bigint,
  party_name text not null, -- nama supplier (utang) atau pelanggan (piutang)
  total bigint not null check (total >= 0),
  paid_amount bigint not null default 0,
  due_date date,
  status text not null default 'belum' check (status in ('belum', 'sebagian', 'lunas')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_payrec_status on public.payables_receivables (status);
create index if not exists idx_payrec_due on public.payables_receivables (due_date);

-- ============================================================
-- ROW LEVEL SECURITY
-- Satu toko: semua staf yang sudah login (authenticated) boleh
-- mengakses semua data operasional. Policy ditulis eksplisit
-- untuk setiap tabel dan setiap operasi.
-- ============================================================

alter table public.users enable row level security;
alter table public.categories enable row level security;
alter table public.suppliers enable row level security;
alter table public.products enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.purchases enable row level security;
alter table public.purchase_items enable row level security;
alter table public.expenses enable row level security;
alter table public.cash_ledger enable row level security;
alter table public.payables_receivables enable row level security;

-- users
create policy "staf login boleh membaca users" on public.users
  for select to authenticated using (true);
create policy "staf login boleh menambah users" on public.users
  for insert to authenticated with check (true);
create policy "staf login boleh mengubah users" on public.users
  for update to authenticated using (true) with check (true);
create policy "staf login boleh menghapus users" on public.users
  for delete to authenticated using (true);

-- categories
create policy "staf login boleh membaca categories" on public.categories
  for select to authenticated using (true);
create policy "staf login boleh menambah categories" on public.categories
  for insert to authenticated with check (true);
create policy "staf login boleh mengubah categories" on public.categories
  for update to authenticated using (true) with check (true);
create policy "staf login boleh menghapus categories" on public.categories
  for delete to authenticated using (true);

-- suppliers
create policy "staf login boleh membaca suppliers" on public.suppliers
  for select to authenticated using (true);
create policy "staf login boleh menambah suppliers" on public.suppliers
  for insert to authenticated with check (true);
create policy "staf login boleh mengubah suppliers" on public.suppliers
  for update to authenticated using (true) with check (true);
create policy "staf login boleh menghapus suppliers" on public.suppliers
  for delete to authenticated using (true);

-- products
create policy "staf login boleh membaca products" on public.products
  for select to authenticated using (true);
create policy "staf login boleh menambah products" on public.products
  for insert to authenticated with check (true);
create policy "staf login boleh mengubah products" on public.products
  for update to authenticated using (true) with check (true);
create policy "staf login boleh menghapus products" on public.products
  for delete to authenticated using (true);

-- sales
create policy "staf login boleh membaca sales" on public.sales
  for select to authenticated using (true);
create policy "staf login boleh menambah sales" on public.sales
  for insert to authenticated with check (true);
create policy "staf login boleh mengubah sales" on public.sales
  for update to authenticated using (true) with check (true);
create policy "staf login boleh menghapus sales" on public.sales
  for delete to authenticated using (true);

-- sale_items
create policy "staf login boleh membaca sale_items" on public.sale_items
  for select to authenticated using (true);
create policy "staf login boleh menambah sale_items" on public.sale_items
  for insert to authenticated with check (true);
create policy "staf login boleh mengubah sale_items" on public.sale_items
  for update to authenticated using (true) with check (true);
create policy "staf login boleh menghapus sale_items" on public.sale_items
  for delete to authenticated using (true);

-- purchases
create policy "staf login boleh membaca purchases" on public.purchases
  for select to authenticated using (true);
create policy "staf login boleh menambah purchases" on public.purchases
  for insert to authenticated with check (true);
create policy "staf login boleh mengubah purchases" on public.purchases
  for update to authenticated using (true) with check (true);
create policy "staf login boleh menghapus purchases" on public.purchases
  for delete to authenticated using (true);

-- purchase_items
create policy "staf login boleh membaca purchase_items" on public.purchase_items
  for select to authenticated using (true);
create policy "staf login boleh menambah purchase_items" on public.purchase_items
  for insert to authenticated with check (true);
create policy "staf login boleh mengubah purchase_items" on public.purchase_items
  for update to authenticated using (true) with check (true);
create policy "staf login boleh menghapus purchase_items" on public.purchase_items
  for delete to authenticated using (true);

-- expenses
create policy "staf login boleh membaca expenses" on public.expenses
  for select to authenticated using (true);
create policy "staf login boleh menambah expenses" on public.expenses
  for insert to authenticated with check (true);
create policy "staf login boleh mengubah expenses" on public.expenses
  for update to authenticated using (true) with check (true);
create policy "staf login boleh menghapus expenses" on public.expenses
  for delete to authenticated using (true);

-- cash_ledger
create policy "staf login boleh membaca cash_ledger" on public.cash_ledger
  for select to authenticated using (true);
create policy "staf login boleh menambah cash_ledger" on public.cash_ledger
  for insert to authenticated with check (true);
create policy "staf login boleh mengubah cash_ledger" on public.cash_ledger
  for update to authenticated using (true) with check (true);
create policy "staf login boleh menghapus cash_ledger" on public.cash_ledger
  for delete to authenticated using (true);

-- payables_receivables
create policy "staf login boleh membaca payables_receivables" on public.payables_receivables
  for select to authenticated using (true);
create policy "staf login boleh menambah payables_receivables" on public.payables_receivables
  for insert to authenticated with check (true);
create policy "staf login boleh mengubah payables_receivables" on public.payables_receivables
  for update to authenticated using (true) with check (true);
create policy "staf login boleh menghapus payables_receivables" on public.payables_receivables
  for delete to authenticated using (true);
