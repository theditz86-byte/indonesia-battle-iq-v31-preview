import type { Metadata } from "next"
import { LegalLayout } from "@/components/legal-layout"

export const metadata:Metadata={title:"Syarat & Ketentuan",description:"Syarat penggunaan ALZAVA Battle Point."}

export default function TermsPage(){
  return <LegalLayout eyebrow="Ketentuan" title="Syarat & Ketentuan">
    <section><h2 className="text-xl font-black text-white">Penggunaan layanan</h2><p className="mt-2">Dengan menggunakan ALZAVA Battle Point, Anda setuju memberikan informasi akun yang wajar, tidak mengganggu layanan, tidak menggunakan otomatisasi untuk memanipulasi hasil, dan tidak mencoba memperoleh akses ke data atau fungsi yang bukan hak Anda.</p></section>
    <section><h2 className="text-xl font-black text-white">Tes Resmi season</h2><p className="mt-2">Setiap peserta memperoleh 1 Tes Resmi gratis pada setiap season. Tes Resmi menggunakan 20 soal dengan batas waktu 20 menit. Hanya hasil Tes Resmi pertama pada season yang membentuk posisi leaderboard resmi.</p></section>
    <section><h2 className="text-xl font-black text-white">Rematch / Practice Credit</h2><p className="mt-2">Setelah Tes Resmi gratis digunakan, peserta dapat membeli Rematch / Practice Credit seharga Rp5.000 per kredit. Rematch tetap menghasilkan Battle Point, analisis hasil, dan riwayat perkembangan pribadi, tetapi tidak mengganti skor resmi leaderboard pada season yang sama.</p></section>
    <section><h2 className="text-xl font-black text-white">Laporan Premium</h2><p className="mt-2">Laporan Premium dijual Rp5.000 untuk setiap hasil tes yang ingin dibuka secara premium. Pembayaran membuka analisis kemampuan lebih rinci, rekomendasi latihan, serta PDF pada hasil tersebut. Jika peserta menyelesaikan tes baru, laporan premium hasil baru dibuka secara terpisah. Produk ini merupakan fitur digital dan bukan laporan psikologi resmi.</p></section>
    <section><h2 className="text-xl font-black text-white">Fair play</h2><p className="mt-2">Peserta wajib mengerjakan sendiri dan dilarang menggunakan AI generatif, bot, kalkulator, mesin pencari, catatan jawaban, bantuan orang lain, atau cara lain yang memanipulasi hasil. Pengelola dapat meninjau atau membatalkan hasil yang memiliki indikasi penyalahgunaan berdasarkan bukti teknis yang tersedia.</p></section>
    <section><h2 className="text-xl font-black text-white">Fitur sosial</h2><p className="mt-2">Chat Global, pertemanan, dan pesan pribadi disediakan untuk interaksi antarpeserta. Pengguna dilarang melakukan spam, pelecehan, penipuan, penyebaran data pribadi tanpa izin, atau konten yang melanggar hukum. Pengelola dapat membatasi fitur sosial atau akun yang menyalahgunakannya.</p></section>
    <section><h2 className="text-xl font-black text-white">Privasi hasil</h2><p className="mt-2">Battle Point, Nama Panggilan, avatar, wilayah, dan peringkat dapat tampil secara publik pada leaderboard, profil pemain, atau kartu share. Estimasi IQ tidak dipublikasikan pada podium, leaderboard, profil pemain publik, atau kartu share.</p></section>
    <section><h2 className="text-xl font-black text-white">Perubahan season dan layanan</h2><p className="mt-2">Soal, aturan season, metode skor, dan fitur dapat diperbaiki untuk meningkatkan kualitas. Perubahan material pada produk berbayar akan diupayakan tidak mengurangi hak digital yang sudah dibeli pada season terkait.</p></section>
    <section><h2 className="text-xl font-black text-white">Batasan hasil</h2><p className="mt-2">Battle Point dan analisis kemampuan di ALZAVA Battle Point tidak boleh digunakan sebagai dasar tunggal untuk keputusan medis, psikologis, pendidikan, pekerjaan, atau keputusan berisiko tinggi lainnya.</p></section>
    <p className="text-xs text-slate-500">Terakhir diperbarui: 25 September 2026.</p>
  </LegalLayout>
}
