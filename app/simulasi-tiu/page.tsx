import type { Metadata } from "next"
import { TiuPractice } from "@/components/tiu-practice"

export const metadata: Metadata = {
  title: "Simulasi TIU 35 Soal Gratis",
  description: "Simulasi TIU 35 soal gratis dengan timer, skor, analisis numerik-logika-verbal, dan pembahasan untuk latihan SKD di ALZAVA Battle Point.",
  keywords: ["simulasi TIU 35 soal","tryout TIU gratis","simulasi SKD TIU","soal TIU CPNS gratis"],
  alternates: { canonical: "/simulasi-tiu" },
}

export default function SimulasiTiuPage() {
  return <TiuPractice mode="simulation" />
}
