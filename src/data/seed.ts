import type { Berkas, ButirPeriksa, Draf, IsianPeriksa, Koreksi, Log, Persetujuan, State, Uji } from './types'

/**
 * Data contoh untuk prototipe. Semua nama dan surel fiktif.
 * Kata sandi akun contoh (hanya untuk prototipe, tidak dipakai di produksi):
 */
export const KATA_SANDI_CONTOH = 'rampai-demo'

const JAM = 3600_000
const HARI = 24 * JAM

/** Tanggal relatif terhadap hari ini, dibulatkan ke jam tertentu. */
function hari(offset: number, jam = 8): string {
  const d = new Date(Date.now() + offset * HARI)
  d.setHours(jam, 0, 0, 0)
  return d.toISOString()
}

export const BUTIR_AWAL: ButirPeriksa[] = [
  { id: 'b1', teks: 'Berkas memiliki lapisan teks dan dapat dipilih (tidak hanya gambar).', bilaAda: false },
  { id: 'b2', teks: 'Struktur judul berurutan (judul, subjudul) dan terbaca sebagai judul oleh pembaca layar.', bilaAda: false },
  { id: 'b3', teks: 'Setiap gambar bermakna memiliki teks alternatif yang sesuai isi gambar; gambar hiasan ditandai hiasan.', bilaAda: false },
  { id: 'b4', teks: 'Rumus dan notasi dideskripsikan dengan benar dan dibandingkan dengan sumber asli.', bilaAda: true },
  { id: 'b5', teks: 'Tabel memiliki baris judul dan terbaca berurutan.', bilaAda: false },
  { id: 'b6', teks: 'Tautan memiliki teks yang bermakna, bukan "klik di sini".', bilaAda: false },
  { id: 'b7', teks: 'Urutan baca sesuai urutan visual (kolom, kotak teks, catatan kaki).', bilaAda: false },
  { id: 'b8', teks: 'Transkrip audio atau video sudah dicocokkan dengan rekaman.', bilaAda: true },
  { id: 'b9', teks: 'Tidak ada nama atau data pribadi pada berkas.', bilaAda: false },
  { id: 'b10', teks: 'Seluruh koreksi manusia atas draf AI sudah dicatat.', bilaAda: false },
]

const MK = 'mk-diskrit'
const PENDAMPING = 'u-nadia'
const PENDAMPING2 = 'u-rizky'
const MHS = 'u-dimas'

function berkas(p: Partial<Berkas> & Pick<Berkas, 'id' | 'judul' | 'pertemuan' | 'status' | 'jadwalKuliah' | 'waktuKirim'>): Berkas {
  return {
    mataKuliahId: MK,
    versi: 1,
    izinPemilik: true,
    waktuIzin: p.waktuKirim,
    namaFile: `MD-P${p.pertemuan}.pdf`,
    jenisFile: 'application/pdf',
    lapisanTeks: true,
    strukturJudul: true,
    bagian: [],
    ...p,
  }
}

export function buatSeed(): State {
  const daftarBerkas: Berkas[] = [
    berkas({
      id: 'bk-1', judul: 'Logika proposisi dan tabel kebenaran', pertemuan: 1, status: 'siap_pakai',
      jadwalKuliah: hari(-14), waktuKirim: hari(-24), waktuTerbit: hari(-17, 15),
      bagian: [
        { id: 'bg-1a', jenis: 'rumus', lokasi: 'Halaman 3, Definisi 1.2', sumber: '(p → q) ≡ (¬p ∨ q)' },
        { id: 'bg-1b', jenis: 'alt_teks', lokasi: 'Halaman 5, Gambar 1', sumber: 'Tabel kebenaran empat baris untuk p, q, dan p → q; baris kedua (B, S) menghasilkan S.' },
      ],
    }),
    berkas({
      id: 'bk-2', judul: 'Himpunan dan operasi himpunan', pertemuan: 2, status: 'siap_pakai', versi: 2,
      jadwalKuliah: hari(-7), waktuKirim: hari(-16), waktuTerbit: hari(-8, 10),
      bagian: [
        { id: 'bg-2a', jenis: 'alt_teks', lokasi: 'Slide 6, Diagram Venn', sumber: 'Diagram Venn dua lingkaran A dan B; irisan A ∩ B diarsir.' },
        { id: 'bg-2b', jenis: 'rumus', lokasi: 'Slide 9', sumber: '|A ∪ B| = |A| + |B| − |A ∩ B|' },
      ],
    }),
    berkas({
      id: 'bk-3', judul: 'Relasi dan fungsi', pertemuan: 3, status: 'lolos_uji',
      jadwalKuliah: hari(2), waktuKirim: hari(-6),
      bagian: [
        { id: 'bg-3a', jenis: 'alt_teks', lokasi: 'Slide 4, Gambar 2', sumber: 'Diagram panah dari himpunan A = {1, 2, 3} ke B = {a, b}; 1 dan 2 ke a, 3 ke b.' },
        { id: 'bg-3b', jenis: 'rumus', lokasi: 'Slide 8', sumber: 'f: A → B, f(x) = 2x + 1' },
      ],
    }),
    berkas({
      id: 'bk-4', judul: 'Induksi matematika', pertemuan: 4, status: 'siap_uji',
      jadwalKuliah: hari(9), waktuKirim: hari(-3),
      bagian: [
        { id: 'bg-4a', jenis: 'rumus', lokasi: 'Halaman 2, Contoh 1', sumber: '∑_{i=1}^{n} i = n(n+1)/2' },
        { id: 'bg-4b', jenis: 'transkrip', lokasi: 'Rekaman kuliah, menit 12:30', sumber: 'Langkah basis: untuk n sama dengan satu, ruas kiri satu, ruas kanan satu kali dua per dua, sama dengan satu. Jadi benar.' },
      ],
    }),
    berkas({
      id: 'bk-5', judul: 'Kombinatorika: permutasi dan kombinasi', pertemuan: 5, status: 'draf_ai',
      jadwalKuliah: hari(16), waktuKirim: hari(-1),
      bagian: [
        { id: 'bg-5a', jenis: 'rumus', lokasi: 'Slide 3', sumber: 'P(n, r) = n! / (n − r)!' },
        { id: 'bg-5b', jenis: 'rumus', lokasi: 'Slide 7', sumber: 'C(n, r) = n! / (r!(n − r)!)' },
        { id: 'bg-5c', jenis: 'alt_teks', lokasi: 'Slide 10, Gambar 3', sumber: 'Pohon keputusan memilih 2 dari 3 huruf A, B, C; enam daun: AB, AC, BA, BC, CA, CB.' },
      ],
    }),
    berkas({
      id: 'bk-6', judul: 'Teori graf: definisi dan jenis graf', pertemuan: 6, status: 'perlu_ocr',
      jadwalKuliah: hari(23), waktuKirim: hari(0, 7), lapisanTeks: false, strukturJudul: false,
      namaFile: 'Graf-pindai.pdf',
      bagian: [
        { id: 'bg-6a', jenis: 'alt_teks', lokasi: 'Halaman 4, Gambar 1', sumber: 'Graf dengan lima simpul v1 sampai v5; sisi v1–v2, v2–v3, v3–v4, v4–v5, v5–v1, dan v1–v3.' },
        { id: 'bg-6b', jenis: 'rumus', lokasi: 'Halaman 6, Teorema 6.1', sumber: '∑_{v ∈ V} deg(v) = 2|E|' },
      ],
    }),
    berkas({
      id: 'bk-7', judul: 'Pohon dan pohon merentang', pertemuan: 7, status: 'diterima',
      jadwalKuliah: hari(30), waktuKirim: hari(0, 9), lapisanTeks: null, strukturJudul: false,
      bagian: [
        { id: 'bg-7a', jenis: 'alt_teks', lokasi: 'Slide 5, Gambar 2', sumber: 'Pohon merentang minimum dengan bobot sisi 2, 3, 4, dan 7; total bobot 16. Contoh soal dari tugas Budi Santoso, NIM G1A021045.' },
        { id: 'bg-7b', jenis: 'transkrip', lokasi: 'Video penjelasan, menit 03:10', sumber: 'Algoritma Kruskal mengurutkan sisi dari bobot terkecil, lalu menambahkan sisi selama tidak membentuk sirkuit. Pertanyaan bisa dikirim ke budi.santoso@contoh.ac.id.' },
      ],
    }),
    berkas({
      id: 'bk-8', judul: 'Relasi rekurensi', pertemuan: 8, status: 'dikembalikan',
      jadwalKuliah: hari(5), waktuKirim: hari(-9),
      catatanKembali: 'Ditolak mahasiswa pengguna: deskripsi rumus di Slide 4 dibacakan "a n kurang 1" tanpa jelas bahwa n kurang 1 adalah indeks. Saya jadi salah paham.',
      bagian: [
        { id: 'bg-8a', jenis: 'rumus', lokasi: 'Slide 4', sumber: 'a_n = a_{n−1} + 2a_{n−2}, a_0 = 1, a_1 = 2' },
      ],
    }),
  ]

  const draf: Draf[] = [
    { id: 'd-1a', berkasId: 'bk-1', bagianId: 'bg-1a', jenis: 'rumus', isiAsli: 'p implikasi q ekuivalen dengan bukan p atau q.', isi: 'p implikasi q ekuivalen dengan negasi p, atau q.', waktu: hari(-22, 10), penyedia: 'AI tiruan' },
    { id: 'd-1b', berkasId: 'bk-1', bagianId: 'bg-1b', jenis: 'alt_teks', isiAsli: 'Gambar tabel dengan beberapa baris huruf B dan S.', isi: 'Tabel kebenaran implikasi p ke q, empat baris. Hasilnya salah hanya pada baris kedua, saat p benar dan q salah; tiga baris lain benar.', waktu: hari(-22, 10), penyedia: 'AI tiruan' },
    { id: 'd-2a', berkasId: 'bk-2', bagianId: 'bg-2a', jenis: 'alt_teks', isiAsli: 'Diagram Venn dua lingkaran A dan B yang beririsan; bagian irisan diarsir.', isi: 'Diagram Venn dua lingkaran A dan B yang beririsan; bagian irisan diarsir.', waktu: hari(-14, 9), penyedia: 'AI tiruan' },
    { id: 'd-2b', berkasId: 'bk-2', bagianId: 'bg-2b', jenis: 'rumus', isiAsli: 'Banyak anggota A gabung B sama dengan banyak A tambah banyak B.', isi: 'Banyak anggota A gabung B sama dengan banyak anggota A, ditambah banyak anggota B, dikurangi banyak anggota A iris B.', waktu: hari(-14, 9), penyedia: 'AI tiruan' },
    { id: 'd-3a', berkasId: 'bk-3', bagianId: 'bg-3a', jenis: 'alt_teks', isiAsli: 'Diagram panah dari himpunan A berisi 1, 2, 3 ke himpunan B berisi a dan b. Angka 1 dan 2 menuju a, angka 3 menuju b.', isi: 'Diagram panah dari himpunan A berisi 1, 2, 3 ke himpunan B berisi a dan b. Angka 1 dan 2 menuju a, angka 3 menuju b.', waktu: hari(-5, 10), penyedia: 'AI tiruan' },
    { id: 'd-3b', berkasId: 'bk-3', bagianId: 'bg-3b', jenis: 'rumus', isiAsli: 'f dari A ke B, f x sama dengan 2 x tambah 1.', isi: 'Fungsi f dari A ke B, dengan f dari x sama dengan dua x tambah satu.', waktu: hari(-5, 10), penyedia: 'AI tiruan' },
    { id: 'd-4a', berkasId: 'bk-4', bagianId: 'bg-4a', jenis: 'rumus', isiAsli: 'Jumlah i dari i sama dengan 1 sampai n sama dengan n kali n tambah 1 per 2.', isi: 'Jumlah i, untuk i dari 1 sampai n, sama dengan n dikali (n tambah 1), lalu dibagi 2.', waktu: hari(-2, 10), penyedia: 'AI tiruan' },
    { id: 'd-4b', berkasId: 'bk-4', bagianId: 'bg-4b', jenis: 'transkrip', isiAsli: 'Langkah basis: untuk n sama dengan satu, ruas kiri satu, ruas kanan satu kali dua per dua [tidak jelas]. Jadi benar.', isi: 'Langkah basis: untuk n sama dengan satu, ruas kiri bernilai satu, ruas kanan satu kali dua per dua, sama dengan satu. Jadi benar.', waktu: hari(-2, 10), penyedia: 'AI tiruan' },
    { id: 'd-5a', berkasId: 'bk-5', bagianId: 'bg-5a', jenis: 'rumus', isiAsli: 'P n r sama dengan n faktorial per n kurang r faktorial.', isi: 'P n r sama dengan n faktorial per n kurang r faktorial.', waktu: hari(0, 8), penyedia: 'AI tiruan' },
    { id: 'd-5b', berkasId: 'bk-5', bagianId: 'bg-5b', jenis: 'rumus', isiAsli: 'C n r sama dengan n faktorial per r faktorial n kurang r faktorial.', isi: 'C n r sama dengan n faktorial per r faktorial n kurang r faktorial.', waktu: hari(0, 8), penyedia: 'AI tiruan' },
    { id: 'd-5c', berkasId: 'bk-5', bagianId: 'bg-5c', jenis: 'alt_teks', isiAsli: 'Diagram pohon dengan huruf A, B, dan C.', isi: 'Diagram pohon dengan huruf A, B, dan C.', waktu: hari(0, 8), penyedia: 'AI tiruan' },
    { id: 'd-8a', berkasId: 'bk-8', bagianId: 'bg-8a', jenis: 'rumus', isiAsli: 'a n sama dengan a n kurang 1 tambah 2 a n kurang 2.', isi: 'a n sama dengan a n kurang 1 tambah 2 a n kurang 2, dengan a nol sama dengan 1 dan a satu sama dengan 2.', waktu: hari(-8, 10), penyedia: 'AI tiruan' },
  ]

  const koreksi: Koreksi[] = draf
    .filter((d) => d.isi !== d.isiAsli)
    .map((d, i) => ({
      id: `k-${i}`, drafId: d.id, pelakuId: i % 2 ? PENDAMPING2 : PENDAMPING, jenis: 'suntingan',
      sebelum: d.isiAsli, sesudah: d.isi, waktu: new Date(new Date(d.waktu).getTime() + 2 * JAM).toISOString(),
    }))

  const isianPeriksa: IsianPeriksa[] = []
  for (const b of daftarBerkas) {
    if (['siap_pakai', 'lolos_uji', 'siap_uji', 'dikembalikan'].includes(b.status)) {
      for (const butir of BUTIR_AWAL) {
        const relevan =
          (butir.id === 'b4' && b.bagian.some((x) => x.jenis === 'rumus')) ||
          (butir.id === 'b8' && b.bagian.some((x) => x.jenis === 'transkrip'))
        isianPeriksa.push({
          id: `ip-${b.id}-${butir.id}`, berkasId: b.id, versiBerkas: b.versi, versiDaftar: 1, butirId: butir.id,
          hasil: butir.bilaAda && !relevan ? 'tidak_berlaku' : 'ya', pelakuId: PENDAMPING, waktu: b.waktuKirim,
        })
      }
    }
  }

  const uji: Uji[] = [
    { id: 'u-1', berkasId: 'bk-1', versiBerkas: 1, alat: 'NVDA 2026.1, Firefox', hasil: 'lulus', catatan: 'Semua judul terbaca, tabel terbaca per sel.', pengujiId: PENDAMPING, waktu: hari(-18, 13) },
    { id: 'u-2', berkasId: 'bk-2', versiBerkas: 1, alat: 'NVDA 2026.1, Chrome', hasil: 'gagal', catatan: 'Slide 9: rumus terbaca sebagai gambar tanpa teks alternatif.', pengujiId: PENDAMPING2, waktu: hari(-11, 10) },
    { id: 'u-3', berkasId: 'bk-2', versiBerkas: 2, alat: 'NVDA 2026.1, Chrome', hasil: 'lulus', catatan: 'Rumus slide 9 kini terbaca lengkap.', pengujiId: PENDAMPING2, waktu: hari(-9, 14) },
    { id: 'u-4', berkasId: 'bk-3', versiBerkas: 1, alat: 'NVDA 2026.1, Firefox', hasil: 'lulus', catatan: 'Diagram panah terbaca berurutan.', pengujiId: PENDAMPING, waktu: hari(-1, 11) },
    { id: 'u-5', berkasId: 'bk-8', versiBerkas: 1, alat: 'NVDA 2026.1, Firefox', hasil: 'lulus', catatan: 'Terbaca penuh.', pengujiId: PENDAMPING, waktu: hari(-4, 11) },
  ]

  const persetujuan: Persetujuan[] = [
    { id: 'p-1', berkasId: 'bk-1', mahasiswaId: MHS, keputusan: 'setuju', alasan: '', waktu: hari(-17, 15) },
    { id: 'p-2', berkasId: 'bk-2', mahasiswaId: MHS, keputusan: 'setuju', alasan: '', waktu: hari(-8, 10) },
    { id: 'p-3', berkasId: 'bk-8', mahasiswaId: MHS, keputusan: 'tolak', alasan: 'Deskripsi rumus di Slide 4 dibacakan "a n kurang 1" tanpa jelas bahwa n kurang 1 adalah indeks. Saya jadi salah paham.', waktu: hari(-3, 9) },
  ]

  const log: Log[] = [
    { id: 'l-0', pelakuId: 'u-lestari', aksi: 'Menetapkan daftar periksa versi 1', objek: 'daftar-periksa', waktu: hari(-30) },
    ...daftarBerkas.map((b, i) => ({ id: `l-k${i}`, pelakuId: 'u-fauzi', aksi: 'Mengirim berkas dan memberi izin pemrosesan', objek: b.id, waktu: b.waktuKirim })),
    { id: 'l-u2', pelakuId: PENDAMPING2, aksi: 'Mencatat uji: gagal', objek: 'bk-2', waktu: hari(-11, 10) },
    { id: 'l-t8', pelakuId: MHS, aksi: 'Menolak materi', objek: 'bk-8', waktu: hari(-3, 9) },
  ]

  return {
    pengguna: [
      { id: 'u-dimas', nama: 'Dimas Pratama', surel: 'dimas@contoh.ac.id', peran: 'mahasiswa', aktif: true },
      { id: 'u-sari', nama: 'Sari Wulandari', surel: 'sari@contoh.ac.id', peran: 'mahasiswa', aktif: true },
      { id: 'u-nadia', nama: 'Nadia Putri', surel: 'nadia@contoh.ac.id', peran: 'pendamping', aktif: true },
      { id: 'u-rizky', nama: 'Rizky Hidayat', surel: 'rizky@contoh.ac.id', peran: 'pendamping', aktif: true },
      { id: 'u-ayu', nama: 'Ayu Lestari', surel: 'ayu@contoh.ac.id', peran: 'pendamping', aktif: false },
      { id: 'u-lestari', nama: 'Lestari Handayani', surel: 'lestari@contoh.ac.id', peran: 'koordinator', aktif: true },
      { id: 'u-fauzi', nama: 'Dr. Ahmad Fauzi', surel: 'fauzi@contoh.ac.id', peran: 'dosen', aktif: true },
      { id: 'u-yusuf', nama: 'Muhammad Yusuf Arrayyan', surel: 'yusuf@contoh.ac.id', peran: 'peneliti', aktif: true },
    ],
    mataKuliah: [{ id: MK, nama: 'Matematika Diskrit', semester: 'Ganjil 2026/2027', dosenId: 'u-fauzi' }],
    berkas: daftarBerkas,
    draf,
    koreksi,
    daftarPeriksa: [{ versi: 1, butir: BUTIR_AWAL, waktu: hari(-30), pelakuId: 'u-lestari' }],
    isianPeriksa,
    uji,
    persetujuan,
    persetujuanRiset: [{ id: 'pr-1', mahasiswaId: MHS, tanggal: hari(-20), cakupan: 'Skor pemahaman materi Matematika Diskrit selama pilot' }],
    skor: [
      { id: 's-1', berkasId: 'bk-1', mahasiswaId: MHS, skor: 78, waktu: hari(-13) },
      { id: 's-2', berkasId: 'bk-2', mahasiswaId: MHS, skor: 85, waktu: hari(-6) },
    ],
    log,
    pengaturan: { masaSimpanHari: 180, tenggatKirimHari: 7 },
    formatPilihan: { 'u-dimas': 'docx' },
  }
}
