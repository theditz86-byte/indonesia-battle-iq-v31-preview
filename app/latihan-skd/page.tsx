import type { Metadata } from "next"
import { SkdHub } from "@/components/skd-hub"

export const metadata: Metadata = {
  title: "Latihan SKD CPNS — TWK TIU TKP & Mini SKD 55 Soal",
  description: "Latihan SKD lengkap di ALZAVA Battle Point: Mini SKD 55 soal dalam 50 menit berisi 15 TWK, 17 TIU, dan 23 TKP, plus riwayat hasil dan review pembahasan.",
  keywords: ["latihan SKD CPNS","simulasi SKD 55 soal","latihan TWK","latihan TIU","latihan TKP","tryout SKD gratis"],
  alternates: { canonical: "/latihan-skd" },
}

export default function LatihanSkdPage(){
  return <>
    <SkdHub />
    <a href="/riwayat-skd" className="fixed bottom-5 right-5 z-50 rounded-2xl border border-cyan-300/25 bg-[#07142e]/95 px-5 py-3 text-sm font-black text-cyan-100 shadow-2xl backdrop-blur transition hover:-translate-y-0.5 hover:border-cyan-300/50">
      Riwayat Mini SKD
    </a>
  </>
}
