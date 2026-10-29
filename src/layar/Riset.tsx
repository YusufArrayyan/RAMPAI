import { useState } from 'react'
import { AlertTriangle, FileSpreadsheet } from 'lucide-react'
import { useStore } from '../data/store'
import { hitungIndikator, keCsvI4 } from '../data/indikator'
import { Kepala, Pesan, tgl, unduhTeks, useJalankan } from '../ui/dasar'

const CAKUPAN = 'Skor pemahaman materi Matematika Diskrit selama pilot'

export default function Riset() {
  const { pengguna } = useStore()
  return pengguna?.peran === 'peneliti' ? <RisetPeneliti /> : <RisetMahasiswa />
}

function RisetPeneliti() {
  const { state } = useStore()
  const i4 = hitungIndikator(state).i4
  return (
    <>
      <Kepala
        judul="Data I4: skor pemahaman"
        sub="Hanya data teragregasi dari mahasiswa yang persetujuan risetnya masih berlaku. Tidak ada nama atau identitas."
        aksi={<button type="button" className="tombol tombol-kedua" onClick={() => unduhTeks('rampai-i4.csv', keCsvI4(state), 'text/csv;charset=utf-8')}><FileSpreadsheet size={18} aria-hidden="true" /> Ekspor CSV</button>}
      />
      <div className="indikator" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(14rem, 100%), 1fr))' }}>
        <section>
          <h2 className="kode-ind"><b>I4</b> Rata-rata skor</h2>
          <p className="angka-besar">{i4.rata === null ? '–' : Math.round(i4.rata)}<small>/100</small></p>
          <p className="kalimat-ind">{i4.rata === null ? 'Belum ada skor yang boleh dipakai.' : `Dari ${i4.jumlahSkor} skor yang dicatat mahasiswa pengguna.`}</p>
        </section>
        <section>
          <h2 className="kode-ind">Peserta</h2>
          <p className="angka-besar">{i4.peserta}</p>
          <p className="kalimat-ind">mahasiswa pengguna dengan persetujuan riset yang berlaku.</p>
        </section>
      </div>
      <div style={{ marginTop: '1.5rem' }}>
        <Pesan judul="Dilaporkan bila mahasiswa bersedia">I4 adalah indikator P1. Skor yang dicatat sebelum persetujuan dicabut ikut dikeluarkan dari perhitungan.</Pesan>
      </div>
    </>
  )
}

function RisetMahasiswa() {
  const { state, pengguna, aksi } = useStore()
  const jalankan = useJalankan()
  const persetujuan = state.persetujuanRiset.find((r) => r.mahasiswaId === pengguna!.id && !r.dicabut)
  const [setuju, setSetuju] = useState(false)
  const [galat, setGalat] = useState('')
  const [yakinCabut, setYakinCabut] = useState(false)
  const materi = state.berkas.filter((b) => b.status === 'siap_pakai').sort((a, b) => a.pertemuan - b.pertemuan)

  return (
    <>
      <Kepala judul="Riset pemahaman" sub="Opsional. Skor pemahaman (I4) membantu menilai apakah materi aksesibel benar-benar membantu. Tidak ikut tidak memengaruhi layanan Anda." />
      {!persetujuan ? (
        <section className="panel panel-isi tumpuk-s" style={{ maxWidth: '44rem', gap: '1rem' }} aria-labelledby="j-setuju">
          <h2 id="j-setuju" style={{ fontSize: 'var(--t-l)' }}>Persetujuan riset</h2>
          <ul className="panduan">
            <li>Cakupan: {CAKUPAN.toLowerCase()}.</li>
            <li>Peneliti hanya melihat rata-rata dan jumlah, tanpa nama Anda.</li>
            <li>Anda bisa mencabut persetujuan kapan saja; skor Anda keluar dari perhitungan.</li>
          </ul>
          <label className="kotak">
            <input type="checkbox" checked={setuju} onChange={(e) => { setSetuju(e.target.checked); setGalat('') }} aria-describedby={galat ? 'g-setuju' : undefined} />
            <span>Saya sudah membaca keterangan di atas dan setuju ikut riset.</span>
          </label>
          {galat && <p id="g-setuju" className="galat-bidang" role="alert"><AlertTriangle size={16} aria-hidden="true" />{galat}</p>}
          <div><button type="button" className="tombol tombol-utama" onClick={() => setuju ? jalankan(() => aksi.setujuRiset(CAKUPAN), 'Persetujuan riset tercatat.') : setGalat('Centang dulu bila Anda setuju.')}>Simpan persetujuan</button></div>
        </section>
      ) : (
        <div className="tumpuk">
          <Pesan nada="berhasil" judul={`Persetujuan tercatat sejak ${tgl(persetujuan.tanggal)}`}>
            {persetujuan.cakupan}.{' '}
            {!yakinCabut
              ? <button type="button" className="tombol tombol-hantu tombol-kecil" onClick={() => setYakinCabut(true)}>Cabut persetujuan</button>
              : <span className="deret-tombol" style={{ display: 'inline-flex', gap: '0.375rem' }}>
                  <button type="button" className="tombol tombol-bahaya tombol-kecil" onClick={() => jalankan(() => aksi.cabutRiset(), 'Persetujuan dicabut. Skor Anda tidak lagi dihitung.')}>Ya, cabut</button>
                  <button type="button" className="tombol tombol-hantu tombol-kecil" onClick={() => setYakinCabut(false)}>Batal</button>
                </span>}
          </Pesan>
          <section className="panel" aria-labelledby="j-skor">
            <div className="panel-kepala"><h2 id="j-skor">Skor pemahaman per materi</h2></div>
            <ul className="materi">
              {materi.map((b) => <BarisSkor key={b.id} berkasId={b.id} judul={`P${b.pertemuan}: ${b.judul}`} />)}
            </ul>
          </section>
        </div>
      )}
    </>
  )
}

function BarisSkor({ berkasId, judul }: { berkasId: string; judul: string }) {
  const { state, pengguna, aksi } = useStore()
  const jalankan = useJalankan()
  const ada = state.skor.find((s) => s.berkasId === berkasId && s.mahasiswaId === pengguna!.id)
  const [nilai, setNilai] = useState(ada ? String(ada.skor) : '')
  const id = `skor-${berkasId}`
  return (
    <li>
      <form className="baris-antara" onSubmit={(e) => { e.preventDefault(); jalankan(() => aksi.catatSkor(berkasId, Number(nilai)), 'Skor dicatat.') }}>
        <label htmlFor={id} style={{ fontWeight: 600 }}>{judul}</label>
        <span className="deret-tombol" style={{ gap: '0.5rem' }}>
          <input id={id} type="number" min={0} max={100} value={nilai} onChange={(e) => setNilai(e.target.value)} style={{ width: '6rem' }} aria-describedby={`${id}-b`} />
          <button type="submit" className="tombol tombol-kedua" disabled={nilai === ''}>Simpan</button>
        </span>
      </form>
      <span id={`${id}-b`} className="sr-only">Skor 0 sampai 100</span>
    </li>
  )
}
