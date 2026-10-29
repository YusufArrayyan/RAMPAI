import { Download, FolderOpen } from 'lucide-react'
import { useStore } from '../data/store'
import type { FormatUnduh } from '../data/types'
import { keHtml, keTeks, namaBerkasUnduh } from '../services/ekspor'
import { Kepala, hariTgl, tglJam, unduhTeks, useJalankan, useToast } from '../ui/dasar'

const FORMAT: { k: FormatUnduh; label: string; bantu: string }[] = [
  { k: 'docx', label: 'Word', bantu: 'Dokumen Word dengan gaya judul.' },
  { k: 'pdf', label: 'PDF bertag', bantu: 'Membuka jendela cetak; pilih "Simpan sebagai PDF" di Chrome atau Edge agar tag judul ikut tersimpan.' },
  { k: 'teks', label: 'Teks polos', bantu: 'Berkas .txt tanpa format, paling ringan.' },
]

export default function Unduhan() {
  const { state, pengguna, aksi } = useStore()
  const jalankan = useJalankan()
  const toast = useToast()
  const format = state.formatPilihan[pengguna!.id] ?? 'docx'
  const daftar = state.berkas.filter((b) => b.status === 'siap_pakai').sort((a, b) => b.jadwalKuliah.localeCompare(a.jadwalKuliah))

  function unduh(berkasId: string) {
    const b = state.berkas.find((x) => x.id === berkasId)!
    const m = { berkas: b, mk: state.mataKuliah.find((x) => x.id === b.mataKuliahId), draf: state.draf.filter((d) => d.berkasId === b.id) }
    if (!jalankan(() => aksi.catatUnduh(b.id, format))) return
    if (format === 'teks') unduhTeks(namaBerkasUnduh(b, 'txt'), keTeks(m))
    else if (format === 'docx') unduhTeks(namaBerkasUnduh(b, 'doc'), keHtml(m), 'application/msword')
    else {
      const w = window.open('', '_blank')
      if (!w) return toast('Jendela cetak diblokir peramban. Izinkan jendela munculan untuk situs ini, lalu coba lagi.', 'galat')
      w.document.write(keHtml(m))
      w.document.close()
      w.focus()
      w.print()
    }
  }

  return (
    <>
      <Kepala judul="Unduhan materi" sub="Hanya materi yang sudah Anda setujui yang muncul di sini." />

      <section className="panel panel-isi" style={{ marginBottom: '1.5rem' }} aria-labelledby="judul-format">
        <fieldset>
          <legend id="judul-format" className="label" style={{ marginBottom: '0.625rem' }}>Format unduhan</legend>
          <div className="segmen">
            {FORMAT.map((f) => (
              <label key={f.k}>
                <input type="radio" name="format" value={f.k} checked={format === f.k} onChange={() => { aksi.pilihFormat(f.k); toast(`Format ${f.label} disimpan untuk unduhan berikutnya.`) }} />
                {f.label}
              </label>
            ))}
          </div>
          <p className="bantu" style={{ marginTop: '0.5rem' }}>{FORMAT.find((f) => f.k === format)!.bantu} Pilihan ini tersimpan.</p>
        </fieldset>
      </section>

      {daftar.length === 0 ? (
        <div className="panel kosong">
          <FolderOpen size={36} aria-hidden="true" />
          <h2>Belum ada materi siap pakai</h2>
          <p>Materi muncul di sini setelah Anda menyetujuinya di halaman Persetujuan.</p>
          <a href="#/persetujuan" className="tombol tombol-kedua">Buka Persetujuan</a>
        </div>
      ) : (
        <section className="panel" aria-label="Daftar materi siap pakai">
          <ul className="materi">
            {daftar.map((b) => (
              <li key={b.id}>
                <div className="baris-antara">
                  <div>
                    <h2 style={{ fontSize: '1.0625rem' }}>{b.judul}</h2>
                    <p className="redup kecil">Pertemuan {b.pertemuan}. Kuliah {hariTgl(b.jadwalKuliah)}. Terbit {tglJam(b.waktuTerbit!)}.</p>
                  </div>
                  <button type="button" className="tombol tombol-utama" onClick={() => unduh(b.id)} aria-label={`Unduh ${b.judul} sebagai ${FORMAT.find((f) => f.k === format)!.label}`}>
                    <Download size={18} aria-hidden="true" /> Unduh
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  )
}
