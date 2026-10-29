import type { State } from './types'
import { terlambatKirim } from './workflow'

export interface Indikator {
  i1: { lolos: number; total: number; persen: number; ujiGagal: number }
  i2: { terbit: number; rataJam: number | null; minJam: number | null; terlambatTerbit: number; terlambatKirimDosen: number; rincian: { pertemuan: number; jam: number }[] }
  i3: { drafTotal: number; drafDikoreksi: number; persen: number; koreksiTotal: number; perJenis: Record<string, { total: number; dikoreksi: number }> }
  i4: { peserta: number; jumlahSkor: number; rata: number | null }
}

const persen = (a: number, b: number) => (b === 0 ? 0 : Math.round((a / b) * 100))

export function hitungIndikator(state: State): Indikator {
  const berkas = state.berkas
  // I1: proporsi berkas yang uji terakhirnya lulus.
  const lolos = berkas.filter((b) => {
    const terakhir = state.uji.filter((u) => u.berkasId === b.id).at(-1)
    return terakhir?.hasil === 'lulus' && ['lolos_uji', 'siap_pakai'].includes(b.status)
  }).length

  // I2: selisih waktu siap pakai dan jadwal kuliah.
  const terbit = berkas.filter((b) => b.status === 'siap_pakai' && b.waktuTerbit)
  const rincian = terbit
    .map((b) => ({ pertemuan: b.pertemuan, jam: (new Date(b.jadwalKuliah).getTime() - new Date(b.waktuTerbit!).getTime()) / 3_600_000 }))
    .sort((a, b) => a.pertemuan - b.pertemuan)
  const jam = rincian.map((r) => r.jam)

  // I3: persentase draf AI yang dikoreksi manusia.
  const dikoreksiIds = new Set(state.koreksi.map((k) => k.drafId))
  const perJenis: Indikator['i3']['perJenis'] = {}
  for (const d of state.draf) {
    perJenis[d.jenis] ??= { total: 0, dikoreksi: 0 }
    perJenis[d.jenis].total++
    if (dikoreksiIds.has(d.id)) perJenis[d.jenis].dikoreksi++
  }
  const drafDikoreksi = state.draf.filter((d) => dikoreksiIds.has(d.id)).length

  // I4: hanya dari mahasiswa yang persetujuan risetnya masih berlaku.
  const setuju = new Set(state.persetujuanRiset.filter((r) => !r.dicabut).map((r) => r.mahasiswaId))
  const skor = state.skor.filter((s) => setuju.has(s.mahasiswaId))

  return {
    i1: { lolos, total: berkas.length, persen: persen(lolos, berkas.length), ujiGagal: state.uji.filter((u) => u.hasil === 'gagal').length },
    i2: {
      terbit: terbit.length,
      rataJam: jam.length ? jam.reduce((a, b) => a + b, 0) / jam.length : null,
      minJam: jam.length ? Math.min(...jam) : null,
      terlambatTerbit: jam.filter((j) => j < 0).length,
      terlambatKirimDosen: berkas.filter((b) => terlambatKirim(b, state.pengaturan.tenggatKirimHari)).length,
      rincian,
    },
    i3: { drafTotal: state.draf.length, drafDikoreksi, persen: persen(drafDikoreksi, state.draf.length), koreksiTotal: state.koreksi.length, perJenis },
    i4: { peserta: setuju.size, jumlahSkor: skor.length, rata: skor.length ? skor.reduce((a, s) => a + s.skor, 0) / skor.length : null },
  }
}

/** CSV teragregasi: tidak memuat nama, surel, atau id pengguna. */
export function keCsv(state: State): string {
  const ind = hitungIndikator(state)
  const baris: (string | number)[][] = [
    ['indikator', 'ukuran', 'nilai'],
    ['I1', 'berkas_lolos_uji', ind.i1.lolos],
    ['I1', 'berkas_total', ind.i1.total],
    ['I1', 'persen', ind.i1.persen],
    ['I1', 'uji_gagal_tercatat', ind.i1.ujiGagal],
    ['I2', 'materi_terbit', ind.i2.terbit],
    ['I2', 'rata_jam_sebelum_kuliah', ind.i2.rataJam?.toFixed(1) ?? ''],
    ['I2', 'terbit_setelah_kuliah', ind.i2.terlambatTerbit],
    ['I2', 'kiriman_dosen_lewat_tenggat', ind.i2.terlambatKirimDosen],
    ...ind.i2.rincian.map((r) => ['I2', `jam_sebelum_kuliah_pertemuan_${r.pertemuan}`, r.jam.toFixed(1)]),
    ['I3', 'draf_total', ind.i3.drafTotal],
    ['I3', 'draf_dikoreksi', ind.i3.drafDikoreksi],
    ['I3', 'persen', ind.i3.persen],
    ['I3', 'koreksi_total', ind.i3.koreksiTotal],
    ...Object.entries(ind.i3.perJenis).flatMap(([j, v]) => [
      ['I3', `draf_${j}`, v.total],
      ['I3', `draf_${j}_dikoreksi`, v.dikoreksi],
    ]),
  ]
  return baris.map((r) => r.join(',')).join('\n')
}

export function keCsvI4(state: State): string {
  const ind = hitungIndikator(state)
  return [
    'indikator,ukuran,nilai',
    `I4,peserta_dengan_persetujuan,${ind.i4.peserta}`,
    `I4,jumlah_skor,${ind.i4.jumlahSkor}`,
    `I4,rata_skor,${ind.i4.rata?.toFixed(1) ?? ''}`,
  ].join('\n')
}
