# Panduan Deploy ByteWorks Academy

Panduan ini untuk deploy gratis memakai:

- GitHub untuk menyimpan source code
- Supabase Free untuk database PostgreSQL + realtime exam result
- Render Free untuk backend dan frontend

## Tahap 1 - Buat Akun

Siapkan akun:

- GitHub: https://github.com
- Supabase: https://supabase.com
- Render: https://render.com

Gunakan login GitHub di Render agar repository mudah dipilih.

## Tahap 2 - Upload Project ke GitHub

Buka terminal di folder:

```bash
cd "D:\0.1 WORKSTATION\jarvis-ai\Byteworks-Academy"
```

Jalankan:

```bash
git init
git add .
git commit -m "Initial ByteWorks Academy"
```

Buka GitHub, buat repository baru, misalnya:

```text
byteworks-academy
```

Setelah repo dibuat, GitHub akan memberi command seperti ini:

```bash
git remote add origin https://github.com/USERNAME/byteworks-academy.git
git branch -M main
git push -u origin main
```

Jalankan command dari GitHub itu di terminal.

## Tahap 3 - Buat Database Supabase

1. Masuk ke Supabase.
2. Klik `New project`.
3. Isi nama project, contoh `byteworks-academy`.
4. Buat password database dan simpan baik-baik.
5. Pilih region terdekat.
6. Klik `Create new project`.

Setelah project aktif:

1. Buka `Project Settings`.
2. Buka `Database`.
3. Copy connection string PostgreSQL URI.
4. Ganti bagian password dengan password database kamu.

Formatnya kurang lebih:

```env
postgresql://postgres.xxxxx:PASSWORD@aws-xxxx.pooler.supabase.com:6543/postgres
```

Lalu:

1. Buka `Project Settings > API`.
2. Copy `Project URL`.
3. Copy `anon public key`.

## Tahap 4 - Deploy Backend di Render

1. Masuk ke Render.
2. Klik `New +`.
3. Pilih `Web Service`.
4. Connect GitHub repository `byteworks-academy`.
5. Isi:

```text
Name: byteworks-academy-api
Root Directory: server
Build Command: npm install
Start Command: npm start
Instance Type: Free
```

Tambahkan Environment Variables:

```env
JWT_SECRET=buat_secret_panjang_random
DATABASE_URL=postgresql://...
DATABASE_SSL=true
CLIENT_ORIGIN=https://ISI_NANTI_SETELAH_FRONTEND_DEPLOY
```

Klik `Deploy Web Service`.

Setelah selesai, Render memberi URL backend seperti:

```text
https://byteworks-academy-api.onrender.com
```

Cek backend:

```text
https://byteworks-academy-api.onrender.com/api/health
```

Kalau muncul status `ok`, backend sudah hidup.

## Tahap 5 - Deploy Frontend di Render

1. Render klik `New +`.
2. Pilih `Static Site`.
3. Pilih repository yang sama.
4. Isi:

```text
Name: byteworks-academy
Root Directory: client
Build Command: npm install && npm run build
Publish Directory: dist
```

Tambahkan Environment Variables:

```env
VITE_API_URL=https://URL_BACKEND_RENDER/api
VITE_SUPABASE_URL=https://PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=anon_public_key
```

Klik `Deploy Static Site`.

Setelah selesai, Render memberi URL frontend seperti:

```text
https://byteworks-academy.onrender.com
```

## Tahap 6 - Update CLIENT_ORIGIN Backend

Balik ke backend Render:

1. Buka service backend.
2. Buka `Environment`.
3. Ubah:

```env
CLIENT_ORIGIN=https://URL_FRONTEND_RENDER
```

4. Klik save.
5. Redeploy backend.

## Tahap 7 - Aktifkan Supabase Realtime

Untuk realtime exam result:

1. Buka Supabase.
2. Buka `Database`.
3. Buka `Publications`.
4. Pilih `supabase_realtime`.
5. Aktifkan table `exam_results`.

## Tahap 8 - Tes Website

Tes login admin:

```text
Email: admin@byteworks.local
Password: Admin12345
```

Tes login member:

```text
Email: member@byteworks.local
Password: Member12345
```

Yang harus dicek:

- Register member baru
- Login member
- Buka course
- Kerjakan exam
- Login admin
- Cek Admin Exam Results

## Catatan Gratis

Render Free bisa sleep jika lama tidak diakses. Saat dibuka lagi, backend mungkin perlu beberapa detik untuk hidup kembali.
