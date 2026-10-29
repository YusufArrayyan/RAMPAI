import { useStore } from '../data/store'
import { PERAN } from '../data/workflow'
import { Kepala, tglJam } from '../ui/dasar'

export default function LogAktivitas() {
  const { state } = useStore()
  const log = state.log.slice().sort((a, b) => b.waktu.localeCompare(a.waktu))
  const u = (id: string) => state.pengguna.find((x) => x.id === id)
  const judul = (objek: string) => state.berkas.find((b) => b.id === objek)

  return (
    <>
      <Kepala judul="Log aktivitas" sub={`${log.length} catatan. Log hanya bisa ditambah, tidak bisa diubah atau dihapus.`} />
      <section className="panel">
        <div className="gulir-x">
          <table>
            <caption className="sr-only">Log aktivitas, terbaru di atas</caption>
            <thead><tr><th scope="col">Waktu</th><th scope="col">Pelaku</th><th scope="col">Aksi</th><th scope="col">Objek</th></tr></thead>
            <tbody>
              {log.map((l) => {
                const p = u(l.pelakuId)
                const b = judul(l.objek)
                return (
                  <tr key={l.id}>
                    <td className="angka" style={{ whiteSpace: 'nowrap' }}><time dateTime={l.waktu}>{tglJam(l.waktu)}</time></td>
                    <td>{p?.nama ?? 'Sistem'}<br /><span className="redup">{p ? PERAN[p.peran] : ''}</span></td>
                    <td>{l.aksi}</td>
                    <td>{b ? <a href={`#/berkas/${b.id}`}>P{b.pertemuan}: {b.judul}</a> : <span className="redup">{l.objek}</span>}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}
