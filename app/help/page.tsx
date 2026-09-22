import type { Metadata } from "next"
import { LegalLayout } from "@/components/legal-layout"

export const metadata:Metadata={title:"Bantuan",description:"Panduan penggunaan dan pembayaran ALZAVA Battle IQ."}

export default function HelpPage(){
  return <LegalLayout eyebrow="Pusat Bantuan" title="Bantuan ALZAVA Battle IQ">
    <section><h2 className="text-xl font-black text-white">Bagaimana cara mulai?</h2><p className="mt-2">Buat akun peserta, lengkapi Nama Arena dan wilayah, lalu buka menu Tes Kemampuan. Format dimulai dengan 30 soal inti dalam 15 menit dan setiap season menyediakan 2 Ranked Attempt gratis. Jika Battle Score inti mencapai 850+, sistem otomatis membuka 10 soal High Range dengan tambahan waktu 8 menit.</p></section>
    <section><h2 className="text-xl font-black text-white">Apa itu High Range?</h2><p className="mt-2">High Range adalah tahap adaptif untuk peserta dengan performa inti sangat tinggi. Tahap ini berisi 10 soal yang lebih sulit dan digunakan untuk mengonfirmasi skor pada rentang atas; tanpa tahap ini, skor inti yang mencapai ambang tidak langsung difinalkan.</p></section>\n    <section><h2 className="text-xl font-black text-white">Apa aturan saat tes?</h2><p className="mt-2">Kerjakan sendiri tanpa ChatGPT/AI, mesin pencari, kalkulator, catatan jawaban, atau bantuan orang lain. Aturan ini menjaga leaderboard tetap berarti.</p></section>\n    <section><h2 className="text-xl font-black text-white">Apakah percobaan Rp5.000 mempengaruhi ranking?</h2><p className="mt-2">Ya. Setelah 2 Ranked Attempt gratis habis, setiap kredit Rp5.000 membuka 1 Ranked Attempt tambahan. Jika skornya lebih baik, hasil tersebut dapat memperbaiki posisi leaderboard resmi.</p></section>
    <section><h2 className="text-xl font-black text-white">Berapa lama verifikasi pembayaran?</h2><p className="mt-2">Pada tahap awal, pembayaran QRIS masih diverifikasi manual. Gunakan tombol Cek Status pada halaman pembayaran untuk melihat apakah fitur sudah aktif.</p></section>
    <section><h2 className="text-xl font-black text-white">Apa itu Laporan Premium?</h2><p className="mt-2">Laporan Premium seharga Rp5.000 membuka analisis domain kemampuan, kekuatan relatif, area pengembangan, rekomendasi latihan, dan PDF untuk satu hasil tes terbaru. Jika peserta mengikuti tes baru, laporan premium untuk hasil baru dibuka secara terpisah.</p></section>
    <section><h2 className="text-xl font-black text-white">Skor saya tidak masuk leaderboard</h2><p className="mt-2">Pastikan tes berhasil dikirim dan lolos pemeriksaan integritas. Ranked Attempt gratis maupun berbayar dapat mempengaruhi leaderboard; sistem memakai hasil terbaik sesuai aturan tie-break.</p></section>
    <section><h2 className="text-xl font-black text-white">Butuh bantuan transaksi?</h2><p className="mt-2">Simpan bukti pembayaran dan Nama Arena yang digunakan. Kanal dukungan resmi pengelola akan ditampilkan melalui aplikasi saat layanan komersial diperluas.</p></section>
  </LegalLayout>
}
