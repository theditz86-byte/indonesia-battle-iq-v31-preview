"use client"

import { useEffect, useMemo, useState } from "react"
import { BATTLE_API_URL, PARTICIPANT_TOKEN_KEY, formatDuration } from "@/lib/battle"
import { ArrowLeft, BrainCircuit, CheckCircle2, Crown, History, Play, Settings, Share2, Trophy } from "lucide-react"
import { VisualIqCertificateModal } from "@/components/visual-iq-certificate"
import type { VisualIqRankItem } from "@/components/visual-iq-leaderboard"

const ACCOUNT_API = "https://efndozplpwyemzgqfnep.supabase.co/functions/v1/battle-account"
const VISUAL_IQ_API = "https://efndozplpwyemzgqfnep.supabase.co/functions/v1/battle-visual-iq"

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

type VisualIqItem = {
  id?: string
  iq_estimate?: number
  correct_count?: number
  question_count?: number
  duration_ms?: number
  breakdown?: Record<string, unknown>
  created_at?: string
}

function iqLevelFor(iq:number){
  if(iq>=140)return "Genius"
  if(iq>=130)return "Sangat Superior"
  if(iq>=120)return "Superior"
  if(iq>=110)return "Di Atas Rata-rata"
  if(iq>=90)return "Rata-rata"
  if(iq>=80)return "Rata-rata Rendah"
  return "Di Bawah Rata-rata"
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
  if(!response.ok) throw new Error(data?.error || "Riwayat tes belum dapat dimuat.")
  return data?.data as ResultHistory
}

async function visualIqHistoryApi(token:string) {
  const response=await fetch(VISUAL_IQ_API,{
    method:"POST",
    headers:{"Content-Type":"application/json","X-Battle-Token":token},
    body:JSON.stringify({action:"history",limit:40}),
  })
  const data=await response.json().catch(()=>({}))
  if(!response.ok) throw new Error(data?.error || "Riwayat Tes IQ belum dapat dimuat.")
  return Array.isArray(data?.items) ? data.items as VisualIqItem[] : []
}

async function visualIqRankingApi(token:string) {
  const response=await fetch(VISUAL_IQ_API,{
    method:"POST",
    headers:{"Content-Type":"application/json","X-Battle-Token":token},
    body:JSON.stringify({action:"leaderboard",scope:"national",limit:50}),
  })
  const data=await response.json().catch(()=>({}))
  if(!response.ok) return null
  return (data?.me || null) as VisualIqRankItem|null
}

export default function AccountResultsPage(){
  const [participant,setParticipant]=useState<Participant|null>(null)
  const [history,setHistory]=useState<ResultHistory|null>(null)
  const [visualHistory,setVisualHistory]=useState<VisualIqItem[]>([])
  const [visualRankingMe,setVisualRankingMe]=useState<VisualIqRankItem|null>(null)
  const [certificateItem,setCertificateItem]=useState<VisualIqItem|null>(null)
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState("")

  useEffect(()=>{
    const token=localStorage.getItem(PARTICIPANT_TOKEN_KEY) || ""
    if(!token){
      window.location.replace("/account")
      return
    }
    Promise.all([accountApi(token),resultApi(token),visualIqHistoryApi(token).catch(()=>[]),visualIqRankingApi(token).catch(()=>null)])
      .then(([account,result,visualIq,visualRank])=>{
        setParticipant(account?.participant || null)
        setHistory(result || null)
        setVisualHistory(visualIq)
        setVisualRankingMe(visualRank)
      })
      .catch((e)=>setError(e instanceof Error?e.message:"Riwayat tes belum dapat dimuat."))
      .finally(()=>setLoading(false))
  },[])

  const attempts=useMemo(()=>[...(history?.attempts || [])].sort((a,b)=>Number(b.attempt_number||0)-Number(a.attempt_number||0)),[history?.attempts])
  const personalBest=attempts.find((item)=>item.is_personal_best) || attempts.slice().sort((a,b)=>Number(b.battle_score||0)-Number(a.battle_score||0))[0]
  const visualBest=visualHistory.slice().sort((a,b)=>Number(b.iq_estimate||0)-Number(a.iq_estimate||0))[0]
  const used=Math.max(0,Number(participant?.attempts_used)||attempts.length)
  const freeRemaining=Math.max(0,Number(participant?.free_attempts_remaining ?? 3-used)||0)
  const active=Boolean(participant?.active_attempt_id)
  const testHref=active || freeRemaining>0 ? "/battle-test" : "/battle#peringkat"
  const testLabel=active ? "Lanjutkan Ranked" : freeRemaining>0 ? `Mulai Ranked · sisa ${freeRemaining}x` : "3 Ranked season ini sudah digunakan"

  async function shareVisualResult(item:VisualIqItem){
    const iq=Number(item.iq_estimate||0)
    const correct=Number(item.correct_count||0)
    const total=Number(item.question_count||35)
    const accuracy=total>0?Math.round((correct/total)*100):0
    const level=iqLevelFor(iq)
    const when=item.created_at?new Date(item.created_at).toLocaleDateString("id-ID",{day:"2-digit",month:"long",year:"numeric"}):""
    const url=window.location.origin+"/visual-iq/"
    const text=[
      "🧠 Hasil Tes IQ ALZAVA",
      `Estimasi IQ: ${iq}`,
      `Tingkat IQ: ${level}`,
      `${correct}/${total} benar · ${accuracy}% akurasi · ${formatDuration(item.duration_ms)}`,
      when?`Tanggal: ${when}`:"",
      "",
      "Berani kalahkan hasilku?",
      url,
    ].filter(Boolean).join("\n")

    if(navigator.share){
      await navigator.share({title:"Hasil Tes IQ ALZAVA",text,url})
      return "Hasil siap dibagikan."
    }
    if(navigator.clipboard){
      await navigator.clipboard.writeText(text)
      return "Hasil disalin. Tempelkan ke WhatsApp atau media sosial."
    }
    return "Bagikan hasil dari perangkat yang mendukung fitur berbagi."
  }

  if(loading) return <main className="grid min-h-screen place-items-center bg-[#020817] text-slate-300">Memuat riwayat tes…</main>

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_10%_0%,rgba(79,70,229,.24),transparent_34rem),radial-gradient(circle_at_90%_8%,rgba(6,182,212,.14),transparent_30rem),linear-gradient(180deg,#020617_0%,#07142e_48%,#020617_100%)] text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#020817]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4">
          <a href="/battle" className="flex items-center gap-3">
            <img src="/brand/alvaza-logo-new.svg" alt="ALZAVA Battle Point" className="h-10 w-10 object-contain"/>
            <div><p className="font-black">ALZAVA <span className="text-[#D4AF37]">Battle Point</span></p><p className="text-[10px] uppercase tracking-[.14em] text-slate-500">Riwayat Tes</p></div>
          </a>
          <a href="/battle" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-slate-300 hover:bg-white/10"><ArrowLeft className="h-4 w-4"/>Beranda</a>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:py-10">
        {error && <div className="mb-6 rounded-2xl border border-rose-400/25 bg-rose-400/10 p-4 text-sm text-rose-100">{error}</div>}

        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#07162f]/90 shadow-2xl">
          <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="flex items-center gap-4">
              {participant?.avatar_url ? <img src={participant.avatar_url} alt="" className="h-20 w-20 rounded-2xl object-cover ring-2 ring-cyan-400/50"/> : <div className="grid h-20 w-20 place-items-center rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-700 text-xl font-black">{(participant?.nickname||"BP").slice(0,2).toUpperCase()}</div>}
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
            <div className="rounded-2xl border border-amber-300/15 bg-amber-300/[.06] p-4"><span className="text-xs text-amber-100/70">Personal Best</span><strong className="mt-1 block text-3xl font-black text-amber-200">{personalBest?.battle_score ? Number(personalBest.battle_score).toLocaleString("id-ID") : "—"}</strong><small className="text-slate-500">{personalBest?.question_count ? Math.round((Number(personalBest.correct_count||0)/Number(personalBest.question_count))*100) : "—"}% akurasi</small></div>
            <div className="rounded-2xl border border-cyan-300/15 bg-cyan-300/[.06] p-4"><span className="text-xs text-cyan-100/70">Sisa gratis</span><strong className="mt-1 block text-3xl font-black">{freeRemaining}x</strong></div>
            <div className="rounded-2xl border border-violet-300/15 bg-violet-300/[.06] p-4"><span className="text-xs text-violet-100/70">Kuota Ranked</span><strong className="mt-1 block text-3xl font-black">3x</strong></div>
          </div>
        </section>

        <section id="riwayat-iq" className="mt-7 rounded-[2rem] border border-cyan-300/15 bg-gradient-to-br from-cyan-400/[.06] via-violet-400/[.04] to-slate-950/45 p-5 shadow-xl sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-cyan-300"><BrainCircuit className="h-5 w-5"/><p className="text-[10px] font-black uppercase tracking-[.18em]">Riwayat Tes IQ</p></div>
              <h2 className="mt-2 text-2xl font-black">Estimasi IQ tersimpan di akun</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">Setiap tes selesai direkam bersama jumlah benar, waktu, dan tanggal. Nilai tertinggi Tes IQ dibatasi maksimal 150.</p>
            </div>
            <div className="flex items-center gap-2">
              {visualBest?.iq_estimate ? <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1.5 text-xs font-black text-amber-200">Best IQ {visualBest.iq_estimate}</span> : null}
              <a href="/visual-iq?view=ranking" className="rounded-full border border-violet-300/20 bg-violet-300/10 px-3 py-1.5 text-xs font-black text-violet-100">Ranking IQ</a>
              <a href="/visual-iq" className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-xs font-black text-cyan-100">Tes lagi</a>
            </div>
          </div>

          {visualHistory.length ? (
            <div className="mt-5 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 [scrollbar-color:rgba(148,163,184,.35)_transparent] [scrollbar-width:thin]">
              {visualHistory.map((item,index)=>{
                const accuracy=Number(item.question_count||0)>0?Math.round((Number(item.correct_count||0)/Number(item.question_count||1))*100):0
                return <button type="button" key={item.id || index} onClick={()=>setCertificateItem(item)} className="group min-w-[260px] max-w-[300px] flex-[0_0_78vw] snap-start rounded-2xl border border-cyan-300/15 bg-[#07162f]/90 p-5 text-left transition hover:border-cyan-300/35 hover:bg-[#0a1b39] focus:outline-none focus:ring-2 focus:ring-cyan-300/45 sm:flex-basis-[290px]">
                  <div className="flex items-start justify-between gap-3">
                    <div><p className="text-[10px] font-black uppercase tracking-[.14em] text-cyan-300">Tes IQ</p><p className="mt-1 text-xs font-bold text-slate-500">Percobaan {visualHistory.length-index}</p></div>
                    {Number(item.iq_estimate||0)===Number(visualBest?.iq_estimate||-1) ? <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/20 bg-amber-300/10 px-2 py-1 text-[9px] font-black uppercase text-amber-200"><Trophy className="h-3 w-3"/>TERBAIK</span> : null}
                  </div>
                  <div className="mt-4 text-sm font-bold text-slate-400">Estimasi IQ</div>
                  <div className="mt-1 bg-gradient-to-r from-cyan-300 to-violet-300 bg-clip-text text-5xl font-black text-transparent">{item.iq_estimate ?? "—"}</div>
                  {item.iq_estimate ? <div className="mt-2 inline-flex rounded-full border border-cyan-300/15 bg-cyan-300/[.07] px-2.5 py-1 text-[10px] font-black text-cyan-100">Tingkat IQ · {iqLevelFor(Number(item.iq_estimate))}</div> : null}
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    <span className="rounded-lg bg-white/5 px-3 py-2 text-slate-300">{item.correct_count ?? 0}/{item.question_count ?? 35} benar · {accuracy}%</span>
                    <span className="rounded-lg bg-white/5 px-3 py-2 text-slate-300">{formatDuration(item.duration_ms)}</span>
                  </div>
                  <p className="mt-4 text-xs text-slate-500">{item.created_at ? new Date(item.created_at).toLocaleString("id-ID",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}) : ""}</p>
                  <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/10 pt-3 text-[10px] font-black uppercase tracking-[.08em] text-cyan-300">
                    <span>Klik untuk detail</span>
                    <span className="inline-flex items-center gap-1 text-slate-400 transition group-hover:text-cyan-200"><Share2 className="h-3.5 w-3.5"/>Bagikan</span>
                  </div>
                </button>
              })}
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-cyan-300/15 bg-white/[.025] p-7 text-center">
              <BrainCircuit className="mx-auto h-8 w-8 text-cyan-300/60"/>
              <p className="mt-3 font-black">Belum ada riwayat Tes IQ</p>
              <p className="mt-1 text-sm text-slate-500">Mulai tes pertama; hasil akan otomatis tersimpan setelah selesai.</p>
            </div>
          )}
        </section>

        <section id="riwayat-hasil" className="mt-7 rounded-[2rem] border border-white/10 bg-slate-950/40 p-5 shadow-xl sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-cyan-300"><History className="h-5 w-5"/><p className="text-[10px] font-black uppercase tracking-[.18em]">Hasil & Riwayat Tes</p></div>
              <h2 className="mt-2 text-2xl font-black">Semua percobaan tersimpan di akun Anda</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">Walaupun riwayat tes nantinya banyak, tampilannya tidak akan memanjang ke bawah. Kartu dibuat sebagai carousel horizontal: geser untuk melihat tes lama, sedangkan hasil terbaru selalu muncul paling depan.</p>
            </div>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-300">{attempts.length} hasil tersimpan</span>
          </div>

          {attempts.length ? (
            <div className="mt-5 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 [scrollbar-color:rgba(148,163,184,.35)_transparent] [scrollbar-width:thin]">
              {attempts.map((item)=>{
                const legacy=Number(item.attempt_number||0)>3
                return <article key={item.attempt_id || item.attempt_number} className="min-w-[280px] max-w-[320px] flex-[0_0_82vw] snap-start overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[.055] to-white/[.025] p-5 sm:flex-basis-[310px]">
                  <div className="flex items-start justify-between gap-3">
                    <div><p className="text-[10px] font-black uppercase tracking-[.14em] text-slate-500">Percobaan #{item.attempt_number ?? "—"}</p><p className="mt-1 text-xs font-bold text-slate-400">{legacy?"Arsip lama":"Ranked resmi"}</p></div>
                    {item.is_personal_best ? <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/20 bg-amber-300/10 px-2 py-1 text-[9px] font-black uppercase text-amber-200"><Trophy className="h-3 w-3"/>PB</span> : null}
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div><span className="text-xs text-slate-500">Jawaban benar</span><strong className="block text-3xl font-black">{item.correct_count ?? 0}/{item.question_count ?? 0}</strong></div>
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
                  </div>
                </article>
              })}
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-white/15 bg-white/[.025] p-8 text-center"><Crown className="mx-auto h-8 w-8 text-slate-500"/><p className="mt-3 font-black">Belum ada hasil tes</p><p className="mt-1 text-sm text-slate-500">Selesaikan percobaan pertama untuk mulai membangun riwayat performa Anda.</p></div>
          )}
        </section>

        <section className="mt-7 grid gap-4 sm:grid-cols-3">
          <a href="/account" className="rounded-2xl border border-white/10 bg-white/[.035] p-5 hover:bg-white/[.06]"><Settings className="h-5 w-5 text-cyan-300"/><p className="mt-3 font-black">Profil & Keamanan</p><p className="mt-1 text-sm text-slate-500">Nama panggilan, avatar, password, dan identitas akun.</p></a>
          <a href="/battle-test" className="rounded-2xl border border-white/10 bg-white/[.035] p-5 hover:bg-white/[.06]"><Play className="h-5 w-5 text-violet-300"/><p className="mt-3 font-black">Ranked Battle</p><p className="mt-1 text-sm text-slate-500">Gunakan maksimal 3 kesempatan resmi; skor terbaik menentukan leaderboard season.</p></a>
          <a href="/latihan-skd" className="rounded-2xl border border-white/10 bg-white/[.035] p-5 hover:bg-white/[.06]"><Play className="h-5 w-5 text-emerald-300"/><p className="mt-3 font-black">Latihan SKD</p><p className="mt-1 text-sm text-slate-500">Latihan TWK, TIU, dan TKP serta simulasi Mini SKD tanpa memengaruhi Ranked Battle.</p></a>
        </section>
      </div>
      {certificateItem&&<VisualIqCertificateModal
        open={Boolean(certificateItem)}
        onClose={()=>setCertificateItem(null)}
        onShareResult={()=>shareVisualResult(certificateItem)}
        data={{
          participantName:participant?.nickname||"Peserta ALZAVA",
          iqScore:Number(certificateItem.iq_estimate||70),
          iqLevel:iqLevelFor(Number(certificateItem.iq_estimate||70)),
          createdAt:certificateItem.created_at,
          attemptId:certificateItem.id,
          rank:visualRankingMe&&visualRankingMe.attempt_id===certificateItem.id?visualRankingMe.rank:null,
          total:visualRankingMe&&visualRankingMe.attempt_id===certificateItem.id?visualRankingMe.total:null,
          percentile:visualRankingMe&&visualRankingMe.attempt_id===certificateItem.id?visualRankingMe.percentile:null,
        }}
      />}
    </main>
  )
}
