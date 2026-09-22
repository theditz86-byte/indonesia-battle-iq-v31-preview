import type { Metadata } from "next"
import { LegalLayout } from "@/components/legal-layout"

export const metadata:Metadata={title:"Kebijakan Pengembalian Dana",description:"Kebijakan pengembalian dana produk digital ALZAVA Battle IQ."}

export default function RefundPage(){
  return <LegalLayout eyebrow="Pembayaran" title="Kebijakan Pengembalian Dana">
    <section><h2 className="text-xl font-black text-white">Sebelum fitur diaktifkan</h2><p className="mt-2">Jika pembayaran belum disetujui dan bukti ternyata tidak sesuai, transaksi dapat ditolak tanpa membuka fitur.</p></section>
    <section><h2 className="text-xl font-black text-white">Setelah fitur digital aktif</h2><p className="mt-2">Practice Attempt atau Laporan Premium yang sudah berhasil diaktifkan pada akun umumnya tidak dapat dikembalikan karena manfaat digital sudah diberikan.</p></section>
    <section><h2 className="text-xl font-black text-white">Pengecualian</h2><p className="mt-2">Pengembalian dana atau penggantian kredit dapat dipertimbangkan jika terjadi pembayaran ganda, fitur tidak pernah aktif karena kegagalan sistem, atau transaksi terverifikasi tetapi hak digital tidak diberikan. Peninjauan dilakukan berdasarkan bukti transaksi dan log sistem.</p></section>
    <section><h2 className="text-xl font-black text-white">Kesalahan Nama Arena</h2><p className="mt-2">Pastikan Nama Arena benar sebelum mengirim bukti. Jika terjadi kesalahan dan pembayaran belum disetujui, gunakan kanal bantuan secepatnya agar admin dapat menahan verifikasi.</p></section>
    <p className="text-xs text-slate-500">Terakhir diperbarui: 22 September 2026.</p>
  </LegalLayout>
}
