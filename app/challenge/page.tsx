"use client"

import { useEffect, useState } from "react"
import { ArrowRight, MapPin, Trophy } from "lucide-react"
import { BATTLE_API_URL, getParticipantToken } from "@/lib/battle"

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
  iq_estimate?: number
}

async function track(event_type:string, details:Record<string,unknown>) {
  try {
    const token=getParticipantToken()
    await fetch(BATTLE_API_URL,{
      method:"POST",
      headers:{"Content-Type":"application/json",...(token?{"X-Battle-Token":token}:{})},
      body:JSON.stringify({action:"track",event_type,details}),
    })
  } catch {}
}

export default function ChallengePage(){
  const [entry,setEntry]=useState<ChallengeEntry|null>(null)
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState("")
  const [challengeId,setChallengeId]=useState("")

  useEffect(()=>{
    const id=new URLSearchParams(window.location.search).get("id") || ""
    setChallengeId(id)
    if(!/^[0-9a-f-]{36}$/i.test(id)){
      setError("Tantangan tidak valid.")
      setLoading(false)
      return
    }
    fetch(`${BATTLE_API_URL}?challenge_id=${encodeURIComponent(id)}`,{cache:"no-store"})
      .then(async r=>{if(!r.ok) throw new Error("Tantangan belum dapat dimuat."); return await r.json()})
      .then(data=>{
        setEntry(data.challenge_entry || null)
        void track("challenge_opened",{challenge_id:id})
      })
      .catch(e=>setError(e instanceof Error?e.message:"Tantangan belum dapat dimuat."))
      .finally(()=>setLoading(false))
  },[])

  function accept(){
    void track("challenge_started",{challenge_id:challengeId})
    window.location.href=getParticipantToken()?"/battle-test":"/account"
  }

  if(loading) return <main className="grid min-h-screen place-items-center bg-[#020817] text-slate-300">Memuat tantangan…</main>

  return (
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,.22),transparent_32rem),linear-gradient(180deg,#020817,#07142f)] px-5 py-12 text-white">
      <section className="w-full max-w-3xl overflow-hidden rounded-[2rem] border border-white/10 bg-[#0a1a37]/90 shadow-2xl">
        <div className="bg-gradient-to-r from-indigo-600/25 via-violet-500/15 to-cyan-400/10 p-7 text-center sm:p-10">
          <img src="/alzava-emblem-v3.svg" alt="ALZAVA Battle IQ" className="mx-auto h-16 w-16 object-contain drop-shadow-[0_0_22px_rgba(212,175,55,.35)]" />
          <p className="mt-5 text-xs font-black uppercase tracking-[.2em] text-cyan-300">Tantangan ALZAVA Battle IQ</p>
          {error || !entry ? (
            <><h1 className="mt-3 text-3xl font-black">Tantangan tidak ditemukan</h1><p className="mt-3 text-slate-400">{error || "Peserta ini belum memiliki hasil ranked pada season aktif."}</p></>
          ) : (
            <>
              <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">{entry.nickname}</h1>
              <p className="mt-3 flex items-center justify-center gap-1 text-sm text-slate-400"><MapPin className="h-4 w-4"/>{[entry.regency_name,entry.province_name].filter(Boolean).join(" · ")}</p>
              <p className="mt-5 text-lg font-bold text-slate-200">menantang Anda mengalahkan skor Battle IQ-nya.</p>
            </>
          )}
        </div>
        {entry && <div className="grid gap-3 p-6 sm:grid-cols-3 sm:p-8">
          <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-5 text-center"><span className="text-xs text-slate-400">Estimasi IQ Battle</span><strong className="mt-1 block text-4xl font-black">{entry.iq_estimate ?? "—"}</strong></div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-5 text-center"><span className="text-xs text-slate-400">Battle Score</span><strong className="mt-1 block text-4xl font-black text-cyan-300">{Number(entry.battle_score||0).toLocaleString("id-ID")}</strong></div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-5 text-center"><span className="text-xs text-slate-400">Peringkat Nasional</span><strong className="mt-1 block text-4xl font-black">#{entry.national_rank ?? "—"}</strong></div>
        </div>}
        <div className="border-t border-white/10 p-6 text-center sm:p-8">
          <p className="text-sm leading-6 text-slate-400">Anda mendapat 1 Ranked Attempt gratis per season. Setelah itu, practice tambahan tidak mengubah leaderboard resmi.</p>
          <button onClick={accept} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-7 py-3.5 font-black shadow-[0_0_28px_rgba(99,102,241,.3)]">{entry?<><Trophy className="h-5 w-5"/>Terima Tantangan</>:<>Mulai Battle IQ</>}<ArrowRight className="h-4 w-4"/></button>
          <div className="mt-4"><a href="/battle" className="text-sm font-bold text-slate-400 hover:text-white">Lihat leaderboard nasional</a></div>
        </div>
      </section>
    </main>
  )
}
