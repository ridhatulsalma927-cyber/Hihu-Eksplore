Bertindaklah sebagai System Analyst dan Software Engineer. Buat **SPEC.md** untuk aplikasi "HalalExplore Aceh", aplikasi halal tourism berbasis web untuk membantu wisatawan menemukan destinasi wisata, kuliner halal, akomodasi ramah Muslim, dan pengalaman budaya di wilayah Aceh.

**Pengguna**: wisatawan domestik, wisatawan mancanegara, pelaku UMKM pariwisata, dan pengelola informasi destinasi wisata.

**Fitur MVP**: - Landing page dengan informasi dan promosi wisata Aceh. - Katalog minimal 12 destinasi wisata contoh. - Cakupan wilayah Banda Aceh, Sabang, Aceh Besar, Aceh Tengah, dan Bener Meriah. - Kategori wisata religi, alam, bahari, sejarah, budaya, dan kuliner. - Informasi detail destinasi, foto, deskripsi, lokasi, estimasi biaya, dan fasilitas. - Informasi fasilitas ibadah dan layanan ramah Muslim. - Katalog kuliner halal dan produk UMKM lokal. - Katalog akomodasi ramah Muslim. - Informasi status verifikasi sertifikasi halal. - Pencarian, filter wilayah, filter kategori, dan sorting. - Peta ilustratif destinasi dan tautan Google Maps. - Fitur favorit destinasi wisata. - Travel itinerary planner untuk menyusun perjalanan selama 1--5 hari. - Kalkulator estimasi anggaran perjalanan. - Rekomendasi paket wisata berdasarkan minat dan anggaran menggunakan rule-based filtering. - Tombol kontak WhatsApp untuk pelaku UMKM atau penyedia layanan wisata dalam mode demo. - Pilihan bahasa Indonesia dan Inggris. - Dashboard demo CRUD untuk pengelolaan destinasi, kuliner, akomodasi, dan paket wisata. - Penyimpanan data favorit, itinerary, dan konfigurasi menggunakan localStorage.

**Data Model**: - Destinasi: id, nama, kategori, wilayah, deskripsi, imageUrl, alamat, mapsUrl, estimasiBiaya, fasilitas, fasilitasIbadah, unggulan. - Kuliner: id, nama, kategori, wilayah, harga, imageUrl, statusSertifikasiHalal, sumberVerifikasi, kontak. - Akomodasi: id, nama, wilayah, hargaPerMalam, fasilitas, fasilitasRamahMuslim, imageUrl, kontak. - PaketWisata: id, nama, durasi, daftarDestinasi, estimasiBiaya, deskripsi. - Itinerary: id, namaPerjalanan, tanggalMulai, jumlahHari, jumlahWisatawan, daftarAktivitas, totalAnggaran. - Favorit: id, itemId, tipeItem, tanggalDitambahkan.

**Tech Stack**: Vite + JavaScript vanilla, HTML5, CSS3, SVG untuk peta ilustratif, serta tautan Google Maps tanpa API key; tanpa backend dan tanpa login palsu.

**Tema UI/UX**: modern halal tourism, premium travel editorial, kombinasi warna emerald green, turquoise, gold, dan putih, menggunakan elemen visual yang terinspirasi dari motif khas Aceh, fotografi destinasi wisata, serta desain responsif untuk desktop dan smartphone.

**Batasan**: jangan menyimpan API key, jangan menjalankan perintah berbahaya, gunakan data contoh nonpribadi, gunakan gambar lokal atau placeholder bebas lisensi, jangan mengklaim suatu produk memiliki sertifikasi halal tanpa verifikasi resmi, jangan mengarang rating wisatawan sebagai ulasan nyata, dan tandai estimasi harga serta kontak sebagai data simulasi.

Informasi destinasi nyata yang belum diverifikasi harus diberi keterangan. Bedakan fasilitas ramah Muslim dengan status sertifikasi halal resmi.

**Kriteria penerimaan** harus dapat diperiksa secara manual, termasuk pencarian destinasi, filter wilayah, filter kategori, penyimpanan favorit, penyusunan itinerary, kalkulasi anggaran, pergantian bahasa, rekomendasi paket wisata, dan fungsi dashboard CRUD.

**Output**: tujuan, pengguna, daftar fitur, data model, nonfunctional requirements, risiko, out-of-scope, acceptance criteria, dan implementation plan per iterasi.

Buatkan prototype-nya dalam single HTML yang sudah mencakup CSS dan JavaScript, dapat langsung dijalankan melalui browser tanpa instalasi tambahan. Pastikan seluruh fitur utama berfungsi dan bukan sekadar tampilan visual.
