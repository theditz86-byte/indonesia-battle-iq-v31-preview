import type { Metadata } from "next"
import { SkdHub } from "@/components/skd-hub"

export const metadata: Metadata = {
  title: "Latihan SKD CPNS — TWK TIU TKP & Mini SKD 55 Soal",
  description: "Latihan SKD lengkap di ALZAVA Battle Point: Mini SKD 55 soal dalam 50 menit berisi 15 TWK, 17 TIU, dan 23 TKP, plus latihan fokus TIU dan review pembahasan.",
  keywords: ["latihan SKD CPNS","simulasi SKD 55 soal","latihan TWK","latihan TIU","latihan TKP","tryout SKD gratis"],
  alternates: { canonical: "/latihan-skd" },
}

export default function LatihanSkdPage(){
  return <SkdHub />
}
