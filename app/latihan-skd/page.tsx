import type { Metadata } from "next"
import { SkdHub } from "@/components/skd-hub"

export const metadata: Metadata = {
  title: "Latihan TIU CPNS Gratis — Bagian dari Persiapan SKD",
  description: "Latihan TIU gratis selama Open Beta ALZAVA Battle Point sebagai bagian dari persiapan SKD. Tersedia TIU Harian, numerik, logika-analitis, verbal, figural-spasial, dan simulasi TIU 35 soal dengan pembahasan. TWK dan TKP belum menjadi fokus versi ini.",
  keywords: ["latihan TIU CPNS gratis","persiapan SKD TIU","soal TIU CPNS","simulasi TIU 35 soal","tryout TIU gratis"],
  alternates: { canonical: "/latihan-skd" },
}

export default function LatihanSkdPage() {
  return <SkdHub />
}
