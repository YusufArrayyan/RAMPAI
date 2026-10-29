import { useEffect, useState, type ReactNode } from 'react'
import {
  BarChart3, ClipboardCheck, Download, FileUp, FlaskConical, History, Inbox, LogOut, Menu, Moon, Settings, Sun, Library,
} from 'lucide-react'
import { useStore } from './data/store'
import type { Peran } from './data/types'
import { BUTUH_PENDAMPING, PERAN } from './data/workflow'
import { inisial, pergi, useRute } from './ui/dasar'
import Masuk from './layar/Masuk'
import Antrean from './layar/Antrean'
import DetailBerkas from './layar/DetailBerkas'
import Persetujuan from './layar/Persetujuan'
import Unduhan from './layar/Unduhan'
import PanelIndikator from './layar/PanelIndikator'
import Pengaturan from './layar/Pengaturan'
import KirimMateri from './layar/KirimMateri'
import MateriDosen from './layar/MateriDosen'
import Riset from './layar/Riset'
import LogAktivitas from './layar/LogAktivitas'

interface ItemNav { ke: string; label: string; ikon: typeof Inbox; hitung?: number }

const BERANDA: Record<Peran, string> = {
  pendamping: 'antrean',
  koordinator: 'panel',
  dosen: 'materi',
  mahasiswa: 'persetujuan',
  peneliti: 'panel',
}

function useTema() {
  const [tema, setTema] = useState<'terang' | 'gelap'>(() => {
    // Terang adalah bawaan; mode gelap hanya aktif bila pengguna memilihnya sendiri.
    return localStorage.getItem('rampai-tema-pilihan') === 'gelap' ? 'gelap' : 'terang'
  })
  useEffect(() => {
    document.documentElement.dataset.tema = tema
    localStorage.setItem('rampai-tema-pilihan', tema)
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', tema === 'gelap' ? '#11131f' : '#f7f8fc')
  }, [tema])
  return [tema, () => setTema((t) => (t === 'terang' ? 'gelap' : 'terang'))] as const
}

export default function App() {
  const { state, pengguna, keluar } = useStore()
  const rute = useRute()
  const [tema, gantiTema] = useTema()
  const [menuBuka, setMenuBuka] = useState(false)

  useEffect(() => setMenuBuka(false), [rute])
  useEffect(() => {
    if (!menuBuka) return
    const f = (e: KeyboardEvent) => e.key === 'Escape' && setMenuBuka(false)
    window.addEventListener('keydown', f)
    return () => window.removeEventListener('keydown', f)
  }, [menuBuka])

  if (!pengguna) return <Masuk tema={tema} gantiTema={gantiTema} />

  const peran = pengguna.peran
  const halaman = rute[0] ?? BERANDA[peran]

  const antreanAktif = state.berkas.filter((b) => b.izinPemilik && BUTUH_PENDAMPING.includes(b.status)).length
  const menungguSaya = state.berkas.filter((b) => b.status === 'lolos_uji').length

  const nav: Record<Peran, ItemNav[]> = {
    pendamping: [{ ke: 'antrean', label: 'Antrean berkas', ikon: Inbox, hitung: antreanAktif }],
    koordinator: [
      { ke: 'panel', label: 'Panel indikator', ikon: BarChart3 },
      { ke: 'antrean', label: 'Antrean berkas', ikon: Inbox, hitung: antreanAktif },
      { ke: 'log', label: 'Log aktivitas', ikon: History },
      { ke: 'pengaturan', label: 'Pengaturan', ikon: Settings },
    ],
    dosen: [
      { ke: 'materi', label: 'Materi saya', ikon: Library },
      { ke: 'kirim', label: 'Kirim materi', ikon: FileUp },
    ],
    mahasiswa: [
      { ke: 'persetujuan', label: 'Persetujuan', ikon: ClipboardCheck, hitung: menungguSaya },
      { ke: 'unduhan', label: 'Unduhan materi', ikon: Download },
      { ke: 'riset', label: 'Riset pemahaman', ikon: FlaskConical },
    ],
    peneliti: [
      { ke: 'panel', label: 'Panel indikator', ikon: BarChart3 },
      { ke: 'riset', label: 'Data I4', ikon: FlaskConical },
    ],
  }

  /** Hak akses per layar mengikuti matriks pada PRD. */
  const izin: Record<string, Peran[]> = {
    antrean: ['pendamping', 'koordinator'],
    berkas: ['pendamping', 'koordinator'],
    persetujuan: ['mahasiswa'],
    unduhan: ['mahasiswa'],
    panel: ['koordinator', 'peneliti'],
    pengaturan: ['koordinator'],
    log: ['koordinator'],
    kirim: ['dosen'],
    materi: ['dosen'],
    riset: ['mahasiswa', 'peneliti'],
  }

  let isi: ReactNode
  if (!izin[halaman]?.includes(peran)) {
    isi = <TidakAda beranda={BERANDA[peran]} />
  } else {
    switch (halaman) {
      case 'antrean': isi = <Antrean />; break
      case 'berkas': isi = <DetailBerkas id={rute[1]} />; break
      case 'persetujuan': isi = <Persetujuan />; break
      case 'unduhan': isi = <Unduhan />; break
      case 'panel': isi = <PanelIndikator />; break
      case 'pengaturan': isi = <Pengaturan />; break
      case 'log': isi = <LogAktivitas />; break
      case 'kirim': isi = <KirimMateri />; break
      case 'materi': isi = <MateriDosen />; break
      case 'riset': isi = <Riset />; break
    }
  }

  const aktif = halaman === 'berkas' ? 'antrean' : halaman

  return (
    <>
      <a href="#isi-utama" className="lompat" onClick={(e) => { e.preventDefault(); document.getElementById('isi-utama')?.focus() }}>
        Lompat ke isi utama
      </a>
      <div className="atas-ponsel">
        <a href={`#/${BERANDA[peran]}`} className="merek">
          <img src="/logo.png" alt="" />
          <b>RAMPAI Tracker</b>
        </a>
        <button type="button" className="tombol tombol-kedua ikon-tombol" aria-label="Buka menu" aria-expanded={menuBuka} aria-controls="navigasi" onClick={() => setMenuBuka(true)}>
          <Menu size={20} aria-hidden="true" />
        </button>
      </div>
      <div className="kerangka">
        {menuBuka && <div className="tirai" onClick={() => setMenuBuka(false)} aria-hidden="true" />}
        <aside className="sisi" id="navigasi" data-buka={menuBuka} aria-label="Navigasi utama">
          <a href={`#/${BERANDA[peran]}`} className="merek">
            <img src="/logo.png" alt="" />
            <span>
              <b>RAMPAI Tracker</b>
              <small>Matematika Diskrit · pilot</small>
            </span>
          </a>
          <nav className="nav">
            {nav[peran].map((n) => (
              <a key={n.ke} href={`#/${n.ke}`} aria-current={aktif === n.ke ? 'page' : undefined}>
                <n.ikon size={20} aria-hidden="true" />
                {n.label}
                {!!n.hitung && (
                  <span className="hitung angka" aria-label={`${n.hitung} perlu tindakan`}>{n.hitung}</span>
                )}
              </a>
            ))}
          </nav>
          <div className="akun">
            <div className="akun-nama">
              <span className="avatar" aria-hidden="true">{inisial(pengguna.nama)}</span>
              <span>
                <b>{pengguna.nama}</b>
                <small>{PERAN[peran]}</small>
              </span>
            </div>
            <div className="akun-tombol">
              <button type="button" className="tombol tombol-kedua tombol-kecil" style={{ flex: 1 }} onClick={() => { keluar(); pergi('/') }}>
                <LogOut size={16} aria-hidden="true" /> Keluar
              </button>
              <button type="button" className="tombol tombol-kedua tombol-kecil ikon-tombol" onClick={gantiTema} aria-label={tema === 'terang' ? 'Pakai mode gelap' : 'Pakai mode terang'}>
                {tema === 'terang' ? <Moon size={16} aria-hidden="true" /> : <Sun size={16} aria-hidden="true" />}
              </button>
            </div>
          </div>
        </aside>
        <main className="utama" id="isi-utama" tabIndex={-1}>
          <div key={rute.join('/')}>{isi}</div>
        </main>
      </div>
    </>
  )
}

function TidakAda({ beranda }: { beranda: string }) {
  useEffect(() => { document.title = 'Halaman tidak tersedia · RAMPAI Tracker' }, [])
  return (
    <div className="panel kosong">
      <h1>Halaman ini tidak tersedia untuk peran Anda</h1>
      <p>Alamatnya mungkin salah, atau halaman ini hanya bisa dibuka oleh peran lain sesuai matriks hak akses.</p>
      <a className="tombol tombol-utama" href={`#/${beranda}`}>Kembali ke beranda</a>
    </div>
  )
}
