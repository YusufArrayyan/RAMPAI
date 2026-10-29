import { useRef, useState, type FormEvent, type RefObject } from 'react'
import { AlertTriangle, FileUp } from 'lucide-react'
import { useStore } from '../data/store'
import { tenggatKirim } from '../data/workflow'
import { deteksiLapisanTeks, type HasilDeteksi } from '../services/layanan'
import { Kepala, Pesan, hariTgl, useJalankan } from '../ui/dasar'

type Kunci = 'judul' | 'pertemuan' | 'jadwal' | 'berkas' | 'izin'

function lokalKeInput(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

export default function KirimMateri() {
  const { state, pengguna, aksi } = useStore()
  const jalankan = useJalankan()
  const mk = state.mataKuliah.filter((m) => m.dosenId === pengguna!.id)
  const berkasMk = state.berkas.filter((b) => mk.some((m) => m.id === b.mataKuliahId))
  const terakhir = berkasMk.slice().sort((a, b) => b.pertemuan - a.pertemuan)[0]
  const usulJadwal = terakhir ? new Date(new Date(terakhir.jadwalKuliah).getTime() + 7 * 86_400_000) : new Date(Date.now() + 14 * 86_400_000)

  const [mkId, setMkId] = useState(mk[0]?.id ?? '')
  const [judul, setJudul] = useState('')
  const [pertemuan, setPertemuan] = useState(String((terakhir?.pertemuan ?? 0) + 1))
  const [jadwal, setJadwal] = useState(lokalKeInput(usulJadwal))
  const [file, setFile] = useState<File | null>(null)
  const [deteksi, setDeteksi] = useState<HasilDeteksi | null>(null)
  const [izin, setIzin] = useState(false)
  const [galat, setGalat] = useState<Partial<Record<Kunci, string>>>({})
  const refs: Record<Kunci, RefObject<HTMLInputElement | null>> = {
    judul: useRef(null), pertemuan: useRef(null), jadwal: useRef(null), berkas: useRef(null), izin: useRef(null),
  }

  async function pilihFile(f: File | null) {
    setFile(f)
    setDeteksi(f ? await deteksiLapisanTeks(f) : null)
  }

  function kirim(e: FormEvent) {
    e.preventDefault()
    const g: typeof galat = {}
    if (!judul.trim()) g.judul = 'Isi judul materi.'
    const n = Number(pertemuan)
    if (!Number.isInteger(n) || n < 1 || n > 16) g.pertemuan = 'Pertemuan berupa angka 1 sampai 16.'
    if (!jadwal) g.jadwal = 'Isi jadwal kuliah.'
    if (!file) g.berkas = 'Pilih berkas materi.'
    else if (file.size > 50 * 1024 * 1024) g.berkas = 'Berkas lebih dari 50 MB. Pecah per bab, lalu kirim lagi.'
    if (!izin) g.izin = 'Centang izin pemrosesan. Tanpa izin, berkas tidak boleh diproses.'
    setGalat(g)
    const pertama = (['judul', 'pertemuan', 'jadwal', 'berkas', 'izin'] as Kunci[]).find((k) => g[k])
    if (pertama) return refs[pertama].current?.focus()

    let id = ''
    const ok = jalankan(() => {
      id = aksi.kirimBerkas({
        judul: judul.trim(), mataKuliahId: mkId, pertemuan: n, jadwalKuliah: new Date(jadwal).toISOString(),
        izinPemilik: true, namaFile: file!.name, jenisFile: file!.type || 'tidak diketahui', lapisanTeks: null,
        hasilDeteksi: deteksi ?? undefined, bagian: [],
      })
    }, 'Materi terkirim. Pendamping akan memulai triase.')
    if (ok && id) window.location.hash = '/materi'
  }

  const tenggat = jadwal ? tenggatKirim({ jadwalKuliah: new Date(jadwal).toISOString() }, state.pengaturan.tenggatKirimHari) : null
  const lewat = tenggat && tenggat < new Date()

  const err = (k: Kunci) => galat[k] && <p id={`g-${k}`} className="galat-bidang"><AlertTriangle size={16} aria-hidden="true" />{galat[k]}</p>
  const desc = (k: Kunci, bantu?: string) => (galat[k] ? `g-${k}` : bantu)

  return (
    <>
      <Kepala judul="Kirim materi" sub="Kirim materi paling lambat 7 hari sebelum kuliah agar pendamping sempat memverifikasi dan menguji dengan NVDA." />
      <div className="dua">
        <form className="panel panel-isi tumpuk-s" style={{ gap: '1.25rem' }} onSubmit={kirim} noValidate>
          <div className="bidang">
            <label htmlFor="mk">Mata kuliah</label>
            <select id="mk" value={mkId} onChange={(e) => setMkId(e.target.value)}>
              {mk.map((m) => <option key={m.id} value={m.id}>{m.nama}, {m.semester}</option>)}
            </select>
          </div>
          <div className="bidang">
            <label htmlFor="judul">Judul materi</label>
            <input ref={refs.judul} id="judul" type="text" value={judul} onChange={(e) => setJudul(e.target.value)} placeholder="Contoh: Graf berbobot dan lintasan terpendek"
              aria-invalid={!!galat.judul} aria-describedby={desc('judul')} />
            {err('judul')}
          </div>
          <div className="pasangan" style={{ padding: 0 }}>
            <div className="bidang">
              <label htmlFor="pertemuan">Pertemuan ke</label>
              <input ref={refs.pertemuan} id="pertemuan" type="number" min={1} max={16} value={pertemuan} onChange={(e) => setPertemuan(e.target.value)}
                aria-invalid={!!galat.pertemuan} aria-describedby={desc('pertemuan')} />
              {err('pertemuan')}
            </div>
            <div className="bidang">
              <label htmlFor="jadwal">Jadwal kuliah</label>
              <input ref={refs.jadwal} id="jadwal" type="datetime-local" value={jadwal} onChange={(e) => setJadwal(e.target.value)}
                aria-invalid={!!galat.jadwal} aria-describedby={desc('jadwal')} />
              {err('jadwal')}
            </div>
          </div>
          {tenggat && (
            <Pesan nada={lewat ? 'galat' : 'info'} judul={lewat ? 'Sudah lewat tenggat kirim' : `Tenggat kirim: ${hariTgl(tenggat.toISOString())}`}>
              {lewat ? 'Materi tetap bisa dikirim. Keterlambatan dicatat untuk indikator I2.' : `${state.pengaturan.tenggatKirimHari} hari sebelum kuliah.`}
            </Pesan>
          )}
          <div className="bidang">
            <label htmlFor="berkas">Berkas materi</label>
            <input ref={refs.berkas} id="berkas" type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.png,.jpg,.jpeg"
              onChange={(e) => pilihFile(e.target.files?.[0] ?? null)} aria-invalid={!!galat.berkas} aria-describedby={desc('berkas', 'b-berkas')} />
            {galat.berkas ? err('berkas') : <p id="b-berkas" className="bantu">PDF, Word, PowerPoint, teks, atau gambar. Maksimal 50 MB.</p>}
            {deteksi && (
              <p className="bantu" role="status"><b>{deteksi.lapisanTeks ? 'Teks ada.' : 'Perlu OCR.'}</b> {deteksi.alasan}</p>
            )}
          </div>
          <div className="bidang">
            <label className="kotak">
              <input ref={refs.izin} type="checkbox" checked={izin} onChange={(e) => setIzin(e.target.checked)} aria-invalid={!!galat.izin} aria-describedby={desc('izin')} />
              <span>Saya mengizinkan ULD memproses berkas ini menjadi format aksesibel untuk mahasiswa pengguna. Isi materi tetap tanggung jawab saya. Salinan dihapus setelah {state.pengaturan.masaSimpanHari} hari.</span>
            </label>
            {err('izin')}
          </div>
          <div><button type="submit" className="tombol tombol-utama"><FileUp size={18} aria-hidden="true" /> Kirim materi</button></div>
        </form>

        <aside className="panel panel-isi tumpuk-s" aria-labelledby="j-apa">
          <h2 id="j-apa" style={{ fontSize: 'var(--t-l)' }}>Yang terjadi setelah dikirim</h2>
          <ol className="panduan">
            <li>Pendamping memeriksa lapisan teks dan struktur judul.</li>
            <li>AI menyusun draf teks alternatif, deskripsi rumus, dan transkrip. AI tidak mengubah isi materi Anda.</li>
            <li>Pendamping memeriksa setiap draf dengan daftar periksa.</li>
            <li>Materi diuji dengan NVDA, lalu mahasiswa pengguna menyetujui.</li>
          </ol>
          <p className="bantu">Pendamping mungkin menghubungi Anda bila ada pertanyaan tentang isi, misalnya maksud sebuah diagram.</p>
        </aside>
      </div>
    </>
  )
}
