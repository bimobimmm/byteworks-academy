# Panduan Deploy ByteWorks Academy

Panduan ini memakai:

- GitHub untuk menyimpan source code
- Supabase Free untuk database PostgreSQL + realtime exam result
- Vercel Hobby untuk hosting frontend + backend API serverless

## Tahap 1 - Akun

Siapkan akun:

- GitHub: https://github.com
- Supabase: https://supabase.com
- Vercel: https://vercel.com

Gunakan login GitHub di Vercel agar repository mudah dipilih.

## Tahap 2 - GitHub

Repository project:

```text
https://github.com/bimobimmm/byteworks-academy
```

Setiap ada perubahan lokal:

```bash
git add .
git commit -m "Update"
git push
```

## Tahap 3 - Supabase

Project Supabase:

```text
https://poesyobvlctpqojygvet.supabase.co
```

Gunakan connection string dari:

```text
Connect > Direct > Session pooler > URI
```

Format:

```env
postgresql://postgres.PROJECT_REF:PASSWORD@aws-REGION.pooler.supabase.com:5432/postgres
```

Jangan pakai direct connection `db.PROJECT_REF.supabase.co` untuk serverless hosting.

## Tahap 4 - Deploy ke Vercel

1. Buka https://vercel.com
2. Login pakai GitHub.
3. Klik `Add New...`.
4. Pilih `Project`.
5. Import repository `bimobimmm/byteworks-academy`.
6. Setting project:

```text
Framework Preset: Other
Root Directory: ./
Build Command: npm run vercel-build
Output Directory: client/dist
Install Command: npm install
```

7. Tambahkan Environment Variables:

```env
JWT_SECRET=isi_secret_panjang_random
DATABASE_URL=postgresql://postgres.poesyobvlctpqojygvet:PASSWORD@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres
DATABASE_SSL=true
VITE_API_URL=/api
VITE_SUPABASE_URL=https://poesyobvlctpqojygvet.supabase.co
VITE_SUPABASE_ANON_KEY=anon_public_key
```

8. Klik `Deploy`.

## Tahap 5 - Cek API

Setelah deploy selesai, buka:

```text
https://DOMAIN-VERCEL/api/health
```

Harus muncul:

```json
{"status":"ok","service":"ByteWorks Academy API"}
```

## Tahap 6 - Aktifkan Supabase Realtime

Untuk realtime exam result:

1. Buka Supabase.
2. Buka `Database`.
3. Buka `Publications`.
4. Pilih `supabase_realtime`.
5. Aktifkan table `exam_results`.

## Tahap 7 - Tes Website

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

Vercel Hobby cocok untuk tahap awal. Backend berjalan sebagai serverless function, jadi database wajib memakai Supabase pooler.
