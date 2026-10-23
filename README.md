# DanKas — Sistem Pencatatan Keuangan DAN'S LABEL

Aplikasi web **mobile-first PWA** untuk mencatat keuangan toko baju **DAN'S LABEL Surakarta**: kasir penjualan, buku kas, stok produk, utang-piutang (skema), dan laporan laba rugi & arus kas — semua dalam Bahasa Indonesia dengan format Rupiah.

Dibangun mengikuti dokumen *Perancangan Aplikasi Sistem Pencatatan Keuangan pada Toko Baju DAN'S LABEL Surakarta* (ERD 11 tabel, logika HPP & laba bersih dari buku kas `cash_ledger`).

## Teknologi

| Bagian | Teknologi |
| --- | --- |
| Framework | Next.js (App Router) + React + TypeScript |
| Tampilan | Tailwind CSS, mobile-first (bottom tab bar di HP, sidebar di desktop) |
| Database & Login | Supabase (PostgreSQL + Auth), Row Level Security aktif |
| Akses data | `@supabase/supabase-js` + `@supabase/ssr` |
| Deploy | Vercel |

## Fitur

- **Login / Daftar** — Supabase Auth, route aplikasi terproteksi, peran staf (Pemilik / Admin / Kasir) di tabel `users`
- **Beranda** — saldo kas dari buku kas, pemasukan & pengeluaran hari ini dan bulan ini, laba bersih bulan ini, transaksi terakhir, peringatan stok menipis, panduan 3 langkah saat data masih kosong
- **Kasir** — pilih produk, keranjang, diskon, metode bayar (Tunai / QRIS / Transfer / E-Wallet), kembalian otomatis, nomor invoice `INV-YYYYMMDD-XXX`; stok berkurang otomatis, HPP tercatat dari snapshot harga modal, jurnal kas tertulis otomatis
- **Transaksi** — catat pengeluaran operasional berkategori dan pemasukan lain; keduanya langsung masuk buku kas
- **Produk** — tambah / ubah / hapus produk, harga modal & jual, stok, batas stok menipis
- **Buku Kas** — jurnal `cash_ledger` dengan saldo berjalan, filter periode (hari ini, bulan ini, bulan lalu, tanggal bebas)
- **Laporan** — laba rugi (Penjualan − HPP − Pengeluaran + Pemasukan Lain) dan arus kas per bulan, pengeluaran dirinci per kategori
- **PWA** — bisa dipasang ke layar utama HP (manifest + ikon + service worker sederhana)

## Struktur Folder

```
dankas/
├── public/
│   ├── manifest.webmanifest   # konfigurasi PWA
│   ├── icons/                 # ikon aplikasi (placeholder, silakan ganti logo asli)
│   └── sw.js                  # service worker sederhana
├── supabase/
│   ├── schema.sql             # 11 tabel + RLS + trigger profil otomatis
│   └── seed.sql               # HANYA kategori bawaan (tanpa data contoh)
└── src/
    ├── proxy.ts               # proteksi route & perbarui sesi (konvensi Next.js 16)
    ├── lib/
    │   ├── supabase/          # client browser, server, dan middleware
    │   ├── ledger.ts          # hitung saldo & tulis jurnal buku kas
    │   ├── format.ts          # format Rupiah & tanggal (id-ID)
    │   └── types.ts           # tipe data tabel
    ├── components/            # AppShell (navigasi), ServiceWorkerRegister
    └── app/
        ├── login/ & register/ # halaman masuk & daftar
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
2. Buka file `supabase/schema.sql` dari proyek ini, salin **seluruh isinya**, tempel ke SQL Editor, lalu klik **Run**. Tunggu sampai muncul pesan sukses (11 tabel + policy RLS + trigger dibuat).
3. Buat query baru lagi, salin isi `supabase/seed.sql`, lalu **Run**. Ini hanya mengisi kategori bawaan (Penjualan Offline, Penjualan Online, Pembelian Stok, Operasional, Gaji, Sewa, Listrik & Air, Marketing, Lainnya) — tidak ada data contoh sama sekali.
4. Cek di menu **Table Editor**: harus terlihat tabel `users`, `categories`, `products`, `suppliers`, `sales`, `sale_items`, `purchases`, `purchase_items`, `expenses`, `cash_ledger`, `payables_receivables`.

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

Buka `http://localhost:3000` di browser. Anda akan diarahkan ke halaman masuk — klik **Daftar di sini**, buat akun pertama (akun ini menjadi staf pertama; perannya dapat diubah menjadi Pemilik lewat Supabase → Table Editor → tabel `users` → kolom `role`).

> Catatan email verifikasi: bila pendaftaran meminta verifikasi email, klik tautan di email Anda. Untuk pemakaian internal, verifikasi bisa dimatikan lewat Supabase → **Authentication** → **Providers** → **Email** → matikan *Confirm email*.

### 5. Deploy ke Vercel

1. Push dulu proyek ini ke GitHub (lihat langkah 6), atau jalankan `npx vercel` dari folder proyek.
2. Buka [vercel.com](https://vercel.com) → **Add New… → Project** → pilih repo `dankas` → **Import**.
3. Di bagian **Environment Variables**, tambahkan dua variabel dari langkah 3:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Klik **Deploy**. Tunggu sampai selesai — aplikasi langsung live dengan alamat seperti `https://dankas-xxxx.vercel.app`.
5. Setiap `git push` berikutnya akan otomatis men-deploy ulang.

Agar tautan verifikasi email & redirect login selalu benar, di Supabase buka **Authentication → URL Configuration** dan isi *Site URL* dengan alamat Vercel Anda.

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
