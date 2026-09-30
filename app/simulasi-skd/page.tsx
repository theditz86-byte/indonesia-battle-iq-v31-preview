import type { Metadata } from "next"
import { SkdSimulation } from "@/components/skd-simulation"

export const metadata: Metadata = {
  title: "Simulasi Mini SKD 55 Soal — TWK TIU TKP",
  description: "Simulasi Mini SKD ALZAVA 55 soal dalam 50 menit: 15 TWK, 17 TIU, dan 23 TKP dengan hasil per bagian, target latihan, dan review pembahasan.",
  keywords: ["simulasi SKD CPNS","latihan TWK TIU TKP","tryout SKD gratis","55 soal SKD","latihan CPNS"],
  alternates: { canonical: "/simulasi-skd" },
}

export default function SimulasiSkdPage(){
  return <SkdSimulation />
}
