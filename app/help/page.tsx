import type { Metadata } from "next"
import { LegalLayout } from "@/components/legal-layout"

export const metadata:Metadata={title:"Bantuan",description:"Panduan penggunaan dan pembayaran ALZAVA Battle Point."}

export default function HelpPage(){
  return <LegalLayout eyebrow="Pusat Bantuan" title="Bantuan ALZAVA Battle Point">
    <section><h2 className="text-xl font-black text-white">Apa itu Quick Battle?</h2><p className="mt-2">Quick Battle adalah 5 soal singkat yang dapat dimainkan gratis tanpa login. Hasilnya berupa Preview Battle Point untuk pemanasan dan tidak masuk leaderboard resmi. Setelah itu peserta dapat membuat akun dan mengikuti Ranked Battle.</p></section>
    <section><h2 className="text-xl font-black text-white">Bagaimana cara masuk leaderboard?</h2><p className="mt-2">Buat akun peserta, lengkapi Nama Arena dan wilayah, lalu buka Ranked Battle. Format dimulai dengan 30 soal inti dalam 15 menit dan setiap season menyediakan 1 Ranked Attempt resmi gratis. Jika Battle Point inti mencapai 850+, sistem otomatis membuka 10 soal High Range dengan tambahan waktu 8 menit.</p></section>
    <section><h2 className="text-xl font-black text-white">Apa itu High Range?</h2><p className="mt-2">High Range adalah tahap adaptif untuk peserta dengan performa inti sangat tinggi. Tahap ini berisi 10 soal yang lebih sulit dan digunakan untuk mengonfirmasi skor pada rentang atas.</p></section>
    <section><h2 className="text-xl font-black text-white">Apa aturan saat tes?</h2><p className="mt-2">Kerjakan sendiri tanpa AI generatif, mesin pencari, kalkulator, catatan jawaban, atau bantuan orang lain. Aturan ini menjaga leaderboard tetap berarti.</p></section>
    <section><h2 className="text-xl font-black text-white">Apakah Rematch Rp5.000 mempengaruhi ranking?</h2><p className="mt-2">Tidak. Setelah Ranked Attempt resmi gratis digunakan, setiap kredit Rp5.000 membuka Rematch / Practice tambahan. Hasilnya tetap mendapatkan Battle Point dan analisis pribadi, tetapi tidak menggantikan skor resmi leaderboard pada season yang sama.</p></section>
    <section><h2 className="text-xl font-black text-white">Bagaimana kartu hasil dibagikan?</h2><p className="mt-2">Di halaman Result pilih Bagikan Kartu Hasil. Sistem membuat kartu 9:16 yang memuat Battle Point, prestasi, season, dan link tantangan. IQ tidak dimasukkan ke kartu share maupun leaderboard publik.</p></section>
    <section><h2 className="text-xl font-black text-white">Berapa lama verifikasi pembayaran?</h2><p className="mt-2">Pada tahap awal, pembayaran QRIS masih diverifikasi admin. Gunakan tombol Cek Status pada halaman pembayaran untuk melihat apakah kredit atau laporan sudah aktif.</p></section>
    <section><h2 className="text-xl font-black text-white">Apa itu Laporan Premium?</h2><p className="mt-2">Laporan Premium seharga Rp5.000 membuka analisis domain kemampuan, kekuatan relatif, area pengembangan, rekomendasi latihan, dan PDF untuk satu hasil tes. Estimasi IQ tetap ditampilkan secara privat di halaman hasil, bukan di leaderboard, podium, challenge, atau kartu share.</p></section>
    <section><h2 className="text-xl font-black text-white">Poin saya tidak masuk leaderboard</h2><p className="mt-2">Pastikan yang dilihat adalah hasil Ranked Attempt resmi pertama pada season aktif dan tes berhasil dikirim serta lolos pemeriksaan integritas. Hasil Rematch tidak mengubah klasemen resmi.</p></section>
    <section><h2 className="text-xl font-black text-white">Butuh bantuan transaksi?</h2><p className="mt-2">Simpan bukti pembayaran dan Nama Arena yang digunakan. Kanal dukungan resmi pengelola akan ditampilkan melalui aplikasi saat layanan komersial diperluas.</p></section>
  </LegalLayout>
}
