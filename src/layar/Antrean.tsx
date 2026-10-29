import { useState } from 'react'
import { ArrowRight, CalendarClock, Check, FileText, Inbox } from 'lucide-react'
import { useStore } from '../data/store'
import type { Berkas } from '../data/types'
import { AKSI_BERIKUT, BUTUH_PENDAMPING, LANGKAH, STATUS } from '../data/workflow'
import { ChipStatus, Kepala, Lintasan, hariTgl, salam, sisaHari, teksSisa } from '../ui/dasar'

type Saring = 'tindakan' | 'menunggu' | 'selesai' | 'semua'

const SARING: { k: Saring; label: string; cocok: (b: Berkas) => boolean }[] = [
  { k: 'tindakan', label: 'Perlu tindakan', cocok: (b) => BUTUH_PENDAMPING.includes(b.status) },
  { k: 'menunggu', label: 'Menunggu mahasiswa', cocok: (b) => b.status === 'lolos_uji' },
  { k: 'selesai', label: 'Siap pakai', cocok: (b) => b.status === 'siap_pakai' },
  { k: 'semua', label: 'Semua', cocok: () => true },
]

export default function Antrean() {
  const { state, pengguna } = useStore()
  const [saring, setSaring] = useState<Saring>('tindakan')
  const bisaUbah = pengguna?.peran === 'pendamping'
  const mk = (id: string) => state.mataKuliah.find((m) => m.id === id)?.nama ?? ''

  const cocok = SARING.find((s) => s.k === saring)!.cocok
  const daftar = state.berkas
    .filter((b) => b.izinPemilik && cocok(b))
    .sort((a, b) => a.jadwalKuliah.localeCompare(b.jadwalKuliah))

  const grup: { judul: string; isi: Berkas[] }[] = [
    { judul: 'Sudah lewat jadwal kuliah', isi: daftar.filter((b) => sisaHari(b.jadwalKuliah) < 0) },
    { judul: 'Kuliah dalam 7 hari', isi: daftar.filter((b) => sisaHari(b.jadwalKuliah) >= 0 && sisaHari(b.jadwalKuliah) <= 7) },
    { judul: 'Kuliah berikutnya', isi: daftar.filter((b) => sisaHari(b.jadwalKuliah) > 7) },
  ].filter((g) => g.isi.length)

  const jumlahTindakan = state.berkas.filter((b) => b.izinPemilik && BUTUH_PENDAMPING.includes(b.status)).length

  return (
    <>
      <Kepala
        sapaan={`${salam()}, ${pengguna?.nama.split(' ')[0]}.`}
        judul="Antrean berkas"
        sub={bisaUbah
          ? `${jumlahTindakan} berkas menunggu tindakan Anda, diurutkan menurut jadwal kuliah terdekat.`
          : 'Tampilan baca untuk koordinator ULD. Perubahan status dilakukan pendamping.'}
      />

      <div className="bento-atas">
        <Fokus berkas={state.berkas} bisaUbah={bisaUbah} />
        <Pekan berkas={state.berkas} />
      </div>

      <div className="saring" role="group" aria-label="Saring antrean">
        {SARING.map((s) => {
          const n = state.berkas.filter((b) => b.izinPemilik && s.cocok(b)).length
          return (
            <button key={s.k} type="button" aria-pressed={saring === s.k} onClick={() => setSaring(s.k)}>
              {s.label} <span className="angka">({n})</span>
            </button>
          )
        })}
      </div>

      {grup.length === 0 && (
        <div className="panel kosong">
          <Inbox size={36} aria-hidden="true" />
          <h2>Tidak ada berkas di sini</h2>
          <p>
            {saring === 'tindakan'
              ? 'Semua berkas sudah melewati langkah pendamping. Berkas baru muncul di sini begitu dosen mengirim materi dan memberi izin.'
              : 'Pilih saringan lain untuk melihat berkas dengan status berbeda.'}
          </p>
          {saring !== 'semua' && <button type="button" className="tombol tombol-kedua" onClick={() => setSaring('semua')}>Lihat semua berkas</button>}
        </div>
      )}

      {grup.map((g) => (
        <section key={g.judul} className="grup-antrean" aria-labelledby={`g-${g.judul}`}>
          <h2 id={`g-${g.judul}`}>{g.judul} <span className="angka">{g.isi.length}</span></h2>
          <ul className="daftar-berkas">
            {g.isi.map((b) => {
              const d = new Date(b.jadwalKuliah)
              const sisa = sisaHari(b.jadwalKuliah)
              const mendesak = sisa <= 3 && BUTUH_PENDAMPING.includes(b.status)
              return (
                <li key={b.id} className="kartu-berkas" data-mendesak={mendesak}>
                  <div className="tanggal" aria-hidden="true">
                    <b className="angka">{d.getDate()}</b>
                    <small>{d.toLocaleDateString('id-ID', { month: 'short' })}</small>
                  </div>
                  <div>
                    <h3><a href={`#/berkas/${b.id}`}>{b.judul}</a></h3>
                    <div className="meta">
                      <span>Pertemuan {b.pertemuan} · {mk(b.mataKuliahId)}</span>
                      <span style={mendesak ? { color: 'var(--err)', fontWeight: 650 } : undefined}>
                        <CalendarClock aria-hidden="true" />Kuliah {teksSisa(b.jadwalKuliah)}
                        <span className="sr-only">, {d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                      </span>
                      <span><FileText aria-hidden="true" />{b.namaFile}{b.versi > 1 && `, versi ${b.versi}`}</span>
                    </div>
                  </div>
                  <div className="kartu-status">
                    <ChipStatus status={b.status} />
                    <Lintasan berkas={b} />
                  </div>
                  <a href={`#/berkas/${b.id}`} className={`tombol ${bisaUbah && BUTUH_PENDAMPING.includes(b.status) ? 'tombol-utama' : 'tombol-kedua'}`} aria-label={`${bisaUbah && BUTUH_PENDAMPING.includes(b.status) ? 'Lanjut' : 'Lihat'}: ${b.judul}`}>
                    {bisaUbah && BUTUH_PENDAMPING.includes(b.status) ? 'Lanjut' : 'Lihat'} <ArrowRight size={18} aria-hidden="true" />
                  </a>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </>
  )
}

function Fokus({ berkas, bisaUbah }: { berkas: Berkas[]; bisaUbah: boolean }) {
  const b = berkas
    .filter((x) => x.izinPemilik && BUTUH_PENDAMPING.includes(x.status))
    .sort((a, c) => a.jadwalKuliah.localeCompare(c.jadwalKuliah))[0]
  if (!b) {
    return (
      <section className="fokus fokus-tenang" aria-labelledby="j-fokus">
        <p className="fokus-label">Berikutnya</p>
        <h2 id="j-fokus">Antrean kosong</h2>
        <p>Semua berkas sudah melewati langkah pendamping. Berkas baru muncul begitu dosen mengirim materi.</p>
      </section>
    )
  }
  const info = STATUS[b.status]
  const sisa = sisaHari(b.jadwalKuliah)
  return (
    <section className="fokus" aria-labelledby="j-fokus">
      <span className="fokus-busur" aria-hidden="true" />
      <div className="fokus-atas">
        <p className="fokus-label">Berikutnya · langkah {info.langkah} dari 4, {LANGKAH[info.langkah - 1].toLowerCase()}</p>
        <h2 id="j-fokus">{b.judul}</h2>
        <p>
          Pertemuan {b.pertemuan}. Kuliah {hariTgl(b.jadwalKuliah)}
          {sisa >= 0 ? `, ${teksSisa(b.jadwalKuliah)}.` : '.'}
          {b.status === 'dikembalikan' && b.catatanKembali ? ` ${b.catatanKembali.split(':')[0]}.` : ''}
        </p>
      </div>
      <div className="fokus-kaki">
        <a href={`#/berkas/${b.id}`} className="tombol tombol-terang">
          {bisaUbah ? AKSI_BERIKUT[b.status] : 'Lihat berkas'} <ArrowRight size={18} aria-hidden="true" />
        </a>
        <ChipStatus status={b.status} />
      </div>
    </section>
  )
}

/** Pita jadwal kuliah 14 hari ke depan; titik menunjukkan apakah materi sudah siap. */
function Pekan({ berkas }: { berkas: Berkas[] }) {
  const hari = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + i)
    return d
  })
  const pada = (i: number) => berkas.filter((b) => b.izinPemilik && sisaHari(b.jadwalKuliah) === i)
  const kuliah = hari.flatMap((_, i) => pada(i))
  return (
    <section className="panel pekan" aria-labelledby="j-pekan">
      <div className="baris-antara">
        <h2 id="j-pekan">Jadwal kuliah 14 hari</h2>
        <span className="bantu"><span className="titik siap" aria-hidden="true" /> siap <span className="titik belum" aria-hidden="true" style={{ marginLeft: '0.5rem' }} /> belum siap</span>
      </div>
      <ol className="pita" aria-hidden="true">
        {hari.map((d, i) => {
          const isi = pada(i)
          return (
            <li key={i} data-hari-ini={i === 0} data-ada={isi.length > 0}>
              <small>{d.toLocaleDateString('id-ID', { weekday: 'short' }).slice(0, 3)}</small>
              <b className="angka">{d.getDate()}</b>
              <span className="titik-deret">
                {isi.map((b) => <span key={b.id} className={`titik ${b.status === 'siap_pakai' ? 'siap' : 'belum'}`} title={`P${b.pertemuan}`} />)}
              </span>
            </li>
          )
        })}
      </ol>
      <ul className="pekan-daftar">
        {kuliah.length === 0 && <li className="redup">Tidak ada kuliah dalam 14 hari ke depan.</li>}
        {kuliah.map((b) => (
          <li key={b.id}>
            {b.status === 'siap_pakai'
              ? <Check size={16} aria-hidden="true" style={{ color: 'var(--ok)' }} />
              : <span className="titik belum" aria-hidden="true" />}
            <span><b>P{b.pertemuan}</b> {teksSisa(b.jadwalKuliah)}: {b.status === 'siap_pakai' ? 'materi siap' : `belum siap (${STATUS[b.status].label.toLowerCase()})`}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
