import type { Metadata } from "next"
import { SkdHub } from "@/components/skd-hub"

export const metadata: Metadata = {
  title: "Latihan SKD CPNS Gratis — TIU Harian & Simulasi",
  description: "Latihan SKD gratis di ALZAVA Battle Point. Mulai dari TIU Harian, latihan numerik, logika-analitis, verbal, dan simulasi TIU 35 soal dengan pembahasan.",
  keywords: ["latihan SKD CPNS gratis","latihan TIU CPNS","soal SKD CPNS","simulasi TIU 35 soal","tryout TIU gratis"],
  alternates: { canonical: "/latihan-skd" },
}

export default function LatihanSkdPage() {
  return <SkdHub />
}
