import type { Berkas, Draf, MataKuliah } from '../data/types'
import { JENIS_DRAF } from '../data/workflow'

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export interface IsiMateri { berkas: Berkas; mk?: MataKuliah; draf: Draf[] }

/** Bagian materi yang sudah diverifikasi, berurutan sesuai berkas. */
export function bagianFinal({ berkas, draf }: IsiMateri) {
  return berkas.bagian.map((g) => ({ ...g, isi: draf.find((d) => d.bagianId === g.id)?.isi ?? '' }))
}

export function keTeks(m: IsiMateri): string {
  const baris = [
    m.berkas.judul.toUpperCase(),
    `${m.mk?.nama ?? ''}, pertemuan ${m.berkas.pertemuan}`,
    '',
    ...bagianFinal(m).flatMap((g) => [`${JENIS_DRAF[g.jenis]}: ${g.lokasi}`, g.isi, '']),
    `Diverifikasi pendamping dan disetujui mahasiswa pengguna. Versi ${m.berkas.versi}.`,
  ]
  return baris.join('\r\n')
}

/** HTML terstruktur (judul, subjudul, bahasa) untuk Word dan untuk cetak ke PDF bertag. */
export function keHtml(m: IsiMateri): string {
  return `<!doctype html><html lang="id"><head><meta charset="utf-8"><title>${esc(m.berkas.judul)}</title>
<style>body{font-family:Arial,sans-serif;font-size:13pt;line-height:1.5;max-width:42em;margin:2em auto;padding:0 1em}h1{font-size:20pt}h2{font-size:15pt;margin-top:1.4em}p.jenis{font-size:11pt;color:#444}</style>
</head><body><main>
<h1>${esc(m.berkas.judul)}</h1>
<p>${esc(m.mk?.nama ?? '')}, pertemuan ${m.berkas.pertemuan}</p>
${bagianFinal(m).map((g) => `<section><h2>${esc(g.lokasi)}</h2><p class="jenis">${JENIS_DRAF[g.jenis]}</p><p>${esc(g.isi)}</p></section>`).join('\n')}
<p><small>Diverifikasi pendamping dan disetujui mahasiswa pengguna. Versi ${m.berkas.versi}.</small></p>
</main></body></html>`
}

export function namaBerkasUnduh(b: Berkas, ext: string) {
  return `MD-P${b.pertemuan}-${b.judul.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}.${ext}`
}
