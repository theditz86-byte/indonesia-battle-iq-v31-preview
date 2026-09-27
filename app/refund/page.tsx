import type { Metadata } from "next"
import { LegalLayout } from "@/components/legal-layout"

export const metadata:Metadata={title:"Kebijakan Pengembalian Dana",description:"Kebijakan transaksi digital ALZAVA Battle Point."}

export default function RefundPage(){
  return <LegalLayout eyebrow="Pembayaran" title="Kebijakan Pengembalian Dana">
    <section><h2 className="text-xl font-black text-white">Status Open Beta</h2><p className="mt-2">ALZAVA Battle Point saat ini tidak menerima pembelian Ranked tambahan maupun penjualan baru Laporan Premium. Karena tidak ada transaksi baru melalui halaman publik, tidak ada biaya yang perlu dibayar untuk mengikuti Ranked selama Open Beta.</p></section>
    <section><h2 className="text-xl font-black text-white">Transaksi lama atau transaksi saat fitur berbayar diaktifkan kembali</h2><p className="mt-2">Jika terdapat transaksi sah dari fase sebelumnya atau fitur berbayar diaktifkan kembali, pengembalian dana atau penggantian hak digital dapat dipertimbangkan untuk pembayaran ganda, fitur yang tidak pernah aktif karena kegagalan sistem, atau transaksi terverifikasi tetapi hak digital tidak diberikan.</p></section>
    <section><h2 className="text-xl font-black text-white">Bukti transaksi</h2><p className="mt-2">Simpan bukti, waktu transaksi, dan akun yang digunakan sampai penyelesaian verifikasi. Peninjauan dilakukan berdasarkan bukti transaksi dan log sistem.</p></section>
    <p className="text-xs text-slate-500">Terakhir diperbarui: 27 September 2026.</p>
  </LegalLayout>
}
