import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import {
  AlertTriangle, Check, CheckCircle2, CircleDashed, CircleDot, Clock, FileCheck2, FileInput, FileWarning, Hourglass,
  RotateCcw, ScanText, Sparkles, X,
} from 'lucide-react'
import type { Berkas, Status } from '../data/types'
import { LANGKAH, STATUS } from '../data/workflow'

/* ---------- Rute (hash) ---------- */
function bacaHash() {
  return window.location.hash.replace(/^#\/?/, '').split('/').filter(Boolean)
}
export function useRute() {
  const [rute, setRute] = useState(bacaHash)
  useEffect(() => {
    const f = () => setRute(bacaHash())
    window.addEventListener('hashchange', f)
    return () => window.removeEventListener('hashchange', f)
  }, [])
  return rute
}
export function pergi(ke: string) {
  window.location.hash = ke
}

/** Judul halaman: memperbarui document.title dan memindahkan fokus ke h1 setelah pindah rute. */
export function Kepala({ judul, sub, aksi, remah, sapaan }: { judul: string; sub?: ReactNode; aksi?: ReactNode; remah?: ReactNode; sapaan?: ReactNode }) {
  const ref = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    document.title = `${judul} · RAMPAI Tracker`
    ref.current?.focus({ preventScroll: false })
  }, [judul])
  return (
    <header className="kepala">
      <div>
        {remah && <nav aria-label="Remah roti" className="remah">{remah}</nav>}
        {sapaan && <p className="sapaan">{sapaan}</p>}
        <h1 ref={ref} tabIndex={-1}>{judul}</h1>
        {sub && <p>{sub}</p>}
      </div>
      {aksi && <div className="deret-tombol">{aksi}</div>}
    </header>
  )
}

/* ---------- Format ---------- */
const fmtTgl = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
const fmtTglJam = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
const fmtHariTgl = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
export const tgl = (iso: string) => fmtTgl.format(new Date(iso))
const fmtPendek = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' })
export const tglPendek = (iso: string) => fmtPendek.format(new Date(iso))
export const tglJam = (iso: string) => fmtTglJam.format(new Date(iso))
export const hariTgl = (iso: string) => fmtHariTgl.format(new Date(iso))

export function sisaHari(iso: string): number {
  const a = new Date(); a.setHours(0, 0, 0, 0)
  const b = new Date(iso); b.setHours(0, 0, 0, 0)
  return Math.round((b.getTime() - a.getTime()) / 86_400_000)
}
export function teksSisa(iso: string): string {
  const n = sisaHari(iso)
  if (n === 0) return 'hari ini'
  if (n === 1) return 'besok'
  if (n === -1) return 'kemarin'
  return n > 0 ? `${n} hari lagi` : `${-n} hari lalu`
}
export function durasiJam(jam: number): string {
  const abs = Math.abs(jam)
  const s = abs >= 48 ? `${Math.round(abs / 24)} hari` : `${Math.round(abs)} jam`
  return jam < 0 ? `${s} terlambat` : s
}
export const inisial = (nama: string) =>
  nama.replace(/^(Dr\.|Prof\.)\s*/, '').split(' ').slice(0, 2).map((x) => x[0]).join('').toUpperCase()

/* ---------- Chip status ---------- */
const IKON: Record<Status, typeof CircleDot> = {
  diterima: FileInput,
  perlu_ocr: ScanText,
  siap_draf: CircleDashed,
  draf_ai: Sparkles,
  terverifikasi: FileCheck2,
  siap_uji: Hourglass,
  lolos_uji: CheckCircle2,
  siap_pakai: CheckCircle2,
  dikembalikan: RotateCcw,
}
export function ChipStatus({ status }: { status: Status }) {
  const info = STATUS[status]
  const Ikon = IKON[status]
  return (
    <span className="chip" data-nada={info.nada}>
      <Ikon aria-hidden="true" />
      <span><span className="sr-only">Status: </span>{info.label}</span>
    </span>
  )
}

/* ---------- Lintasan empat langkah ---------- */
export function Lintasan({ berkas, besar = false }: { berkas: Pick<Berkas, 'status'>; besar?: boolean }) {
  const info = STATUS[berkas.status]
  const selesaiSemua = berkas.status === 'siap_pakai' || berkas.status === 'lolos_uji'
  const keadaan = (i: number) => {
    const n = i + 1
    if (selesaiSemua) return 'selesai'
    if (n < info.langkah) return 'selesai'
    if (n === info.langkah) return berkas.status === 'dikembalikan' ? 'kembali' : 'aktif'
    return 'nanti'
  }
  const teksKeadaan = { selesai: 'selesai', aktif: 'sedang berjalan', kembali: 'dikembalikan', nanti: 'belum' } as const
  const ringkasan = selesaiSemua ? 'Keempat langkah selesai' : `Langkah ${info.langkah} dari 4: ${LANGKAH[info.langkah - 1]}`
  const teksTampil = { selesai: 'Selesai', aktif: 'Sedang berjalan', kembali: 'Dikembalikan', nanti: 'Belum' } as const
  if (besar) {
    return (
      <ol className="stepper" aria-label="Langkah RAMPAI">
        {LANGKAH.map((l, i) => {
          const k = keadaan(i)
          return (
            <li key={l} data-k={k} data-draf={i === 2 && berkas.status === 'draf_ai' ? 'true' : undefined} aria-current={k === 'aktif' || k === 'kembali' ? 'step' : undefined}>
              <span className="stepper-bulat" aria-hidden="true">
                {k === 'selesai' ? <Check size={16} strokeWidth={3} /> : k === 'kembali' ? <RotateCcw size={15} strokeWidth={2.5} /> : i + 1}
              </span>
              <span className="stepper-teks">
                <b>{l}</b>
                <small>{teksTampil[k]}</small>
              </span>
            </li>
          )
        })}
      </ol>
    )
  }
  return (
    <ol className="lintasan ringkas" aria-label={ringkasan}>
      {LANGKAH.map((l, i) => {
        const k = keadaan(i)
        return (
          <li key={l} data-k={k} data-draf={i === 2 && berkas.status === 'draf_ai' ? 'true' : undefined}>
            <span className="bar" aria-hidden="true" />
            <span className="sr-only">{l}, {teksKeadaan[k]}</span>
          </li>
        )
      })}
    </ol>
  )
}

/* ---------- Pesan ---------- */
export function Pesan({ nada = 'info', judul, children, ikon }: { nada?: 'info' | 'galat' | 'berhasil' | 'draf'; judul?: string; children?: ReactNode; ikon?: ReactNode }) {
  const Ikon = nada === 'galat' ? FileWarning : nada === 'berhasil' ? CheckCircle2 : nada === 'draf' ? AlertTriangle : Clock
  return (
    <div className="pesan" data-nada={nada}>
      {ikon ?? <Ikon aria-hidden="true" />}
      <div>
        {judul && <b>{judul}</b>}
        {children}
      </div>
    </div>
  )
}

export function LabelDraf() {
  return (
    <span className="label-draf">
      <Sparkles aria-hidden="true" /> DRAF AI, BELUM DIVERIFIKASI
    </span>
  )
}

/* ---------- Toast (diumumkan ke pembaca layar) ---------- */
interface Toast { id: number; teks: string; nada: 'info' | 'galat' }
const ToastCtx = createContext<(teks: string, nada?: Toast['nada']) => void>(() => {})

export function ToastProvider({ children }: { children: ReactNode }) {
  const [daftar, setDaftar] = useState<Toast[]>([])
  const tampil = useCallback((teks: string, nada: Toast['nada'] = 'info') => {
    const id = Date.now() + Math.random()
    setDaftar((d) => [...d.slice(-2), { id, teks, nada }])
    setTimeout(() => setDaftar((d) => d.filter((t) => t.id !== id)), nada === 'galat' ? 8000 : 5000)
  }, [])
  return (
    <ToastCtx.Provider value={tampil}>
      {children}
      <div className="wadah-toast" role="status" aria-live="polite">
        {daftar.map((t) => (
          <div key={t.id} className="toast" data-nada={t.nada}>
            {t.nada === 'galat' ? <AlertTriangle size={18} aria-hidden="true" /> : <CheckCircle2 size={18} aria-hidden="true" />}
            <span style={{ flex: 1 }}>{t.teks}</span>
            <button type="button" className="tombol tombol-hantu ikon-tombol tombol-kecil" style={{ color: 'inherit' }} aria-label="Tutup pemberitahuan" onClick={() => setDaftar((d) => d.filter((x) => x.id !== t.id))}>
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}
// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => useContext(ToastCtx)

/** Menjalankan aksi store; galat aturan alur ditampilkan sebagai toast, bukan dibiarkan diam. */
export function useJalankan() {
  const toast = useToast()
  return useCallback(
    (f: () => void, berhasil?: string) => {
      try {
        f()
        if (berhasil) toast(berhasil)
        return true
      } catch (e) {
        toast(e instanceof Error ? e.message : 'Aksi gagal. Coba lagi.', 'galat')
        return false
      }
    },
    [toast],
  )
}

export function unduhTeks(namaFile: string, isi: string, tipe = 'text/plain;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([isi], { type: tipe }))
  const a = document.createElement('a')
  a.href = url
  a.download = namaFile
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function salam(d = new Date()): string {
  const j = d.getHours()
  return j < 11 ? 'Selamat pagi' : j < 15 ? 'Selamat siang' : j < 18 ? 'Selamat sore' : 'Selamat malam'
}

/** Cincin progres dekoratif; nilai selalu juga ditulis sebagai teks di dekatnya. */
export function Cincin({ nilai, ukuran = 88, tebal = 10, warna = 'var(--primary)' }: { nilai: number; ukuran?: number; tebal?: number; warna?: string }) {
  const r = (ukuran - tebal) / 2
  const k = 2 * Math.PI * r
  const v = Math.max(0, Math.min(100, nilai))
  return (
    <svg className="cincin" width={ukuran} height={ukuran} viewBox={`0 0 ${ukuran} ${ukuran}`} aria-hidden="true">
      <circle cx={ukuran / 2} cy={ukuran / 2} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={tebal} />
      <circle cx={ukuran / 2} cy={ukuran / 2} r={r} fill="none" stroke={warna} strokeWidth={tebal} strokeLinecap="round"
        strokeDasharray={`${(v / 100) * k} ${k}`} transform={`rotate(-90 ${ukuran / 2} ${ukuran / 2})`} />
    </svg>
  )
}
