# Tabel Pengujian Portal Janji Senyum Rekah (Empat Peran)

Dokumen hasil pengujian autentikasi, otorisasi peran, *route guard*, dan alur inti untuk Tugas Mandiri Sesi 6 Bootcamp AI Web Programming.

---

## 1. Tabel Uji Hak Akses & Penjagaan Halaman (Route Guard)

| No | Akun / Peran | Yang Dilakukan | Hasil yang Benar | Lolos? |
| :--- | :--- | :--- | :--- | :---: |
| 1 | Pengunjung (Belum Masuk) | Buka `/beranda` langsung di peramban | Menampilkan Memuat lalu dialihkan ke `/masuk` | [x] Lolos |
| 2 | Pengunjung (Belum Masuk) | Buka `/resepsionis` langsung di peramban | Menampilkan Memuat lalu dialihkan ke `/masuk` | [x] Lolos |
| 3 | Pengunjung (Belum Masuk) | Buka `/dokter` langsung di peramban | Menampilkan Memuat lalu dialihkan ke `/masuk` | [x] Lolos |
| 4 | Pengunjung (Belum Masuk) | Buka `/admin` langsung di peramban | Menampilkan Memuat lalu dialihkan ke `/masuk` | [x] Lolos |
| 5 | Pengunjung (Belum Masuk) | Buka `/masuk` dan `/daftar` | Halaman terbuka normal tanpa pengalihan | [x] Lolos |
| 6 | Pasien (`pasien`) | Buka `/beranda` setelah masuk | Halaman Beranda terbuka dengan kartu janji terdekat | [x] Lolos |
| 7 | Pasien (`pasien`) | Ketik `/resepsionis` di kolom URL | Muncul halaman **Akses Ditolak** dengan tombol kembali | [x] Lolos |
| 8 | Pasien (`pasien`) | Ketik `/dokter` di kolom URL | Muncul halaman **Akses Ditolak** dengan tombol kembali | [x] Lolos |
| 9 | Pasien (`pasien`) | Ketik `/admin` di kolom URL | Muncul halaman **Akses Ditolak** dengan tombol kembali | [x] Lolos |
| 10 | Pasien (`pasien`) | Buka `/masuk` saat sudah login | Otomatis dialihkan kembali ke `/beranda` | [x] Lolos |
| 11 | Resepsionis (`resepsionis`) | Buka `/resepsionis` setelah masuk | Halaman Dasbor Resepsionis terbuka dengan metrik janji | [x] Lolos |
| 12 | Resepsionis (`resepsionis`) | Ketik `/beranda` di kolom URL | Muncul halaman **Akses Ditolak** dengan tombol kembali | [x] Lolos |
| 13 | Resepsionis (`resepsionis`) | Ketik `/dokter` di kolom URL | Muncul halaman **Akses Ditolak** dengan tombol kembali | [x] Lolos |
| 14 | Resepsionis (`resepsionis`) | Ketik `/admin` di kolom URL | Muncul halaman **Akses Ditolak** dengan tombol kembali | [x] Lolos |
| 15 | Resepsionis (`resepsionis`) | Buka `/resepsionis/pasien` | Kontak nama, email, no HP tampil tanpa catatan medis | [x] Lolos |
| 16 | Dokter (`dokter`) | Buka `/dokter` setelah masuk | Halaman Dasbor Dokter terbuka dengan jadwal periksa hari ini | [x] Lolos |
| 17 | Dokter (`dokter`) | Ketik `/beranda` di kolom URL | Muncul halaman **Akses Ditolak** dengan tombol kembali | [x] Lolos |
| 18 | Dokter (`dokter`) | Ketik `/resepsionis` di kolom URL | Muncul halaman **Akses Ditolak** dengan tombol kembali | [x] Lolos |
| 19 | Dokter (`dokter`) | Ketik `/admin` di kolom URL | Muncul halaman **Akses Ditolak** dengan tombol kembali | [x] Lolos |
| 20 | Dokter (`dokter`) | Buka Pemeriksaan janji dokter lain di URL | Ditampilkan "Janji tidak ditemukan" | [x] Lolos |
| 21 | Super Admin (`super_admin`) | Buka `/admin` setelah masuk | Halaman Dasbor Admin terbuka dengan metrik lengkap | [x] Lolos |
| 22 | Super Admin (`super_admin`) | Buka `/beranda` & `/janji` | Halaman terbuka normal (Super Admin berhak akses) | [x] Lolos |
| 23 | Super Admin (`super_admin`) | Buka `/resepsionis` & `/resepsionis/janji` | Halaman terbuka normal (Super Admin berhak akses) | [x] Lolos |
| 24 | Super Admin (`super_admin`) | Buka `/dokter` | Halaman terbuka normal (Super Admin berhak akses) | [x] Lolos |
| 25 | Super Admin (`super_admin`) | Buka `/admin/pengguna` & ubah peran | Halaman kelola pengguna terbuka dan peran berhasil diubah | [x] Lolos |

---

## 2. Tabel Uji Muat Ulang Halaman (*Page Reload*)

| No | Akun / Peran | Halaman yang Dimuat Ulang | Perilaku Route Guard | Lolos? |
| :--- | :--- | :--- | :--- | :---: |
| 26 | Pasien | `/beranda` dimuat ulang (F5) | Layar memuat sejenak tanpa berkedip Akses Ditolak, tetap di `/beranda` | [x] Lolos |
| 27 | Resepsionis | `/resepsionis/janji` dimuat ulang (F5) | Layar memuat sejenak tanpa berkedip Akses Ditolak, tetap di `/resepsionis/janji` | [x] Lolos |
| 28 | Dokter | `/dokter` dimuat ulang (F5) | Layar memuat sejenak tanpa berkedip Akses Ditolak, tetap di `/dokter` | [x] Lolos |
| 29 | Super Admin | `/admin/laporan` dimuat ulang (F5) | Layar memuat sejenak tanpa berkedip Akses Ditolak, tetap di `/admin/laporan` | [x] Lolos |

---

## 3. Tabel Uji Alur Inti (*Core Flow E2E*)

Alur Inti Sesuai Bab 7 PRD:
*Pasien membuat janji (4.3) → Resepsionis mengonfirmasi lalu menandai hadir (4.7) → Dokter mengisi pemeriksaan dan menandai selesai (4.10) → Pasien membaca riwayat perawatan (4.4)*

| Langkah Alur | Peran | Tindakan yang Diuji | Hasil Verifikasi Firestore | Lolos? |
| :--- | :--- | :--- | :--- | :---: |
| Langkah 1 | Pasien (Andi) | Buat janji di `/janji/baru` memilih layanan, dokter, tanggal, slot jam 10:00, keluhan | Dokumen dibuat di `janji_temu` (`status: "menunggu"`) dan di `slot_terisi` | [x] Lolos |
| Langkah 2 | Resepsionis (Laras) | Buka `/resepsionis/janji`, klik janji, lalu klik **Konfirmasi** | Field `status` di dokumen `janji_temu` terbarui menjadi `"dikonfirmasi"` | [x] Lolos |
| Langkah 3 | Resepsionis (Laras) | Pasien tiba di klinik, klik tombol **Tandai Hadir** | Field `status` terbarui menjadi `"hadir"` dan janji muncul di Dasbor Dokter | [x] Lolos |
| Langkah 4 | Dokter (drg. Bima) | Buka `/dokter`, klik janji Siap Diperiksa, isi tindakan & catatan medis, klik **Tandai Selesai** | Field `status` terbarui menjadi `"selesai"`, dokumen dibuat di `catatan_perawatan`, slot di `slot_terisi` dihapus | [x] Lolos |
| Langkah 5 | Pasien (Andi) | Buka `/riwayat` | Riwayat perawatan tampil lengkap berisi tanggal, dokter, layanan, tindakan, dan instruksi dokter | [x] Lolos |

---

## 4. Akun Uji Coba

Empat akun yang disiapkan untuk pengujian:
1. **Super Admin**: `ratna@senyumrekah.id` (Bu Ratna - Pemilik Klinik)
2. **Resepsionis**: `laras@senyumrekah.id` (Laras - Staf Depan)
3. **Dokter Gigi**: `bima@senyumrekah.id` (drg. Bima - Tenaga Ahli)
4. **Pasien**: `andi@gmail.com` (Andi - Pasien Terdaftar)
