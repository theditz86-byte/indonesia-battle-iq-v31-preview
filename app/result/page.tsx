"use client"

import { useEffect, useMemo, useState } from "react"
import { ArrowLeft, BarChart3, CheckCircle2, Crown, Download, LockKeyhole, Share2, Sparkles, Trophy } from "lucide-react"
import { BATTLE_API_URL, getParticipantToken } from "@/lib/battle"

type DomainDetail = { index?: number; correct?: number; total?: number }

type LatestResult = {
  participant_public_id?: string
  nickname?: string
  province_name?: string
  regency_name?: string
  district_name?: string
  premium_unlocked?: boolean
  leaderboard_total?: number
  result?: {
    attempt_id?: string
    attempt_number?: number
    ranked_attempt?: boolean
    battle_score?: number
    correct_count?: number
    question_count?: number
    duration_ms?: number
    iq_estimate?: number
    iq_low?: number
    iq_high?: number
    domain_scores?: Record<string,DomainDetail>
    submitted_at?: string
    best_score?: number
    national_rank?: number
  } | null
}

const labels: Record<string,string> = {
  fluid: "Logika & Numerik",
  verbal: "Penalaran Verbal",
  visual: "Spasial & Visual",
  memory: "Memori Kerja",
  speed: "Kecepatan Nalar",
}

const descriptions: Record<string,string> = {
  fluid: "Kemampuan menemukan pola, mengolah angka, dan menarik kesimpulan logis.",
  verbal: "Kemampuan memahami hubungan konsep, informasi, dan kesimpulan berbasis bahasa.",
  visual: "Kemampuan memahami arah, bentuk, rotasi, dan hubungan spasial.",
  memory: "Kemampuan mempertahankan dan memanipulasi informasi dalam waktu singkat.",
  speed: "Kemampuan menyelesaikan persoalan terstruktur dengan cepat dan akurat.",
}

function formatDuration(ms?: number) {
  const total = Math.max(0, Math.round((Number(ms)||0)/1000))
  const min = Math.floor(total/60)
  const sec = total%60
  return `${min}m ${String(sec).padStart(2,"0")}d`
}

async function post(body: Record<string,unknown>) {
  const token = getParticipantToken()
  const response = await fetch(BATTLE_API_URL, {
    method:"POST",
    headers:{ "Content-Type":"application/json", ...(token ? {"X-Battle-Token":token} : {}) },
    body:JSON.stringify(body),
  })
  const data = await response.json().catch(()=>({}))
  if(!response.ok) throw new Error(data?.error || "Data belum dapat dimuat.")
  return data
}

async function track(event_type:string, details:Record<string,unknown>={}) {
  try { await post({action:"track",event_type,details}) } catch {}
}

export default function ResultPage() {
  const [data,setData]=useState<LatestResult|null>(null)
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState("")
  const [copied,setCopied]=useState(false)

  useEffect(()=>{
    if(!getParticipantToken()){
      window.location.replace("/account")
      return
    }
    post({action:"latest_result"})
      .then((r)=>{
        const payload=r.data as LatestResult
        setData(payload)
        void track("result_viewed",{has_result:Boolean(payload?.result)})
        if(payload?.result && !payload?.premium_unlocked) void track("premium_offer_viewed",{attempt_id:payload.result.attempt_id})
      })
      .catch((e)=>setError(e instanceof Error?e.message:"Hasil belum dapat dimuat."))
      .finally(()=>setLoading(false))
  },[])

  const result=data?.result
  const domains=useMemo(()=>{
    const source=result?.domain_scores || {}
    return Object.entries(source)
      .map(([key,value])=>({key,label:labels[key]||key,description:descriptions[key]||"",...value,index:Number(value?.index)||0}))
      .sort((a,b)=>b.index-a.index)
  },[result?.domain_scores])

  const topPercent = result?.national_rank && data?.leaderboard_total
    ? Math.max(1,Math.ceil((result.national_rank/data.leaderboard_total)*100))
    : null

  const strength=domains[0]
  const development=domains[domains.length-1]

  async function share() {
    if(!data?.participant_public_id || !result) return
    const url=`${window.location.origin}/challenge?id=${encodeURIComponent(data.participant_public_id)}`
    const text=`${data.nickname || "Saya"} meraih Estimasi IQ Battle ${result.iq_estimate ?? "—"} dan peringkat nasional #${result.national_rank ?? "—"} di Indonesia Battle IQ. Berani mengalahkan skor ini?`
    void track("share_clicked",{attempt_id:result.attempt_id,national_rank:result.national_rank})
    try{
      if(navigator.share){
        await navigator.share({title:"Tantangan Indonesia Battle IQ",text,url})
      }else{
        await navigator.clipboard.writeText(text+" "+url)
        setCopied(true)
        setTimeout(()=>setCopied(false),1800)
      }
    }catch{}
  }

  function openPremium() {
    if(result) void track("premium_checkout_opened",{attempt_id:result.attempt_id})
    window.location.href="/payment?product=premium_report"
  }

  if(loading) return <main className="grid min-h-screen place-items-center bg-[#020817] text-slate-300">Memuat hasil Battle IQ…</main>

  if(error || !data) return <main className="grid min-h-screen place-items-center bg-[#020817] px-5 text-white"><div className="max-w-xl rounded-3xl border border-rose-400/20 bg-rose-500/10 p-7 text-center"><p>{error || "Hasil belum tersedia."}</p><a href="/battle" className="mt-5 inline-flex rounded-xl bg-indigo-600 px-5 py-3 font-black">Kembali ke Battle</a></div></main>

  if(!result) return <main className="grid min-h-screen place-items-center bg-[#020817] px-5 text-white"><div className="max-w-xl rounded-3xl border border-white/10 bg-white/5 p-8 text-center"><BarChart3 className="mx-auto h-10 w-10 text-cyan-300"/><h1 className="mt-4 text-2xl font-black">Belum ada hasil pada season ini</h1><p className="mt-2 text-slate-400">Selesaikan tes untuk melihat skor dan posisi Anda.</p><a href="/battle-test" className="mt-6 inline-flex rounded-xl bg-indigo-600 px-5 py-3 font-black">Mulai Tes</a></div></main>

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_15%_0%,rgba(68,100,255,.2),transparent_30rem),radial-gradient(circle_at_90%_10%,rgba(34,211,238,.1),transparent_28rem),linear-gradient(180deg,#020817,#07142f_55%,#030817)] px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
          <a href="/battle" className="inline-flex items-center gap-2 text-sm font-bold text-slate-300 hover:text-white"><ArrowLeft className="h-4 w-4"/>Kembali ke Battle</a>
          <div className="flex gap-2">
            <button onClick={share} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-black"><Share2 className="h-4 w-4"/>{copied?"Tautan disalin":"Tantang Teman"}</button>
            {data.premium_unlocked && <button onClick={()=>window.print()} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-black text-slate-950"><Download className="h-4 w-4"/>Simpan PDF</button>}
          </div>
        </div>

        <section className="print-report overflow-hidden rounded-[2rem] border border-white/10 bg-[#091a38]/90 shadow-2xl">
          <div className="border-b border-white/10 bg-gradient-to-r from-indigo-600/20 via-cyan-500/10 to-transparent p-6 sm:p-9">
            <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[.2em] text-cyan-300">Hasil Indonesia Battle IQ</p>
                <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-6xl">{data.nickname || "Peserta"}</h1>
                <p className="mt-3 text-sm text-slate-400">{[data.district_name,data.regency_name,data.province_name].filter(Boolean).join(" · ")}</p>
                {result.ranked_attempt===false && <span className="mt-4 inline-flex rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1.5 text-xs font-black text-amber-200">PRACTICE RESULT — tidak mengubah leaderboard</span>}
              </div>
              <div className="rounded-3xl border border-cyan-300/20 bg-slate-950/45 px-7 py-5 text-center">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Estimasi IQ Battle</span>
                <strong className="mt-1 block text-6xl font-black text-white">{result.iq_estimate ?? "—"}</strong>
                <span className="text-xs text-slate-500">Rentang {result.iq_low ?? "—"}–{result.iq_high ?? "—"}</span>
              </div>
            </div>
          </div>

          <div className="grid gap-4 p-6 sm:grid-cols-2 sm:p-9 lg:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-5"><span className="text-xs text-slate-400">Battle Score</span><strong className="mt-1 block text-3xl font-black text-cyan-300">{Number(result.battle_score||0).toLocaleString("id-ID")}</strong></div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-5"><span className="text-xs text-slate-400">Ketepatan</span><strong className="mt-1 block text-3xl font-black">{result.correct_count ?? 0}/{result.question_count ?? 0}</strong></div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-5"><span className="text-xs text-slate-400">Peringkat Nasional</span><strong className="mt-1 block text-3xl font-black">#{result.national_rank ?? "—"}</strong></div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-5"><span className="text-xs text-slate-400">Waktu</span><strong className="mt-1 block text-3xl font-black">{formatDuration(result.duration_ms)}</strong></div>
          </div>

          {topPercent && <div className="mx-6 mb-6 rounded-2xl border border-indigo-300/20 bg-indigo-400/10 px-5 py-4 text-sm text-indigo-100 sm:mx-9 sm:mb-9"><Trophy className="mr-2 inline h-5 w-5 text-yellow-300"/>Posisi saat ini setara <b>Top {topPercent}%</b> dari peserta yang sudah tercatat pada leaderboard season ini.</div>}

          {!data.premium_unlocked ? (
            <section className="relative mx-6 mb-8 overflow-hidden rounded-3xl border border-fuchsia-300/20 bg-gradient-to-br from-indigo-500/15 via-violet-500/10 to-fuchsia-500/10 p-6 sm:mx-9 sm:p-8">
              <div className="absolute right-5 top-5"><LockKeyhole className="h-8 w-8 text-violet-300"/></div>
              <p className="text-xs font-black uppercase tracking-[.2em] text-violet-300">Laporan Premium</p>
              <h2 className="mt-3 max-w-2xl text-3xl font-black">Jangan berhenti di satu angka. Ketahui pola kemampuan Anda.</h2>
              <p className="mt-3 max-w-3xl leading-7 text-slate-300">Buka profil kemampuan per domain, kekuatan utama, area pengembangan, rekomendasi latihan, ringkasan yang dapat disimpan sebagai PDF, serta kartu hasil lengkap.</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {["Analisis domain kemampuan","Kekuatan & area pengembangan","Rekomendasi latihan personal","Laporan premium siap simpan PDF"].map((item)=><div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/30 p-4 text-sm font-bold"><CheckCircle2 className="h-5 w-5 text-emerald-300"/>{item}</div>)}
              </div>
              <button onClick={openPremium} className="no-print mt-7 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-6 py-3.5 font-black shadow-[0_0_30px_rgba(168,85,247,.28)]"><Crown className="h-5 w-5"/>Buka Laporan Premium · Rp9.900</button>
            </section>
          ) : (
            <section className="mx-6 mb-8 sm:mx-9">
              <div className="mb-5 flex items-center gap-3"><Sparkles className="h-6 w-6 text-violet-300"/><div><p className="text-xs font-black uppercase tracking-[.18em] text-violet-300">Laporan Premium Aktif</p><h2 className="text-2xl font-black">Profil Kemampuan</h2></div></div>
              <div className="grid gap-4">
                {domains.map((domain)=>(
                  <article key={domain.key} className="rounded-2xl border border-white/10 bg-slate-950/35 p-5">
                    <div className="flex items-center justify-between gap-3"><div><h3 className="font-black">{domain.label}</h3><p className="mt-1 text-sm leading-6 text-slate-400">{domain.description}</p></div><strong className="text-2xl font-black text-cyan-300">{domain.index}</strong></div>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500" style={{width:`${Math.max(2,Math.min(100,domain.index))}%`}}/></div>
                    <p className="mt-2 text-xs text-slate-500">{domain.correct ?? 0} benar dari {domain.total ?? 0} soal pada domain ini</p>
                  </article>
                ))}
              </div>
              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <article className="rounded-3xl border border-emerald-300/20 bg-emerald-400/10 p-6"><p className="text-xs font-black uppercase tracking-widest text-emerald-300">Kekuatan Utama</p><h3 className="mt-2 text-2xl font-black">{strength?.label || "Penalaran umum"}</h3><p className="mt-2 leading-7 text-emerald-50/80">{strength ? `Skor indeks ${strength.index}. Area ini menjadi kekuatan relatif Anda pada tes saat ini. Pertahankan dengan latihan berkala dan soal yang makin kompleks.` : "Pertahankan konsistensi latihan dan evaluasi hasil pada season berikutnya."}</p></article>
                <article className="rounded-3xl border border-amber-300/20 bg-amber-300/10 p-6"><p className="text-xs font-black uppercase tracking-widest text-amber-300">Area Pengembangan</p><h3 className="mt-2 text-2xl font-black">{development?.label || "Konsistensi"}</h3><p className="mt-2 leading-7 text-amber-50/80">{development ? `Skor indeks ${development.index}. Prioritaskan latihan bertahap pada area ini, mulai dari akurasi lalu kecepatan.` : "Fokuskan latihan pada kesalahan yang paling sering berulang."}</p></article>
              </div>
              <article className="mt-4 rounded-3xl border border-white/10 bg-white/5 p-6"><p className="text-xs font-black uppercase tracking-widest text-cyan-300">Rekomendasi Latihan</p><p className="mt-3 leading-7 text-slate-300">Gunakan siklus 20–30 menit: 10 menit latihan domain terendah, 10 menit soal numerik/logika campuran, lalu 5–10 menit evaluasi kesalahan. Ulangi 3–4 kali per minggu dan bandingkan hasil antar-season, bukan hanya satu skor.</p></article>
            </section>
          )}

          <div className="border-t border-white/10 px-6 py-5 text-xs leading-5 text-slate-500 sm:px-9">
            Estimasi IQ Battle adalah indikator performa pada sistem Indonesia Battle IQ dan bukan diagnosis psikologis, hasil psikotes klinis, atau pengganti asesmen oleh psikolog berwenang.
          </div>
        </section>
      </div>
    </main>
  )
}
