import type { Metadata } from "next"
import { LegalLayout } from "@/components/legal-layout"

export const metadata:Metadata={title:"Bantuan",description:"Panduan penggunaan ALZAVA Battle Point."}

export default function HelpPage(){
  return <LegalLayout eyebrow="Pusat Bantuan" title="Bantuan ALZAVA Battle Point">
    <section><h2 className="text-xl font-black text-white">Apa itu Quick Battle?</h2><p className="mt-2">Quick Battle adalah 5 soal singkat yang dapat dimainkan gratis tanpa login. Hasilnya berupa Preview Battle Point untuk pemanasan dan tidak masuk leaderboard resmi.</p></section>
    <section><h2 className="text-xl font-black text-white">Bagaimana cara masuk leaderboard?</h2><p className="mt-2">Buat akun peserta, lengkapi Nama Panggilan dan wilayah, lalu buka Ranked Battle. Setiap season mingguan menyediakan maksimal 3 Ranked Battle gratis, masing-masing 20 soal dalam 20 menit. Ketiganya langsung tersedia dan boleh dipakai kapan saja selama season aktif, termasuk di hari yang sama. Skor terbaik dari maksimal 3 attempt masuk leaderboard.</p></section>
    <section><h2 className="text-xl font-black text-white">Apa aturan saat Ranked?</h2><p className="mt-2">Kerjakan sendiri tanpa AI generatif, mesin pencari, kalkulator, catatan jawaban, atau bantuan orang lain. Jawaban disimpan berkala untuk mengurangi risiko kehilangan progress.</p></section>
    <section><h2 className="text-xl font-black text-white">Apakah Ranked bisa dibeli?</h2><p className="mt-2">Tidak selama Open Beta. Semua pemain mendapat aturan yang sama: maksimal 3 Ranked gratis pada season mingguan dan tidak ada pembelian Ranked tambahan.</p></section>
    <section><h2 className="text-xl font-black text-white">Bagaimana kartu hasil dibagikan?</h2><p className="mt-2">Di halaman hasil pilih Bagikan Kartu Hasil. Sistem membuat kartu yang memuat Battle Point, prestasi, season, dan tantangan. Nilai IQ tidak digunakan sebagai tampilan publik ALZAVA Battle Point.</p></section>
    <section><h2 className="text-xl font-black text-white">Bagaimana pembayaran selama Open Beta?</h2><p className="mt-2">Transaksi baru untuk Ranked dan Laporan Premium sementara dinonaktifkan. Infrastruktur pembayaran tetap disimpan untuk fase produk berikutnya, tetapi halaman publik tidak menerima pembelian baru selama Open Beta.</p></section>
    <section><h2 className="text-xl font-black text-white">Bagaimana Chat Global, teman, dan pesan pribadi bekerja?</h2><p className="mt-2">Peserta yang login dapat menggunakan Chat Global, melihat profil pemain, mengirim permintaan pertemanan, dan berkirim pesan pribadi setelah berteman. Hindari spam dan jangan membagikan data pribadi sensitif.</p></section>
    <section><h2 className="text-xl font-black text-white">Poin saya tidak masuk leaderboard</h2><p className="mt-2">Pastikan Ranked berhasil dikirim, lolos pemeriksaan integritas, dan season masih aktif. Dari maksimal 3 Ranked dalam season, sistem menggunakan skor terbaik; jika Battle Point sama, waktu pengerjaan menjadi pembeda berikutnya.</p></section>
    <section><h2 className="text-xl font-black text-white">Apa itu History Ranking?</h2><p className="mt-2">Saat admin menutup season, hanya Top 3 final disimpan sebagai arsip History Ranking. Podium season lama tidak berubah ketika season baru dibuka.</p></section>
  </LegalLayout>
}
