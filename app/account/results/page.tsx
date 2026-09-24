"use client"

import { useEffect, useMemo, useState } from "react"
import { BATTLE_API_URL, PARTICIPANT_TOKEN_KEY, formatDuration } from "@/lib/battle"
import { ArrowLeft, CheckCircle2, Crown, History, Play, Settings, Sparkles, Trophy, WalletCards } from "lucide-react"

const ACCOUNT_API = "https://efndozplpwyemzgqfnep.supabase.co/functions/v1/battle-account"

type Participant = {
  nickname?: string
  avatar_url?: string | null
  province_name?: string
  regency_name?: string
  district_name?: string
  attempts_used?: number
  free_attempts_remaining?: number
  paid_credits?: number
  attempts_remaining?: number
  active_attempt_id?: string | null
}

type AttemptItem = {
  attempt_id?: string
  attempt_number?: number
  battle_score?: number
  correct_count?: number
  question_count?: number
  duration_ms?: number
  iq_estimate?: number
  iq_low?: number
  iq_high?: number
  submitted_at?: string
  is_personal_best?: boolean
  premium_unlocked?: boolean
}

type ResultHistory = {
  attempts?: AttemptItem[]
  selected_attempt_id?: string | null
}

async function accountApi(token:string) {
  const response=await fetch(ACCOUNT_API,{
    method:"POST",
    headers:{"Content-Type":"application/json","X-Battle-Token":token},
    body:JSON.stringify({action:"me"}),
  })
  const data=await response.json().catch(()=>({}))
  if(!response.ok) throw new Error(data?.error || "Akun belum dapat dimuat.")
  return data
}

async function resultApi(token:string) {
  const response=await fetch(BATTLE_API_URL,{
    method:"POST",
    headers:{"Content-Type":"application/json","X-Battle-Token":token},
    body:JSON.stringify({action:"latest_result"}),
  })
  const data=await response.json().catch(()=>({}))
  if(!response.ok) throw new Error(data?.error || "Riwayat hasil belum dapat dimuat.")
  return data?.data as ResultHistory
}

export default function AccountResultsPage(){
  const [participant,setParticipant]=useState<Participant|null>(null)
  const [history,setHistory]=useState<ResultHistory|null>(null)
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState("")

  useEffect(()=>{
    const token=localStorage.getItem(PARTICIPANT_TOKEN_KEY) || ""
    if(!token){
      window.location.replace("/account")
      return
    }
    Promise.all([accountApi(token),resultApi(token)])
      .then(([account,result])=>{
        setParticipant(account?.participant || null)
        setHistory(result || null)
      })
      .catch((e)=>setError(e instanceof Error?e.message:"Data akun belum dapat dimuat."))
      .finally(()=>setLoading(false))
  },[])

  const attempts=useMemo(()=>[...(history?.attempts || [])].sort((a,b)=>Number(b.attempt_number||0)-Number(a.attempt_number||0)),[history?.attempts])
  const personalBest=attempts.find((item)=>item.is_personal_best) || attempts.slice().sort((a,b)=>Number(b.battle_score||0)-Number(a.battle_score||0))[0]
  const used=Math.max(0,Number(participant?.attempts_used)||attempts.length)
  const freeRemaining=Math.max(0,Number(participant?.free_attempts_remaining ?? 1-used)||0)
  const paidCredits=Math.max(0,Number(participant?.paid_credits)||0)
  const active=Boolean(participant?.active_attempt_id)
  const testHref=active || freeRemaining>0 || paidCredits>0 ? "/battle-test" : "/payment?product=attempt_credit"
  const testLabel=active ? "Lanjutkan tes" : freeRemaining>0 ? `Mulai tes · gratis ${freeRemaining}x` : paidCredits>0 ? `Mulai Ranked · kredit ${paidCredits}x` : "Tambah Ranked · Rp5.000"

  if(loading) return <main className="grid min-h-screen place-items-center bg-[#020817] text-slate-300">Memuat akun & riwayat hasil…</main>

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_10%_0%,rgba(79,70,229,.24),transparent_34rem),radial-gradient(circle_at_90%_8%,rgba(6,182,212,.14),transparent_30rem),linear-gradient(180deg,#020617_0%,#07142e_48%,#020617_100%)] text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#020817]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4">
          <a href="/battle" className="flex items-center gap-3">
            <img src="/alzava-emblem-v3.svg" alt="ALZAVA Battle Point" className="h-10 w-10 object-contain"/>
            <div><p className="font-black">ALZAVA <span className="text-[#D4AF37]">Battle Point</span></p><p className="text-[10px] uppercase tracking-[.14em] text-slate-500">Akun & Hasil</p></div>
          </a>
          <a href="/battle" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-slate-300 hover:bg-white/10"><ArrowLeft className="h-4 w-4"/>Beranda</a>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:py-10">
        {error && <div className="mb-6 rounded-2xl border border-rose-400/25 bg-rose-400/10 p-4 text-sm text-rose-100">{error}</div>}

        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#07162f]/90 shadow-2xl">
          <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="flex items-center gap-4">
              {participant?.avatar_url ? <img src={participant.avatar_url} alt="" className="h-20 w-20 rounded-2xl object-cover ring-2 ring-cyan-400/50"/> : <div className="grid h-20 w-20 place-items-center rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-700 text-xl font-black">{(participant?.nickname||"IQ").slice(0,2).toUpperCase()}</div>}
              <div>
                <p className="text-[10px] font-black uppercase tracking-[.18em] text-cyan-300">Akun Peserta</p>
                <h1 className="mt-1 text-3xl font-black sm:text-4xl">{participant?.nickname || "Peserta"}</h1>
                <p className="mt-2 text-sm text-slate-400">{[participant?.district_name,participant?.regency_name,participant?.province_name].filter(Boolean).join(" · ")}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <a href={testHref} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 text-sm font-black"><Play className="h-4 w-4"/>{testLabel}</a>
              <a href="/account" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-slate-200 hover:bg-white/10"><Settings className="h-4 w-4"/>Pengaturan akun</a>
            </div>
          </div>

          <div className="grid gap-3 border-t border-white/10 p-6 sm:grid-cols-2 sm:p-8 lg:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-white/[.04] p-4"><span className="text-xs text-slate-500">Total percobaan</span><strong className="mt-1 block text-3xl font-black">{attempts.length}x</strong></div>
            <div className="rounded-2xl border border-amber-300/15 bg-amber-300/[.06] p-4"><span className="text-xs text-amber-100/70">Personal Best</span><strong className="mt-1 block text-3xl font-black text-amber-200">{personalBest?.battle_score ? Number(personalBest.battle_score).toLocaleString("id-ID") : "—"}</strong><small className="text-slate-500">IQ {personalBest?.iq_estimate ?? "—"}</small></div>
            <div className="rounded-2xl border border-cyan-300/15 bg-cyan-300/[.06] p-4"><span className="text-xs text-cyan-100/70">Sisa gratis</span><strong className="mt-1 block text-3xl font-black">{freeRemaining}x</strong></div>
            <div className="rounded-2xl border border-violet-300/15 bg-violet-300/[.06] p-4"><span className="text-xs text-violet-100/70">Kredit Ranked</span><strong className="mt-1 block text-3xl font-black">{paidCredits}x</strong></div>
          </div>
        </section>

        <section id="riwayat-hasil" className="mt-7 rounded-[2rem] border border-white/10 bg-slate-950/40 p-5 shadow-xl sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-cyan-300"><History className="h-5 w-5"/><p className="text-[10px] font-black uppercase tracking-[.18em]">Hasil Tes & Riwayat Attempt</p></div>
              <h2 className="mt-2 text-2xl font-black">Semua percobaan tersimpan di akun Anda</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">Walaupun attempt nantinya banyak, tampilannya tidak akan memanjang ke bawah. Kartu dibuat sebagai carousel horizontal: geser untuk melihat attempt lama, sedangkan yang terbaru selalu muncul paling depan.</p>
            </div>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-300">{attempts.length} hasil tersimpan</span>
          </div>

          {attempts.length ? (
            <div className="mt-5 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 [scrollbar-color:rgba(148,163,184,.35)_transparent] [scrollbar-width:thin]">
              {attempts.map((item)=>{
                const paid=Number(item.attempt_number||0)>1
                return <article key={item.attempt_id || item.attempt_number} className="min-w-[280px] max-w-[320px] flex-[0_0_82vw] snap-start overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[.055] to-white/[.025] p-5 sm:flex-basis-[310px]">
                  <div className="flex items-start justify-between gap-3">
                    <div><p className="text-[10px] font-black uppercase tracking-[.14em] text-slate-500">Percobaan #{item.attempt_number ?? "—"}</p><p className="mt-1 text-xs font-bold text-slate-400">{paid?"Ranked berbayar":"Ranked gratis"}</p></div>
                    {item.is_personal_best ? <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/20 bg-amber-300/10 px-2 py-1 text-[9px] font-black uppercase text-amber-200"><Trophy className="h-3 w-3"/>PB</span> : null}
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div><span className="text-xs text-slate-500">IQ Battle</span><strong className="block text-3xl font-black">{item.iq_estimate ?? "—"}</strong></div>
                    <div><span className="text-xs text-slate-500">Battle Point</span><strong className="block text-3xl font-black text-cyan-300">{Number(item.battle_score||0).toLocaleString("id-ID")}</strong></div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    <span className="rounded-lg bg-white/5 px-3 py-2 text-slate-400">{item.correct_count ?? 0}/{item.question_count ?? 0} benar</span>
                    <span className="rounded-lg bg-white/5 px-3 py-2 text-slate-400">{formatDuration(item.duration_ms)}</span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {item.premium_unlocked ? <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2 py-1 text-[9px] font-black uppercase text-emerald-200"><CheckCircle2 className="h-3 w-3"/>Premium Aktif</span> : <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[9px] font-bold text-slate-500">Premium belum dibuka</span>}
                  </div>
                  <p className="mt-4 text-xs text-slate-500">{item.submitted_at ? new Date(item.submitted_at).toLocaleString("id-ID",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}) : ""}</p>
                  <div className="mt-5 grid gap-2">
                    <a href={item.attempt_id?`/result?attempt=${encodeURIComponent(item.attempt_id)}`:"/result"} className="rounded-xl bg-white px-4 py-2.5 text-center text-sm font-black text-slate-950">Lihat hasil percobaan</a>
                    {!item.premium_unlocked && item.attempt_id ? <a href={`/payment?product=premium_report&attempt=${encodeURIComponent(item.attempt_id)}`} className="inline-flex items-center justify-center gap-2 rounded-xl border border-violet-300/20 bg-violet-400/10 px-4 py-2.5 text-sm font-bold text-violet-200"><Sparkles className="h-4 w-4"/>Buka Premium · Rp5.000</a> : null}
                  </div>
                </article>
              })}
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-white/15 bg-white/[.025] p-8 text-center"><Crown className="mx-auto h-8 w-8 text-slate-500"/><p className="mt-3 font-black">Belum ada hasil tes</p><p className="mt-1 text-sm text-slate-500">Selesaikan percobaan pertama untuk mulai membangun riwayat performa Anda.</p></div>
          )}
        </section>

        <section className="mt-7 grid gap-4 sm:grid-cols-3">
          <a href="/account" className="rounded-2xl border border-white/10 bg-white/[.035] p-5 hover:bg-white/[.06]"><Settings className="h-5 w-5 text-cyan-300"/><p className="mt-3 font-black">Profil & Keamanan</p><p className="mt-1 text-sm text-slate-500">Nama Arena, avatar, password, dan identitas akun.</p></a>
          <a href="/payment?product=attempt_credit" className="rounded-2xl border border-white/10 bg-white/[.035] p-5 hover:bg-white/[.06]"><WalletCards className="h-5 w-5 text-violet-300"/><p className="mt-3 font-black">Kredit Ranked</p><p className="mt-1 text-sm text-slate-500">Tambah percobaan kompetitif setelah kuota gratis habis.</p></a>
          <a href="/battle-test" className="rounded-2xl border border-white/10 bg-white/[.035] p-5 hover:bg-white/[.06]"><Play className="h-5 w-5 text-emerald-300"/><p className="mt-3 font-black">Tes Kemampuan</p><p className="mt-1 text-sm text-slate-500">Mulai atau lanjutkan attempt yang tersedia.</p></a>
        </section>
      </div>
    </main>
  )
}
