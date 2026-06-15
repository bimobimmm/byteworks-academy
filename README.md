# ByteWorks Academy

Website resmi ByteWorks Academy untuk pembelajaran Database Administrator, member content, dan ujian online.

## Struktur Folder

```text
Byteworks-Academy/
  client/        React + Vite + Tailwind CSS
  server/        Node.js + Express + SQLite API
  .env.example   Contoh konfigurasi backend
```

## Install

```bash
npm install
npm run install:all
```

Copy konfigurasi backend:

```bash
copy .env.example server\.env
```

## Run

Jalankan frontend dan backend bersamaan:

```bash
npm run dev
```

Atau terpisah:

```bash
npm run dev:server
npm run dev:client
```

Frontend: `http://localhost:5173`  
Backend: `http://localhost:5000`

## Login Default

Admin:

- Email: `admin@byteworks.local`
- Password: `Admin12345`

Member demo:

- Email: `member@byteworks.local`
- Password: `Member12345`

## Cara Menambah Course

Login sebagai admin, buka `/admin`, lalu gunakan form Course Management. Course baru otomatis tersedia di halaman Courses jika `published` dicentang.

## Akses Member Content

Guest dapat melihat daftar course DBA publik, tetapi detail materi dan exam akan diarahkan ke halaman locked. Register atau login sebagai member untuk membuka materi Oracle, MySQL, Microsoft SQL Server, PostgreSQL, dashboard member, exam, dan hasil ujian.

## Rencana Deploy dan Database Online

Untuk versi online/production, opsi database yang disarankan adalah Supabase PostgreSQL.

Alasan:

- Free tier cukup untuk tahap awal.
- PostgreSQL cocok untuk struktur relational seperti member, course, lesson, exam, question, dan exam result.
- Mendukung realtime, sehingga dashboard admin bisa diperbarui tanpa refresh manual.
- Lebih mudah dimigrasi dari SQLite dibanding database NoSQL.

Rencana migrasi:

1. Deploy frontend dan backend.
2. Buat project Supabase.
3. Migrasi schema SQLite ke PostgreSQL.
4. Ganti koneksi backend dari SQLite ke Supabase PostgreSQL.
5. Simpan progress belajar member ke database server, bukan localStorage.

## Deploy Gratis: Render + Supabase

Stack gratis yang disarankan:

- Database: Supabase Free PostgreSQL
- Backend: Render Free Web Service
- Frontend: Render Free Static Site

### 1. Supabase

1. Buat project baru di Supabase.
2. Buka `Project Settings > Database`.
3. Copy connection string PostgreSQL URI.
4. Buka `Project Settings > API`.
5. Copy `Project URL` dan `anon public key`.

Backend akan otomatis membuat table dan seed data saat pertama kali jalan jika `DATABASE_URL` diisi.

### 2. Backend Render

Render Web Service:

- Root directory: `server`
- Build command: `npm install`
- Start command: `npm start`

Environment variables:

```env
PORT=10000
JWT_SECRET=isi_secret_panjang_random
DATABASE_URL=postgresql://...
DATABASE_SSL=true
CLIENT_ORIGIN=https://domain-frontend-render
```

### 3. Frontend Render

Render Static Site:

- Root directory: `client`
- Build command: `npm install && npm run build`
- Publish directory: `dist`

Environment variables:

```env
VITE_API_URL=https://domain-backend-render/api
VITE_SUPABASE_URL=https://project-id.supabase.co
VITE_SUPABASE_ANON_KEY=anon_public_key
```

### 4. Supabase Realtime

Untuk realtime exam result:

1. Buka Supabase Dashboard.
2. Buka `Database > Publications`.
3. Aktifkan table `exam_results` pada publication `supabase_realtime`.
4. Setelah itu halaman Admin Exam Results dapat memperbarui data saat ada submit exam baru.
