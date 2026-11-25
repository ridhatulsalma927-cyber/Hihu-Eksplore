# SPEC.md — Hihu Eksplor

## 1. Tujuan Aplikasi
**Hihu Eksplor** adalah aplikasi web panduan pariwisata ramah Muslim (*halal tourism*) yang dirancang dengan pendekatan editorial perjalanan modern untuk membantu wisatawan menemukan destinasi wisata, kuliner halal, produk UMKM lokal, akomodasi ramah Muslim, serta pengalaman budaya di Provinsi Aceh.

Aplikasi ini menggabungkan informasi fasilitas ibadah yang jelas, pembedaan tegas antara **status sertifikasi halal resmi** dan **fasilitas ramah Muslim**, peta interaktif realistis Google Maps (dengan tampilan peta jalan, satelit, hibrida, topografi, serta pencarian masjid/kuliner halal via Places API New), penyusun rencana perjalanan (*itinerary planner*) 1–5 hari, kalkulator estimasi anggaran, rekomendasi paket berbasis aturan (*rule-based filtering*), serta dashboard CRUD lokal berbasis `localStorage` tanpa ketergantungan backend atau login palsu.

---

## 2. Target Pengguna
1. **Wisatawan Domestik**: Wisatawan dari berbagai daerah di Indonesia yang mencari destinasi religi, bahari, sejarah, dan kuliner Aceh dengan informasi fasilitas ibadah serta estimasi biaya yang transparan.
2. **Wisatawan Mancanegara**: Pengunjung internasional (khususnya Malaysia, Brunei, Timur Tengah, dan global) yang membutuhkan antarmuka dwibahasa (Indonesia/Inggris), panduan fasilitas ramah Muslim, dan rute Google Maps langsung.
3. **Pelaku UMKM Pariwisata**: Penyedia kuliner khas Aceh, kopi Gayo, penginapan syariah, dan pemandu lokal yang dapat dihubungi melalui tombol simulasi WhatsApp.
4. **Pengelola Informasi Destinasi Wisata**: Admin atau kurator konten lokal yang menguji penambahan, penyuntingan, dan penghapusan data destinasi, kuliner, akomodasi, serta paket wisata melalui Dashboard Demo CRUD.

---

## 3. Daftar Fitur MVP
1. **Landing Page Editorial Aceh**: Informasi dan promosi wisata Aceh dengan motif visual khas Aceh (*Pinto Aceh* & *Bungong Seulanga*), palet Emerald, Turquoise, Gold, dan Alabaster, serta penegasan transparansi data simulasi.
2. **Katalog Minimal 12 Destinasi Wisata (15 Data Contoh)**: Mencakup 5 wilayah (Banda Aceh, Sabang, Aceh Besar, Aceh Tengah, Bener Meriah) dan 6 kategori (Religi, Alam, Bahari, Sejarah, Budaya, Kuliner).
3. **Detail Destinasi Lengkap**: Foto/ilustrasi lokal, deskripsi dwibahasa, alamat, tautan Google Maps tanpa API key, estimasi biaya simulasi, fasilitas umum, **fasilitas ibadah & layanan ramah Muslim**, serta keterangan status verifikasi informasi destinasi.
4. **Katalog Kuliner Halal & Produk UMKM Lokal**: Informasi harga simulasi, asal wilayah, kontak simulasi, **status sertifikasi halal** (*Tersertifikasi Halal Resmi*, *Proses Verifikasi*, *Klaim Mandiri Pelaku Usaha*), dan sumber verifikasi.
5. **Katalog Akomodasi Ramah Muslim**: Informasi harga per malam simulasi, fasilitas umum, dan **fasilitas ramah Muslim** (arah kiblat, perlengkapan shalat, dapur bebas alkohol/babi, kebijakan keluarga syariah) yang dibedakan secara eksplisit dari sertifikasi halal resmi.
6. **Pencarian, Filter, dan Sorting**: Pencarian kata kunci, filter wilayah, filter kategori, filter status sertifikasi halal (pada kuliner), dan pengurutan (Unggulan, Biaya Terendah, Biaya Tertinggi, Nama A–Z).
7. **Peta Interaktif Realistis Google Maps & Places**: Peta nyata wilayah Banda Aceh, Sabang, Aceh Besar, Aceh Tengah, dan Bener Meriah menggunakan Maps JavaScript API (`AdvancedMarkerElement`, `InfoWindow`, mode satelit/medan/hibrida) serta pencarian lokasi ramah Muslim secara langsung melalui Places API (New).
8. **Fitur Favorit**: Menyimpan destinasi, kuliner, dan akomodasi ke daftar favorit di `localStorage`, lengkap dengan tanggal ditambahkan dan panel pengelola favorit.
9. **Travel Itinerary Planner (1–5 Hari)**: Menentukan nama perjalanan, tanggal mulai, durasi 1–5 hari, jumlah wisatawan, memilih akomodasi serta aktivitas harian dari katalog maupun entri kustom.
10. **Kalkulator Estimasi Anggaran Perjalanan**: Menghitung otomatis estimasi biaya destinasi, akomodasi per malam, konsumsi harian, dan transportasi antardaerah/penyeberangan dalam format angka tabular yang mudah dibaca.
11. **Rekomendasi Paket Wisata (Rule-Based Filtering)**: Memfilter dan mengurutkan paket wisata berdasarkan minat kategori, durasi (1–5 hari), wilayah, dan batas anggaran, disertai penjelasan kriteria kecocokan yang transparan serta tombol muat langsung ke Itinerary Planner.
12. **Kontak WhatsApp Mode Demo**: Modal simulasi komunikasi WhatsApp untuk pelaku UMKM kuliner/akomodasi/paket wisata dengan opsi pratinjau pesan otomatis dan tanda bahwa nomor bersifat simulasi.
13. **Pilihan Bahasa Indonesia & Inggris (ID / EN)**: Alih bahasa instan pada seluruh antarmuka dan konten utama yang tersimpan di `localStorage`.
14. **Dashboard Demo CRUD**: Pengelolaan Create, Read, Update, Delete untuk entitas Destinasi, Kuliner, Akomodasi, dan Paket Wisata, disertai fitur reset ke data awal.
15. **Persistensi `localStorage`**: Penyimpanan otomatis data katalog hasil suntingan, daftar favorit, daftar itinerary, dan preferensi bahasa di browser pengguna.

---

## 4. Data Model
Seluruh entitas disimpan dalam struktur objek JavaScript yang tersinkronisasi dengan `localStorage`:

- **Destinasi**:
  `{ id, nama, namaEn, kategori, wilayah, deskripsi, deskripsiEn, imageUrl, alamat, mapsUrl, estimasiBiaya, fasilitas[], fasilitasIbadah[], unggulan, statusVerifikasi, koordinatPeta: { x, y } }`
- **Kuliner**:
  `{ id, nama, namaEn, kategori, wilayah, harga, imageUrl, statusSertifikasiHalal, sumberVerifikasi, kontak, deskripsi, deskripsiEn }`
- **Akomodasi**:
  `{ id, nama, wilayah, hargaPerMalam, fasilitas[], fasilitasRamahMuslim[], statusSertifikasiHalal, imageUrl, kontak, deskripsi, deskripsiEn }`
- **PaketWisata**:
  `{ id, nama, namaEn, durasi, daftarDestinasi[], estimasiBiaya, deskripsi, deskripsiEn, minat[], wilayahUtama }`
- **Itinerary**:
  `{ id, namaPerjalanan, tanggalMulai, jumlahHari, jumlahWisatawan, akomodasiId, estimasiKonsumsiHarian, estimasiTransport, daftarAktivitas[{ id, hari, itemId, tipe, judul, wilayah, estimasiBiaya, waktu }], totalAnggaran }`
- **Favorit**:
  `{ id, itemId, tipeItem, tanggalDitambahkan }`

---

## 5. Non-Functional Requirements
1. **Tech Stack Murni**: Vite + Vanilla JavaScript (ES Modules), HTML5 semantik, CSS3 modern dengan CSS Custom Properties, dan SVG inline/lokal tanpa framework UI eksternal dan tanpa backend.
2. **Keamanan & Privasi**: Tidak menyimpan API key apa pun, tidak menggunakan `innerHTML` tanpa sanitasi (`escapeHtml` untuk seluruh input pengguna), serta tidak menggunakan data pribadi nyata.
3. **Kejujuran Informasi & Kepatuhan Halal**:
   - Tidak mengarang ulasan atau rating bintang wisatawan fiktif.
   - Membedakan secara tegas antara *Fasilitas Ramah Muslim* dan *Sertifikasi Halal Resmi*.
   - Menandai seluruh estimasi harga dan nomor kontak sebagai data simulasi, serta memberi keterangan status verifikasi pada destinasi nyata.
4. **Aksesibilitas & Responsivitas**: Kontras minimal WCAG AA, fokus keyboard (`focus-visible`), target sentuh $\ge 44\text{px}$ pada perangkat mobile, responsif penuh untuk layar desktop (1440px) hingga smartphone (375px), dan menghormati `prefers-reduced-motion`.
5. **Kinerja**: Zero broken images dengan aset SVG lokal di `/public/images/`, angka tabular pada seluruh kalkulasi anggaran, dan pembaruan DOM cepat tanpa reload halaman.

---

## 6. Risiko & Mitigasi
| Risiko | Dampak | Mitigasi |
| :--- | :--- | :--- |
| Kesalahpahaman antara fasilitas ramah Muslim dan sertifikasi halal resmi | Informasi menyesatkan bagi wisatawan Muslim | Label terpisah, banner klarifikasi, dan kolom `sumberVerifikasi` eksplisit di katalog & dashboard. |
| Data harga atau kontak dianggap tarif mengikat / nomor aktif | Keluhan pengguna saat berkunjung | Penandaan eksplisit `(Estimasi Simulasi)` dan modal konfirmasi demo pada tombol WhatsApp. |
| Perubahan data CRUD merusak referensi itinerary/favorit | Error saat merender detail item | Penanganan fallback aman (`item tidak ditemukan`) serta tombol Reset Data Demo di Dashboard. |
| Ketergantungan host gambar eksternal | Gambar gagal dimuat di lingkungan sandbox/offline | Seluruh ilustrasi menggunakan aset SVG lokal di `/public/images/` disertai kontainer fallback. |

---

## 7. Out-of-Scope
- Autentikasi pengguna, sistem login/registrasi nyata, atau manajemen peran berbasis server.
- Integrasi pembayaran online (*payment gateway*) maupun pemesanan tiket/hotel secara real-time.
- Koneksi API langsung ke BPJPH atau LPPOM MUI.
- Sistem ulasan/komentar publik dan rating bintang berbasis database.

---

## 8. Acceptance Criteria (Pemeriksaan Manual)
1. **Pencarian & Filter Katalog**: Memasukkan kata kunci pada kolom cari, memilih wilayah (mis. `Sabang`), memilih kategori (mis. `Bahari`), dan mengubah urutan sorting harus memperbarui daftar dari $\ge 12$ destinasi secara instan.
2. **Detail & Fasilitas Ibadah**: Mengklik satu destinasi membuka detail lengkap yang menampilkan fasilitas ibadah, keterangan verifikasi, estimasi biaya simulasi, dan tautan Google Maps yang valid.
3. **Pembedaan Halal & Ramah Muslim**: Katalog kuliner menampilkan status sertifikasi halal + sumber verifikasi; katalog akomodasi menampilkan fasilitas ramah Muslim yang terpisah dari klaim sertifikasi resmi.
4. **Peta Realistis Google Maps**: Mengklik wilayah, pin marker pada Google Maps, atau mencari masjid/restoran halal memunculkan lokasi nyata pada peta interaktif beserta ringkasan destinasi dan tautan Google Maps.
5. **Penyimpanan Favorit**: Menekan tombol Favorit pada destinasi/kuliner/akomodasi menambahkannya ke daftar Favorit dan tetap tersimpan setelah halaman di-refresh (`localStorage`).
6. **Itinerary & Kalkulator Anggaran**: Pengguna dapat membuat rencana 1–5 hari, menambah/menghapus aktivitas per hari, mengubah jumlah wisatawan/akomodasi, melihat rincian & total anggaran terhitung otomatis, dan data tetap tersimpan setelah refresh.
7. **Rekomendasi Paket Wisata**: Mengubah anggaran, durasi, dan minat pada pencari paket menghasilkan daftar rekomendasi sesuai aturan filter dan dapat dimuat ke Itinerary Planner.
8. **Kontak WhatsApp Demo**: Menekan tombol WhatsApp menampilkan dialog simulasi kontak pelaku UMKM beserta pratinjau pesan dan label simulasi.
9. **Pergantian Bahasa**: Mengklik pengalih bahasa `ID / EN` mengubah seluruh teks antarmuka dan deskripsi konten serta bertahan setelah halaman dimuat ulang.
10. **Dashboard CRUD**: Menambah, menyunting, dan menghapus data Destinasi, Kuliner, Akomodasi, maupun Paket Wisata di Dashboard langsung memperbarui tampilan katalog dan tersimpan di `localStorage`.

---

## 9. Implementation Plan per Iterasi
- **Iterasi 1 — Fondasi Proyek & Arsitektur Data**: Transformasi struktur proyek Vite ke Vanilla JS + HTML5 + CSS3, perancangan `SPEC.md`, pemodelan dataset (15 destinasi, 8 kuliner, 6 akomodasi, 5 paket), kamus i18n ID/EN, dan utilitas `localStorage`.
- **Iterasi 2 — Aset Visual Lokal & Sistem Desain Editorial**: Pembuatan ilustrasi SVG lokal untuk destinasi/kuliner/akomodasi Aceh serta implementasi CSS3 bertema *modern halal tourism* (Emerald, Turquoise, Gold, Alabaster, motif geometris Aceh).
- **Iterasi 3 — Katalog, Pencarian, Detail, & Peta SVG**: Implementasi katalog destinasi, kuliner, akomodasi, filter/sorting, modal detail fasilitas ibadah, WhatsApp demo modal, dan peta SVG interaktif Aceh.
- **Iterasi 4 — Favorit, Itinerary Planner, Kalkulator Anggaran, & Paket Rule-Based**: Implementasi manajemen favorit, perencana perjalanan 1–5 hari, kalkulator anggaran dinamis, dan mesin rekomendasi paket berbasis aturan.
- **Iterasi 5 — Dashboard CRUD & Verifikasi Akhir**: Implementasi form CRUD lengkap untuk 4 entitas, sinkronisasi `localStorage`, fitur reset demo, audit aksesibilitas/keamanan (XSS escaping), kompilasi Vite, dan verifikasi fungsional manual.
