# RAMPAI Tracker (prototipe)

Prototipe yang bisa diklik untuk lampiran esai AKSARA 2026, dibangun dari `PRD_RAMPAI_Tracker.md`. Aplikasi ini berjalan sepenuhnya di peramban. Data contoh disimpan di `localStorage`, dan penyedia OCR serta AI masih berupa tiruan (`src/services/layanan.ts`).

## Menjalankan

```bash
npm install
npm run dev
```

Buka http://localhost:5173, lalu pilih salah satu akun contoh di halaman Masuk. Kata sandi akun contoh ada di `src/data/seed.ts`.

## Deploy ke Render

Repo ini memuat `render.yaml`. Di Render, pilih **New > Blueprint**, sambungkan repo GitHub, lalu terapkan. Render menjalankan `npm ci && npm run build` dan menayangkan folder `dist` sebagai situs statis.

## Isi

| Peran | Layar |
| --- | --- |
| Pendamping | Antrean berkas, detail berkas dengan satu langkah aktif: triase, OCR, minta draf AI (pemindai data pribadi, F10), verifikasi (draf berdampingan dan daftar periksa wajib), uji NVDA |
| Mahasiswa pengguna | Persetujuan (setujui atau tolak dengan alasan), unduhan (Word, PDF bertag lewat cetak, teks polos), riset I4 dengan persetujuan |
| Dosen | Materi saya (pengingat tenggat, cabut izin), kirim materi (izin wajib, deteksi lapisan teks F1) |
| Koordinator ULD | Panel indikator I1 sampai I3 dan ekspor CSV, beban pendamping, log aktivitas, pengaturan (akun, masa simpan, daftar periksa berversi) |
| Peneliti | Panel indikator teragregasi, data I4 |

Gerbang yang ditegakkan di `src/data/store.tsx`: tombol Lanjut terkunci sampai daftar periksa lengkap; draf AI tidak pernah bisa diunduh; uji gagal wajib disertai lokasi masalah; materi hanya terbit setelah mahasiswa menyetujuinya; penolakan dan kegagalan uji mengembalikan berkas ke langkah 3 dengan versi baru.

## Belum ada

Server, basis data, login sungguhan, penyedia OCR dan AI sungguhan, berkas DOCX asli (saat ini Word diekspor sebagai `.doc` berbasis HTML), dan pengingat surel untuk dosen.
