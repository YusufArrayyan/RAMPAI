import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { buatSeed } from './seed'
import type { Berkas, ButirPeriksa, FormatUnduh, HasilButir, Pengaturan, Pengguna, Peran, State, Status } from './types'
import { butirKosong, daftarPeriksaAktif } from './workflow'
import { NAMA_PENYEDIA_AI } from '../services/layanan'

const KUNCI = 'rampai-tracker-v1'
const KUNCI_SESI = 'rampai-tracker-sesi'

function muat(): State {
  try {
    const s = localStorage.getItem(KUNCI)
    if (s) return JSON.parse(s) as State
  } catch {
    /* data rusak: mulai dari data contoh */
  }
  return buatSeed()
}

const id = () => Math.random().toString(36).slice(2, 10)
const kini = () => new Date().toISOString()

/** Galat yang ditampilkan ke pengguna saat aturan alur dilanggar. */
export class GalatAlur extends Error {}

function wajib(kondisi: unknown, pesan: string): asserts kondisi {
  if (!kondisi) throw new GalatAlur(pesan)
}

export function useAksi(state: State, setState: (f: (s: State) => State) => void, pelaku: Pengguna | null) {
  return useMemo(() => {
    const pid = pelaku?.id ?? 'sistem'

    function ubah(f: (s: State) => State, aksi: string, objek: string) {
      setState((s) => {
        const baru = f(s)
        return { ...baru, log: [...baru.log, { id: id(), pelakuId: pid, aksi, objek, waktu: kini() }] }
      })
    }
    function ubahBerkas(s: State, berkasId: string, f: (b: Berkas) => Berkas): State {
      return { ...s, berkas: s.berkas.map((b) => (b.id === berkasId ? f(b) : b)) }
    }
    function cari(berkasId: string) {
      const b = state.berkas.find((x) => x.id === berkasId)
      wajib(b, 'Berkas tidak ditemukan.')
      return b
    }
    function harusStatus(b: Berkas, ...status: Status[]) {
      wajib(status.includes(b.status), `Langkah ini tidak berlaku untuk berkas berstatus "${b.status}".`)
    }

    return {
      kirimBerkas(data: Omit<Berkas, 'id' | 'versi' | 'status' | 'waktuKirim' | 'waktuIzin' | 'strukturJudul'>) {
        wajib(data.izinPemilik, 'Berkas hanya bisa diproses dengan izin pemilik.')
        const bid = `bk-${id()}`
        ubah(
          (s) => ({
            ...s,
            berkas: [...s.berkas, { ...data, id: bid, versi: 1, status: 'diterima', waktuKirim: kini(), waktuIzin: kini(), strukturJudul: false }],
          }),
          'Mengirim berkas dan memberi izin pemrosesan',
          bid,
        )
        return bid
      },
      cabutIzin(berkasId: string) {
        ubah((s) => ubahBerkas(s, berkasId, (b) => ({ ...b, izinPemilik: false })), 'Mencabut izin pemrosesan', berkasId)
      },
      jalankanTriase(berkasId: string, lapisanTeks: boolean) {
        const b = cari(berkasId)
        harusStatus(b, 'diterima')
        ubah(
          (s) => ubahBerkas(s, berkasId, (x) => ({ ...x, lapisanTeks, status: lapisanTeks ? 'diterima' : 'perlu_ocr' })),
          lapisanTeks ? 'Triase: lapisan teks ada' : 'Triase: perlu OCR',
          berkasId,
        )
      },
      selesaiOcr(berkasId: string) {
        harusStatus(cari(berkasId), 'perlu_ocr')
        ubah((s) => ubahBerkas(s, berkasId, (x) => ({ ...x, lapisanTeks: true, status: 'diterima' })), 'OCR selesai, kembali ke triase', berkasId)
      },
      selesaiTriase(berkasId: string) {
        const b = cari(berkasId)
        harusStatus(b, 'diterima')
        wajib(b.izinPemilik, 'Izin pemilik belum ada.')
        wajib(b.lapisanTeks === true, 'Lapisan teks belum dipastikan.')
        ubah((s) => ubahBerkas(s, berkasId, (x) => ({ ...x, strukturJudul: true, status: 'siap_draf' })), 'Triase selesai: struktur judul tersusun', berkasId)
      },
      tambahBagian(berkasId: string, bagian: Omit<Berkas['bagian'][number], 'id'>) {
        harusStatus(cari(berkasId), 'siap_draf')
        wajib(bagian.lokasi.trim() && bagian.sumber.trim(), 'Isi lokasi dan isi sumber bagian.')
        ubah(
          (s) => ubahBerkas(s, berkasId, (x) => ({ ...x, bagian: [...x.bagian, { ...bagian, id: `bg-${id()}` }] })),
          'Menandai bagian yang butuh draf',
          berkasId,
        )
      },
      samarkanBagian(berkasId: string, bagianId: string, sumber: string) {
        ubah(
          (s) => ubahBerkas(s, berkasId, (x) => ({ ...x, bagian: x.bagian.map((g) => (g.id === bagianId ? { ...g, sumber } : g)) })),
          'Menghapus data pribadi sebelum kirim ke AI',
          berkasId,
        )
      },
      simpanDraf(berkasId: string, hasil: { bagianId: string; jenis: Berkas['bagian'][number]['jenis']; isi: string }[]) {
        harusStatus(cari(berkasId), 'siap_draf')
        ubah(
          (s) => ({
            ...ubahBerkas(s, berkasId, (x) => ({ ...x, status: 'draf_ai' })),
            draf: [
              ...s.draf.filter((d) => d.berkasId !== berkasId),
              ...hasil.map((h) => ({ id: `d-${id()}`, berkasId, bagianId: h.bagianId, jenis: h.jenis, isiAsli: h.isi, isi: h.isi, waktu: kini(), penyedia: NAMA_PENYEDIA_AI })),
            ],
          }),
          `Meminta draf AI (${hasil.length} bagian)`,
          berkasId,
        )
      },
      suntingDraf(drafId: string, isi: string) {
        const d = state.draf.find((x) => x.id === drafId)
        wajib(d, 'Draf tidak ditemukan.')
        if (d.isi === isi) return
        harusStatus(cari(d.berkasId), 'draf_ai')
        ubah(
          (s) => ({
            ...s,
            draf: s.draf.map((x) => (x.id === drafId ? { ...x, isi } : x)),
            koreksi: [...s.koreksi, { id: `k-${id()}`, drafId, pelakuId: pid, jenis: 'suntingan', sebelum: d.isi, sesudah: isi, waktu: kini() }],
          }),
          'Mengoreksi draf AI',
          d.berkasId,
        )
      },
      isiButir(berkasId: string, butirId: string, hasil: HasilButir | null) {
        const b = cari(berkasId)
        harusStatus(b, 'draf_ai')
        const versiDaftar = daftarPeriksaAktif(state).versi
        setState((s) => {
          const lain = s.isianPeriksa.filter((i) => !(i.berkasId === berkasId && i.versiBerkas === b.versi && i.versiDaftar === versiDaftar && i.butirId === butirId))
          return {
            ...s,
            isianPeriksa: hasil
              ? [...lain, { id: `ip-${id()}`, berkasId, versiBerkas: b.versi, versiDaftar, butirId, hasil, pelakuId: pid, waktu: kini() }]
              : lain,
          }
        })
      },
      verifikasi(berkasId: string) {
        const b = cari(berkasId)
        harusStatus(b, 'draf_ai')
        const kosong = butirKosong(state, b)
        wajib(kosong.length === 0, `Masih ada ${kosong.length} butir daftar periksa yang kosong.`)
        ubah((s) => ubahBerkas(s, berkasId, (x) => ({ ...x, status: 'terverifikasi' })), 'Verifikasi selesai', berkasId)
      },
      jadwalkanUji(berkasId: string) {
        harusStatus(cari(berkasId), 'terverifikasi')
        ubah((s) => ubahBerkas(s, berkasId, (x) => ({ ...x, status: 'siap_uji' })), 'Menjadwalkan uji pembaca layar', berkasId)
      },
      catatUji(berkasId: string, hasil: 'lulus' | 'gagal', catatan: string, alat: string) {
        const b = cari(berkasId)
        harusStatus(b, 'siap_uji')
        wajib(hasil === 'lulus' || catatan.trim().length > 0, 'Tulis lokasi masalah sebelum mencatat hasil gagal.')
        ubah(
          (s) => ({
            ...ubahBerkas(s, berkasId, (x) => ({
              ...x,
              status: hasil === 'lulus' ? 'lolos_uji' : 'dikembalikan',
              catatanKembali: hasil === 'gagal' ? `Gagal uji pembaca layar: ${catatan.trim()}` : x.catatanKembali,
            })),
            uji: [...s.uji, { id: `u-${id()}`, berkasId, versiBerkas: b.versi, alat, hasil, catatan: catatan.trim(), pengujiId: pid, waktu: kini() }],
          }),
          `Mencatat uji: ${hasil}`,
          berkasId,
        )
      },
      putuskan(berkasId: string, keputusan: 'setuju' | 'tolak', alasan: string) {
        wajib(pelaku?.peran === 'mahasiswa', 'Hanya mahasiswa pengguna yang bisa menyetujui materi.')
        harusStatus(cari(berkasId), 'lolos_uji')
        wajib(keputusan === 'setuju' || alasan.trim().length > 0, 'Tulis alasan penolakan agar pendamping tahu apa yang perlu diperbaiki.')
        ubah(
          (s) => ({
            ...ubahBerkas(s, berkasId, (x) =>
              keputusan === 'setuju'
                ? { ...x, status: 'siap_pakai', waktuTerbit: kini(), catatanKembali: undefined }
                : { ...x, status: 'dikembalikan', catatanKembali: `Ditolak mahasiswa pengguna: ${alasan.trim()}` },
            ),
            persetujuan: [...s.persetujuan, { id: `p-${id()}`, berkasId, mahasiswaId: pid, keputusan, alasan: alasan.trim(), waktu: kini() }],
          }),
          keputusan === 'setuju' ? 'Menyetujui materi' : 'Menolak materi',
          berkasId,
        )
      },
      perbaiki(berkasId: string) {
        harusStatus(cari(berkasId), 'dikembalikan')
        ubah((s) => ubahBerkas(s, berkasId, (x) => ({ ...x, status: 'draf_ai', versi: x.versi + 1 })), 'Membuka perbaikan (versi baru)', berkasId)
      },
      /* --- pengaturan (koordinator) --- */
      ubahPengguna(uid: string, ubahan: Partial<Pick<Pengguna, 'aktif' | 'peran'>>) {
        wajib(pelaku?.peran === 'koordinator', 'Hanya koordinator ULD yang mengelola akun.')
        ubah((s) => ({ ...s, pengguna: s.pengguna.map((u) => (u.id === uid ? { ...u, ...ubahan } : u)) }), 'Mengubah akun', uid)
      },
      tambahPengguna(nama: string, surel: string, peran: Peran) {
        wajib(pelaku?.peran === 'koordinator', 'Hanya koordinator ULD yang mengelola akun.')
        wajib(!state.pengguna.some((u) => u.surel.toLowerCase() === surel.toLowerCase()), 'Surel ini sudah terdaftar.')
        const uid = `u-${id()}`
        ubah((s) => ({ ...s, pengguna: [...s.pengguna, { id: uid, nama, surel, peran, aktif: true }] }), 'Menambah akun', uid)
      },
      ubahPengaturan(p: Pengaturan) {
        ubah((s) => ({ ...s, pengaturan: p }), 'Mengubah masa simpan atau tenggat kirim', 'pengaturan')
      },
      simpanDaftarPeriksa(butir: ButirPeriksa[]) {
        const versi = daftarPeriksaAktif(state).versi + 1
        ubah((s) => ({ ...s, daftarPeriksa: [...s.daftarPeriksa, { versi, butir, waktu: kini(), pelakuId: pid }] }), `Menetapkan daftar periksa versi ${versi}`, 'daftar-periksa')
      },
      /* --- mahasiswa --- */
      pilihFormat(f: FormatUnduh) {
        setState((s) => ({ ...s, formatPilihan: { ...s.formatPilihan, [pid]: f } }))
      },
      catatUnduh(berkasId: string, f: FormatUnduh) {
        const b = cari(berkasId)
        wajib(b.status === 'siap_pakai', 'Materi belum siap pakai. Draf tidak bisa diunduh sebagai final.')
        ubah((s) => s, `Mengunduh materi (${f})`, berkasId)
      },
      setujuRiset(cakupan: string) {
        ubah((s) => ({ ...s, persetujuanRiset: [...s.persetujuanRiset, { id: `pr-${id()}`, mahasiswaId: pid, tanggal: kini(), cakupan }] }), 'Memberi persetujuan riset', 'riset')
      },
      cabutRiset() {
        ubah(
          (s) => ({ ...s, persetujuanRiset: s.persetujuanRiset.map((r) => (r.mahasiswaId === pid && !r.dicabut ? { ...r, dicabut: kini() } : r)) }),
          'Mencabut persetujuan riset',
          'riset',
        )
      },
      catatSkor(berkasId: string, skor: number) {
        wajib(state.persetujuanRiset.some((r) => r.mahasiswaId === pid && !r.dicabut), 'Skor hanya bisa dicatat setelah persetujuan riset tercatat.')
        wajib(skor >= 0 && skor <= 100, 'Skor harus di antara 0 dan 100.')
        ubah(
          (s) => ({ ...s, skor: [...s.skor.filter((x) => !(x.berkasId === berkasId && x.mahasiswaId === pid)), { id: `s-${id()}`, berkasId, mahasiswaId: pid, skor, waktu: kini() }] }),
          'Mencatat skor pemahaman',
          berkasId,
        )
      },
    }
  }, [state, setState, pelaku])
}

type Aksi = ReturnType<typeof useAksi>

interface Konteks {
  state: State
  aksi: Aksi
  pengguna: Pengguna | null
  masuk: (uid: string) => void
  keluar: () => void
  aturUlang: () => void
}

const Ctx = createContext<Konteks | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setStateRaw] = useState<State>(muat)
  const [sesi, setSesi] = useState<string | null>(() => sessionStorage.getItem(KUNCI_SESI))

  useEffect(() => {
    localStorage.setItem(KUNCI, JSON.stringify(state))
  }, [state])

  const setState = useCallback((f: (s: State) => State) => setStateRaw(f), [])
  const pengguna = state.pengguna.find((u) => u.id === sesi && u.aktif) ?? null
  const aksi = useAksi(state, setState, pengguna)

  const nilai = useMemo<Konteks>(
    () => ({
      state,
      aksi,
      pengguna,
      masuk(uid) {
        sessionStorage.setItem(KUNCI_SESI, uid)
        setSesi(uid)
      },
      keluar() {
        sessionStorage.removeItem(KUNCI_SESI)
        setSesi(null)
      },
      aturUlang() {
        setStateRaw(buatSeed())
      },
    }),
    [state, aksi, pengguna],
  )
  return <Ctx.Provider value={nilai}>{children}</Ctx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useStore() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useStore di luar StoreProvider')
  return c
}
