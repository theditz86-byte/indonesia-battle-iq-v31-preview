import type { Metadata } from "next"
import { TiuPractice } from "@/components/tiu-practice"

export const metadata: Metadata = {
  title: "Latihan TIU CPNS Gratis — Numerik, Logika & Verbal",
  description: "Latihan TIU CPNS gratis dengan soal numerik, logika analitis, dan verbal, lengkap dengan skor, pembahasan, dan analisis kategori di ALZAVA Battle Point.",
  keywords: ["latihan TIU CPNS gratis","soal TIU CPNS","latihan numerik CPNS","logika analitis CPNS","tes intelegensia umum"],
  alternates: { canonical: "/latihan-tiu" },
}

export default function LatihanTiuPage() {
  return <TiuPractice mode="category" />
}
