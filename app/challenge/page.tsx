"use client"

import { useEffect, useState } from "react"
import { ArrowRight, MapPin, Swords, Trophy } from "lucide-react"
import { BATTLE_API_URL, getParticipantToken } from "@/lib/battle"
import { getReferralVisitorKey, referralCall, saveReferral } from "@/lib/referral"

type ChallengeEntry = {
  participant_public_id?: string
  nickname?: string
  avatar_url?: string | null
  province_name?: string
  regency_name?: string
  district_name?: string
  battle_score?: number
  correct_count?: number
  question_count?: number
  duration_ms?: number
  national_rank?: number
}

export default function ChallengePage(){
  const [entry,setEntry]=useState<ChallengeEntry|null>(null)
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState("")
  const [challengeId,setChallengeId]=useState("")
  const [source,setSource]=useState("direct")

  useEffect(()=>{
    const params=new URLSearchParams(window.location.search)
    const id=params.get("id") || params.get("ref") || ""
    const src=(params.get("src")||"direct").slice(0,40)
    setChallengeId(id);setSource(src)
    if(!/^[0-9a-f-]{36}$/i.test(id)){setError("Tantangan tidak valid.");setLoading(false);return}
    const visitor=getReferralVisitorKey()
    saveReferral(id,src)
    void referralCall({action:"open",referrer_public_id:id,visitor_key:visitor,source:src}).catch(()=>{})
    fetch(`${BATTLE_API_URL}?challenge_id=${encodeURIComponent(id)}`,{cache:"no-store"})
      .then(async r=>{if(!r.ok)throw new Error("Tantangan belum dapat dimuat.");return await r.json()})
      .then(data=>setEntry(data.challenge_entry||null))
      .catch(e=>setError(e instanceof Error?e.message:"Tantangan belum dapat dimuat."))
      .finally(()=>setLoading(false))
  },[])

  function accept(){
    const visitor=getReferralVisitorKey()
    saveReferral(challengeId,source)
    void referralCall({action:"accept",referrer_public_id:challengeId,visitor_key:visitor,source}).catch(()=>{})
    try{localStorage.setItem("alzava.challenge.id",challengeId)}catch{}
    if(getParticipantToken())window.location.href="/battle-test"
    else window.location.href=`/quick-battle?challenge=${encodeURIComponent(challengeId)}&ref=${encodeURIComponent(challengeId)}&src=${encodeURIComponent(source)}`
  }

  if(loading)return <main className="grid min-h-screen place-items-center bg-[#020817] text-slate-300">Memuat tantangan…</main>

  const accuracy=entry?.question_count?Math.round(Number(entry.correct_count||0)/Number(entry.question_count)*100):0
  return <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,.26),transparent_34rem),radial-gradient(circle_at_50%_55%,rgba(245,158,11,.12),transparent_30rem),linear-gradient(180deg,#020817,#07142f)] px-5 py-12 text-white">
    <section className="w-full max-w-3xl overflow-hidden rounded-[2rem] border border-white/10 bg-[#081730]/92 shadow-2xl backdrop-blur-xl">
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600/25 via-violet-500/15 to-cyan-400/10 p-7 text-center sm:p-10">
        <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(110deg,transparent_0%,rgba(34,211,238,.15)_45%,transparent_52%)]"/>
        <img src="/brand/alvaza-logo-new.svg" alt="ALZAVA Battle Point" className="relative mx-auto h-16 w-16 object-contain drop-shadow-[0_0_22px_rgba(212,175,55,.35)]"/>
        <p className="relative mt-5 text-xs font-black uppercase tracking-[.2em] text-cyan-300">Tantangan ALZAVA Battle Point</p>
        {error||!entry?<><h1 className="relative mt-3 text-3xl font-black">Tantangan tidak ditemukan</h1><p className="relative mt-3 text-slate-400">{error||"Peserta ini belum memiliki skor resmi pada season aktif."}</p></>:<>
          <div className="relative mx-auto mt-6 grid h-28 w-28 place-items-center overflow-hidden rounded-full border-4 border-amber-300 bg-slate-900 shadow-[0_0_35px_rgba(245,158,11,.35)]">{entry.avatar_url?<img src={entry.avatar_url} alt={entry.nickname||"Pemain"} className="h-full w-full object-cover"/>:<span className="text-3xl font-black">{(entry.nickname||"P").slice(0,2).toUpperCase()}</span>}</div>
          <h1 className="relative mt-4 text-4xl font-black tracking-tight sm:text-5xl">{entry.nickname}</h1>
          <p className="relative mt-3 flex items-center justify-center gap-1 text-sm text-slate-400"><MapPin className="h-4 w-4"/>{[entry.regency_name,entry.province_name].filter(Boolean).join(" · ")}</p>
          <div className="relative mx-auto mt-6 max-w-xl rounded-2xl border border-amber-300/20 bg-black/20 px-5 py-5"><p className="text-sm text-slate-300">menantangmu melewati</p><div className="mt-1 text-6xl font-black text-amber-300">{Number(entry.battle_score||0).toLocaleString("id-ID")}</div><p className="text-xs font-black uppercase tracking-[.2em] text-amber-200">Battle Point</p><p className="mt-4 text-lg font-black text-white">Coba kalahkan skorku!</p></div>
        </>}
      </div>
      {entry&&<div className="grid gap-3 p-6 sm:grid-cols-3 sm:p-8"><div className="rounded-2xl border border-white/10 bg-slate-950/40 p-5 text-center"><span className="text-xs text-slate-400">Battle Point</span><strong className="mt-1 block text-3xl font-black text-cyan-300">{Number(entry.battle_score||0).toLocaleString("id-ID")}</strong></div><div className="rounded-2xl border border-white/10 bg-slate-950/40 p-5 text-center"><span className="text-xs text-slate-400">Peringkat Nasional</span><strong className="mt-1 block text-3xl font-black">#{entry.national_rank??"—"}</strong></div><div className="rounded-2xl border border-white/10 bg-slate-950/40 p-5 text-center"><span className="text-xs text-slate-400">Akurasi</span><strong className="mt-1 block text-3xl font-black">{accuracy}%</strong></div></div>}
      <div className="border-t border-white/10 p-6 text-center sm:p-8"><h2 className="text-2xl font-black">Bisa lewati skornya?</h2><p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-400">Belum punya akun? Coba Quick Battle 5 soal dulu tanpa login. Setelah itu daftar gratis dan ikuti Tes Resmi 20 soal untuk masuk leaderboard kecamatan hingga nasional.</p><button onClick={accept} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-600 px-7 py-3.5 font-black shadow-[0_0_28px_rgba(99,102,241,.35)]">{entry?<><Swords className="h-5 w-5"/>Terima Tantangan</>:<>Mulai Battle Point</>}<ArrowRight className="h-4 w-4"/></button><div className="mt-4"><a href="/battle" className="inline-flex items-center gap-1 text-sm font-bold text-slate-400 hover:text-white"><Trophy className="h-4 w-4"/>Lihat leaderboard</a></div></div>
    </section>
  </main>
}
