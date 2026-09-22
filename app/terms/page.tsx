import type { Metadata } from "next"
import { LegalLayout } from "@/components/legal-layout"

export const metadata:Metadata={title:"Syarat & Ketentuan",description:"Syarat penggunaan Indonesia Battle IQ."}

export default function TermsPage(){
  return <LegalLayout eyebrow="Ketentuan" title="Syarat & Ketentuan">
    <section><h2 className="text-xl font-black text-white">Penggunaan layanan</h2><p className="mt-2">Dengan menggunakan Indonesia Battle IQ, Anda setuju memberikan informasi akun yang wajar, tidak mengganggu layanan, tidak menggunakan otomatisasi untuk memanipulasi hasil, dan tidak mencoba memperoleh akses ke data atau fungsi yang bukan hak Anda.</p></section>
    <section><h2 className="text-xl font-black text-white">Ranked Attempt</h2><p className="mt-2">Setiap peserta memperoleh 2 Ranked Attempt gratis pada setiap season. Hasil Ranked Attempt dapat memengaruhi leaderboard resmi. Sistem mempertahankan hasil terbaik sesuai aturan penilaian dan tie-break yang berlaku.</p></section>
    <section><h2 className="text-xl font-black text-white">Practice Attempt</h2><p className="mt-2">Setelah dua Ranked Attempt gratis digunakan, peserta dapat membeli Practice Attempt seharga Rp5.000 per kredit. Practice Attempt memberikan hasil pribadi namun tidak mengubah leaderboard resmi. Tujuannya menjaga kompetisi agar tidak menjadi pay-to-win.</p></section>
    <section><h2 className="text-xl font-black text-white">Laporan Premium</h2><p className="mt-2">Laporan Premium season aktif dijual Rp9.900 dan membuka analisis kemampuan lebih rinci, rekomendasi latihan, serta tampilan laporan yang dapat disimpan sebagai PDF. Produk ini merupakan fitur digital dan bukan laporan psikologi resmi.</p></section>
    <section><h2 className="text-xl font-black text-white">Fair play</h2><p className="mt-2">Ranked Attempt terdiri dari 30 soal dengan batas waktu 15 menit. Peserta wajib mengerjakan sendiri dan dilarang menggunakan ChatGPT atau AI lain, bot, kalkulator, mesin pencari, catatan jawaban, bantuan orang lain, atau cara lain yang memanipulasi hasil. Pengelola dapat meninjau atau membatalkan hasil yang memiliki indikasi penyalahgunaan berdasarkan bukti teknis yang tersedia.</p></section>
    <section><h2 className="text-xl font-black text-white">Perubahan season dan layanan</h2><p className="mt-2">Soal, aturan season, metode skor, dan fitur dapat diperbaiki untuk meningkatkan kualitas. Perubahan material pada produk berbayar akan diupayakan tidak mengurangi hak digital yang sudah dibeli pada season terkait.</p></section>
    <section><h2 className="text-xl font-black text-white">Batasan hasil</h2><p className="mt-2">Skor dan estimasi IQ Battle tidak boleh digunakan sebagai dasar tunggal untuk keputusan medis, psikologis, pendidikan, pekerjaan, atau keputusan berisiko tinggi lainnya.</p></section>
    <p className="text-xs text-slate-500">Terakhir diperbarui: 22 September 2026.</p>
  </LegalLayout>
}
