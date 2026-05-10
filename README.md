# SIA Web Multi Halaman + Modul Operasional POS

Versi ini sudah diperbarui agar lebih sesuai dengan rancangan **NusaBuku / SIA UMKM**: sistem tidak hanya mencatat siklus akuntansi, tetapi juga mendukung alur operasional kasir, persediaan, HPP, hutang-piutang, HR, payroll, PPh 21 sederhana, dan laporan owner.

## Halaman utama
- `index.html` — Dashboard SIA
- `transaksi.html` — Input transaksi akuntansi, daftar transaksi, dan jurnal manual
- `operasional.html` — **Modul baru: setup perusahaan jasa/dagang, POS, pembelian, persediaan, HPP, hutang-piutang, HR, payroll, PPh 21, jurnal operasional, dan laporan owner**
- `jurnal-umum.html` — Jurnal umum
- `buku-besar.html` — Buku besar
- `neraca-saldo.html` — Neraca saldo
- `laba-rugi.html` — Laporan laba rugi
- `perubahan-modal.html` — Laporan perubahan modal
- `jurnal-penutup.html` — Jurnal penutup
- `neraca-saldo-penutup.html` — Neraca saldo setelah penutup
- `neraca.html` — Neraca

## File penting
- `styles.css` — UI aplikasi utama
- `operasional.css` — style untuk halaman POS
- `data.js` — akun, saldo awal, dan data demo siklus akuntansi
- `app.js` — logika siklus akuntansi, auth, sinkronisasi cloud, import/export, dan render halaman akuntansi
- `operasional.js` — logika POS, HPP, kartu stok, hutang-piutang, HR, payroll, laporan operasional, dan sinkronisasi Firebase
- `firebase-config.js` — config Firebase
- `firebase-config.example.js` — contoh config
- `firestore.rules` — rules Firestore


## Update versi 2.3 — POS full Firebase + auto login
Modul `operasional.html` sekarang sudah tersambung ke Firebase Auth dan Cloud Firestore. Sesi Google memakai Firebase app default yang sama dengan halaman SIA lain, sehingga jika user sudah login di Dashboard/Jurnal, halaman Operasional POS otomatis membaca akun yang sama tanpa login ulang.

Struktur Firestore yang dipakai:
- `siaUsers/{uid}/apps/operasional-pos` — master dan transaksi Operasional POS: produk, kontak, penjualan, pembelian, pegawai, absensi, payroll, dan setup perusahaan.
- `siaUsers/{uid}/apps/primary` — data SIA utama yang dipakai halaman Transaksi, Jurnal Umum, Buku Besar, Neraca Saldo, Laba Rugi, dan Neraca.

Alur sinkronisasi:
1. User login Google di salah satu halaman SIA.
2. Saat membuka Operasional POS, sistem otomatis membaca sesi login yang sama.
3. Sistem memuat data POS dari Firestore.
4. Input penjualan, pembelian, atau payroll otomatis tersimpan ke Firestore.
5. Jurnal otomatis dari POS ikut ditulis ke dokumen SIA utama (`primary`).
6. Halaman akuntansi lama dapat membaca transaksi POS dari cloud yang sama.

Catatan teknis:
- `localStorage` tetap dipakai sebagai cache lokal agar aplikasi tetap bisa dibuka saat koneksi Firebase bermasalah.
- Jika user belum login Google, tombol status menampilkan mode lokal dan data belum tersimpan ke Firebase.
- Firestore rules tetap memakai pola `siaUsers/{userId}/apps/{docId}` sehingga setiap user hanya dapat membaca/menulis datanya sendiri.

## Update besar versi 2.0 POS

### 1. Setup jenis perusahaan
Pada halaman `operasional.html`, pengguna dapat memilih:
- **Perusahaan jasa** — HPP barang dagang nonaktif. Perlengkapan/peralatan diperlakukan sebagai aset/operasional.
- **Perusahaan dagang** — HPP aktif, persediaan barang dagang aktif, dan kartu stok dipakai.

### 2. POS penjualan
Modul penjualan mendukung:
- pilih pelanggan,
- pilih produk/jasa,
- qty,
- diskon,
- PPN 11%,
- status lunas/belum lunas,
- metode kas/bank,
- jurnal otomatis.

Untuk perusahaan dagang, penjualan barang otomatis membuat jurnal:
- Debit Kas/Bank/Piutang
- Kredit Penjualan Barang / Pendapatan Jasa
- Kredit PPN Keluaran jika aktif
- Debit HPP
- Kredit Persediaan Barang Dagang

### 3. Pembelian dan persediaan
Modul pembelian mendukung:
- pilih vendor,
- barang/jasa/perlengkapan/peralatan,
- qty,
- harga beli,
- diskon,
- PPN Masukan,
- status lunas/belum lunas,
- stok masuk otomatis.

### 4. Kartu stok
Halaman persediaan menampilkan:
- SKU,
- nama item,
- jenis item,
- harga beli,
- harga jual,
- stok masuk,
- stok keluar,
- stok akhir,
- nilai persediaan.

### 5. Hutang-piutang
Modul hutang/piutang menampilkan transaksi belum lunas dan menyediakan tombol **Tandai Lunas**.

### 6. HR, absensi, payroll, dan PPh 21
Modul HR mendukung:
- data pegawai,
- absensi manual,
- proses payroll,
- estimasi PPh 21 sederhana berdasarkan PTKP,
- jurnal payroll otomatis.

Catatan: perhitungan PPh 21 pada modul ini masih bersifat **estimasi rancangan**, belum menggantikan sistem pajak resmi.

### 7. Export/import khusus operasional
Modul operasional sudah terhubung ke Firebase saat login Google dan tetap menyediakan backup manual. Tersedia:
- Export Operasional,
- Import Operasional,
- Reset Operasional.

## Tetap didukung
- GitHub Pages
- VS Code Live Server / Go Live
- Login Google Firebase Auth pada halaman akuntansi lama
- Sinkronisasi data per user ke Cloud Firestore pada halaman akuntansi lama
- Import / export JSON untuk backup manual

## Cara menjalankan lokal
1. Buka folder ini di VS Code.
2. Jalankan **Go Live** / Live Server.
3. Buka `index.html`.
4. Klik menu **Operasional POS**. Jika sudah login di Dashboard, halaman ini otomatis memakai akun yang sama.

## Catatan integrasi
`operasional.html` berisi fitur operasional POS yang siap dipakai untuk presentasi/asistensi. Data operasional tersimpan di Firebase pada dokumen `operasional-pos`, lalu jurnal otomatisnya disalin ke dokumen utama `primary`. Dengan begitu, transaksi POS dapat terbaca oleh halaman Transaksi, Jurnal Umum, Buku Besar, Neraca Saldo, Laba Rugi, dan Neraca setelah user login Google di salah satu halaman SIA.

## Tes cepat
1. Buka `operasional.html`.
2. Pilih **Perusahaan Dagang**.
3. Input penjualan barang dagang.
4. Cek tab **Persediaan**, stok harus berkurang.
5. Cek tab **Jurnal Operasional**, harus muncul jurnal penjualan dan HPP.
6. Cek tab **Laporan**, HPP dan laba kotor harus tampil.
7. Ubah setup menjadi **Perusahaan Jasa**, lalu cek bahwa HPP barang dagang tidak dipakai.
