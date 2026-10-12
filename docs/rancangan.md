# Rancangan Portal Janji Senyum Rekah (Empat Peran)

Dokumen rancangan matriks akses, peta route, dan keputusan arsitektur berdasarkan PRD Portal Janji Senyum Rekah untuk Tugas Mandiri Sesi 6 Bootcamp AI Web Programming.

---

## 1. Daftar Fitur (Berdasarkan Bab 4 PRD)

1. **Daftar Akun Baru (4.1)**: Mendaftar akun baru dengan Nama, Email, Nomor HP, dan Password (atau Google Auth). Otomatis mendapatkan peran `pasien`.
2. **Masuk Akun / Login (4.1)**: Masuk dengan Email & Password atau Google Sign-In, diarahkan otomatis sesuai peran pengguna.
3. **Melihat Janji Terdekat & Tombol Cepat Buat Janji (4.2)**: Melihat kartu janji terdekat di `/beranda` dan tombol navigasi cepat untuk membuat janji baru.
4. **Membuat Janji Temu (4.3.1)**: Memilih layanan aktif, dokter, tanggal praktik yang valid, melihat slot jam kosong (per 30 menit), dan mengisi keluhan.
5. **Melihat Daftar & Rincian Janji Sendiri (4.3.2)**: Melihat riwayat janji pribadi berstatus Menunggu, Dikonfirmasi, Hadir, Selesai, atau Dibatalkan.
6. **Membatalkan Janji Temu Sendiri (4.3.2)**: Membatalkan janji sendiri paling lambat H-1 (hanya status Menunggu atau Dikonfirmasi).
7. **Melihat Riwayat Perawatan Pribadi (4.4)**: Melihat tindakan medis dan catatan dokter dari kunjungan janji yang telah berstatus Selesai.
8. **Memperbarui Profil Diri (4.5)**: Melihat informasi profil dan mengubah nama serta nomor HP.
9. **Melihat Dasbor Resepsionis (4.6)**: Melihat ringkasan janji hari ini per dokter dan jumlah janji yang menunggu konfirmasi.
10. **Mengonfirmasi Janji Pasien (4.7)**: Resepsionis mengonfirmasi janji berstatus Menunggu menjadi Dikonfirmasi.
11. **Menjadwalkan Ulang Janji Pasien (4.7)**: Resepsionis memindahkan tanggal/jam janji pasien ke slot kosong baru.
12. **Membatalkan Janji Temu oleh Resepsionis (4.7)**: Resepsionis membatalkan janji dengan menyertakan alasan pembatalan.
13. **Menandai Pasien Hadir (4.7)**: Resepsionis menandai pasien hadir di klinik pada hari H dari status Dikonfirmasi menjadi Hadir (siap diperiksa).
14. **Melihat Data Pasien / Kontak (4.8)**: Resepsionis mencari nama, email, dan no HP pasien tanpa melihat catatan perawatan medis.
15. **Melihat Dasbor Dokter (4.9)**: Dokter melihat jadwal periksa hari ini miliknya sendiri dengan status pasien.
16. **Mengisi Pemeriksaan & Catatan Perawatan (4.10)**: Dokter mengisi tindakan dan catatan untuk janji pasien berstatus Hadir, lalu menandai Selesai.
17. **Melihat Riwayat Pasien Tertangani (4.11)**: Dokter melihat riwayat catatan perawatan pasien yang pernah ditangani oleh dokter tersebut sebelumnya.
18. **Melihat Dasbor Admin (4.12)**: Super Admin melihat ringkasan metrik kunjungan hari ini, kunjungan bulan ini, dan janji menunggu konfirmasi.
19. **Mengelola Pengguna & Peran (4.13)**: Super Admin mengubah peran pengguna (`pasien`, `resepsionis`, `dokter`, `super_admin`) dan menonaktifkan akun pengguna.
20. **Mengelola Layanan Klinik (4.14)**: Super Admin menambah, mengedit durasi, harga, dan status aktif layanan klinik.
21. **Mengelola Jadwal Dokter (4.15)**: Super Admin mengatur hari (Senin-Sabtu) dan jam praktik tiap dokter.
22. **Melihat Laporan Kunjungan (4.16)**: Super Admin melihat rekap laporan kunjungan per dokter dan per layanan berdasarkan bulan terpilih.

---

## 2. Matriks Akses

| Fitur (Subbab PRD) | Pengunjung | Pasien | Resepsionis | Dokter | Super Admin |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Daftar Akun Baru (4.1) | ✓ | ✕ (diarahkan ke beranda) | ✕ (diarahkan ke dasbor) | ✕ (diarahkan ke dasbor) | ✕ (diarahkan ke admin) |
| Masuk Akun / Login (4.1) | ✓ | ✕ (diarahkan ke beranda) | ✕ (diarahkan ke dasbor) | ✕ (diarahkan ke dasbor) | ✕ (diarahkan ke admin) |
| Beranda & Janji Terdekat (4.2) | ✕ | ✓ milik sendiri | ✕ | ✕ | ✓ |
| Membuat Janji Temu (4.3.1) | ✕ | ✓ milik sendiri | ✕ | ✕ | ✓ |
| Melihat Daftar & Rincian Janji (4.3.2) | ✕ | ✓ milik sendiri | ✕ | ✕ | ✓ |
| Membatalkan Janji Temu Sendiri (4.3.2) | ✕ | ✓ milik sendiri (H-1) | ✕ | ✕ | ✓ |
| Melihat Riwayat Perawatan Pribadi (4.4) | ✕ | ✓ milik sendiri | ✕ | ✕ | ✓ |
| Memperbarui Profil (4.5) | ✕ | ✓ profil sendiri | ✓ profil sendiri | ✓ profil sendiri | ✓ profil sendiri |
| Dasbor Resepsionis (4.6) | ✕ | ✕ | ✓ | ✕ | ✓ |
| Mengonfirmasi & Jadwal Ulang Janji (4.7) | ✕ | ✕ | ✓ | ✕ | ✓ |
| Membatalkan Janji dg Alasan (4.7) | ✕ | ✕ | ✓ | ✕ | ✓ |
| Menandai Pasien Hadir (4.7) | ✕ | ✕ | ✓ | ✕ | ✓ |
| Data Kontak Pasien (4.8) | ✕ | ✕ | ✓ | ✕ | ✓ |
| Dasbor Dokter Hari Ini (4.9) | ✕ | ✕ | ✕ | ✓ milik sendiri | ✓ |
| Mengisi Pemeriksaan & Selesai (4.10) | ✕ | ✕ | ✕ | ✓ janji sendiri | ✓ |
| Melihat Riwayat Pasien Tertangani (4.11) | ✕ | ✕ | ✕ | ✓ pasien yg ditangani | ✓ |
| Dasbor Admin (4.12) | ✕ | ✕ | ✕ | ✕ | ✓ |
| Kelola Pengguna & Ubah Peran (4.13) | ✕ | ✕ | ✕ | ✕ | ✓ |
| Kelola Layanan (4.14) | ✕ | ✕ | ✕ | ✕ | ✓ |
| Kelola Jadwal Dokter (4.15) | ✕ | ✕ | ✕ | ✕ | ✓ |
| Melihat Laporan Kunjungan (4.16) | ✕ | ✕ | ✕ | ✕ | ✓ |

---

## 3. Peta Route

| Halaman | Alamat URL | Peran yang Boleh Membuka | Jika Belum Masuk | Jika Peran Lain (Tidak Berhak) |
| :--- | :--- | :--- | :--- | :--- |
| Daftar Akun | `/daftar` | Pengunjung (Belum masuk) | Halaman terbuka | Dialihkan ke halaman sesuai perannya |
| Masuk Akun | `/masuk` | Pengunjung (Belum masuk) | Halaman terbuka | Dialihkan ke halaman sesuai perannya |
| Beranda Pasien | `/beranda` | `pasien`, `super_admin` | Dialihkan ke `/masuk` | Akses Ditolak |
| Janji Saya (Daftar) | `/janji` | `pasien`, `super_admin` | Dialihkan ke `/masuk` | Akses Ditolak |
| Buat Janji | `/janji/baru` | `pasien`, `super_admin` | Dialihkan ke `/masuk` | Akses Ditolak |
| Rincian Janji Pasien | `/janji/[id]` | `pasien`, `super_admin` | Dialihkan ke `/masuk` | Akses Ditolak |
| Riwayat Perawatan Pasien | `/riwayat` | `pasien`, `super_admin` | Dialihkan ke `/masuk` | Akses Ditolak |
| Profil Pengguna | `/profil` | `pasien`, `resepsionis`, `dokter`, `super_admin` | Dialihkan ke `/masuk` | Akses Ditolak |
| Dasbor Resepsionis | `/resepsionis` | `resepsionis`, `super_admin` | Dialihkan ke `/masuk` | Akses Ditolak |
| Kelola Janji Resepsionis | `/resepsionis/janji` | `resepsionis`, `super_admin` | Dialihkan ke `/masuk` | Akses Ditolak |
| Rincian Janji Resepsionis | `/resepsionis/janji/[id]` | `resepsionis`, `super_admin` | Dialihkan ke `/masuk` | Akses Ditolak |
| Data Pasien Resepsionis | `/resepsionis/pasien` | `resepsionis`, `super_admin` | Dialihkan ke `/masuk` | Akses Ditolak |
| Dasbor Dokter | `/dokter` | `dokter`, `super_admin` | Dialihkan ke `/masuk` | Akses Ditolak |
| Pemeriksaan Dokter | `/dokter/janji/[id]` | `dokter`, `super_admin` | Dialihkan ke `/masuk` | Akses Ditolak |
| Riwayat Pasien Dokter | `/dokter/pasien/[id]` | `dokter`, `super_admin` | Dialihkan ke `/masuk` | Akses Ditolak |
| Dasbor Super Admin | `/admin` | `super_admin` | Dialihkan ke `/masuk` | Akses Ditolak |
| Kelola Pengguna | `/admin/pengguna` | `super_admin` | Dialihkan ke `/masuk` | Akses Ditolak |
| Rincian/Ubah Pengguna | `/admin/pengguna/[id]` | `super_admin` | Dialihkan ke `/masuk` | Akses Ditolak |
| Kelola Layanan | `/admin/layanan` | `super_admin` | Dialihkan ke `/masuk` | Akses Ditolak |
| Kelola Jadwal Dokter | `/admin/jadwal-dokter` | `super_admin` | Dialihkan ke `/masuk` | Akses Ditolak |
| Laporan Kunjungan | `/admin/laporan` | `super_admin` | Dialihkan ke `/masuk` | Akses Ditolak |

---

## 4. Jawaban Keputusan Wajib Rancangan

Berikut adalah 4 keputusan wajib yang harus dijawab dengan merujuk langsung ke PRD Klinik Gigi Senyum Rekah:

### 1. Bolehkah resepsionis membaca catatan perawatan?
> **Jawaban: TIDAK BOLEH.**
> **Dasar PRD:**
> - **Bab 1 (Ringkasan Eksekutif):** *"Catatan perawatan tetap rahasia. Resepsionis tidak bisa membacanya, dan dokter hanya membaca catatan pasien yang ia tangani."*
> - **Bab 2.3 & 2.4 (Hak akses per modul & Yang tidak boleh dilihat tiap peran):** Pada baris Catatan Perawatan, kolom Resepsionis tertulis tegas *"Tidak tampil"*.
> - **Bab 4.7 & 4.8 (Kelola Janji & Data Pasien):** *"Rincian untuk resepsionis tidak menampilkan catatan perawatan."* dan *"Batasan v1: resepsionis tidak bisa membaca catatan perawatan dari halaman mana pun."*

### 2. Bolehkah drg. Bima membuka pemeriksaan janji drg. Sinta?
> **Jawaban: TIDAK BOLEH.**
> **Dasar PRD:**
> - **Bab 4.9 (Dasbor Dokter):** *"Perilaku otomatis: hanya janji dengan dokterId miliknya yang tampil. Janji drg. Sinta tidak terlihat oleh drg. Bima."*
> - **Bab 4.10 (Pemeriksaan):** *"Validasi: hanya janji milik dokter itu yang berstatus Hadir yang bisa diisi. Bila ID diganti dengan janji dokter lain, tampil 'Janji tidak ditemukan'."*
> - **Bab 8 (Pengujian - Uji Tembus):** Menyatakan secara eksplisit bahwa upaya drg. Bima membuka Pemeriksaan untuk janji drg. Sinta harus ditolak.

### 3. Bolehkah pasien melihat jam yang sudah terisi pasien lain?
> **Jawaban: TIDAK BOLEH.**
> **Dasar PRD:**
> - **Bab 1 (Ringkasan Eksekutif):** *"Pasien hanya bisa memilih slot jam yang masih kosong."*
> - **Bab 2.4 (Yang tidak boleh dilihat):** Janji dan kontak pasien lain bagi pasien bertatus *"Tidak tampil"*.
> - **Bab 4.3.1 (Buat Janji):** *"Slot yang bertabrakan dengan janji lain dokter itu yang belum dibatalkan tidak ditampilkan. Untuk mengetahuinya, aplikasi membaca koleksi slot_terisi yang hanya berisi dokter, tanggal, jam, dan durasi, tanpa nama atau keluhan pasien."*
> Jadi pasien hanya disuguhkan slot jam yang tersedia/kosong, tanpa pernah melihat data atau jam milik pasien lain.

### 4. Halaman mana saja yang boleh dibuka Bu Ratna?
> **Jawaban: SEMUA HALAMAN APLIKASI (Termasuk seluruh kelompok Pasien, Resepsionis, Dokter, dan Admin).**
> **Dasar PRD:**
> - **Bab 2.1 (Empat pemegang akun):** Bu Ratna sebagai `super_admin` memiliki: *"Semua hak tiga peran lain, ditambah mengelola pengguna, layanan, jadwal dokter, dan laporan."*
> - **Bab 3.1 (Peta modul):** Di bawah judul Super Admin: *"(semua menu peran lain, ditambah) Dasbor Admin, Kelola Pengguna, Layanan, Jadwal Dokter, Laporan"*.
> - **Bab 4.12 (Dasbor Admin):** *"Menu samping Super Admin juga memuat semua menu peran lain."*
> - **Bab 5.1 & Tabel Uji:** Super Admin diizinkan membuka `/beranda`, `/janji`, `/riwayat`, `/resepsionis`, `/resepsionis/janji`, `/resepsionis/pasien`, `/dokter`, `/dokter/janji/[id]`, `/admin`, `/admin/pengguna`, `/admin/layanan`, `/admin/jadwal-dokter`, dan `/admin/laporan`.
