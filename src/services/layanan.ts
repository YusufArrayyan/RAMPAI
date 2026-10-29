/**
 * Lapisan layanan OCR dan AI. Aplikasi hanya memanggil fungsi di berkas ini,
 * sehingga penyedia dapat diganti tanpa mengubah alur (PRD: Pemeliharaan).
 * Prototipe memakai penyedia tiruan yang berjalan lokal; tidak ada data yang keluar dari peramban.
 */
import type { Bagian, JenisDraf } from '../data/types'

export const NAMA_PENYEDIA_AI = 'AI tiruan (prototipe)'

/* ---------- F1: deteksi lapisan teks ---------- */

export interface HasilDeteksi {
  lapisanTeks: boolean
  alasan: string
}

/** Memeriksa berkas yang diunggah. PDF dicek dari operator teks dan font; gambar selalu perlu OCR. */
export async function deteksiLapisanTeks(file: File): Promise<HasilDeteksi> {
  const nama = file.name.toLowerCase()
  if (file.type.startsWith('image/') || /\.(png|jpe?g|tiff?|bmp)$/.test(nama)) {
    return { lapisanTeks: false, alasan: 'Berkas berupa gambar, tidak ada teks yang bisa dipilih.' }
  }
  if (/\.(docx?|pptx?|txt|md|odt|html?)$/.test(nama)) {
    return { lapisanTeks: true, alasan: 'Format dokumen menyimpan teks secara langsung.' }
  }
  if (file.type === 'application/pdf' || nama.endsWith('.pdf')) {
    const buf = new Uint8Array(await file.slice(0, 4_000_000).arrayBuffer())
    const teks = new TextDecoder('latin1').decode(buf)
    const adaFont = /\/Font\b/.test(teks)
    const adaGambar = /\/Subtype\s*\/Image/.test(teks)
    if (adaFont) return { lapisanTeks: true, alasan: 'PDF memuat font tertanam, jadi teksnya bisa dipilih.' }
    if (adaGambar) return { lapisanTeks: false, alasan: 'PDF hanya berisi gambar halaman (hasil pindai).' }
    return { lapisanTeks: false, alasan: 'Tidak ditemukan lapisan teks di PDF.' }
  }
  return { lapisanTeks: false, alasan: 'Format tidak dikenali. Periksa manual.' }
}

/* ---------- F10: pemindai identitas sederhana ---------- */

export interface TemuanIdentitas {
  jenis: 'Nama' | 'NIM' | 'Surel' | 'Nomor telepon' | 'NIK'
  teks: string
}

const POLA: { jenis: TemuanIdentitas['jenis']; re: RegExp }[] = [
  { jenis: 'Surel', re: /[\w.+-]+@[\w-]+(\.[\w-]+)+/g },
  { jenis: 'NIK', re: /\b\d{16}\b/g },
  { jenis: 'Nomor telepon', re: /(\+62|\b0)8\d{2}[-\s]?\d{3,4}[-\s]?\d{3,4}\b/g },
  { jenis: 'NIM', re: /\b[A-Z]\d[A-Z]\d{6}\b|\bNIM\s*:?\s*\d{6,}\b/g },
]

/** Nama orang dikenali dari pola "Nama: ..." dan dari daftar nama yang diketahui. */
export function pindaiIdentitas(teks: string, namaDikenal: string[] = []): TemuanIdentitas[] {
  const temuan: TemuanIdentitas[] = []
  for (const { jenis, re } of POLA) {
    for (const m of teks.matchAll(re)) temuan.push({ jenis, teks: m[0] })
  }
  for (const m of teks.matchAll(/\b(?:Nama|nama|tugas|oleh|dari)\s*:?\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+)+)/g)) {
    temuan.push({ jenis: 'Nama', teks: m[1] })
  }
  for (const nama of namaDikenal) {
    if (nama.length > 3 && teks.includes(nama)) temuan.push({ jenis: 'Nama', teks: nama })
  }
  const unik = new Map(temuan.map((t) => [`${t.jenis}:${t.teks}`, t]))
  return [...unik.values()]
}

export function samarkan(teks: string, temuan: TemuanIdentitas[]): string {
  let hasil = teks
  for (const t of temuan) hasil = hasil.split(t.teks).join(`[${t.jenis.toLowerCase()} dihapus]`)
  return hasil
}

/* ---------- F2: draf AI ---------- */

const KAMUS_RUMUS: [RegExp, string][] = [
  [/∑_\{([^}]*)\}\^\{([^}]*)\}/g, ' jumlah untuk $1 sampai $2 dari '],
  [/∑_\{([^}]*)\}/g, ' jumlah untuk $1 dari '],
  [/≡/g, ' ekuivalen dengan '],
  [/→/g, ' ke '],
  [/¬/g, ' bukan '],
  [/∨/g, ' atau '],
  [/∧/g, ' dan '],
  [/∪/g, ' gabung '],
  [/∩/g, ' iris '],
  [/∈/g, ' anggota '],
  [/≤/g, ' kurang dari atau sama dengan '],
  [/≥/g, ' lebih dari atau sama dengan '],
  [/−|-/g, ' kurang '],
  [/\+/g, ' tambah '],
  [/=/g, ' sama dengan '],
  [/!/g, ' faktorial '],
  [/\//g, ' per '],
  [/_\{([^}]*)\}/g, ' $1 '],
  [/_(\w)/g, ' $1 '],
  [/\|([^|]*)\|/g, ' banyak $1 '],
  [/[(){}]/g, ' '],
]

/** Penyedia tiruan sengaja menghasilkan draf yang masuk akal tapi belum tentu tepat, seperti AI sungguhan. */
function susunDraf(jenis: JenisDraf, sumber: string): string {
  if (jenis === 'rumus') {
    let s = sumber
    for (const [re, ganti] of KAMUS_RUMUS) s = s.replace(re, ganti)
    s = s.replace(/\s+/g, ' ').trim()
    return s.charAt(0).toUpperCase() + s.slice(1) + '.'
  }
  if (jenis === 'alt_teks') {
    const kalimat = sumber.split(/(?<=[.;])\s/)[0].replace(/[.;]$/, '')
    return `Gambar: ${kalimat.charAt(0).toLowerCase()}${kalimat.slice(1)}.`
  }
  const kata = sumber.split(' ')
  const tengah = Math.floor(kata.length / 2)
  return [...kata.slice(0, tengah), '[tidak jelas]', ...kata.slice(tengah + 2)].join(' ')
}

export async function mintaDraf(
  bagian: Bagian[],
  onKemajuan: (selesai: number, total: number) => void,
): Promise<{ bagianId: string; jenis: JenisDraf; isi: string }[]> {
  const hasil = []
  for (let i = 0; i < bagian.length; i++) {
    await new Promise((r) => setTimeout(r, 450 + Math.random() * 350))
    hasil.push({ bagianId: bagian[i].id, jenis: bagian[i].jenis, isi: susunDraf(bagian[i].jenis, bagian[i].sumber) })
    onKemajuan(i + 1, bagian.length)
  }
  return hasil
}
