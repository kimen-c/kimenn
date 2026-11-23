# NOHMEN Portfolio

Portfolio pribadi dark premium menggunakan HTML, CSS, JavaScript module, Supabase, dan Vercel. Tidak membutuhkan proses build.

## 1. Jalankan lokal

Karena file JavaScript menggunakan ES modules, jangan membuka `index.html` langsung melalui `file://`.

Cara paling mudah:
- Buka folder ini di VS Code.
- Jalankan extension Live Server, lalu buka URL lokal yang diberikan.
- Alternatif: jalankan `python -m http.server 5500` dari folder project, lalu buka `http://localhost:5500`.

Di Android, gunakan Acode dengan fitur Preview/Live Server atau jalankan server lokal dari Termux.

## 2. Buat database Supabase

1. Buat project baru di https://supabase.com/.
2. Buka **SQL Editor** pada project.
3. Salin seluruh isi `supabase/schema.sql`, lalu jalankan.
4. Buka **Project Settings → API** (atau Connect) dan salin Project URL serta anon/publishable key.
5. Buka `config.js`, isi `SUPABASE_URL` dan `SUPABASE_ANON_KEY`.

PENTING:
- Hanya gunakan anon/publishable key pada website.
- Jangan pernah menaruh `service_role` key di browser, GitHub, atau file frontend.
- Schema mengaktifkan Row Level Security (RLS). Jangan menonaktifkannya.

## 3. Buat akun admin

1. Di Supabase, buka **Authentication → Users**.
2. Buat akun admin menggunakan email dan password yang kuat (atau aktifkan sign-up lalu daftar dan nonaktifkan sign-up setelahnya).
3. Salin UUID user tersebut.
4. Buka SQL Editor dan jalankan, ganti UUID dengan UUID akun admin:

```sql
insert into public.admins (user_id)
values ('UUID_USER_ADMIN');
```

5. Buka `https://domain-kamu/admin.html`, lalu login dengan akun tadi.
6. Dashboard hanya memberikan hak admin kepada UUID yang tercatat di tabel `admins`.

Jangan membuat pendaftaran admin publik. Tambahkan admin secara manual dari dashboard Supabase.

## 4. Deploy ke Vercel

Cara yang direkomendasikan:
1. Buat repository GitHub baru dan upload seluruh isi folder project.
2. Login ke https://vercel.com/ lalu pilih **Add New → Project**.
3. Import repository GitHub tersebut.
4. Framework Preset pilih **Other**. Build Command dan Output Directory dikosongkan (static site).
5. Deploy.
6. Setelah deploy, buka domain Vercel dan tes halaman utama, formulir kontak, serta `/admin.html`.

Setiap perubahan yang di-push ke branch production akan memicu deployment baru.

## 5. Tes setelah deploy

- Halaman utama terbuka di HP dan desktop.
- Project yang berstatus Published muncul pada bagian Projects.
- Project Draft tidak terlihat oleh pengunjung.
- Kirim pesan melalui Contact, lalu pastikan pesan masuk di Admin → Inbox.
- Login admin dan coba tambah, edit, publish/unpublish, serta hapus project.

## 6. Catatan keamanan dan batasan

- `config.js` berisi Project URL dan anon/publishable key. Key ini memang dapat dilihat publik; keamanan bergantung pada RLS dan policy database.
- Jangan pernah menambahkan `service_role` key ke frontend.
- Form kontak publik belum dilengkapi CAPTCHA/rate limiting. Untuk website publik yang ramai, tambahkan proteksi anti-spam (mis. Cloudflare Turnstile + server-side verification atau Edge Function) sebelum dipromosikan luas.
- Batasi atau matikan sign-up publik setelah akun admin dibuat.
- Email `hello@nohmen.com` pada halaman adalah placeholder. Ganti dengan email kontak milikmu.
- Konten profil, skill, angka statistik, dan ilustrasi hero adalah konten awal yang bisa kamu ubah di `index.html` dan `style.css`.
- Gunakan URL gambar publik HTTPS untuk cover project. Jangan mengunggah data privat.
