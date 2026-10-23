# DanKas — Sistem Pencatatan Keuangan DAN'S LABEL

Aplikasi web **mobile-first PWA** untuk mencatat keuangan toko baju **DAN'S LABEL Surakarta**: kasir penjualan, buku kas, stok produk, utang-piutang (skema), dan laporan laba rugi & arus kas — semua dalam Bahasa Indonesia dengan format Rupiah.

Dibangun mengikuti dokumen *Perancangan Aplikasi Sistem Pencatatan Keuangan pada Toko Baju DAN'S LABEL Surakarta* (ERD 11 tabel, logika HPP & laba bersih dari buku kas `cash_ledger`).

## Teknologi

| Bagian | Teknologi |
| --- | --- |
| Framework | Next.js (App Router) + React + TypeScript |
| Tampilan | Tailwind CSS, mobile-first (bottom tab bar di HP, sidebar di desktop) |
| Database | Supabase (PostgreSQL), Row Level Security aktif — policy khusus user login (role `authenticated`) |
| Autentikasi | Supabase Auth (email & kata sandi), sesi dijaga `@supabase/ssr` + proxy Next.js |
| Akses data | `@supabase/supabase-js` + `@supabase/ssr` (anon key + sesi login staf) |
| Deploy | Vercel |

## Fitur

- **Login staf** — halaman Masuk & Daftar memakai Supabase Auth (email + kata sandi). Hanya staf yang sudah login yang bisa membuka aplikasi; halaman lain otomatis dialihkan ke halaman masuk, dan data dilindungi RLS khusus user login
- **Beranda** — kartu saldo kas dari buku kas, pemasukan & pengeluaran hari ini, statistik bulan ini (penjualan, pemasukan, pengeluaran, laba bersih), grafik arus kas 7 hari, transaksi terakhir, peringatan stok menipis, panduan 3 langkah saat data masih kosong
- **Kasir** — pilih produk, keranjang, diskon, metode bayar (Tunai / QRIS / Transfer / E-Wallet), kembalian otomatis, nomor invoice `INV-YYYYMMDD-XXX`; stok berkurang otomatis, HPP tercatat dari snapshot harga modal, jurnal kas tertulis otomatis
- **Transaksi** — catat pengeluaran operasional berkategori dan pemasukan lain; keduanya langsung masuk buku kas
- **Produk** — tambah / ubah / hapus produk, harga modal & jual, stok, batas stok menipis
- **Buku Kas** — jurnal `cash_ledger` dengan saldo berjalan, filter periode (hari ini, bulan ini, bulan lalu, tanggal bebas)
- **Laporan** — laba rugi (Penjualan − HPP − Pengeluaran + Pemasukan Lain) dan arus kas per bulan, pengeluaran dirinci per kategori
- **PWA** — bisa dipasang ke layar utama HP (manifest + ikon + service worker sederhana)

> 🔒 **Catatan keamanan:** aplikasi ini memakai login Supabase Auth. Data keuangan hanya bisa dibaca/diubah oleh akun staf yang sudah login — Row Level Security di database menolak semua akses tanpa sesi (`authenticated`). Anon key yang terbawa di aplikasi web hanya berfungsi untuk proses login itu sendiri. Tetap jaga kerahasiaan kata sandi staf, dan nonaktifkan akun staf yang sudah tidak bekerja di toko lewat dashboard Supabase (**Authentication → Users**).

## Struktur Folder

```
dankas/
├── public/
│   ├── manifest.webmanifest   # konfigurasi PWA
│   ├── icons/                 # ikon aplikasi (placeholder, silakan ganti logo asli)
│   └── sw.js                  # service worker sederhana
├── supabase/
│   ├── schema.sql             # 11 tabel + RLS policy khusus user login (authenticated)
│   ├── seed.sql               # HANYA kategori bawaan (tanpa data contoh)
│   ├── seed-contoh.sql        # OPSIONAL: data demo Oktober 2026 (lihat "Data Contoh")
│   ├── migration-002-no-auth.sql    # riwayat: policy login → terbuka (sudah tidak dipakai)
│   └── migration-003-restore-auth.sql # untuk instalasi live yang terlanjur terbuka: kembalikan policy khusus login (jalankan sekali)
└── src/
    ├── proxy.ts               # penjaga route (Next.js proxy): belum login → /login
    ├── lib/
    │   ├── supabase/          # client browser, server & middleware sesi (@supabase/ssr)
    │   ├── auth-redirect.ts   # arahkan user setelah login sesuai peran (kasir → Kasir)
    │   ├── ledger.ts          # hitung saldo & tulis jurnal buku kas
    │   ├── format.ts          # format Rupiah & tanggal (id-ID)
    │   └── types.ts           # tipe data tabel
    ├── components/            # AppShell (navigasi + info user), AuthShell (kerangka login), ServiceWorkerRegister
    └── app/
        ├── page.tsx           # akar web → alihkan ke /dashboard (proxy menjaga sesi)
        ├── login/             # halaman masuk (Supabase Auth)
        ├── register/          # halaman daftar akun staf
        └── (app)/             # dashboard, kasir, transaksi, produk, buku-kas, laporan
```

---

## Cara Menjalankan (Lengkap, dari Nol)

### 1. Buat Project Supabase (gratis)

1. Buka [supabase.com](https://supabase.com) → **Start your project** → masuk dengan akun GitHub/Google.
2. Klik **New project**, isi:
   - *Name*: `dankas` (bebas)
   - *Database Password*: buat kata sandi yang kuat dan **simpan baik-baik** (hanya dipakai untuk akses database tingkat lanjut; aplikasi tidak memakainya)
   - *Region*: pilih **Southeast Asia (Singapore)** agar dekat dengan Indonesia
3. Tunggu 1–2 menit sampai project selesai dibuat.

### 2. Jalankan Skema Database

1. Di dashboard Supabase, buka menu **SQL Editor** → **New query**.
2. Buka file `supabase/schema.sql` dari proyek ini, salin **seluruh isinya**, tempel ke SQL Editor, lalu klik **Run**. Tunggu sampai muncul pesan sukses (11 tabel + policy RLS dibuat). Skema ini **sudah termasuk policy khusus user login** ("staf login boleh ...", role `authenticated`), jadi instalasi baru langsung aman — tidak ada langkah tambahan.
3. Buat query baru lagi, salin isi `supabase/seed.sql`, lalu **Run**. Ini hanya mengisi kategori bawaan (Penjualan Offline, Penjualan Online, Pembelian Stok, Operasional, Gaji, Sewa, Listrik & Air, Marketing, Lainnya) — tidak ada data contoh sama sekali.
4. Cek di menu **Table Editor**: harus terlihat tabel `users`, `categories`, `products`, `suppliers`, `sales`, `sale_items`, `purchases`, `purchase_items`, `expenses`, `cash_ledger`, `payables_receivables`.
5. *(Opsional, untuk demo)* Jalankan `supabase/seed-contoh.sql` untuk mengisi data contoh — lihat bagian **Data Contoh** di bawah.

> **Database live Anda masih memakai policy terbuka (pernah menjalankan `migration-002-no-auth.sql`)?** Jangan jalankan `schema.sql` ulang. Cukup jalankan file `supabase/migration-003-restore-auth.sql` **satu kali** di SQL Editor — file itu menghapus 44 policy terbuka ("akses terbuka ...") dan membuat kembali 44 policy khusus user login ("staf login boleh ...") di semua tabel. Setelah itu data hanya bisa diakses staf yang sudah login. File ini aman dijalankan ulang (idempotent).

### 3. Ambil URL & Anon Key

1. Di dashboard Supabase buka **Project Settings** (ikon gerigi) → **API**.
2. Catat dua nilai ini:
   - **Project URL** — contoh: `https://xxxxxxxx.supabase.co`
   - **anon public** key — kunci panjang di bagian *Project API keys*

### 4. Jalankan di Komputer Sendiri (Lokal)

Syarat: Node.js versi 20 atau lebih baru sudah terpasang.

```bash
# 1. masuk ke folder proyek
cd dankas

# 2. pasang dependensi
npm install

# 3. buat file env dari contoh, lalu isi dengan URL & anon key langkah 3
cp .env.example .env.local
# edit .env.local: ganti NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY

# 4. jalankan server pengembangan
npm run dev
```

Buka `http://localhost:3000` di browser. Anda akan diarahkan ke **halaman Masuk**. Belum punya akun? Klik **Daftar di sini**, isi nama, email, dan kata sandi (akun pertama sebaiknya milik pemilik toko). Setelah masuk, Anda tiba di Beranda (peran kasir langsung diarahkan ke layar Kasir). Tambahkan produk pertama lewat menu **Produk**, lalu mulai mencatat lewat **Kasir** / **Transaksi**.

### 5. Deploy ke Vercel

1. Push dulu proyek ini ke GitHub (lihat langkah 6), atau jalankan `npx vercel` dari folder proyek.
2. Buka [vercel.com](https://vercel.com) → **Add New… → Project** → pilih repo `dankas` → **Import**.
3. Di bagian **Environment Variables**, tambahkan dua variabel dari langkah 3:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Klik **Deploy**. Tunggu sampai selesai — aplikasi langsung live dengan alamat seperti `https://dankas-xxxx.vercel.app`.
5. Setiap `git push` berikutnya akan otomatis men-deploy ulang.
6. **Penting (login):** di dashboard Supabase buka **Authentication → URL Configuration**, lalu isi:
   - *Site URL*: alamat Vercel aplikasi Anda (cth. `https://danskas.vercel.app`)
   - *Redirect URLs*: tambahkan `https://ALAMAT-ANDA.vercel.app/**`
   
   Tanpa ini, tautan konfirmasi email pendaftaran bisa mengarah ke alamat yang salah.

### 6. Push ke GitHub

```bash
cd dankas
git init
git add .
git commit -m "DanKas versi awal: kasir, buku kas, produk, laporan (Next.js + Supabase)"
git branch -M main
# buat repo kosong bernama dankas di github.com terlebih dahulu, lalu:
git remote add origin https://github.com/USERNAME/dankas.git
git push -u origin main
```

File `.env.local` **tidak** ikut ter-push (sudah dikecualikan oleh `.gitignore`) — kredensial Supabase Anda tetap aman.

## Data Contoh (Opsional, untuk Demo)

File `supabase/seed-contoh.sql` berisi data rekaaan bulan Oktober 2026 yang konsisten secara angka — berguna agar dashboard, grafik arus kas, buku kas, dan laporan langsung terlihat hidup saat pertama dicoba:

- 7 kategori produk mengikuti barang asli toko (Daster, Oneset, Atasan, Celana, Piyama, Jilbab, Cardigan) & 2 supplier contoh
- 12 produk pakaian (SKU `DL-DS-001` dst.) dengan stok akhir yang sudah memperhitungkan transaksi contoh
- Saldo awal kas Rp5.000.000 (1 Okt), 8 penjualan (5–23 Okt, Tunai/QRIS/Transfer/E-Wallet), 1 pembelian stok, 5 pengeluaran (Sewa, Listrik & Air, Marketing, Operasional, Gaji) — semuanya lengkap dengan jurnal `cash_ledger` dan saldo berjalan yang benar. **Saldo akhir data contoh: Rp425.000.**

**Memuat:** jalankan file itu **satu kali** di Supabase SQL Editor, *setelah* `schema.sql` dan `seed.sql`. Menjalankannya dua kali akan gagal di batas unik (SKU/nomor invoice) — itu disengaja.

**Menghapus data contoh** (sebelum aplikasi dipakai sungguhan), jalankan di SQL Editor:

```sql
truncate table
  public.sale_items, public.sales, public.purchase_items, public.purchases,
  public.expenses, public.cash_ledger, public.products
restart identity cascade;
```

Perintah ini mengosongkan seluruh transaksi & produk tetapi **mempertahankan kategori** (bawaan + kategori produk contoh; hapus manual lewat Table Editor bila tidak diperlukan) dan akun staf Anda.

## Logika Keuangan (sesuai dokumen perancangan)

- **Saldo kas** hanya dihitung dari `cash_ledger`: total `in` − total `out`. Setiap penjualan, pengeluaran, dan pemasukan lain menulis satu baris jurnal dengan `balance_after` (saldo berjalan).
- **HPP** = Σ (qty × `cost_price` snapshot) dari `sale_items` pada periode laporan.
- **Laba kotor** = Total Penjualan − HPP.
- **Laba bersih** = Laba Kotor − Total Pengeluaran + Pemasukan Lain.
- **Arus kas bersih** = Total kas masuk − Total kas keluar pada periode yang sama. Laba dan arus kas memang bisa berbeda (contoh: penjualan tempo menambah laba tetapi belum menambah kas) — aplikasi menampilkan keduanya secara terpisah.

## Pengembangan Lanjutan (belum termasuk versi ini)

- Modul pembelian stok & utang ke supplier (tabel `purchases`, `purchase_items`, `payables_receivables` sudah disiapkan di skema)
- Cetak / kirim struk (PDF / WhatsApp), ekspor laporan ke Excel
- Tutup shift & rekonsiliasi kas kasir, multi-cabang
