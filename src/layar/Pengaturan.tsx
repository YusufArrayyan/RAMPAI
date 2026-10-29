import { useState, type FormEvent } from 'react'
import { AlertTriangle, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { useStore } from '../data/store'
import type { ButirPeriksa, Peran } from '../data/types'
import { PERAN, daftarPeriksaAktif } from '../data/workflow'
import { Kepala, tglJam, useJalankan } from '../ui/dasar'

export default function Pengaturan() {
  return (
    <>
      <Kepala judul="Pengaturan" sub="Akun dan peran, masa simpan berkas, dan daftar periksa verifikasi. Setiap perubahan tercatat di log aktivitas." />
      <div className="tumpuk">
        <Akun />
        <div className="dua">
          <DaftarPeriksa />
          <MasaSimpan />
        </div>
      </div>
    </>
  )
}

function Akun() {
  const { state, pengguna, aksi } = useStore()
  const jalankan = useJalankan()
  const [nama, setNama] = useState('')
  const [surel, setSurel] = useState('')
  const [peran, setPeran] = useState<Peran>('pendamping')
  const [galat, setGalat] = useState('')

  function tambah(e: FormEvent) {
    e.preventDefault()
    if (!nama.trim() || !surel.includes('@')) return setGalat('Isi nama dan surel yang memakai tanda @.')
    setGalat('')
    if (jalankan(() => aksi.tambahPengguna(nama.trim(), surel.trim(), peran), `Akun ${nama.trim()} ditambahkan.`)) {
      setNama(''); setSurel('')
    }
  }

  return (
    <section className="panel" aria-labelledby="j-akun">
      <div className="panel-kepala"><h2 id="j-akun">Akun dan peran</h2></div>
      <div className="gulir-x">
        <table>
          <thead><tr><th scope="col">Nama</th><th scope="col">Surel</th><th scope="col">Peran</th><th scope="col">Status</th></tr></thead>
          <tbody>
            {state.pengguna.map((u) => (
              <tr key={u.id}>
                <th scope="row" style={{ background: 'none', color: 'var(--ink)', fontSize: 'var(--t-s)' }}>{u.nama}</th>
                <td>{u.surel}</td>
                <td>
                  <label className="sr-only" htmlFor={`peran-${u.id}`}>Peran {u.nama}</label>
                  <select id={`peran-${u.id}`} value={u.peran} disabled={u.id === pengguna?.id} style={{ minWidth: '12rem' }}
                    onChange={(e) => jalankan(() => aksi.ubahPengguna(u.id, { peran: e.target.value as Peran }), `Peran ${u.nama} diubah.`)}>
                    {Object.entries(PERAN).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </td>
                <td>
                  <label className="kotak" style={{ alignItems: 'center' }}>
                    <input type="checkbox" checked={u.aktif} disabled={u.id === pengguna?.id}
                      onChange={(e) => jalankan(() => aksi.ubahPengguna(u.id, { aktif: e.target.checked }), `${u.nama} ${e.target.checked ? 'diaktifkan' : 'dinonaktifkan'}.`)} />
                    {u.aktif ? 'Aktif' : 'Nonaktif'}<span className="sr-only">: {u.nama}</span>
                  </label>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <form onSubmit={tambah} className="panel-isi" style={{ borderTop: '1px solid var(--line)' }} noValidate>
        <h3 style={{ fontSize: 'var(--t-m)', marginBottom: '0.75rem' }}>Tambah akun</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(13rem, 100%), 1fr))', gap: '0.75rem', alignItems: 'end' }}>
          <div className="bidang"><label htmlFor="a-nama">Nama</label><input id="a-nama" type="text" value={nama} onChange={(e) => setNama(e.target.value)} autoComplete="off" /></div>
          <div className="bidang"><label htmlFor="a-surel">Surel kampus</label><input id="a-surel" type="email" value={surel} onChange={(e) => setSurel(e.target.value)} autoComplete="off" /></div>
          <div className="bidang">
            <label htmlFor="a-peran">Peran</label>
            <select id="a-peran" value={peran} onChange={(e) => setPeran(e.target.value as Peran)}>
              {Object.entries(PERAN).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <button type="submit" className="tombol tombol-kedua"><Plus size={18} aria-hidden="true" /> Tambah akun</button>
        </div>
        {galat && <p className="galat-bidang" role="alert" style={{ marginTop: '0.5rem' }}><AlertTriangle size={16} aria-hidden="true" />{galat}</p>}
      </form>
    </section>
  )
}

function DaftarPeriksa() {
  const { state, aksi } = useStore()
  const jalankan = useJalankan()
  const aktif = daftarPeriksaAktif(state)
  const [butir, setButir] = useState<ButirPeriksa[]>(aktif.butir)
  const berubah = JSON.stringify(butir) !== JSON.stringify(aktif.butir)
  const nama = (uid: string) => state.pengguna.find((u) => u.id === uid)?.nama ?? ''

  const ubah = (i: number, p: Partial<ButirPeriksa>) => setButir((b) => b.map((x, j) => (j === i ? { ...x, ...p } : x)))

  return (
    <section className="panel" aria-labelledby="j-dp">
      <div className="panel-kepala">
        <h2 id="j-dp">Daftar periksa</h2>
        <span className="chip" data-nada="netral">Versi {aktif.versi}</span>
      </div>
      <div className="panel-isi tumpuk-s">
        <p className="bantu">Usulan awal untuk bahan pelatihan. Tinjau bersama ULD dan mahasiswa pengguna. Menyimpan perubahan membuat versi baru; berkas yang sedang diverifikasi mengisi ulang sesuai versi baru.</p>
        <ol className="tumpuk-s" style={{ margin: 0, paddingLeft: '1.25rem' }}>
          {butir.map((x, i) => (
            <li key={x.id}>
              <div style={{ display: 'grid', gap: '0.375rem' }}>
                <label className="sr-only" htmlFor={`dp-${x.id}`}>Butir {i + 1}</label>
                <textarea id={`dp-${x.id}`} value={x.teks} onChange={(e) => ubah(i, { teks: e.target.value })} style={{ minHeight: '3.5rem' }} />
                <div className="baris-antara">
                  <label className="pilih-tb"><input type="checkbox" checked={x.bilaAda} onChange={(e) => ubah(i, { bilaAda: e.target.checked })} />Bila ada (boleh "tidak ada")</label>
                  <button type="button" className="tombol tombol-hantu tombol-kecil" onClick={() => setButir((b) => b.filter((_, j) => j !== i))} aria-label={`Hapus butir ${i + 1}`}>
                    <Trash2 size={16} aria-hidden="true" /> Hapus
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ol>
        <div className="deret-tombol">
          <button type="button" className="tombol tombol-kedua" onClick={() => setButir((b) => [...b, { id: `b${Date.now()}`, teks: '', bilaAda: false }])}>
            <Plus size={18} aria-hidden="true" /> Tambah butir
          </button>
          <button type="button" className="tombol tombol-utama" disabled={!berubah || butir.some((x) => !x.teks.trim())}
            onClick={() => jalankan(() => aksi.simpanDaftarPeriksa(butir.map((x) => ({ ...x, teks: x.teks.trim() }))), `Daftar periksa versi ${aktif.versi + 1} disimpan.`)}>
            Simpan sebagai versi {aktif.versi + 1}
          </button>
          {berubah && <button type="button" className="tombol tombol-hantu" onClick={() => setButir(aktif.butir)}>Batal</button>}
        </div>
        <h3 style={{ fontSize: 'var(--t-s)', marginTop: '0.75rem' }}>Riwayat versi</h3>
        <ul className="kecil redup" style={{ margin: 0, paddingLeft: '1.25rem' }}>
          {state.daftarPeriksa.slice().reverse().map((v) => (
            <li key={v.versi}>Versi {v.versi}: {v.butir.length} butir, {tglJam(v.waktu)}, oleh {nama(v.pelakuId)}</li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function MasaSimpan() {
  const { state, aksi, aturUlang } = useStore()
  const jalankan = useJalankan()
  const [masa, setMasa] = useState(String(state.pengaturan.masaSimpanHari))
  const [tenggat, setTenggat] = useState(String(state.pengaturan.tenggatKirimHari))
  const [yakin, setYakin] = useState(false)
  const m = Number(masa), t = Number(tenggat)
  const valid = Number.isInteger(m) && m >= 7 && m <= 730 && Number.isInteger(t) && t >= 1 && t <= 30

  return (
    <div className="tumpuk">
      <section className="panel" aria-labelledby="j-ms">
        <div className="panel-kepala"><h2 id="j-ms">Masa simpan dan tenggat</h2></div>
        <form className="panel-isi tumpuk-s" onSubmit={(e) => { e.preventDefault(); if (valid) jalankan(() => aksi.ubahPengaturan({ masaSimpanHari: m, tenggatKirimHari: t }), 'Pengaturan disimpan.') }}>
          <div className="bidang">
            <label htmlFor="ms">Masa simpan salinan berkas (hari)</label>
            <input id="ms" type="number" min={7} max={730} value={masa} onChange={(e) => setMasa(e.target.value)} aria-describedby="ms-b" />
            <p id="ms-b" className="bantu">Salinan dihapus otomatis setelah masa ini, sesuai izin hak cipta. 7 sampai 730 hari.</p>
          </div>
          <div className="bidang">
            <label htmlFor="tk">Tenggat kirim dosen (hari sebelum kuliah)</label>
            <input id="tk" type="number" min={1} max={30} value={tenggat} onChange={(e) => setTenggat(e.target.value)} aria-describedby="tk-b" />
            <p id="tk-b" className="bantu">Dipakai untuk pengingat dosen dan pencatatan keterlambatan di I2.</p>
          </div>
          {!valid && <p className="galat-bidang"><AlertTriangle size={16} aria-hidden="true" />Masa simpan 7 sampai 730 hari, tenggat 1 sampai 30 hari.</p>}
          <div><button type="submit" className="tombol tombol-utama" disabled={!valid}>Simpan pengaturan</button></div>
        </form>
      </section>

      <section className="panel" aria-labelledby="j-reset">
        <div className="panel-kepala"><h2 id="j-reset">Data contoh</h2></div>
        <div className="panel-isi tumpuk-s">
          <p className="bantu">Kembalikan semua berkas, draf, dan log ke data contoh awal. Berguna sebelum demo.</p>
          {!yakin ? (
            <div><button type="button" className="tombol tombol-bahaya" onClick={() => setYakin(true)}><RotateCcw size={18} aria-hidden="true" /> Atur ulang data contoh</button></div>
          ) : (
            <>
              <p role="alert"><b>Atur ulang semua data?</b> Perubahan yang Anda buat di peramban ini akan hilang.</p>
              <div className="deret-tombol">
                <button type="button" className="tombol tombol-bahaya" onClick={() => { aturUlang(); setYakin(false); window.location.hash = '/panel' }}>Atur ulang</button>
                <button type="button" className="tombol tombol-hantu" onClick={() => setYakin(false)}>Batal</button>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  )
}
