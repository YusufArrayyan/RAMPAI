import { useEffect, useRef, useState, type FormEvent } from 'react'
import { AlertCircle, ChevronRight, Moon, Sun } from 'lucide-react'
import { useStore } from '../data/store'
import { KATA_SANDI_CONTOH } from '../data/seed'
import type { Peran } from '../data/types'
import { PERAN } from '../data/workflow'
import { inisial } from '../ui/dasar'

type Galat = Partial<Record<'surel' | 'sandi' | 'peran', string>>

export default function Masuk({ tema, gantiTema }: { tema: string; gantiTema: () => void }) {
  const { state, masuk } = useStore()
  const [surel, setSurel] = useState('')
  const [sandi, setSandi] = useState('')
  const [peran, setPeran] = useState<Peran | ''>('')
  const [galat, setGalat] = useState<Galat>({})
  const refs = { surel: useRef<HTMLInputElement>(null), sandi: useRef<HTMLInputElement>(null), peran: useRef<HTMLSelectElement>(null) }

  useEffect(() => { document.title = 'Masuk · RAMPAI Tracker' }, [])

  function kirim(e: FormEvent) {
    e.preventDefault()
    const g: Galat = {}
    const u = state.pengguna.find((x) => x.surel.toLowerCase() === surel.trim().toLowerCase())
    if (!surel.trim()) g.surel = 'Isi surel kampus Anda.'
    else if (!surel.includes('@')) g.surel = 'Surel belum memakai tanda @.'
    else if (!u) g.surel = 'Surel ini belum terdaftar. Minta koordinator ULD menambahkan akun Anda.'
    else if (!u.aktif) g.surel = 'Akun ini dinonaktifkan. Hubungi koordinator ULD.'
    if (!sandi) g.sandi = 'Isi kata sandi.'
    else if (u && sandi !== KATA_SANDI_CONTOH) g.sandi = 'Kata sandi salah. Periksa huruf besar dan kecil, lalu coba lagi.'
    if (!peran) g.peran = 'Pilih peran Anda.'
    else if (u && u.peran !== peran) g.peran = `Akun ini terdaftar sebagai ${PERAN[u.peran].toLowerCase()}, bukan ${PERAN[peran].toLowerCase()}.`
    setGalat(g)
    const pertama = (['surel', 'sandi', 'peran'] as const).find((k) => g[k])
    if (pertama) {
      refs[pertama].current?.focus()
      return
    }
    masuk(u!.id)
    window.location.hash = '/'
  }

  const contoh = (['pendamping', 'koordinator', 'mahasiswa', 'dosen', 'peneliti'] as Peran[])
    .map((p) => state.pengguna.find((u) => u.peran === p && u.aktif))
    .filter((u) => !!u)

  return (
    <div className="masuk">
      <section className="masuk-kiri" aria-labelledby="judul-masuk">
        <div className="merek">
          <img src="/logo.png" alt="" style={{ background: 'white', borderRadius: 12, padding: 2 }} />
          <span>
            <b>RAMPAI Tracker</b>
            <small>Unit Layanan Disabilitas</small>
          </span>
        </div>
        <div>
          <h1 id="judul-masuk">Materi kuliah yang terbaca sebelum kelas dimulai.</h1>
          <p>Setiap berkas dicatat dari triase sampai siap pakai. AI hanya menyusun draf, pendamping memeriksa, dan mahasiswa pengguna yang memutuskan.</p>
        </div>
        <ol className="alur-masuk" aria-label="Empat langkah RAMPAI">
          <li><span className="n" aria-hidden="true">1</span><span><b>Triase</b><span>Periksa lapisan teks, jalankan OCR bila perlu.</span></span></li>
          <li><span className="n" aria-hidden="true">2</span><span><b>Draf AI</b><span>Teks alternatif, deskripsi rumus, transkrip. Selalu berlabel draf.</span></span></li>
          <li><span className="n" aria-hidden="true">3</span><span><b>Verifikasi manusia</b><span>Daftar periksa wajib lengkap, setiap koreksi dicatat.</span></span></li>
          <li><span className="n" aria-hidden="true">4</span><span><b>Uji pembaca layar</b><span>Uji NVDA, lalu persetujuan mahasiswa pengguna.</span></span></li>
        </ol>
        <span className="busur" aria-hidden="true" />
      </section>

      <main className="masuk-kanan">
        <div className="kotak-masuk">
          <div className="baris-antara">
            <h2>Masuk</h2>
            <button type="button" className="tombol tombol-hantu ikon-tombol" onClick={gantiTema} aria-label={tema === 'terang' ? 'Pakai mode gelap' : 'Pakai mode terang'}>
              {tema === 'terang' ? <Moon size={18} aria-hidden="true" /> : <Sun size={18} aria-hidden="true" />}
            </button>
          </div>

          <form onSubmit={kirim} noValidate className="tumpuk-s" style={{ gap: '1rem' }}>
            <div className="bidang">
              <label htmlFor="surel">Surel kampus</label>
              <input ref={refs.surel} id="surel" type="email" autoComplete="username" value={surel} onChange={(e) => setSurel(e.target.value)}
                aria-invalid={!!galat.surel} aria-describedby={galat.surel ? 'g-surel' : undefined} />
              {galat.surel && <p id="g-surel" className="galat-bidang"><AlertCircle size={16} aria-hidden="true" />{galat.surel}</p>}
            </div>
            <div className="bidang">
              <label htmlFor="sandi">Kata sandi</label>
              <input ref={refs.sandi} id="sandi" type="password" autoComplete="current-password" value={sandi} onChange={(e) => setSandi(e.target.value)}
                aria-invalid={!!galat.sandi} aria-describedby={galat.sandi ? 'g-sandi' : undefined} />
              {galat.sandi && <p id="g-sandi" className="galat-bidang"><AlertCircle size={16} aria-hidden="true" />{galat.sandi}</p>}
            </div>
            <div className="bidang">
              <label htmlFor="peran">Peran</label>
              <select ref={refs.peran} id="peran" value={peran} onChange={(e) => setPeran(e.target.value as Peran)}
                aria-invalid={!!galat.peran} aria-describedby={galat.peran ? 'g-peran' : undefined}>
                <option value="">Pilih peran</option>
                {Object.entries(PERAN).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              {galat.peran && <p id="g-peran" className="galat-bidang"><AlertCircle size={16} aria-hidden="true" />{galat.peran}</p>}
            </div>
            <button type="submit" className="tombol tombol-utama" style={{ marginTop: '0.25rem' }}>Masuk</button>
          </form>

          <div className="pemisah">atau coba dengan akun contoh</div>
          <div className="akun-contoh">
            {contoh.map((u) => (
              <button key={u.id} type="button" onClick={() => { masuk(u.id); window.location.hash = '/' }}>
                <span className="avatar" aria-hidden="true">{inisial(u.nama)}</span>
                <span>
                  <b>{u.nama}</b>
                  <small>{PERAN[u.peran]}</small>
                </span>
                <ChevronRight size={18} aria-hidden="true" />
              </button>
            ))}
          </div>
          <p className="bantu">Prototipe untuk lampiran esai. Data contoh tersimpan di peramban ini saja; kata sandi akun contoh tercatat di berkas data contoh proyek.</p>
        </div>
      </main>
    </div>
  )
}
