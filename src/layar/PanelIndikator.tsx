import { FileSpreadsheet } from 'lucide-react'
import { useStore } from '../data/store'
import { hitungIndikator, keCsv } from '../data/indikator'
import type { Status } from '../data/types'
import { BUTUH_PENDAMPING, JENIS_DRAF, STATUS } from '../data/workflow'
import { Cincin, Kepala, durasiJam, salam, unduhTeks } from '../ui/dasar'

export default function PanelIndikator() {
  const { state, pengguna } = useStore()
  const ind = hitungIndikator(state)
  const koordinator = pengguna?.peran === 'koordinator'
  const maksJam = Math.max(1, ...ind.i2.rincian.map((r) => Math.abs(r.jam)))
  const tanggal = new Date().toISOString().slice(0, 10)

  // Beban pendamping (hanya koordinator): aksi 30 hari terakhir dan berkas yang sedang ditangani.
  const batas = Date.now() - 30 * 86_400_000
  const pendamping = state.pengguna.filter((u) => u.peran === 'pendamping')
  const beban = pendamping.map((u) => {
    const aksi = state.log.filter((l) => l.pelakuId === u.id && new Date(l.waktu).getTime() > batas)
    const berkasDisentuh = new Set(aksi.map((l) => l.objek))
    return {
      u,
      aksi: aksi.length,
      koreksi: state.koreksi.filter((k) => k.pelakuId === u.id).length,
      uji: state.uji.filter((x) => x.pengujiId === u.id).length,
      aktif: state.berkas.filter((b) => berkasDisentuh.has(b.id) && BUTUH_PENDAMPING.includes(b.status)).length,
    }
  })

  return (
    <>
      <Kepala
        sapaan={`${salam()}, ${pengguna?.nama.split(' ')[0]}.`}
        judul="Panel indikator"
        sub={`Dihitung otomatis dari aktivitas kerja ${state.mataKuliah[0]?.nama}, ${state.mataKuliah[0]?.semester}. Semua target adalah rancangan pilot, bukan temuan.`}
        aksi={
          <button type="button" className="tombol tombol-kedua" onClick={() => unduhTeks(`rampai-indikator-${tanggal}.csv`, keCsv(state), 'text/csv;charset=utf-8')}>
            <FileSpreadsheet size={18} aria-hidden="true" /> Ekspor CSV
          </button>
        }
      />

      <div className="indikator">
        <section aria-labelledby="i1">
          <h2 id="i1" className="kode-ind"><b>I1</b> Lolos uji pembaca layar</h2>
          <div className="angka-cincin">
            <p className="angka-besar">{ind.i1.persen}<small>%</small></p>
            <Cincin nilai={ind.i1.persen} warna="var(--ok)" />
          </div>
          <p className="kalimat-ind">{ind.i1.lolos} dari {ind.i1.total} berkas materi terbaca penuh di NVDA pada uji terakhirnya.</p>
          <p className="bantu">{ind.i1.ujiGagal} uji gagal tercatat dan sudah dikembalikan ke verifikasi. Target rancangan: seluruh materi sasaran lolos pada akhir bulan 3.</p>
        </section>

        <section aria-labelledby="i2">
          <h2 id="i2" className="kode-ind"><b>I2</b> Waktu tersedia sebelum kuliah</h2>
          <p className="angka-besar">
            {ind.i2.rataJam === null ? '–' : Math.abs(ind.i2.rataJam) < 72 ? Math.round(ind.i2.rataJam) : Math.round(ind.i2.rataJam / 24)}
            <small>{ind.i2.rataJam !== null && Math.abs(ind.i2.rataJam) < 72 ? 'jam' : 'hari'}</small>
          </p>
          <p className="kalimat-ind">
            {ind.i2.rataJam === null
              ? 'Belum ada materi yang terbit, jadi waktu penyediaan belum bisa dihitung.'
              : `Rata-rata materi siap pakai ${durasiJam(ind.i2.rataJam)} sebelum kuliah, dari ${ind.i2.terbit} materi yang sudah terbit.`}
          </p>
          <p className="bantu">{ind.i2.terlambatTerbit} materi terbit setelah kuliah. {ind.i2.terlambatKirimDosen} kiriman dosen melewati tenggat {state.pengaturan.tenggatKirimHari} hari.</p>
        </section>

        <section aria-labelledby="i3">
          <h2 id="i3" className="kode-ind"><b>I3</b> Draf AI dikoreksi manusia</h2>
          <div className="angka-cincin">
            <p className="angka-besar">{ind.i3.persen}<small>%</small></p>
            <Cincin nilai={ind.i3.persen} warna="var(--draf-line)" />
          </div>
          <p className="kalimat-ind">{ind.i3.drafDikoreksi} dari {ind.i3.drafTotal} draf AI diubah pendamping sebelum dipakai, dengan {ind.i3.koreksiTotal} koreksi tercatat.</p>
          <p className="bantu">Angka tinggi berarti pemeriksaan berjalan, bukan berarti alatnya buruk. Dilaporkan apa adanya.</p>
        </section>
      </div>

      <Sebaran hitung={(st) => state.berkas.filter((b) => b.status === st).length} total={state.berkas.length} />

      <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(22rem, 100%), 1fr))', gap: '1.5rem', alignItems: 'start' }}>
        <section className="panel" aria-labelledby="rinci-i2">
          <div className="panel-kepala"><h2 id="rinci-i2">I2 per pertemuan</h2></div>
          <div className="panel-isi">
            {ind.i2.rincian.length === 0 ? <p className="redup">Belum ada materi siap pakai.</p> : (
              <>
                <div className="batang" aria-hidden="true">
                  {ind.i2.rincian.map((r) => (
                    <div key={r.pertemuan} className="batang-baris">
                      <span>Pertemuan {r.pertemuan}</span>
                      <span className="isi"><span data-negatif={r.jam < 0} style={{ width: `${(Math.abs(r.jam) / maksJam) * 100}%` }} /></span>
                      <span className="angka">{durasiJam(r.jam)}</span>
                    </div>
                  ))}
                </div>
                <div className="sr-only"><table>
                  <caption>Waktu materi siap pakai sebelum kuliah, per pertemuan</caption>
                  <thead><tr><th scope="col">Pertemuan</th><th scope="col">Waktu sebelum kuliah</th></tr></thead>
                  <tbody>{ind.i2.rincian.map((r) => <tr key={r.pertemuan}><td>{r.pertemuan}</td><td>{durasiJam(r.jam)}</td></tr>)}</tbody>
                </table></div>
              </>
            )}
          </div>
        </section>

        <section className="panel" aria-labelledby="rinci-i3">
          <div className="panel-kepala"><h2 id="rinci-i3">I3 per jenis draf</h2></div>
          <div className="gulir-x">
            <table>
              <thead><tr><th scope="col">Jenis</th><th scope="col">Draf</th><th scope="col">Dikoreksi</th><th scope="col">Persen</th></tr></thead>
              <tbody>
                {Object.entries(ind.i3.perJenis).map(([j, v]) => (
                  <tr key={j}>
                    <th scope="row" style={{ background: 'none', color: 'var(--ink)', fontSize: 'var(--t-s)' }}>{JENIS_DRAF[j as keyof typeof JENIS_DRAF]}</th>
                    <td className="angka">{v.total}</td>
                    <td className="angka">{v.dikoreksi}</td>
                    <td className="angka">{v.total ? Math.round((v.dikoreksi / v.total) * 100) : 0}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {koordinator && (
        <section className="panel" style={{ marginTop: '1.5rem' }} aria-labelledby="beban">
          <div className="panel-kepala">
            <h2 id="beban">Beban pendamping</h2>
            <span className="bantu">Aksi 30 hari terakhir. Tidak ikut diekspor.</span>
          </div>
          <div className="gulir-x">
            <table>
              <thead><tr><th scope="col">Pendamping</th><th scope="col">Status akun</th><th scope="col">Aksi</th><th scope="col">Koreksi</th><th scope="col">Uji</th><th scope="col">Berkas berjalan</th></tr></thead>
              <tbody>
                {beban.map((x) => (
                  <tr key={x.u.id}>
                    <th scope="row" style={{ background: 'none', color: 'var(--ink)', fontSize: 'var(--t-s)' }}>{x.u.nama}</th>
                    <td>{x.u.aktif ? 'Aktif' : 'Nonaktif'}</td>
                    <td className="angka">{x.aksi}</td>
                    <td className="angka">{x.koreksi}</td>
                    <td className="angka">{x.uji}</td>
                    <td className="angka">{x.aktif}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  )
}

const URUT: Status[] = ['siap_pakai', 'lolos_uji', 'siap_uji', 'terverifikasi', 'draf_ai', 'siap_draf', 'diterima', 'perlu_ocr', 'dikembalikan']

function Sebaran({ hitung, total }: { hitung: (s: Status) => number; total: number }) {
  const isi = URUT.map((s) => ({ s, n: hitung(s) })).filter((x) => x.n > 0)
  return (
    <section className="panel panel-isi sebaran" aria-labelledby="j-sebaran" style={{ marginTop: '2rem' }}>
      <div className="baris-antara">
        <h2 id="j-sebaran" style={{ fontSize: 'var(--t-m)' }}>Posisi {total} berkas saat ini</h2>
        <span className="bantu">Dari siap pakai (kiri) sampai yang perlu perbaikan (kanan)</span>
      </div>
      <div className="sebaran-bar" aria-hidden="true">
        {isi.map((x) => <span key={x.s} data-nada={STATUS[x.s].nada} data-s={x.s} style={{ flexGrow: x.n }} title={`${STATUS[x.s].label}: ${x.n}`} />)}
      </div>
      <ul className="sebaran-legenda">
        {isi.map((x) => (
          <li key={x.s}><span className="kotak-warna" data-nada={STATUS[x.s].nada} data-s={x.s} aria-hidden="true" />{STATUS[x.s].label} <b className="angka">{x.n}</b></li>
        ))}
      </ul>
    </section>
  )
}
