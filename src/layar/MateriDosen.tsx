import { useState } from 'react'
import { BellRing, FileUp } from 'lucide-react'
import { useStore } from '../data/store'
import { tenggatKirim, terlambatKirim } from '../data/workflow'
import { ChipStatus, Kepala, Pesan, hariTgl, tglPendek, teksSisa, useJalankan } from '../ui/dasar'

export default function MateriDosen() {
  const { state, pengguna, aksi } = useStore()
  const jalankan = useJalankan()
  const [cabut, setCabut] = useState<string | null>(null)
  const mk = state.mataKuliah.filter((m) => m.dosenId === pengguna!.id)
  const daftar = state.berkas.filter((b) => mk.some((m) => m.id === b.mataKuliahId)).sort((a, b) => a.pertemuan - b.pertemuan)
  const hariTenggat = state.pengaturan.tenggatKirimHari

  // F11: pertemuan berikutnya yang materinya belum dikirim (jadwal mingguan).
  const terakhir = daftar.at(-1)
  const berikut = terakhir && {
    pertemuan: terakhir.pertemuan + 1,
    jadwal: new Date(new Date(terakhir.jadwalKuliah).getTime() + 7 * 86_400_000).toISOString(),
  }
  const tenggatBerikut = berikut && tenggatKirim({ jadwalKuliah: berikut.jadwal }, hariTenggat)

  return (
    <>
      <Kepala
        judul="Materi saya"
        sub={mk.map((m) => `${m.nama}, ${m.semester}`).join('; ')}
        aksi={<a href="#/kirim" className="tombol tombol-utama"><FileUp size={18} aria-hidden="true" /> Kirim materi</a>}
      />

      {berikut && tenggatBerikut && (
        <div style={{ marginBottom: '1.5rem' }}>
          <Pesan nada={tenggatBerikut < new Date() ? 'galat' : 'info'} ikon={<BellRing aria-hidden="true" />}
            judul={`Pengingat: materi pertemuan ${berikut.pertemuan} dikirim paling lambat ${hariTgl(tenggatBerikut.toISOString())}`}>
            Kuliah {hariTgl(berikut.jadwal)}. Tenggat {hariTenggat} hari sebelum kuliah memberi pendamping waktu untuk verifikasi dan uji NVDA.
          </Pesan>
        </div>
      )}

      <section className="panel" aria-label="Daftar materi">
        <div className="gulir-x">
          <table>
            <thead>
              <tr><th scope="col">Pertemuan</th><th scope="col">Materi</th><th scope="col">Kuliah</th><th scope="col">Dikirim</th><th scope="col">Status</th><th scope="col">Izin</th></tr>
            </thead>
            <tbody>
              {daftar.map((b) => (
                <tr key={b.id}>
                  <td className="angka">{b.pertemuan}</td>
                  <th scope="row" style={{ background: 'none', color: 'var(--ink)', fontSize: 'var(--t-s)' }}>{b.judul}</th>
                  <td style={{ whiteSpace: 'nowrap' }}>{tglPendek(b.jadwalKuliah)}<br /><span className="redup">{teksSisa(b.jadwalKuliah)}</span></td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {tglPendek(b.waktuKirim)}
                    {terlambatKirim(b, hariTenggat) && <><br /><span style={{ color: 'var(--err)', fontWeight: 650 }}>Lewat tenggat</span></>}
                  </td>
                  <td><ChipStatus status={b.status} /></td>
                  <td>
                    {!b.izinPemilik ? <span className="redup">Dicabut</span>
                      : b.status === 'siap_pakai' ? <span className="redup">Tercatat</span>
                      : cabut === b.id ? (
                        <span className="deret-tombol" style={{ gap: '0.375rem' }}>
                          <button type="button" className="tombol tombol-bahaya tombol-kecil" onClick={() => { jalankan(() => aksi.cabutIzin(b.id), 'Izin dicabut. Berkas berhenti diproses.'); setCabut(null) }}>Cabut izin</button>
                          <button type="button" className="tombol tombol-hantu tombol-kecil" onClick={() => setCabut(null)}>Batal</button>
                        </span>
                      ) : (
                        <button type="button" className="tombol tombol-hantu tombol-kecil" onClick={() => setCabut(b.id)} aria-label={`Cabut izin untuk ${b.judul}`}>Cabut izin</button>
                      )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}
