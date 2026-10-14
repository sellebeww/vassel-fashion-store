# Audit VASSEL — 14 Oktober 2026

## Hasil implementasi

Prototipe localStorage telah diganti dengan toko yang memakai backend Express + SQLite. Logo asli tetap dipakai; storefront menggunakan kembali desain editorial sebelumnya, pilihan English / Français, Rupiah, tipografi Bodoni/Jost lokal, dan palet ivory–espresso. Kode aktif ada di `src/shop/`, `src/App.tsx`, dan `server/`.

- 125 produk contoh, 25 per kategori, 3 visual per produk, SKU produk/varian unik, varian warna+ukuran, harga bervariasi, stok normal/menipis/habis, 5 produk tersembunyi.
- Pembeli: daftar, login, logout, reset token sekali pakai, profil, buku alamat, wishlist, pencarian/filter/sort/load more, galeri, panduan ukuran, related products, keranjang, checkout wajib login, promo, pesanan dan pelacakan.
- Admin: role diperiksa di server; dashboard, CRUD produk/foto/varian, diskon, stok, kategori/koleksi, pesanan/resi, pelanggan, kupon, homepage, urutan section, newsletter, restock, wishlist, keranjang tersimpan, ulasan, statistik view/aksi, riwayat stok.
- Checkout memakai harga server, transaksi stok, conditional decrement, dan idempotency key. Pesanan kedua untuk stok terakhir ditolak. Pembatalan hanya mengembalikan stok sekali. Total yang berubah perlu ditinjau kembali.
- Editor produk memeriksa versi agar data stok lama tidak menimpa checkout baru. Penghapusan produk/varian dengan pesanan aktif ditolak. Gambar yang tidak ada atau jenis media tidak sesuai ditolak oleh server.
- Perubahan admin disiarkan melalui server-sent events. Buyer menerima harga/visibilitas/hero baru tanpa reload; ada refresh saat tab aktif dan fallback berkala.
- Password scrypt, sesi HttpOnly, token sesi di-hash di database, same-origin mutation check, rate limit autentikasi, order ownership check, dan reset yang membatalkan seluruh sesi lama.

## Temuan dan perbaikan selama QA

1. Filter select memiliki label implisit yang mencakup teks opsi: diperbaiki dengan nama aksesibel eksplisit.
2. Navigasi admin menyebabkan overflow HP: lebar grid/nav dibatasi; tabel panjang menggulir di wadah sendiri.
3. Baris navigasi admin HP mengambil tinggi kosong: distribusi baris grid diperbaiki.
4. Foto kategori celana lama sebenarnya gaun: diganti visual katalog celana espresso; kemeja dan blazer mendapat foto konsep yang searah.
5. Header/footer mempertahankan logo asli; latar abu pada logo footer dihilangkan melalui compositing CSS.
6. Buyer tidak dapat mengatur harga/role dari request, mengakses pesanan akun lain, memesan stok kosong, atau memasukkan produk tersembunyi.
7. Stock edits yang basi, SKU duplikat, media hilang, status order yang melompat, dan pengiriman tanpa resi ditolak.
8. Error pada request/penyimpanan ditampilkan tanpa mengklaim transaksi sukses. Hero foto statis memiliki fallback. Tidak ada elemen video atau permintaan video di beranda.

## Verifikasi

- TypeScript dan build produksi.
- 14 skenario API integrasi: seed; autentikasi/role; CSRF/alamat; wishlist/keranjang; checkout/promo/idempotency/stok; stale inventory; order ownership/lifecycle/ulasan; stok terakhir/pembatalan; sinkronisasi admin; engagement/log; total/media/SKU; reset/session invalidation; penyimpanan teks bilingual; upload gambar dan penolakan video.
- 15 skenario browser Chrome terhadap **build produksi**, dengan server dan database sementara: hero statis, katalog, daftar, variant/cart/wishlist, checkout, admin order processing, product CRUD/upload, konten hero live, review/newsletter/restock, responsive EN/FR, persistence bahasa/keranjang/formulir, halaman editorial, media lokal, accessibility, logout.
- Halaman pembeli diuji pada 320, 390, 768, 1440 px; panel admin diuji pada desktop/HP. EN/FR diuji pada empat lebar tersebut; reduced motion tetap menampilkan hero statis.
- Axe WCAG 2 A/AA dan 2.1 AA dijalankan pada beranda, katalog, detail, login, akun, Maison, Atelier, Lookbook, dan dashboard admin. Ini pengujian otomatis pada halaman tersebut, bukan sertifikasi seluruh kondisi atau konten admin yang kelak diunggah.
- Tujuh unit test lama pada utilitas commerce tetap lulus; utilitas itu tidak dipakai checkout server yang baru.
- Hasil akhir browser: `output/qa/store-results.json`; screenshot `store-home-desktop.png`, `store-home-mobile.png`, `store-hero-desktop.png`, `store-hero-mobile.png`, `store-order.png`, `store-admin-mobile.png`, dan `store-home-french.png`.

## Batas yang dinyatakan di produk

Pembayaran transfer/QRIS dan tarif kurir masih demo, tidak memindahkan uang atau memesan pengiriman. Reset password menghasilkan pesan lokal di `data/mail-outbox/`; belum mengirim email. Newsletter dan back-in-stock menyimpan permintaan, belum mengirim notifikasi. Foto, bahan, ukuran, harga, stok, serta testimoni seed harus diganti/diverifikasi untuk produk asli. Kontak bisnis, kebijakan retur/privasi final, hosting dan backup perlu disiapkan sebelum menerima transaksi nyata.

## Penyempurnaan desain dan pembersihan

- Hero “Presence, without a word.” kembali menjadi foto. Header, signature edit, panel editorial, cerita atelier, Maison, Atelier dan Lookbook dipulihkan dari struktur desain sebelumnya dan dihubungkan ke API toko.
- Navigasi EN/FR persisten, label aksesibel, tanggal lokal, copy UI/admin, status stok/pesanan, dan deskripsi produk Prancis. Nilai internal filter/varian tetap stabil ketika bahasa berubah. Mata uang tetap Rupiah.
- Form admin menyimpan teks hero EN/FR dan deskripsi produk Prancis. Pembaruan stok/harga tidak menghapus terjemahan.
- Perbaikan overflow judul akun panjang di HP, spasi teks dinamis, warna teks panel editorial, tautan lookbook lama, dan gabungan label produk yang belum diterjemahkan.
- 55 file media tak terpakai dihapus; total 26.674.130 byte. Lihat `ASSET-CLEANUP.json`. Seluruh media aktif diperiksa keberadaan dan respons HTTP-nya.
- Migrasi database lokal diverifikasi dengan hash data sebelum/sesudah: akun, pesanan, varian/stok, harga, visibilitas, dan foto produk identik. Database lokal berisi 125 produk dan 0 pesanan pada pemeriksaan akhir; transaksi QA memakai database sementara.
- Tidak ada deployment, transaksi pembayaran nyata, atau koneksi layanan video.

Referensi implementasi: [Node SQLite](https://nodejs.org/api/sqlite.html) dan [Express middleware](https://expressjs.com/en/guide/using-middleware/).
