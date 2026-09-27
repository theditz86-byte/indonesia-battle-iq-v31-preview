import type { Metadata } from "next"
import { LegalLayout } from "@/components/legal-layout"

export const metadata:Metadata={title:"Syarat & Ketentuan",description:"Syarat penggunaan ALZAVA Battle Point."}

export default function TermsPage(){
  return <LegalLayout eyebrow="Ketentuan" title="Syarat & Ketentuan">
    <section><h2 className="text-xl font-black text-white">Penggunaan layanan</h2><p className="mt-2">Dengan menggunakan ALZAVA Battle Point, Anda setuju memberikan informasi akun yang wajar, tidak mengganggu layanan, tidak menggunakan otomatisasi untuk memanipulasi hasil, dan tidak mencoba memperoleh akses ke data atau fungsi yang bukan hak Anda.</p></section>
    <section><h2 className="text-xl font-black text-white">Usia & persetujuan</h2><p className="mt-2">Pengguna berusia 18 tahun ke atas dapat membuat akun sendiri. Pengguna di bawah 18 tahun hanya boleh menggunakan layanan dengan persetujuan orang tua atau wali, terutama untuk fitur sosial seperti Chat Global, pertemanan, dan pesan pribadi.</p></section>
    <section><h2 className="text-xl font-black text-white">Ranked Battle season</h2><p className="mt-2">Pada Open Beta, setiap peserta memperoleh maksimal 3 Ranked Battle gratis pada setiap season mingguan. Setiap Ranked menggunakan 20 soal dengan batas waktu 20 menit. Ketiga kesempatan boleh digunakan kapan saja selama season aktif, termasuk di hari yang sama. Skor terbaik dari maksimal 3 attempt menentukan posisi leaderboard.</p></section>
    <section><h2 className="text-xl font-black text-white">Open Beta dan pembayaran</h2><p className="mt-2">Pembelian Ranked tambahan dan penjualan baru Laporan Premium sementara dinonaktifkan selama Open Beta. Pengelola dapat mengaktifkan kembali produk digital pada fase berikutnya setelah aturan dan halaman transaksi diperbarui secara konsisten.</p></section>
    <section><h2 className="text-xl font-black text-white">Fair play</h2><p className="mt-2">Peserta wajib mengerjakan sendiri dan dilarang menggunakan AI generatif, bot, kalkulator, mesin pencari, catatan jawaban, bantuan orang lain, atau cara lain yang memanipulasi hasil. Pengelola dapat meninjau atau membatalkan hasil yang memiliki indikasi penyalahgunaan berdasarkan bukti teknis yang tersedia.</p></section>
    <section><h2 className="text-xl font-black text-white">Fitur sosial</h2><p className="mt-2">Chat Global, pertemanan, dan pesan pribadi disediakan untuk interaksi antarpeserta. Pengguna dilarang melakukan spam, pelecehan, penipuan, penyebaran data pribadi tanpa izin, atau konten yang melanggar hukum.</p></section>
    <section><h2 className="text-xl font-black text-white">Privasi hasil</h2><p className="mt-2">Battle Point, Nama Panggilan, avatar, wilayah, dan peringkat dapat tampil secara publik pada leaderboard, profil pemain, History Ranking, atau kartu share. Estimasi IQ tidak digunakan sebagai tampilan publik ALZAVA Battle Point.</p></section>
    <section><h2 className="text-xl font-black text-white">Perubahan season dan layanan</h2><p className="mt-2">Admin dapat menutup season dan membuka season baru. Saat season ditutup, hanya Top 3 final disimpan pada History Ranking. Soal, metode skor, dan fitur dapat diperbaiki untuk meningkatkan kualitas dan fairness.</p></section>
    <section><h2 className="text-xl font-black text-white">Batasan hasil</h2><p className="mt-2">Battle Point dan analisis kemampuan merupakan indikator performa dalam permainan/latihan dan tidak boleh digunakan sebagai dasar tunggal untuk keputusan medis, psikologis, pendidikan, pekerjaan, atau keputusan berisiko tinggi lainnya.</p></section>
    <p className="text-xs text-slate-500">Terakhir diperbarui: 27 September 2026.</p>
  </LegalLayout>
}
