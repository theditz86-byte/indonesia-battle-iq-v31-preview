import type { Metadata } from "next"
import { LegalLayout } from "@/components/legal-layout"

export const metadata:Metadata={title:"Bantuan",description:"Panduan penggunaan dan pembayaran ALZAVA Battle Point."}

export default function HelpPage(){
  return <LegalLayout eyebrow="Pusat Bantuan" title="Bantuan ALZAVA Battle Point">
    <section><h2 className="text-xl font-black text-white">Apa itu Quick Battle?</h2><p className="mt-2">Quick Battle adalah 5 soal singkat yang dapat dimainkan gratis tanpa login. Hasilnya berupa Preview Battle Point untuk pemanasan dan tidak masuk leaderboard resmi.</p></section>
    <section><h2 className="text-xl font-black text-white">Bagaimana cara masuk leaderboard?</h2><p className="mt-2">Buat akun peserta, lengkapi Nama Panggilan dan wilayah, lalu buka Tes Kemampuan. Setiap season menyediakan 1 Tes Resmi gratis berisi 20 soal dengan waktu 20 menit. Hasil Tes Resmi pertama itulah yang dipakai untuk leaderboard season.</p></section>
    <section><h2 className="text-xl font-black text-white">Apa aturan saat tes?</h2><p className="mt-2">Kerjakan sendiri tanpa AI generatif, mesin pencari, kalkulator, catatan jawaban, atau bantuan orang lain. Aturan ini menjaga leaderboard tetap berarti.</p></section>
    <section><h2 className="text-xl font-black text-white">Apakah Rematch Rp5.000 mempengaruhi ranking?</h2><p className="mt-2">Tidak. Setelah Tes Resmi gratis digunakan, setiap kredit Rp5.000 membuka Rematch / Practice tambahan. Hasilnya tetap mendapatkan Battle Point dan analisis pribadi, tetapi tidak menggantikan skor resmi leaderboard pada season yang sama.</p></section>
    <section><h2 className="text-xl font-black text-white">Bagaimana kartu hasil dibagikan?</h2><p className="mt-2">Di halaman hasil pilih Bagikan Kartu Hasil. Sistem membuat kartu yang memuat Battle Point, prestasi, season, dan link tantangan. IQ tidak dimasukkan ke kartu share maupun leaderboard publik.</p></section>
    <section><h2 className="text-xl font-black text-white">Bagaimana pembayaran dikaitkan ke akun saya?</h2><p className="mt-2">Halaman pembayaran sekarang menggunakan sesi akun yang sedang login. Anda tidak perlu mengetik Nama Panggilan untuk memilih penerima kredit, sehingga risiko kredit masuk ke akun yang salah lebih kecil.</p></section>
    <section><h2 className="text-xl font-black text-white">Berapa lama verifikasi pembayaran?</h2><p className="mt-2">Pada tahap awal, pembayaran QRIS masih diverifikasi admin. Gunakan tombol Cek Status pada halaman pembayaran untuk melihat apakah kredit atau laporan sudah aktif.</p></section>
    <section><h2 className="text-xl font-black text-white">Apa itu Laporan Premium?</h2><p className="mt-2">Laporan Premium seharga Rp5.000 membuka analisis kemampuan, kekuatan relatif, area pengembangan, rekomendasi latihan, dan PDF untuk satu hasil tes. Informasi privat tidak ditampilkan pada leaderboard, podium, profil pemain publik, atau kartu share.</p></section>
    <section><h2 className="text-xl font-black text-white">Bagaimana Chat Global, teman, dan pesan pribadi bekerja?</h2><p className="mt-2">Peserta yang login dapat menggunakan Chat Global, melihat profil pemain, mengirim permintaan pertemanan, dan berkirim pesan pribadi setelah berteman. Hindari spam dan jangan membagikan data pribadi sensitif di percakapan.</p></section>
    <section><h2 className="text-xl font-black text-white">Poin saya tidak masuk leaderboard</h2><p className="mt-2">Pastikan yang dilihat adalah hasil Tes Resmi pertama pada season aktif dan tes berhasil dikirim serta lolos pemeriksaan integritas. Hasil Rematch tidak mengubah klasemen resmi.</p></section>
    <section><h2 className="text-xl font-black text-white">Butuh bantuan transaksi?</h2><p className="mt-2">Simpan bukti pembayaran, waktu transaksi, dan akun yang digunakan. Informasi itu membantu pengelola memeriksa transaksi lebih cepat.</p></section>
  </LegalLayout>
}
