import type { Metadata } from "next"
import { LegalLayout } from "@/components/legal-layout"

export const metadata:Metadata={title:"Kebijakan Privasi",description:"Kebijakan privasi ALZAVA Battle Point."}

export default function PrivacyPage(){
  return <LegalLayout eyebrow="Privasi" title="Kebijakan Privasi">
    <section><h2 className="text-xl font-black text-white">Data yang kami proses</h2><p className="mt-2">ALZAVA Battle Point memproses data yang Anda berikan atau yang diperlukan untuk menjalankan layanan, seperti username, Nama Arena, wilayah, foto profil bila diunggah, token sesi peserta, jawaban dan hasil tes, riwayat percobaan, serta bukti pembayaran bila Anda membeli fitur digital.</p></section>
    <section><h2 className="text-xl font-black text-white">Tujuan penggunaan</h2><p className="mt-2">Data digunakan untuk membuat dan mengamankan akun, menjalankan tes, menghitung hasil, menampilkan leaderboard, mencegah penyalahgunaan, memproses pembayaran, membuka fitur yang dibeli, menangani dukungan, serta mengukur kinerja produk secara agregat.</p></section>
    <section><h2 className="text-xl font-black text-white">Leaderboard publik</h2><p className="mt-2">Nama Arena, avatar bila tersedia, wilayah, Battle Point, ketepatan, waktu, dan peringkat dapat ditampilkan secara publik pada leaderboard. Nilai atau estimasi IQ tidak ditampilkan pada leaderboard maupun podium publik; informasi tersebut hanya tersedia secara privat pada halaman hasil peserta.</p></section>
    <section><h2 className="text-xl font-black text-white">Bukti pembayaran</h2><p className="mt-2">Pada tahap pembayaran manual, bukti pembayaran hanya digunakan untuk verifikasi transaksi oleh admin. Hindari mengunggah informasi yang tidak diperlukan selain bukti transaksi terkait.</p></section>
    <section><h2 className="text-xl font-black text-white">Keamanan dan penyimpanan</h2><p className="mt-2">Kami menerapkan kontrol akses dan pemisahan data publik dengan data privat. Tidak ada sistem yang sepenuhnya bebas risiko; karena itu kami terus memperbaiki keamanan dan membatasi akses administratif.</p></section>
    <section><h2 className="text-xl font-black text-white">Hak pengguna</h2><p className="mt-2">Anda dapat meminta koreksi informasi akun yang keliru dan menghubungi pengelola untuk pertanyaan mengenai data pribadi. Mekanisme bantuan tersedia pada halaman Bantuan.</p></section>
    <section><h2 className="text-xl font-black text-white">Catatan hasil tes</h2><p className="mt-2">Estimasi IQ yang tampil secara privat pada hasil tes merupakan indikator performa dalam sistem ALZAVA Battle Point dan bukan diagnosis psikologis, hasil psikotes klinis, atau pengganti asesmen oleh psikolog berwenang.</p></section>
    <p className="text-xs text-slate-500">Terakhir diperbarui: 24 September 2026.</p>
  </LegalLayout>
}
