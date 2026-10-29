export type Peran = 'mahasiswa' | 'pendamping' | 'koordinator' | 'dosen' | 'peneliti'

export type Status =
  | 'diterima'
  | 'perlu_ocr'
  | 'siap_draf'
  | 'draf_ai'
  | 'terverifikasi'
  | 'siap_uji'
  | 'lolos_uji'
  | 'siap_pakai'
  | 'dikembalikan'

export type JenisDraf = 'alt_teks' | 'rumus' | 'transkrip'

export type FormatUnduh = 'docx' | 'pdf' | 'teks'

export interface Pengguna {
  id: string
  nama: string
  surel: string
  peran: Peran
  aktif: boolean
}

export interface MataKuliah {
  id: string
  nama: string
  semester: string
  dosenId: string
}

/** Bagian berkas yang butuh draf AI (gambar, rumus, audio). */
export interface Bagian {
  id: string
  jenis: JenisDraf
  /** Penanda lokasi di berkas asli, misalnya "Slide 4, Gambar 2". */
  lokasi: string
  /** Isi sumber yang dibaca pendamping: konteks gambar, notasi rumus, cuplikan audio. */
  sumber: string
}

export interface Berkas {
  id: string
  judul: string
  mataKuliahId: string
  pertemuan: number
  versi: number
  status: Status
  /** Jadwal kuliah yang memakai materi ini (ISO). */
  jadwalKuliah: string
  /** Waktu dosen mengirim berkas (ISO). */
  waktuKirim: string
  izinPemilik: boolean
  waktuIzin?: string
  namaFile: string
  jenisFile: string
  /** null sebelum triase dijalankan. */
  lapisanTeks: boolean | null
  /** Hasil pemeriksaan otomatis saat berkas diunggah (F1). */
  hasilDeteksi?: { lapisanTeks: boolean; alasan: string }
  strukturJudul: boolean
  bagian: Bagian[]
  waktuTerbit?: string
  catatanKembali?: string
}

export interface Draf {
  id: string
  berkasId: string
  bagianId: string
  jenis: JenisDraf
  /** Isi dari AI, tidak pernah diubah. */
  isiAsli: string
  /** Isi setelah suntingan pendamping. */
  isi: string
  waktu: string
  penyedia: string
}

export interface Koreksi {
  id: string
  drafId: string
  pelakuId: string
  jenis: 'suntingan'
  sebelum: string
  sesudah: string
  waktu: string
}

export interface ButirPeriksa {
  id: string
  teks: string
  /** true = boleh ditandai "tidak berlaku" (butir bertanda "bila ada"). */
  bilaAda: boolean
}

export interface DaftarPeriksaVersi {
  versi: number
  butir: ButirPeriksa[]
  waktu: string
  pelakuId: string
}

export type HasilButir = 'ya' | 'tidak_berlaku'

export interface IsianPeriksa {
  id: string
  berkasId: string
  versiBerkas: number
  versiDaftar: number
  butirId: string
  hasil: HasilButir
  pelakuId: string
  waktu: string
}

export interface Uji {
  id: string
  berkasId: string
  versiBerkas: number
  alat: string
  hasil: 'lulus' | 'gagal'
  catatan: string
  pengujiId: string
  waktu: string
}

export interface Persetujuan {
  id: string
  berkasId: string
  mahasiswaId: string
  keputusan: 'setuju' | 'tolak'
  alasan: string
  waktu: string
}

export interface PersetujuanRiset {
  id: string
  mahasiswaId: string
  tanggal: string
  cakupan: string
  dicabut?: string
}

export interface SkorPemahaman {
  id: string
  berkasId: string
  mahasiswaId: string
  skor: number
  waktu: string
}

export interface Log {
  id: string
  pelakuId: string
  aksi: string
  objek: string
  waktu: string
}

export interface Pengaturan {
  masaSimpanHari: number
  tenggatKirimHari: number
}

export interface State {
  pengguna: Pengguna[]
  mataKuliah: MataKuliah[]
  berkas: Berkas[]
  draf: Draf[]
  koreksi: Koreksi[]
  daftarPeriksa: DaftarPeriksaVersi[]
  isianPeriksa: IsianPeriksa[]
  uji: Uji[]
  persetujuan: Persetujuan[]
  persetujuanRiset: PersetujuanRiset[]
  skor: SkorPemahaman[]
  log: Log[]
  pengaturan: Pengaturan
  formatPilihan: Record<string, FormatUnduh>
}
