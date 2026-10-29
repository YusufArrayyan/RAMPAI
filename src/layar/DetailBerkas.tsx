import { useMemo, useRef, useState, type ReactNode } from 'react'
import {
  AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, EyeOff, Info, Lock, RotateCcw, ScanText, ShieldAlert, Sparkles, XCircle,
} from 'lucide-react'
import { useStore } from '../data/store'
import type { Berkas, Draf } from '../data/types'
import { JENIS_DRAF, LANGKAH, STATUS, daftarPeriksaAktif, isianBerlaku } from '../data/workflow'
import { mintaDraf, pindaiIdentitas, samarkan, type TemuanIdentitas } from '../services/layanan'
import { ChipStatus, Kepala, LabelDraf, Lintasan, Pesan, durasiJam, hariTgl, tglJam, teksSisa, useJalankan } from '../ui/dasar'

export default function DetailBerkas({ id }: { id?: string }) {
  const { state, pengguna } = useStore()
  const b = state.berkas.find((x) => x.id === id)
  if (!b) {
    return (
      <div className="panel kosong">
        <h1>Berkas tidak ditemukan</h1>
        <p>Berkas ini mungkin sudah dihapus setelah masa simpan berakhir, atau alamatnya salah.</p>
        <a href="#/antrean" className="tombol tombol-utama">Kembali ke antrean</a>
      </div>
    )
  }
  const mk = state.mataKuliah.find((m) => m.id === b.mataKuliahId)
  const bisaUbah = pengguna?.peran === 'pendamping'
  const info = STATUS[b.status]
  const nama = (uid: string) => state.pengguna.find((u) => u.id === uid)?.nama ?? 'Sistem'
  const riwayat = state.log.filter((l) => l.objek === b.id).slice().reverse()

  return (
    <>
      <Kepala
        judul={b.judul}
        remah={<a href="#/antrean"><ArrowLeft size={16} aria-hidden="true" />Antrean berkas</a>}
        sub={`Pertemuan ${b.pertemuan} · ${mk?.nama}. Kuliah ${hariTgl(b.jadwalKuliah)} (${teksSisa(b.jadwalKuliah)}).`}
      />
      <div className="detail">
        <div className="tumpuk">
          <section className="panel ringkasan-berkas" aria-label="Ringkasan status">
            <div className="baris-antara">
              <ChipStatus status={b.status} />
              <span className="redup kecil">{info.arti}</span>
            </div>
            <Lintasan berkas={b} besar />
          </section>

          {!b.izinPemilik ? (
            <Pesan nada="galat" judul="Izin pemrosesan dicabut">Berkas tidak boleh diproses lagi. Hubungi dosen pemilik materi bila perlu.</Pesan>
          ) : bisaUbah ? (
            <LangkahAktif berkas={b} />
          ) : (
            <Pesan judul="Tampilan baca">
              Langkah berikutnya dikerjakan pendamping: {info.langkah ? LANGKAH[info.langkah - 1] : ''}. Koordinator ULD dapat membaca status dan riwayat tanpa mengubahnya.
            </Pesan>
          )}
        </div>

        <aside className="samping" aria-label="Info dan riwayat berkas">
          <section className="panel panel-isi" aria-labelledby="judul-info">
            <h2 id="judul-info" style={{ fontSize: 'var(--t-m)', marginBottom: '0.875rem' }}>Info berkas</h2>
            <dl className="info-berkas">
              <div><dt>Nama berkas</dt><dd>{b.namaFile}</dd></div>
              <div><dt>Versi</dt><dd className="angka">{b.versi}</dd></div>
              <div><dt>Lapisan teks</dt><dd>{b.lapisanTeks === null ? 'Belum diperiksa' : b.lapisanTeks ? 'Ada' : 'Tidak ada'}</dd></div>
              <div><dt>Bagian butuh draf</dt><dd className="angka">{b.bagian.length}</dd></div>
              <div><dt>Izin pemilik</dt><dd>{b.izinPemilik ? `Tercatat ${b.waktuIzin ? tglJam(b.waktuIzin) : ''}` : 'Dicabut'}</dd></div>
            </dl>
          </section>
          <section className="panel" aria-labelledby="judul-riwayat">
            <div className="panel-kepala"><h2 id="judul-riwayat">Riwayat</h2></div>
            <div className="panel-isi" style={{ maxHeight: '28rem', overflowY: 'auto' }} tabIndex={0} aria-label="Daftar riwayat, bisa digulir">
              {riwayat.length === 0 ? <p className="redup kecil">Belum ada aktivitas.</p> : (
                <ol className="riwayat">
                  {riwayat.map((l) => (
                    <li key={l.id}>
                      <span>
                        {l.aksi}
                        <span className="redup"> · {nama(l.pelakuId)}</span>
                        <time dateTime={l.waktu}>{tglJam(l.waktu)}</time>
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </section>
        </aside>
      </div>
    </>
  )
}

function KepalaLangkah({ n, judul, aksi }: { n: number; judul: string; aksi?: ReactNode }) {
  return (
    <div className="panel-kepala">
      <div className="judul-langkah">
        <span className="nomor-langkah" aria-hidden="true">{n}</span>
        <h2><span className="sr-only">Langkah {n}: </span>{judul}</h2>
      </div>
      {aksi}
    </div>
  )
}

function LangkahAktif({ berkas }: { berkas: Berkas }) {
  switch (berkas.status) {
    case 'diterima': return <Triase b={berkas} />
    case 'perlu_ocr': return <Ocr b={berkas} />
    case 'siap_draf': return <MintaDraf b={berkas} />
    case 'draf_ai': return <Verifikasi b={berkas} />
    case 'dikembalikan': return <Dikembalikan b={berkas} />
    case 'terverifikasi': return <Terverifikasi b={berkas} />
    case 'siap_uji': return <UjiPembacaLayar b={berkas} />
    case 'lolos_uji':
      return (
        <section className="panel langkah-aktif">
          <KepalaLangkah n={4} judul="Menunggu persetujuan mahasiswa" />
          <div className="panel-isi tumpuk-s">
            <Pesan nada="berhasil" judul="Lolos uji pembaca layar">Mahasiswa pengguna sedang meninjau materi. Bila ditolak, berkas kembali ke langkah verifikasi beserta alasannya.</Pesan>
          </div>
        </section>
      )
    case 'siap_pakai': {
      const jam = (new Date(berkas.jadwalKuliah).getTime() - new Date(berkas.waktuTerbit!).getTime()) / 3_600_000
      return (
        <section className="panel langkah-aktif">
          <KepalaLangkah n={4} judul="Siap pakai" />
          <div className="panel-isi">
            <Pesan nada={jam >= 0 ? 'berhasil' : 'galat'} judul={`Terbit ${tglJam(berkas.waktuTerbit!)}`}>
              {jam >= 0 ? `Tersedia ${durasiJam(jam)} sebelum kuliah.` : `Terbit ${durasiJam(jam)} dari jadwal kuliah.`} Angka ini masuk ke indikator I2.
            </Pesan>
          </div>
        </section>
      )
    }
  }
}

/* ---------- Langkah 1: Triase ---------- */
function Triase({ b }: { b: Berkas }) {
  const { aksi } = useStore()
  const jalankan = useJalankan()
  const [memeriksa, setMemeriksa] = useState(false)
  const [struktur, setStruktur] = useState(false)
  const [galat, setGalat] = useState('')

  async function periksa() {
    setMemeriksa(true)
    await new Promise((r) => setTimeout(r, 700))
    const ada = b.hasilDeteksi?.lapisanTeks ?? !/pindai|scan/i.test(b.namaFile)
    jalankan(() => aksi.jalankanTriase(b.id, ada), ada ? 'Lapisan teks ditemukan.' : 'Tidak ada lapisan teks. Berkas ditandai perlu OCR.')
    setMemeriksa(false)
  }

  return (
    <section className="panel langkah-aktif" aria-labelledby="l1">
      <KepalaLangkah n={1} judul="Triase" />
      <div className="panel-isi tumpuk-s" style={{ gap: '1.25rem' }} id="l1">
        {b.lapisanTeks === null ? (
          <>
            <p>Periksa apakah berkas punya lapisan teks yang bisa dipilih. Berkas pindai tanpa lapisan teks tidak terbaca pembaca layar dan perlu OCR dulu.</p>
            {b.hasilDeteksi && <p className="bantu">Pemeriksaan saat unggah: {b.hasilDeteksi.alasan}</p>}
            <div className="deret-tombol">
              <button type="button" className="tombol tombol-utama" onClick={periksa} disabled={memeriksa} aria-busy={memeriksa}>
                <ScanText size={18} aria-hidden="true" />{memeriksa ? 'Memeriksa…' : 'Periksa lapisan teks'}
              </button>
            </div>
          </>
        ) : (
          <>
            <Pesan nada="berhasil" judul="Teks ada">Teks pada berkas bisa dipilih.</Pesan>
            <p>Susun struktur judul di berkas sumber (Judul 1 untuk judul materi, Judul 2 untuk subbagian), lalu pastikan di sini.</p>
            <label className="kotak">
              <input type="checkbox" checked={struktur} onChange={(e) => { setStruktur(e.target.checked); setGalat('') }} aria-describedby={galat ? 'g-struktur' : undefined} />
              <span>Struktur judul sudah berurutan dan memakai gaya judul, bukan sekadar huruf tebal.</span>
            </label>
            {galat && <p id="g-struktur" className="galat-bidang" role="alert"><AlertTriangle size={16} aria-hidden="true" />{galat}</p>}
            <div className="deret-tombol">
              <button type="button" className="tombol tombol-utama" onClick={() => {
                if (!struktur) return setGalat('Centang dulu setelah struktur judul tersusun.')
                jalankan(() => aksi.selesaiTriase(b.id), 'Triase selesai. Berkas siap untuk draf AI.')
              }}>
                Lanjut ke draf AI <ArrowRight size={18} aria-hidden="true" />
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  )
}

function Ocr({ b }: { b: Berkas }) {
  const { aksi } = useStore()
  const jalankan = useJalankan()
  const [jalan, setJalan] = useState(false)
  const [kemajuan, setKemajuan] = useState(0)
  async function ocr() {
    setJalan(true)
    for (let i = 1; i <= 5; i++) {
      await new Promise((r) => setTimeout(r, 300))
      setKemajuan(i * 20)
    }
    jalankan(() => aksi.selesaiOcr(b.id), 'OCR selesai. Berkas kembali ke triase.')
  }
  return (
    <section className="panel langkah-aktif">
      <KepalaLangkah n={1} judul="Triase: perlu OCR" />
      <div className="panel-isi tumpuk-s" style={{ gap: '1.25rem' }}>
        <Pesan nada="galat" judul="Tidak ada lapisan teks">{b.hasilDeteksi?.alasan ?? 'Berkas berupa hasil pindai. Pembaca layar hanya akan membaca "gambar".'}</Pesan>
        <p>Jalankan OCR agar teksnya bisa dipilih. Hasil OCR tetap diperiksa di langkah verifikasi, terutama angka dan notasi.</p>
        {jalan && (
          <div className="kemajuan-periksa">
            <progress className="biru" value={kemajuan} max={100} aria-label="Kemajuan OCR" />
            <span className="angka" aria-hidden="true">{kemajuan}%</span>
          </div>
        )}
        <div className="deret-tombol">
          <button type="button" className="tombol tombol-utama" onClick={ocr} disabled={jalan} aria-busy={jalan}>
            <ScanText size={18} aria-hidden="true" />{jalan ? 'Menjalankan OCR…' : 'Jalankan OCR'}
          </button>
        </div>
      </div>
    </section>
  )
}

/* ---------- Langkah 2: Minta draf AI, dengan pemindai identitas (F10) ---------- */
function Sorot({ teks, temuan }: { teks: string; temuan: TemuanIdentitas[] }) {
  if (!temuan.length) return <>{teks}</>
  const re = new RegExp(`(${temuan.map((t) => t.teks.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'g')
  return <>{teks.split(re).map((p, i) => (temuan.some((t) => t.teks === p) ? <mark key={i} className="sorot">{p}</mark> : p))}</>
}

function MintaDraf({ b }: { b: Berkas }) {
  const { state, aksi } = useStore()
  const jalankan = useJalankan()
  const namaDikenal = useMemo(() => state.pengguna.map((u) => u.nama), [state.pengguna])
  const temuan = b.bagian.map((g) => pindaiIdentitas(g.sumber, namaDikenal))
  const total = temuan.flat().length
  const [pernahAda] = useState(total > 0)
  const [konfirmasi, setKonfirmasi] = useState(false)
  const [kemajuan, setKemajuan] = useState<number | null>(null)
  const [galat, setGalat] = useState('')
  const refKonfirmasi = useRef<HTMLInputElement>(null)

  async function minta() {
    if (total > 0) return setGalat(`Masih ada ${total} data pribadi. Hapus dulu sebelum mengirim ke AI.`)
    if (pernahAda && !konfirmasi) {
      setGalat('Pastikan dulu bahwa berkas sudah bersih dari data pribadi.')
      refKonfirmasi.current?.focus()
      return
    }
    setGalat('')
    setKemajuan(0)
    const hasil = await mintaDraf(b.bagian, (s, t) => setKemajuan(Math.round((s / t) * 100)))
    jalankan(() => aksi.simpanDraf(b.id, hasil), `${hasil.length} draf AI diterima. Periksa setiap draf sebelum lanjut.`)
  }

  return (
    <section className="panel langkah-aktif">
      <KepalaLangkah n={2} judul="Minta draf AI" />
      <div className="panel-isi tumpuk-s" style={{ gap: '1.25rem' }}>
        <p>AI hanya diminta menyusun teks alternatif, deskripsi rumus, dan transkrip untuk bagian di bawah. AI tidak meringkas atau menulis ulang materi dosen.</p>

        {total > 0 ? (
          <Pesan nada="galat" judul={`Ditemukan ${total} data pribadi`} ikon={<ShieldAlert aria-hidden="true" />}>
            Nama, NIM, surel, atau nomor telepon tidak boleh dikirim ke penyedia AI. Hapus bagian yang disorot, lalu kirim.
          </Pesan>
        ) : pernahAda ? (
          <Pesan nada="berhasil" judul="Data pribadi sudah dihapus">Periksa sekali lagi, lalu pastikan di kotak centang sebelum mengirim.</Pesan>
        ) : (
          <Pesan judul="Tidak ditemukan data pribadi">Pemindai sederhana tidak menemukan nama, NIM, surel, atau nomor telepon. Pemindai bisa terlewat; tetap baca isinya.</Pesan>
        )}

        <ul className="tumpuk-s" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {b.bagian.map((g, i) => (
            <li key={g.id} className="bagian-draf">
              <header>
                <h3>{JENIS_DRAF[g.jenis]} <span className="redup kecil">· {g.lokasi}</span></h3>
                {temuan[i].length > 0 && (
                  <button type="button" className="tombol tombol-bahaya tombol-kecil" onClick={() => jalankan(() => aksi.samarkanBagian(b.id, g.id, samarkan(g.sumber, temuan[i])), 'Data pribadi dihapus dari bagian ini.')}>
                    <EyeOff size={16} aria-hidden="true" /> Hapus {temuan[i].length} data pribadi
                  </button>
                )}
              </header>
              <div style={{ padding: '1rem' }}>
                <p className="sumber"><Sorot teks={g.sumber} temuan={temuan[i]} /></p>
                {temuan[i].length > 0 && (
                  <p className="bantu" style={{ marginTop: '0.5rem' }}>Terdeteksi: {temuan[i].map((t) => `${t.jenis} "${t.teks}"`).join(', ')}.</p>
                )}
              </div>
            </li>
          ))}
        </ul>

        <TambahBagian b={b} />

        {pernahAda && total === 0 && (
          <label className="kotak">
            <input ref={refKonfirmasi} type="checkbox" checked={konfirmasi} onChange={(e) => { setKonfirmasi(e.target.checked); setGalat('') }} />
            <span>Saya sudah menyunting bagian di atas dan tidak ada lagi nama atau data pribadi.</span>
          </label>
        )}

        {galat && <p className="galat-bidang" role="alert"><AlertTriangle size={16} aria-hidden="true" />{galat}</p>}

        {kemajuan !== null && (
          <div className="kemajuan-periksa" role="status">
            <progress className="biru" value={kemajuan} max={100} aria-label="Kemajuan draf AI" />
            <span className="angka">{kemajuan}%</span>
          </div>
        )}

        <div className="deret-tombol">
          <button type="button" className="tombol tombol-utama" onClick={minta} disabled={kemajuan !== null || b.bagian.length === 0} aria-busy={kemajuan !== null}>
            <Sparkles size={18} aria-hidden="true" />
            {kemajuan !== null ? 'Menyusun draf…' : `Minta draf untuk ${b.bagian.length} bagian`}
          </button>
        </div>
      </div>
    </section>
  )
}

function TambahBagian({ b }: { b: Berkas }) {
  const { aksi } = useStore()
  const jalankan = useJalankan()
  const [buka, setBuka] = useState(b.bagian.length === 0)
  const [jenis, setJenis] = useState<Draf['jenis']>('alt_teks')
  const [lokasi, setLokasi] = useState('')
  const [sumber, setSumber] = useState('')
  if (!buka) {
    return (
      <div>
        <button type="button" className="tombol tombol-kedua tombol-kecil" onClick={() => setBuka(true)} aria-expanded={false}>Tandai bagian lain</button>
      </div>
    )
  }
  return (
    <fieldset className="bagian-draf" style={{ padding: '1rem' }}>
      <legend className="label" style={{ padding: '0 0.25rem' }}>Tandai bagian yang butuh draf</legend>
      {b.bagian.length === 0 && <p className="bantu" style={{ marginBottom: '0.75rem' }}>Belum ada bagian. Tandai gambar, rumus, atau rekaman yang perlu penjelasan teks.</p>}
      <div className="pasangan" style={{ padding: 0 }}>
        <div className="bidang">
          <label htmlFor="bg-jenis">Jenis</label>
          <select id="bg-jenis" value={jenis} onChange={(e) => setJenis(e.target.value as Draf['jenis'])}>
            {Object.entries(JENIS_DRAF).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div className="bidang">
          <label htmlFor="bg-lokasi">Lokasi di berkas</label>
          <input id="bg-lokasi" type="text" value={lokasi} onChange={(e) => setLokasi(e.target.value)} placeholder="Slide 4, Gambar 2" />
        </div>
      </div>
      <div className="bidang" style={{ marginTop: '0.75rem' }}>
        <label htmlFor="bg-sumber">Isi sumber</label>
        <textarea id="bg-sumber" value={sumber} onChange={(e) => setSumber(e.target.value)} aria-describedby="bg-sumber-b" />
        <p id="bg-sumber-b" className="bantu">Salin notasi rumus, keterangan gambar, atau cuplikan audio apa adanya.</p>
      </div>
      <div className="deret-tombol" style={{ marginTop: '0.75rem' }}>
        <button type="button" className="tombol tombol-kedua" onClick={() => {
          if (jalankan(() => aksi.tambahBagian(b.id, { jenis, lokasi: lokasi.trim(), sumber: sumber.trim() }), 'Bagian ditandai.')) {
            setLokasi(''); setSumber('')
          }
        }}>Simpan bagian</button>
        {b.bagian.length > 0 && <button type="button" className="tombol tombol-hantu" onClick={() => setBuka(false)}>Tutup</button>}
      </div>
    </fieldset>
  )
}

/* ---------- Langkah 3: Verifikasi (draf berdampingan + daftar periksa) ---------- */
function KolomDraf({ d, sumber, lokasi }: { d: Draf; sumber: string; lokasi: string }) {
  const { state, aksi } = useStore()
  const jalankan = useJalankan()
  const [isi, setIsi] = useState(d.isi)
  const jumlahKoreksi = state.koreksi.filter((k) => k.drafId === d.id).length
  const idTeks = `draf-${d.id}`
  return (
    <li className="bagian-draf">
      <header>
        <h3>{JENIS_DRAF[d.jenis]} <span className="redup kecil">· {lokasi}</span></h3>
        <span className="kecil angka" aria-live="polite">{jumlahKoreksi ? `${jumlahKoreksi} koreksi tercatat` : 'Belum dikoreksi'}</span>
      </header>
      <div className="pasangan">
        <div>
          <div className="lbl">Berkas asli</div>
          <div className="sumber">{d.jenis === 'rumus' ? <code>{sumber}</code> : sumber}</div>
        </div>
        <div className="bidang">
          <label className="lbl" htmlFor={idTeks}>
            <span>Draf {JENIS_DRAF[d.jenis].toLowerCase()}</span>
            <LabelDraf />
          </label>
          <textarea id={idTeks} className="draf-sunting" value={isi} onChange={(e) => setIsi(e.target.value)}
            onBlur={() => isi.trim() && isi !== d.isi && jalankan(() => aksi.suntingDraf(d.id, isi.trim()), 'Koreksi dicatat.')}
            aria-describedby={`${idTeks}-b`} />
          <p id={`${idTeks}-b`} className="bantu">Setiap suntingan dicatat sebagai koreksi saat Anda meninggalkan kolom ini.</p>
        </div>
      </div>
    </li>
  )
}

function Verifikasi({ b }: { b: Berkas }) {
  const { state, aksi } = useStore()
  const jalankan = useJalankan()
  const draf = state.draf.filter((d) => d.berkasId === b.id)
  const daftar = daftarPeriksaAktif(state)
  const isian = isianBerlaku(state, b)
  const terisi = daftar.butir.filter((x) => isian.has(x.id)).length
  const lengkap = terisi === daftar.butir.length
  const [galat, setGalat] = useState('')
  const refDaftar = useRef<HTMLFieldSetElement>(null)

  function lanjut() {
    if (!lengkap) {
      const kosong = daftar.butir.filter((x) => !isian.has(x.id))
      setGalat(`${kosong.length} butir belum diisi. Mulai dari butir: "${kosong[0].teks}"`)
      refDaftar.current?.querySelector<HTMLInputElement>(`#butir-${kosong[0].id}`)?.focus()
      return
    }
    setGalat('')
    jalankan(() => aksi.verifikasi(b.id), 'Verifikasi selesai. Berkas siap dijadwalkan uji.')
  }

  return (
    <section className="panel langkah-aktif">
      <KepalaLangkah n={3} judul="Verifikasi manusia" aksi={<LabelDraf />} />
      <div className="panel-isi tumpuk" >
        {b.catatanKembali && b.versi > 1 && (
          <Pesan nada="galat" judul={`Versi ${b.versi}: perbaikan`} ikon={<RotateCcw aria-hidden="true" />}>{b.catatanKembali}</Pesan>
        )}
        <Pesan nada="draf" judul="Draf AI bisa keliru">
          Studi pada pengguna tunanetra menemukan halusinasi dan salah tafsir pada alat berbasis AI (Xie dkk., 2025). Alat TRAIL masih salah pada gambar beresolusi rendah dan diagram halus (Schauer dkk., 2025). Bandingkan setiap draf dengan berkas asli. Draf tidak bisa diunduh sebagai final.
        </Pesan>

        <div>
          <h3 style={{ marginBottom: '0.75rem' }}>Draf dan berkas asli</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {draf.map((d) => {
              const g = b.bagian.find((x) => x.id === d.bagianId)
              return <KolomDraf key={d.id} d={d} sumber={g?.sumber ?? ''} lokasi={g?.lokasi ?? ''} />
            })}
          </ul>
        </div>

        <fieldset ref={refDaftar}>
          <legend style={{ marginBottom: '0.5rem', fontSize: 'var(--t-l)', fontWeight: 700 }}>
            Daftar periksa <span className="redup kecil">versi {daftar.versi}</span>
          </legend>
          <div className="kemajuan-periksa" style={{ marginBottom: '0.5rem' }}>
            <progress value={terisi} max={daftar.butir.length} aria-label="Butir daftar periksa terisi" />
            <span className="angka">{terisi} dari {daftar.butir.length}</span>
          </div>
          <ul className="periksa">
            {daftar.butir.map((x) => {
              const h = isian.get(x.id)?.hasil
              return (
                <li key={x.id} className="butir" data-isi={h}>
                  <input id={`butir-${x.id}`} type="checkbox" checked={h === 'ya'} disabled={h === 'tidak_berlaku'}
                    onChange={(e) => { setGalat(''); jalankan(() => aksi.isiButir(b.id, x.id, e.target.checked ? 'ya' : null)) }} />
                  <label htmlFor={`butir-${x.id}`}>
                    {x.teks}
                    <span className="wajib">{x.bilaAda ? 'Bila ada' : 'Wajib'}</span>
                  </label>
                  {x.bilaAda ? (
                    <label className="pilih-tb">
                      <input type="checkbox" checked={h === 'tidak_berlaku'} onChange={(e) => { setGalat(''); jalankan(() => aksi.isiButir(b.id, x.id, e.target.checked ? 'tidak_berlaku' : null)) }} />
                      Tidak ada<span className="sr-only"> untuk butir: {x.teks}</span>
                    </label>
                  ) : <span />}
                </li>
              )
            })}
          </ul>
        </fieldset>

        {galat && <p className="galat-bidang" role="alert"><AlertTriangle size={16} aria-hidden="true" />{galat}</p>}
        <div className="deret-tombol">
          <button type="button" className="tombol tombol-utama" aria-disabled={!lengkap} onClick={lanjut} aria-describedby="kunci-lanjut">
            {lengkap ? <CheckCircle2 size={18} aria-hidden="true" /> : <Lock size={18} aria-hidden="true" />} Lanjut
          </button>
          <span id="kunci-lanjut" className="bantu">{lengkap ? 'Semua butir terisi.' : 'Terkunci sampai semua butir terisi.'}</span>
        </div>
      </div>
    </section>
  )
}

function Dikembalikan({ b }: { b: Berkas }) {
  const { aksi } = useStore()
  const jalankan = useJalankan()
  return (
    <section className="panel langkah-aktif">
      <KepalaLangkah n={3} judul="Dikembalikan" />
      <div className="panel-isi tumpuk-s" style={{ gap: '1.25rem' }}>
        <Pesan nada="galat" judul="Perlu perbaikan" ikon={<RotateCcw aria-hidden="true" />}>{b.catatanKembali ?? 'Tidak ada catatan.'}</Pesan>
        <p>Perbaikan membuka versi {b.versi + 1}. Daftar periksa diisi ulang untuk versi baru; koreksi lama tetap tercatat.</p>
        <div className="deret-tombol">
          <button type="button" className="tombol tombol-utama" onClick={() => jalankan(() => aksi.perbaiki(b.id), `Versi ${b.versi + 1} dibuka untuk perbaikan.`)}>
            Perbaiki draf <ArrowRight size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  )
}

function Terverifikasi({ b }: { b: Berkas }) {
  const { state, aksi } = useStore()
  const jalankan = useJalankan()
  const drafIds = new Set(state.draf.filter((d) => d.berkasId === b.id).map((d) => d.id))
  const koreksi = state.koreksi.filter((k) => drafIds.has(k.drafId)).length
  return (
    <section className="panel langkah-aktif">
      <KepalaLangkah n={4} judul="Uji pembaca layar" />
      <div className="panel-isi tumpuk-s" style={{ gap: '1.25rem' }}>
        <Pesan nada="berhasil" judul="Terverifikasi">Daftar periksa lengkap. {koreksi} koreksi atas draf AI tercatat untuk indikator I3.</Pesan>
        <p>Jadwalkan uji dengan NVDA. Bila memungkinkan, ajak mahasiswa pengguna ikut menguji.</p>
        <div className="deret-tombol">
          <button type="button" className="tombol tombol-utama" onClick={() => jalankan(() => aksi.jadwalkanUji(b.id), 'Berkas siap diuji.')}>
            Jadwalkan uji <ArrowRight size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  )
}

/* ---------- Langkah 4: Uji pembaca layar (F4) ---------- */
function UjiPembacaLayar({ b }: { b: Berkas }) {
  const { aksi } = useStore()
  const jalankan = useJalankan()
  const [hasil, setHasil] = useState<'lulus' | 'gagal' | ''>('')
  const [alat, setAlat] = useState('NVDA 2026.1, Firefox')
  const [catatan, setCatatan] = useState('')
  const [galat, setGalat] = useState<{ hasil?: string; catatan?: string }>({})
  const refHasil = useRef<HTMLInputElement>(null)
  const refCatatan = useRef<HTMLTextAreaElement>(null)

  function simpan() {
    const g: typeof galat = {}
    if (!hasil) g.hasil = 'Pilih hasil uji: lulus atau gagal.'
    if (hasil === 'gagal' && !catatan.trim()) g.catatan = 'Tulis lokasi masalah, misalnya "Slide 4, rumus kedua dibaca sebagai gambar".'
    setGalat(g)
    if (g.hasil) return refHasil.current?.focus()
    if (g.catatan) return refCatatan.current?.focus()
    jalankan(() => aksi.catatUji(b.id, hasil as 'lulus' | 'gagal', catatan, alat),
      hasil === 'lulus' ? 'Lolos uji. Materi dikirim ke mahasiswa pengguna untuk persetujuan.' : 'Gagal uji dicatat. Berkas kembali ke langkah verifikasi.')
  }

  return (
    <section className="panel langkah-aktif">
      <KepalaLangkah n={4} judul="Uji pembaca layar" />
      <div className="panel-isi tumpuk" >
        <div className="dua" style={{ gap: '1.25rem' }}>
          <div>
            <h3 style={{ marginBottom: '0.625rem' }}>Panduan uji NVDA</h3>
            <ol className="panduan">
              <li>Buka berkas di peramban atau pembaca PDF, lalu nyalakan NVDA.</li>
              <li>Tekan <kbd>Insert</kbd> + <kbd>F7</kbd>. Pastikan daftar judul muncul berurutan.</li>
              <li>Tekan <kbd>H</kbd> untuk melompat antarjudul, <kbd>G</kbd> antargambar, <kbd>T</kbd> antartabel.</li>
              <li>Dengarkan setiap gambar dan rumus. Bandingkan dengan isi aslinya.</li>
              <li>Baca satu halaman penuh dengan <kbd>Insert</kbd> + <kbd>↓</kbd> untuk mengecek urutan baca.</li>
            </ol>
          </div>
          <div className="pesan" data-nada="info">
            <Info aria-hidden="true" />
            <div><b>Kapan gagal?</b>Gagal bila ada bagian yang dilewati, dibaca "gambar" tanpa keterangan, rumus yang salah dibacakan, atau urutan baca yang melompat.</div>
          </div>
        </div>

        <fieldset aria-describedby={galat.hasil ? 'g-hasil' : undefined}>
          <legend className="label" style={{ marginBottom: '0.5rem' }}>Hasil uji</legend>
          <div className="pilih-hasil">
            <label data-h="lulus">
              <input ref={refHasil} type="radio" name="hasil" value="lulus" checked={hasil === 'lulus'} onChange={() => { setHasil('lulus'); setGalat({}) }} />
              Lulus: terbaca penuh <CheckCircle2 size={22} aria-hidden="true" style={{ color: 'var(--ok)' }} />
            </label>
            <label data-h="gagal">
              <input type="radio" name="hasil" value="gagal" checked={hasil === 'gagal'} onChange={() => { setHasil('gagal'); setGalat({}) }} />
              Gagal: ada masalah <XCircle size={22} aria-hidden="true" style={{ color: 'var(--err)' }} />
            </label>
          </div>
          {galat.hasil && <p id="g-hasil" className="galat-bidang" style={{ marginTop: '0.5rem' }}><AlertTriangle size={16} aria-hidden="true" />{galat.hasil}</p>}
        </fieldset>

        <div className="dua" style={{ gap: '1.25rem' }}>
          <div className="bidang">
            <label htmlFor="catatan-uji">{hasil === 'gagal' ? 'Lokasi masalah (wajib)' : 'Catatan uji'}</label>
            <textarea ref={refCatatan} id="catatan-uji" value={catatan} onChange={(e) => setCatatan(e.target.value)}
              aria-invalid={!!galat.catatan} aria-describedby={galat.catatan ? 'g-catatan' : 'b-catatan'} />
            {galat.catatan
              ? <p id="g-catatan" className="galat-bidang"><AlertTriangle size={16} aria-hidden="true" />{galat.catatan}</p>
              : <p id="b-catatan" className="bantu">Sebut halaman atau slide, dan apa yang dibacakan NVDA.</p>}
          </div>
          <div className="bidang">
            <label htmlFor="alat-uji">Alat dan versi</label>
            <select id="alat-uji" value={alat} onChange={(e) => setAlat(e.target.value)}>
              <option>NVDA 2026.1, Firefox</option>
              <option>NVDA 2026.1, Chrome</option>
              <option>NVDA 2026.1, Adobe Acrobat Reader</option>
              <option>NVDA 2026.1, Microsoft Word</option>
            </select>
          </div>
        </div>

        <div className="deret-tombol">
          <button type="button" className="tombol tombol-utama" onClick={simpan}>Simpan hasil uji</button>
        </div>
      </div>
    </section>
  )
}
