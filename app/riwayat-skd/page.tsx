import type { Metadata } from "next"
import { SkdHistory } from "@/components/skd-history"

export const metadata: Metadata = {
  title: "Riwayat Mini SKD — ALZAVA Battle Point",
  description: "Lihat riwayat Mini SKD, skor /500, jumlah jawaban terbaik dari 55 soal, nilai TWK TIU TKP, pembahasan, dan bagikan hasil latihan ALZAVA Battle Point.",
  alternates: { canonical: "/riwayat-skd" },
}

export default function RiwayatSkdPage(){
  return <SkdHistory />
}
