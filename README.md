# Entrust Prayers — Sampaikan Doaku

Platform untuk mempertemukan orang yang ingin menitipkan doa dengan jamaah Haji & Umroh.

Dibangun dengan **Vue 3 + Vite + TypeScript + TailwindCSS + Pinia + Vue Router + Supabase**.

---

## Daftar Isi

1. [Persiapan](#1-persiapan)
2. [Setup Database Supabase](#2-setup-database-supabase)
3. [Menjalankan secara Lokal](#3-menjalankan-secara-lokal)
4. [Struktur Folder](#4-struktur-folder)
5. [Fitur](#5-fitur)
6. [Deployment](#6-deployment)
7. [Troubleshooting](#7-troubleshooting)

---

## 1. Persiapan

### Prasyarat

- **Node.js** v20+
- **npm** v10+
- **Akun Supabase** (gratis, daftar di https://supabase.com)
- **Akun Vercel** untuk deployment frontend (opsional)

### Install dependencies

```bash
npm install
```

---

## 2. Setup Database Supabase

### Langkah 1 — Buat project Supabase

1. Login ke https://supabase.com
2. Klik **New Project** → isi nama, password DB, region (Singapore untuk Indonesia)
3. Tunggu ~2 menit hingga project siap

### Langkah 2 — Catat kredensial

Di **Project Settings → API**, catat:
- `Project URL` → `VITE_SUPABASE_URL`
- `anon public key` → `VITE_SUPABASE_ANON_KEY`

### Langkah 3 — Jalankan migration SQL

**Opsi A — via SQL Editor (paling mudah):**
1. Buka **SQL Editor** di dashboard Supabase
2. Salin-lalu-run urutan file berikut, satu per satu:
   ```
   supabase/migrations/20260101000000_create_extensions.sql
   supabase/migrations/20260101000100_create_profiles.sql
   supabase/migrations/20260101000200_create_pilgrimages.sql
   supabase/migrations/20260101000300_create_prayers.sql
   supabase/migrations/20260101000400_create_notifications.sql
   supabase/migrations/20260101000500_storage_bucket.sql
   supabase/migrations/20260101000600_enable_realtime.sql
   ```

**Opsi B — via Supabase CLI:**
```bash
npm install -g supabase
supabase login
supabase link --project-ref <project-ref>
supabase db push
```

### Langkah 4 — Konfigurasi Auth

1. **Authentication → Providers → Email**: pastikan **enabled**
2. **Authentication → URL Configuration**:
   - Site URL: `http://localhost:5173` (development)
   - Redirect URLs: tambahkan `http://localhost:5173/reset-password`
3. Untuk development, Anda boleh menonaktifkan email verification:
   - **Authentication → Settings → User Signups**: enable "Allow new users to sign up"
   - (opsional) matikan "Confirm email" untuk testing lokal

### Langkah 5 — Aktifkan Realtime (jika belum)

Cek di **Database → Replication → supabase_realtime** — pastikan tabel `prayers` dan `notifications` tercentang.

Jika belum, jalankan:
```sql
alter publication supabase_realtime add table public.prayers;
alter publication supabase_realtime add table public.notifications;
```

---

## 3. Menjalankan secara Lokal

### Buat file `.env.local`

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

### Jalankan dev server

```bash
npm run dev
```

Buka http://localhost:5173

### Buat akun untuk testing

1. Buka aplikasi → klik **Daftar**
2. Pilih role (Penitip / Pendoa)
3. Register dengan email & password
4. Login → lanjut lengkapi profil

### Build production

```bash
npm run build
npm run preview   # preview hasil build
```

---

## 4. Struktur Folder

```
sampaikan-doaku/
├── docs/
│   └── ERD.md                          # Diagram ERD + state machine
├── supabase/
│   ├── migrations/                     # 7 file SQL migration
│   │   ├── 000_run_all.sql             # Aggregate runner
│   │   ├── ..._create_extensions.sql
│   │   ├── ..._create_profiles.sql
│   │   ├── ..._create_pilgrimages.sql
│   │   ├── ..._create_prayers.sql
│   │   ├── ..._create_notifications.sql
│   │   ├── ..._storage_bucket.sql
│   │   └── ..._enable_realtime.sql
│   └── seed/seed.sql
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── ui/                         # Button, Input, Card, Modal, dll.
│   │   │   ├── AppButton.vue
│   │   │   ├── AppInput.vue
│   │   │   ├── AppTextarea.vue
│   │   │   ├── AppCard.vue
│   │   │   ├── AppBadge.vue
│   │   │   ├── AppAvatar.vue
│   │   │   ├── AppModal.vue
│   │   │   ├── EmptyState.vue
│   │   │   ├── Spinner.vue
│   │   │   ├── Icon.vue
│   │   │   ├── ToastContainer.vue
│   │   │   └── icon-types.ts
│   │   ├── forms/
│   │   │   └── PrayerFormModal.vue
│   │   ├── cards/
│   │   │   ├── PendoaCard.vue
│   │   │   └── PrayerStatusBadge.vue
│   │   └── layouts/
│   │       ├── AppHeader.vue
│   │       ├── AppSidebar.vue
│   │       ├── NotificationDropdown.vue
│   │       └── RealtimeNotifications.vue
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── LoginPage.vue
│   │   │   ├── RegisterPage.vue
│   │   │   ├── ForgotPasswordPage.vue
│   │   │   └── ResetPasswordPage.vue
│   │   ├── public/
│   │   │   ├── LandingPage.vue
│   │   │   └── NotFoundPage.vue
│   │   ├── penitip/
│   │   │   ├── PenitipDashboard.vue
│   │   │   ├── PendoaListPage.vue
│   │   │   ├── PendoaDetailPage.vue
│   │   │   └── MyPrayersPage.vue
│   │   ├── pendoa/
│   │   │   ├── PendoaDashboard.vue
│   │   │   ├── PilgrimageListPage.vue
│   │   │   ├── PilgrimageEditPage.vue
│   │   │   └── IncomingPrayersPage.vue
│   │   ├── DashboardRouter.vue
│   │   ├── ProfileEditPage.vue
│   │   └── NotificationsPage.vue
│   ├── router/index.ts                 # Routes + role-based guards
│   ├── stores/
│   │   ├── auth.store.ts
│   │   ├── notification.store.ts
│   │   └── ui.store.ts
│   ├── composables/
│   │   ├── useRealtime.ts
│   │   └── usePrayerRealtime.ts
│   ├── services/                       # Supabase API layer
│   │   ├── supabase.ts
│   │   ├── auth.service.ts
│   │   ├── profile.service.ts
│   │   ├── pilgrimage.service.ts
│   │   ├── prayer.service.ts
│   │   ├── notification.service.ts
│   │   └── constants.ts
│   ├── types/database.ts               # TypeScript interfaces
│   ├── utils/{format.ts, validation.ts}
│   ├── layouts/AppLayout.vue
│   ├── App.vue
│   ├── main.ts
│   └── style.css                       # TailwindCSS + design system
├── .env.example
├── .gitignore
├── env.d.ts
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
└── vite.config.ts
```

---

## 5. Fitur

### Authentication
- Register dengan pilihan role (Penitip / Pendoa)
- Login dengan email + password
- Logout
- Forgot password (reset via email)
- Auto-create profile via database trigger

### Penitip Doa
- Lihat daftar pendoa aktif (filter Haji/Umroh + cari)
- Detail pendoa dengan info perjalanan
- Kirim doa (dengan opsi private & anonim)
- Lihat daftar titipan + filter status
- Tandai doa selesai setelah didoakan
- Batalkan doa yang masih pending
- Notifikasi realtime saat status berubah

### Pendoa
- CRUD perjalanan ibadah (Haji/Umroh)
- Aktifkan/nonaktifkan perjalanan (toggle)
- Lihat titipan doa masuk
- Update status: accept → pray → complete
- Reset status jika perlu
- Notifikasi realtime saat ada doa baru

### Lainnya
- Profil editable dengan upload avatar
- Notifikasi dropdown di header (realtime)
- Halaman notifikasi terpusat
- Toast notifications
- Responsive (mobile-first)
- Aksesibilitas: focus ring, ARIA labels, keyboard friendly

### Keamanan
- **Row Level Security (RLS)** di semua tabel
- Trigger auto-create profile saat signup
- Trigger auto-buat notifikasi saat status doa berubah
- Storage bucket terisolasi per user ID

---

## 6. Deployment

### Frontend — Vercel

1. Push repo ke GitHub
2. Login ke https://vercel.com → **New Project**
3. Import repo, pilih framework **Vue** (auto-detected)
4. Set Environment Variables:
   ```
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_ANON_KEY=...
   ```
5. Build & Output settings auto (Vite):
   - Build Command: `npm run build`
   - Output Directory: `dist`
6. **Deploy**
7. Setelah deploy, salin URL produksi → update **Supabase → Authentication → URL Configuration → Site URL** ke URL Vercel

### Backend — Supabase Free Tier

Supabase project yang sudah dibuat tidak perlu di-deploy terpisah. Yang perlu dilakukan:

1. Pastikan **Project → Pause** tidak aktif (free tier bisa pause setelah 1 minggu idle)
2. Untuk custom domain: Settings → Custom Domains (berbayar)
3. Backup database berkala via **Database → Backups**

---

## 7. Troubleshooting

### Halaman diagnostik

Tersedia halaman `/auth-debug` untuk memeriksa konfigurasi Supabase Anda:
```
http://localhost:5173/auth-debug
```
Halaman ini akan menunjukkan: URL & anon key terbaca, koneksi ke Auth endpoint, session aktif, dan akses ke tabel profiles.

### Login gagal: HTTP 400 dari `/auth/v1/token`

**Penyebab paling umum:** Email belum dikonfirmasi. Supabase secara default mengaktifkan "Confirm email" — saat register, user harus klik link di email sebelum bisa login.

**Untuk development, MATIKAN email confirmation:**
1. Buka Supabase Dashboard
2. **Authentication → Settings** (atau "Providers → Email")
3. Pada section "Email Auth", **uncheck** "Confirm email"
4. Save
5. Coba register ulang dengan email baru

**Penyebab lain:**
- Akun belum terdaftar → daftar dulu
- Password salah → klik "Lupa Password"
- Anon key salah → copy ulang dari **Project Settings → API**
- Format key baru (`sb_publishable_...`) didukung mulai supabase-js v2.39 — versi yang dipakai di repo ini (v2.45+) sudah kompatibel

### Register gagal: HTTP 429 `over_email_send_rate_limit`

**Penyebab:** Supabase Free Tier membatasi pengiriman email hingga **~3 per jam**. Setiap kali register dengan "Confirm email" aktif, Supabase mengirim 1 email verifikasi. Setelah 2-3 attempt, diblokir 1 jam.

**Solusi terbaik untuk development — MATIKAN email confirmation:**

1. Buka **Supabase Dashboard** → project Anda
2. **Authentication → Providers → Email**
3. **Toggle OFF** "Confirm email"
4. **Save**
5. Sekarang register → user langsung login tanpa perlu email verifikasi
6. Aplikasi akan auto-redirect ke dashboard setelah register

**Alternatif:**
- Tunggu 1 jam sampai rate limit reset
- Upgrade Supabase ke Pro plan ($25/bulan) → limit 30k email/bulan
- Setup custom SMTP (SendGrid, Mailgun, dll.) di **Authentication → SMTP Settings**

### Pesan error umum & solusinya

| Pesan error | Artinya | Solusi |
| ----------- | ------- | ------ |
| `Email not confirmed` | User belum klik link verifikasi | Disable "Confirm email" di dashboard, atau klik link di inbox |
| `over_email_send_rate_limit` | Limit email Supabase terlampaui | Matikan "Confirm email" atau tunggu 1 jam |
| `Invalid login credentials` | Email/password salah | Register dulu, atau reset password |
| `User already registered` | Email sudah dipakai | Login atau pakai email lain |
| `User not found` | Email belum terdaftar | Register akun baru |
| `For brute-force protection` | Terlalu banyak percobaan gagal | Tunggu 5-10 menit |
| `Weak password` | Password kurang dari 6 karakter | Gunakan password lebih kuat |
| `permission denied for table ...` | RLS policy belum terpasang | Re-jalankan migration `02_create_profiles.sql` |

### Profile tidak muncul setelah register
- Trigger `handle_new_user` membuat profile secara async setelah user dibuat di `auth.users`
- Aplikasi sudah retry 5x (lihat `loadProfile()` di `auth.store.ts`)
- Jika tetap gagal: cek log PostgreSQL di Supabase dashboard → apakah trigger jalan?
- Quick fix: jalankan manual di SQL Editor
  ```sql
  insert into public.profiles (id, email, full_name, role)
  select id, email,
         coalesce(raw_user_meta_data->>'full_name', ''),
         coalesce((raw_user_meta_data->>'role')::public.user_role, 'penitip')
  from auth.users
  where id not in (select id from public.profiles);
  ```

### Realtime tidak update
- Cek **Database → Replication → supabase_realtime** — tabel prayers & notifications harus tercentang
- Cek browser tab Network → WS — harus ada koneksi WebSocket ke Supabase
- Restart dev server

### Upload avatar gagal
- Cek policy Storage bucket `avatars`
- Pastikan file path mengikuti pola `{user_id}/avatar-{timestamp}.ext`
- Cek ukuran file (maks ~2MB disarankan)

### "permission denied for table ..."
- RLS belum terpasang atau policy salah
- Re-jalankan migration yang sesuai

### Membuat user menjadi admin

Karena kolom `role` di-revoke dari client (wajib via RPC), cara termudah adalah jalankan langsung di **Supabase SQL Editor**:

```sql
update public.profiles set role = 'admin' where email = 'email@anda.com';
```

Atau untuk membuat admin pertama kali:
```sql
-- Pastikan user sudah register dulu via aplikasi, lalu jalankan:
update public.profiles
set role = 'admin'
where email = 'admin@email-anda.com';
```

Setelah itu logout & login ulang — sidebar akan menampilkan menu admin:
- **Dashboard** — statistik agregat (jumlah user, doa per status, dll)
- **Kelola User** — ubah role & hapus user
- **Kelola Perjalanan** — aktifkan/nonaktifkan/hapus perjalanan siapa saja
- **Kelola Doa** — ubah status atau hapus doa apa saja
- **Broadcast** — kirim notifikasi ke semua user atau ke user tertentu

#### Aturan keamanan admin (di-enforce di database)

| Aksi                         | Aturan                                                    |
| ---------------------------- | --------------------------------------------------------- |
| Ubah role user lain          | Hanya admin. Tidak bisa ubah role sendiri.               |
| Demote admin terakhir        | Ditolak — harus promosi admin lain dulu.                 |
| Hapus user                   | Hanya admin. Tidak bisa hapus diri sendiri.              |
| Hapus admin terakhir         | Ditolak.                                                  |
| Broadcast notifikasi         | Hanya admin.                                              |
| Akses halaman admin (UI)     | Hanya role admin — dijaga oleh router guard `roles: ['admin']`. |

---

## Lisensi

MIT — silakan digunakan untuk kebaikan.

> Dibuat dengan ♥ untuk sesama Muslim.
