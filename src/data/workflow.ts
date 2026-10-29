import type { Berkas, ButirPeriksa, IsianPeriksa, JenisDraf, Peran, State, Status } from './types'

export interface InfoStatus {
  label: string
  /** Kalimat pendek: apa arti status ini. */
  arti: string
  langkah: 0 | 1 | 2 | 3 | 4
  nada: 'netral' | 'info' | 'draf' | 'berhasil' | 'galat' | 'tunggu'
}

export const STATUS: Record<Status, InfoStatus> = {
  diterima: { label: 'Diterima', arti: 'Berkas masuk dengan izin pemilik. Triase belum dimulai.', langkah: 1, nada: 'netral' },
  perlu_ocr: { label: 'Perlu OCR', arti: 'Berkas tidak punya lapisan teks. Jalankan OCR dulu.', langkah: 1, nada: 'galat' },
  siap_draf: { label: 'Siap draf', arti: 'Teks dan struktur judul tersedia. Draf AI bisa diminta.', langkah: 2, nada: 'info' },
  draf_ai: { label: 'Draf AI', arti: 'Keluaran AI belum diverifikasi manusia.', langkah: 3, nada: 'draf' },
  terverifikasi: { label: 'Terverifikasi', arti: 'Daftar periksa lengkap dan koreksi tercatat.', langkah: 4, nada: 'info' },
  siap_uji: { label: 'Siap uji', arti: 'Menunggu uji dengan NVDA.', langkah: 4, nada: 'tunggu' },
  lolos_uji: { label: 'Lolos uji', arti: 'Terbaca penuh di NVDA. Menunggu persetujuan mahasiswa.', langkah: 4, nada: 'berhasil' },
  siap_pakai: { label: 'Siap pakai', arti: 'Disetujui mahasiswa dan dapat diunduh.', langkah: 4, nada: 'berhasil' },
  dikembalikan: { label: 'Dikembalikan', arti: 'Gagal uji atau ditolak mahasiswa. Perbaiki di langkah verifikasi.', langkah: 3, nada: 'galat' },
}

export const LANGKAH = ['Triase', 'Draf AI', 'Verifikasi', 'Uji pembaca layar'] as const

export const JENIS_DRAF: Record<JenisDraf, string> = {
  alt_teks: 'Teks alternatif',
  rumus: 'Deskripsi rumus',
  transkrip: 'Transkrip',
}

export const PERAN: Record<Peran, string> = {
  mahasiswa: 'Mahasiswa pengguna',
  pendamping: 'Pendamping sejawat',
  koordinator: 'Koordinator ULD',
  dosen: 'Dosen',
  peneliti: 'Peneliti pilot',
}

/** Urutan bobot untuk mengurutkan antrean: yang paling butuh tindakan pendamping di depan. */
export const BUTUH_PENDAMPING: Status[] = ['dikembalikan', 'diterima', 'perlu_ocr', 'siap_draf', 'draf_ai', 'terverifikasi', 'siap_uji']

export function daftarPeriksaAktif(state: State) {
  return state.daftarPeriksa[state.daftarPeriksa.length - 1]
}

/** Isian daftar periksa yang berlaku untuk versi berkas dan versi daftar saat ini. */
export function isianBerlaku(state: State, berkas: Berkas): Map<string, IsianPeriksa> {
  const daftar = daftarPeriksaAktif(state)
  const peta = new Map<string, IsianPeriksa>()
  for (const i of state.isianPeriksa) {
    if (i.berkasId === berkas.id && i.versiBerkas === berkas.versi && i.versiDaftar === daftar.versi) peta.set(i.butirId, i)
  }
  return peta
}

export function butirKosong(state: State, berkas: Berkas): ButirPeriksa[] {
  const isian = isianBerlaku(state, berkas)
  return daftarPeriksaAktif(state).butir.filter((b) => !isian.has(b.id))
}

export function tenggatKirim(berkas: Pick<Berkas, 'jadwalKuliah'>, hariSebelum: number): Date {
  return new Date(new Date(berkas.jadwalKuliah).getTime() - hariSebelum * 86_400_000)
}

export function terlambatKirim(berkas: Berkas, hariSebelum: number): boolean {
  return new Date(berkas.waktuKirim) > tenggatKirim(berkas, hariSebelum)
}

/** Kalimat aksi berikutnya untuk pendamping, dipakai di kartu fokus antrean. */
export const AKSI_BERIKUT: Partial<Record<Status, string>> = {
  diterima: 'Mulai triase',
  perlu_ocr: 'Jalankan OCR',
  siap_draf: 'Minta draf AI',
  draf_ai: 'Periksa draf AI',
  dikembalikan: 'Perbaiki draf',
  terverifikasi: 'Jadwalkan uji',
  siap_uji: 'Uji dengan NVDA',
}
