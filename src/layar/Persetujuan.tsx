import { useRef, useState } from 'react'
import { AlertTriangle, Check, ClipboardCheck, X } from 'lucide-react'
import { useStore } from '../data/store'
import type { Berkas } from '../data/types'
import { JENIS_DRAF } from '../data/workflow'
import { bagianFinal } from '../services/ekspor'
import { Kepala, hariTgl, teksSisa, useJalankan } from '../ui/dasar'

export default function Persetujuan() {
  const { state } = useStore()
  const daftar = state.berkas.filter((b) => b.status === 'lolos_uji').sort((a, b) => a.jadwalKuliah.localeCompare(b.jadwalKuliah))

  return (
    <>
      <Kepala
        judul="Persetujuan materi"
        sub="Materi di bawah sudah lolos uji NVDA. Baca isinya, lalu putuskan. Materi baru bisa diunduh setelah Anda setujui; bila ditolak, pendamping memperbaikinya."
      />
      {daftar.length === 0 ? (
        <div className="panel kosong">
          <ClipboardCheck size={36} aria-hidden="true" />
          <h2>Tidak ada materi yang menunggu keputusan Anda</h2>
          <p>Materi muncul di sini setelah pendamping selesai memverifikasi dan mengujinya dengan NVDA. Materi yang sudah disetujui ada di halaman Unduhan materi.</p>
          <a href="#/unduhan" className="tombol tombol-kedua">Buka Unduhan materi</a>
        </div>
      ) : (
        <div className="tumpuk">{daftar.map((b) => <KartuPersetujuan key={b.id} b={b} />)}</div>
      )}
    </>
  )
}

function KartuPersetujuan({ b }: { b: Berkas }) {
  const { state, aksi } = useStore()
  const jalankan = useJalankan()
  const [tolak, setTolak] = useState(false)
  const [alasan, setAlasan] = useState('')
  const [galat, setGalat] = useState('')
  const refAlasan = useRef<HTMLTextAreaElement>(null)
  const draf = state.draf.filter((d) => d.berkasId === b.id)
  const mk = state.mataKuliah.find((m) => m.id === b.mataKuliahId)
  const uji = state.uji.filter((u) => u.berkasId === b.id).at(-1)
  const idJudul = `judul-${b.id}`

  return (
    <article className="panel" aria-labelledby={idJudul}>
      <div className="panel-kepala">
        <div>
          <h2 id={idJudul}>{b.judul}</h2>
          <p className="redup kecil">{mk?.nama}, pertemuan {b.pertemuan}. Kuliah {hariTgl(b.jadwalKuliah)} ({teksSisa(b.jadwalKuliah)}).</p>
        </div>
      </div>
      <div className="panel-isi tumpuk">
        <section aria-label="Isi materi yang diverifikasi">
          <ol className="tumpuk-s" style={{ paddingLeft: '1.25rem', margin: 0 }}>
            {bagianFinal({ berkas: b, draf }).map((g) => (
              <li key={g.id}>
                <h3 style={{ fontSize: 'var(--t-m)' }}>{g.lokasi} <span className="redup kecil">· {JENIS_DRAF[g.jenis]}</span></h3>
                <p style={{ maxWidth: '68ch' }}>{g.isi}</p>
              </li>
            ))}
          </ol>
        </section>
        {uji && <p className="bantu">Uji terakhir: {uji.alat}, {uji.hasil}. {uji.catatan}</p>}

        {tolak && (
          <div className="bidang">
            <label htmlFor={`alasan-${b.id}`}>Alasan penolakan</label>
            <textarea ref={refAlasan} id={`alasan-${b.id}`} value={alasan} onChange={(e) => { setAlasan(e.target.value); setGalat('') }}
              aria-invalid={!!galat} aria-describedby={galat ? `g-${b.id}` : `b-${b.id}`} />
            {galat
              ? <p id={`g-${b.id}`} className="galat-bidang"><AlertTriangle size={16} aria-hidden="true" />{galat}</p>
              : <p id={`b-${b.id}`} className="bantu">Sebut bagian mana yang membingungkan dan bagaimana NVDA membacanya.</p>}
          </div>
        )}

        <div className="deret-tombol">
          {!tolak ? (
            <>
              <button type="button" className="tombol tombol-berhasil" onClick={() => jalankan(() => aksi.putuskan(b.id, 'setuju', ''), `"${b.judul}" disetujui dan sekarang bisa diunduh.`)}>
                <Check size={18} aria-hidden="true" /> Setujui materi
              </button>
              <button type="button" className="tombol tombol-bahaya" onClick={() => { setTolak(true); setTimeout(() => refAlasan.current?.focus(), 0) }}>
                <X size={18} aria-hidden="true" /> Tolak
              </button>
            </>
          ) : (
            <>
              <button type="button" className="tombol tombol-bahaya" onClick={() => {
                if (!alasan.trim()) { setGalat('Tulis alasannya agar pendamping tahu apa yang perlu diperbaiki.'); refAlasan.current?.focus(); return }
                jalankan(() => aksi.putuskan(b.id, 'tolak', alasan), 'Materi ditolak dan dikembalikan ke pendamping.')
              }}>
                Kirim penolakan
              </button>
              <button type="button" className="tombol tombol-hantu" onClick={() => { setTolak(false); setGalat('') }}>Batal</button>
            </>
          )}
        </div>
      </div>
    </article>
  )
}
