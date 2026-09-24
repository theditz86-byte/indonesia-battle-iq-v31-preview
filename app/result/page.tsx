"use client"

import { useEffect, useMemo, useState } from "react"
import {
  ArrowLeft,
  Brain,
  CheckCircle2,
  Crown,
  Download,
  Gauge,
  Lightbulb,
  LockKeyhole,
  Medal,
  Rocket,
  Share2,
  ShieldCheck,
  Sparkles,
  Target,
  Timer,
  Trophy,
  Zap,
} from "lucide-react"
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
  selected_attempt_id?: string | null
  attempts?: Array<{
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
  }>
  result?: {
    attempt_id?: string
    attempt_number?: number
    ranked_attempt?: boolean
    paid_attempt?: boolean
    is_personal_best?: boolean
    battle_score?: number
    correct_count?: number
    question_count?: number
    core_question_count?: number
    high_range_attempted?: boolean
    high_range_question_count?: number
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

type DomainView = DomainDetail & {
  key: string
  label: string
  short: string
  description: string
  index: number
}

const labels: Record<string,string> = {
  fluid: "Logika & Numerik",
  verbal: "Penalaran Verbal",
  visual: "Spasial & Visual",
  memory: "Memori Kerja",
  speed: "Kecepatan Nalar",
}

const shortLabels: Record<string,string> = {
  fluid: "Logika",
  verbal: "Verbal",
  visual: "Visual",
  memory: "Memori",
  speed: "Kecepatan",
}

const descriptions: Record<string,string> = {
  fluid: "Mendeteksi pola, mengolah angka, membandingkan informasi, dan menyelesaikan masalah baru secara logis.",
  verbal: "Memahami hubungan konsep, menarik kesimpulan dari informasi tertulis, dan mengenali struktur argumen.",
  visual: "Membayangkan perubahan bentuk, arah, rotasi, posisi, dan hubungan spasial tanpa bantuan benda nyata.",
  memory: "Mempertahankan informasi singkat sambil mengolahnya untuk menyelesaikan tugas.",
  speed: "Menjaga ketepatan ketika keputusan harus dibuat dalam waktu terbatas.",
}

const iqReferenceBands = [
  {min:-Infinity,max:69,range:"≤69",label:"Extremely Low",id:"Sangat rendah"},
  {min:70,max:79,range:"70–79",label:"Very Low",id:"Rendah"},
  {min:80,max:89,range:"80–89",label:"Low Average",id:"Rata-rata bawah"},
  {min:90,max:109,range:"90–109",label:"Average",id:"Rata-rata"},
  {min:110,max:119,range:"110–119",label:"High Average",id:"Rata-rata atas"},
  {min:120,max:129,range:"120–129",label:"Very High",id:"Sangat tinggi"},
  {min:130,max:149,range:"130–149",label:"Extremely High",id:"Ekstrem tinggi"},
  {min:150,max:Infinity,range:"150+",label:"Extremely High",id:"Ekstrem tinggi · 3,3 SD+"},
] as const

const domainMeaning: Record<string,{strength:string;application:string;growth:string}> = {
  fluid: {
    strength: "Anda relatif cepat menemukan struktur tersembunyi, hubungan angka, dan aturan yang tidak dinyatakan secara langsung.",
    application: "Kekuatan ini biasanya terasa saat memecahkan masalah baru, membaca data, membuat prioritas, atau membandingkan beberapa alternatif.",
    growth: "Naikkan level latihan dengan soal multi-langkah, data yang tidak rapi, dan masalah yang membutuhkan dua atau tiga aturan sekaligus.",
  },
  verbal: {
    strength: "Anda relatif kuat menangkap makna, hubungan konsep, implikasi kalimat, dan konsistensi sebuah argumen.",
    application: "Kekuatan ini membantu saat membaca dokumen panjang, menyaring inti informasi, menyusun alasan, dan menjelaskan keputusan.",
    growth: "Latih argumen dengan premis yang lebih kompleks, analogi tingkat lanjut, serta bacaan singkat dengan informasi pengalih.",
  },
  visual: {
    strength: "Anda relatif kuat membentuk gambaran mental, membaca orientasi, serta melihat transformasi posisi dan bentuk.",
    application: "Kekuatan ini berguna ketika informasi disajikan sebagai diagram, tata letak, peta proses, pola, atau hubungan ruang.",
    growth: "Gunakan latihan rotasi bertingkat, matriks figural, dan transformasi dua tahap untuk memperluas fleksibilitas spasial.",
  },
  memory: {
    strength: "Anda mampu menahan beberapa potongan informasi sekaligus saat melakukan operasi mental.",
    application: "Ini mendukung tugas berurutan, mengikuti instruksi multi-tahap, dan mengolah informasi tanpa sering kembali ke sumber.",
    growth: "Latih chunking, recall terbalik, dan operasi mental singkat dengan gangguan waktu.",
  },
  speed: {
    strength: "Anda mampu bergerak cepat tanpa kehilangan terlalu banyak akurasi.",
    application: "Ini mendukung situasi dengan banyak keputusan kecil, penyaringan informasi, dan target waktu ketat.",
    growth: "Gunakan latihan interval: cepat pada item mudah, lalu alokasikan waktu lebih besar pada item kompleks.",
  },
}

function clamp(value:number,min=0,max=100){ return Math.max(min,Math.min(max,value)) }

function formatDuration(ms?: number) {
  const total = Math.max(0, Math.round((Number(ms)||0)/1000))
  const min = Math.floor(total/60)
  const sec = total%60
  return min + "m " + String(sec).padStart(2,"0") + "d"
}

function levelLabel(index:number) {
  if(index>=90) return "Sangat menonjol"
  if(index>=80) return "Kuat"
  if(index>=70) return "Baik"
  if(index>=60) return "Cukup"
  return "Perlu diperkuat"
}

function iqTier(iq:number) {
  if(iq>=145) return "Rentang sangat tinggi"
  if(iq>=130) return "Rentang tinggi"
  if(iq>=115) return "Di atas rerata"
  if(iq>=85) return "Rentang rerata"
  if(iq>=70) return "Di bawah rerata"
  return "Rentang rendah"
}

function signatureFor(domains:DomainView[]) {
  if(!domains.length) return {title:"Pemecah Masalah Adaptif",tag:"Adaptive Solver",text:"Profil Anda menunjukkan kombinasi kemampuan yang perlu dibaca bersama dengan akurasi dan tempo pengerjaan."}
  const values=domains.map(d=>d.index)
  const spread=Math.max(...values)-Math.min(...values)
  if(spread<=8) return {
    title:"Strategis Seimbang",
    tag:"Balanced Strategist",
    text:"Kekuatan Anda tidak bertumpu pada satu jalur saja. Anda cenderung dapat berpindah antara angka, bahasa, dan representasi visual tanpa penurunan performa yang besar."
  }
  const top=domains[0]?.key
  if(top==="fluid") return {
    title:"Strategis Analitis",
    tag:"Analytical Strategist",
    text:"Anda cenderung memulai dari struktur masalah: mencari pola, membandingkan informasi, lalu menyusun keputusan yang dapat dijelaskan secara logis."
  }
  if(top==="verbal") return {
    title:"Penalar Konseptual",
    tag:"Conceptual Reasoner",
    text:"Anda cenderung memahami masalah melalui makna dan hubungan antar-konsep. Kekuatan utama muncul ketika informasi perlu diringkas, dibandingkan, atau dijelaskan."
  }
  if(top==="visual") return {
    title:"Pemikir Sistem Visual",
    tag:"Visual Systems Thinker",
    text:"Anda cenderung menangkap hubungan melalui pola, posisi, dan gambaran mental. Struktur visual sering memberi Anda jalan tercepat untuk memahami persoalan."
  }
  return {
    title:"Pemecah Masalah Adaptif",
    tag:"Adaptive Solver",
    text:"Profil Anda menunjukkan kemampuan berpindah strategi sesuai jenis persoalan, dengan satu atau dua area yang menjadi jangkar utama."
  }
}

function paceLabel(avgSec:number,accuracy:number){
  if(accuracy>=85 && avgSec<=30) return {title:"Cepat & presisi",text:"Anda menjaga ketepatan tinggi sambil mempertahankan tempo yang kompetitif."}
  if(accuracy>=80) return {title:"Cermat & terstruktur",text:"Anda tampak lebih mengutamakan ketepatan daripada terburu-buru, sebuah pola yang baik untuk masalah berlapis."}
  if(avgSec<=24) return {title:"Agresif dalam tempo",text:"Kecepatan Anda tinggi; peluang peningkatan terbesar adalah menambahkan pemeriksaan singkat sebelum mengunci jawaban."}
  return {title:"Deliberatif",text:"Anda memberi waktu lebih besar untuk memahami soal. Efisiensi dapat ditingkatkan tanpa mengorbankan ketepatan."}
}

function recommendationFor(key:string|undefined){
  if(key==="fluid") return {
    week:"Setiap hari 12–15 menit: deret tingkat lanjut, rasio, perbandingan kuantitatif, dan soal cerita dua tahap.",
    month:"Naikkan ke soal data campuran dan problem solving multi-langkah. Catat jenis kesalahan: konsep, hitung, atau salah membaca kondisi."
  }
  if(key==="verbal") return {
    week:"Setiap hari 10–12 menit: analogi, inferensi singkat, dan identifikasi kesimpulan. Jelaskan alasan jawaban dalam satu kalimat.",
    month:"Latih bacaan pendek dengan informasi pengalih dan argumen berlapis. Fokus pada perbedaan antara fakta, asumsi, dan implikasi."
  }
  if(key==="visual") return {
    week:"Setiap hari 10–12 menit: rotasi, serial figural, dan matriks pola. Hindari menghitung secara verbal; gunakan gambaran mental.",
    month:"Masuk ke transformasi dua tahap dan matriks dengan dua atribut berubah sekaligus: arah, isi, jumlah, atau posisi."
  }
  return {
    week:"Gunakan latihan campuran 15 menit dengan evaluasi kesalahan setelah setiap sesi.",
    month:"Bandingkan performa antar-domain dan prioritaskan area dengan akurasi terendah."
  }
}

function RadarChart({domains,accuracy,pace}:{domains:DomainView[];accuracy:number;pace:number}) {
  const byKey = Object.fromEntries(domains.map(d=>[d.key,d.index]))
  const metrics=[
    {label:"Logika",value:Number(byKey.fluid||0)},
    {label:"Verbal",value:Number(byKey.verbal||0)},
    {label:"Visual",value:Number(byKey.visual||0)},
    {label:"Akurasi",value:accuracy},
    {label:"Tempo",value:pace},
  ]
  const cx=160,cy=150,r=104
  const point=(i:number,value:number)=>{
    const angle=-Math.PI/2+(i*2*Math.PI/metrics.length)
    const rr=r*clamp(value)/100
    return [cx+Math.cos(angle)*rr,cy+Math.sin(angle)*rr]
  }
  const outer=(i:number,ratio:number)=>{
    const angle=-Math.PI/2+(i*2*Math.PI/metrics.length)
    return [cx+Math.cos(angle)*r*ratio,cy+Math.sin(angle)*r*ratio]
  }
  const polygon=metrics.map((m,i)=>point(i,m.value).join(",")).join(" ")
  return (
    <svg viewBox="0 0 320 310" className="mx-auto w-full max-w-[360px]" role="img" aria-label="Radar profil kognitif">
      {[.25,.5,.75,1].map(ratio=><polygon key={ratio} points={metrics.map((_,i)=>outer(i,ratio).join(",")).join(" ")} fill="none" stroke="rgba(148,163,184,.18)" strokeWidth="1"/>)}
      {metrics.map((_,i)=><line key={i} x1={cx} y1={cy} x2={outer(i,1)[0]} y2={outer(i,1)[1]} stroke="rgba(148,163,184,.16)"/>)}
      <polygon points={polygon} fill="rgba(99,102,241,.25)" stroke="rgba(103,232,249,.95)" strokeWidth="2.5"/>
      {metrics.map((m,i)=>{
        const [x,y]=point(i,m.value)
        const [lx,ly]=outer(i,1.18)
        return <g key={m.label}>
          <circle cx={x} cy={y} r="4.5" fill="#67e8f9"/>
          <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fill="#cbd5e1" fontSize="11" fontWeight="700">{m.label}</text>
          <text x={x} y={y-10} textAnchor="middle" fill="#fff" fontSize="10" fontWeight="800">{m.value}</text>
        </g>
      })}
    </svg>
  )
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

function PremiumSeal({reference,serial,compact=false}:{reference?:string;serial?:string;compact?:boolean}) {
  const ref=(reference || "ALZAVA").replace(/[^a-z0-9]/gi,"").slice(0,8).toUpperCase()
  const shortSerial=(serial || ref || "PREMIUM").split("-").slice(-1)[0].slice(0,8)
  return (
    <div className={compact ? "alzava-premium-seal alzava-premium-seal-compact" : "alzava-premium-seal"} aria-label="ALZAVA Premium Report seal">
      <div className="alzava-seal-orbit alzava-seal-orbit-a"/>
      <div className="alzava-seal-orbit alzava-seal-orbit-b"/>
      <div className="alzava-seal-core">
        <span className="alzava-seal-star">✦</span>
        <img src="/alzava-emblem-v3.svg" alt="" />
        <b>ALZAVA</b>
        <strong>PREMIUM</strong>
        <small>ORIGINAL REPORT</small>
        <em>NO. {shortSerial}</em>
      </div>
    </div>
  )
}

export default function ResultPage() {
  const [data,setData]=useState<LatestResult|null>(null)
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState("")
  const [copied,setCopied]=useState(false)
  const [switchingResult,setSwitchingResult]=useState(false)

  async function loadResult(attemptId?:string|null,initial=false) {
    if(!getParticipantToken()){
      window.location.replace("/account")
      return
    }
    if(initial) setLoading(true)
    else setSwitchingResult(true)
    setError("")
    try{
      const r=await post({action:"latest_result",...(attemptId?{attempt_id:attemptId}:{})})
      const payload=r.data as LatestResult
      setData(payload)
      const selected=payload?.result?.attempt_id
      if(selected){
        const url="/result?attempt="+encodeURIComponent(selected)
        window.history.replaceState(null,"",url)
      }
      void track("result_viewed",{has_result:Boolean(payload?.result),attempt_id:selected})
      if(payload?.result && !payload?.premium_unlocked) void track("premium_offer_viewed",{attempt_id:payload.result.attempt_id})
    }catch(e){
      setError(e instanceof Error?e.message:"Hasil belum dapat dimuat.")
    }finally{
      if(initial) setLoading(false)
      setSwitchingResult(false)
    }
  }

  useEffect(()=>{
    const requested=new URLSearchParams(window.location.search).get("attempt")
    void loadResult(requested,true)
  },[])

  const result=data?.result
  const domains=useMemo<DomainView[]>(()=>{
    const source=result?.domain_scores || {}
    return Object.entries(source)
      .map(([key,value])=>({
        key,
        label:labels[key]||key,
        short:shortLabels[key]||key,
        description:descriptions[key]||"",
        ...value,
        index:Number(value?.index)||0,
      }))
      .sort((a,b)=>b.index-a.index)
  },[result?.domain_scores])

  const accuracy=result?.question_count ? Math.round((Number(result.correct_count||0)/result.question_count)*100) : 0
  const avgSec=result?.question_count ? (Number(result.duration_ms||0)/1000)/result.question_count : 0
  const paceIndex=clamp(Math.round(100-Math.max(0,avgSec-18)*2.2),45,100)
  const signature=signatureFor(domains)
  const pace=paceLabel(avgSec,accuracy)
  const strength=domains[0]
  const second=domains[1]
  const development=domains[domains.length-1]
  const plan=recommendationFor(development?.key)
  const spread=domains.length ? Math.max(...domains.map(d=>d.index))-Math.min(...domains.map(d=>d.index)) : 0
  const topPercent=result?.national_rank && data?.leaderboard_total
    ? Math.max(1,Math.ceil((result.national_rank/data.leaderboard_total)*100))
    : null

  const strengths=[
    strength ? strength.label + " menjadi jangkar terkuat dengan indeks " + strength.index + "." : "Kemampuan pemecahan masalah umum menjadi fondasi utama.",
    second ? second.label + " memberi dukungan kedua yang membuat strategi Anda lebih fleksibel." : "Strategi Anda dapat berkembang melalui latihan lintas-domain.",
    accuracy>=85 ? "Akurasi tinggi menunjukkan kontrol kesalahan yang kuat pada tes ini." : accuracy>=75 ? "Akurasi sudah kompetitif dan masih memiliki ruang perbaikan yang jelas." : "Peluang peningkatan terbesar datang dari kontrol kesalahan.",
    avgSec<=30 ? "Tempo pengerjaan efisien; Anda tidak membutuhkan waktu berlebihan untuk sebagian besar item." : "Anda cenderung memberi waktu untuk memastikan jawaban pada persoalan kompleks.",
    result?.high_range_attempted ? "Anda telah melewati High Range, sehingga estimasi rentang atas mendapat verifikasi tambahan." : "Hasil inti memberi baseline yang jelas untuk membandingkan perkembangan pada season berikutnya.",
  ]

  const blindSpots=[
    development ? "Area dengan indeks terendah adalah " + development.label + " (" + development.index + "). Ini bukan kelemahan tetap, tetapi prioritas latihan paling efisien." : "Belum cukup data domain untuk menentukan prioritas pengembangan.",
    spread>=20 ? "Jarak antardomain cukup lebar. Anda mungkin merasa sangat nyaman pada jenis masalah tertentu tetapi lebih lambat ketika representasinya berubah." : "Profil relatif seimbang; tantangannya adalah meningkatkan ceiling, bukan hanya menutup satu kelemahan besar.",
    accuracy<80 ? "Sebagian skor hilang karena akurasi. Tambahkan pemeriksaan kondisi soal sebelum memilih jawaban." : avgSec>35 ? "Ketepatan cukup baik, tetapi efisiensi waktu masih bisa ditingkatkan dengan strategi skip-and-return." : "Trade-off kecepatan dan ketepatan relatif terjaga; fokus berikutnya adalah soal dengan kompleksitas lebih tinggi.",
  ]

  async function share() {
    if(!data?.participant_public_id || !result) return
    const url=window.location.origin + "/challenge?id=" + encodeURIComponent(data.participant_public_id)
    const text=(data.nickname || "Saya") + " meraih Estimasi IQ Battle " + (result.iq_estimate ?? "—") + " dan peringkat nasional #" + (result.national_rank ?? "—") + " di ALZAVA Battle Point. Berani mengalahkan skor ini?"
    void track("share_clicked",{attempt_id:result.attempt_id,national_rank:result.national_rank})
    try{
      if(navigator.share){
        await navigator.share({title:"Tantangan ALZAVA Battle Point",text,url})
      }else{
        await navigator.clipboard.writeText(text+" "+url)
        setCopied(true)
        setTimeout(()=>setCopied(false),1800)
      }
    }catch{}
  }

  function printPremium() {
    window.print()
  }

  function openPremium() {
    if(result) void track("premium_checkout_opened",{attempt_id:result.attempt_id})
    const suffix=result?.attempt_id ? "&attempt="+encodeURIComponent(result.attempt_id) : ""
    window.location.href="/payment?product=premium_report"+suffix
  }

  if(loading) return <main className="grid min-h-screen place-items-center bg-[#020817] text-slate-300">Memuat hasil…</main>

  if(error || !data) return <main className="grid min-h-screen place-items-center bg-[#020817] px-5 text-white"><div className="max-w-xl rounded-3xl border border-rose-400/20 bg-rose-500/10 p-7 text-center"><p>{error || "Hasil belum tersedia."}</p><a href="/battle" className="mt-5 inline-flex rounded-xl bg-indigo-600 px-5 py-3 font-black">Kembali ke Battle</a></div></main>

  if(!result) return <main className="grid min-h-screen place-items-center bg-[#020817] px-5 text-white"><div className="max-w-xl rounded-3xl border border-white/10 bg-white/5 p-8 text-center"><Brain className="mx-auto h-10 w-10 text-cyan-300"/><h1 className="mt-4 text-2xl font-black">Belum ada hasil pada season ini</h1><p className="mt-2 text-slate-400">Selesaikan tes untuk melihat skor dan profil kognitif Anda.</p><a href="/battle-test" className="mt-6 inline-flex rounded-xl bg-indigo-600 px-5 py-3 font-black">Mulai Tes</a></div></main>

  const iq=Number(result.iq_estimate||0)
  const iqProgress=clamp(((iq-55)/100)*100)
  const rankText=result.is_personal_best===false ? "Bukan PB" : result.national_rank && data.leaderboard_total ? "#" + result.national_rank + " dari " + data.leaderboard_total : "#" + (result.national_rank ?? "—")
  const reportDate=result.submitted_at ? new Date(result.submitted_at) : new Date()
  const reportDateCode=[
    reportDate.getFullYear(),
    String(reportDate.getMonth()+1).padStart(2,"0"),
    String(reportDate.getDate()).padStart(2,"0"),
  ].join("")
  const reportRef=(result.attempt_id || "ALZAVA").replace(/[^a-z0-9]/gi,"").slice(0,8).toUpperCase()
  const reportNumber=`ALZ-BP-${reportDateCode}-${reportRef}`
  const reportIssued=reportDate.toLocaleDateString("id-ID",{day:"2-digit",month:"long",year:"numeric"})


  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_10%_-10%,rgba(79,70,229,.32),transparent_34rem),radial-gradient(circle_at_90%_5%,rgba(6,182,212,.18),transparent_30rem),linear-gradient(180deg,#020617_0%,#07142e_48%,#020617_100%)] px-4 py-8 text-white sm:px-6">
      <div className="pointer-events-none fixed inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.025)_1px,transparent_1px)] [background-size:42px_42px]" />
      <div className="relative mx-auto max-w-7xl">
        <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
          <a href="/battle" className="inline-flex items-center gap-2 text-sm font-bold text-slate-300 hover:text-white"><ArrowLeft className="h-4 w-4"/>Kembali ke Battle</a>
          <div className="flex gap-2">
            <button onClick={share} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-black backdrop-blur-lg hover:bg-white/10"><Share2 className="h-4 w-4"/>{copied?"Tautan disalin":"Tantang Teman"}</button>
            {data.premium_unlocked && <button onClick={printPremium} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-black text-slate-950 shadow-xl"><Download className="h-4 w-4"/>Simpan PDF Premium</button>}
          </div>
        </div>

        {Array.isArray(data.attempts) && data.attempts.length > 1 && (
          <section className="no-print mb-6 rounded-[1.75rem] border border-white/10 bg-slate-950/45 p-4 shadow-xl backdrop-blur-xl sm:p-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[.2em] text-cyan-300">Riwayat Hasil Season Ini</p>
                <h2 className="mt-1 text-xl font-black text-white">Pilih percobaan yang ingin dilihat</h2>
                <p className="mt-1 text-sm text-slate-400">Setiap percobaan menyimpan hasilnya sendiri. Laporan Premium juga melekat pada hasil yang dipilih.</p>
              </div>
              {switchingResult && <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-xs font-bold text-cyan-200">Memuat hasil…</span>}
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {data.attempts
                .slice()
                .sort((a,b)=>Number(a.attempt_number||0)-Number(b.attempt_number||0))
                .map((item)=>{
                  const active=item.attempt_id===data.selected_attempt_id || item.attempt_id===result?.attempt_id
                  const paid=Number(item.attempt_number||0)>1
                  return <button
                    key={item.attempt_id || String(item.attempt_number)}
                    type="button"
                    disabled={switchingResult || !item.attempt_id}
                    onClick={()=>item.attempt_id && void loadResult(item.attempt_id)}
                    className={`relative overflow-hidden rounded-2xl border p-4 text-left transition-all disabled:opacity-60 ${active?"border-cyan-300/45 bg-gradient-to-br from-cyan-400/12 via-indigo-500/12 to-violet-500/10 shadow-[0_0_0_1px_rgba(103,232,249,.08),0_18px_50px_rgba(0,0,0,.22)]":"border-white/10 bg-white/[.035] hover:border-white/20 hover:bg-white/[.06]"}`}
                  >
                    {active && <span className="absolute right-3 top-3 rounded-full bg-cyan-300/15 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-cyan-200">Sedang dilihat</span>}
                    <p className="text-[10px] font-black uppercase tracking-[.14em] text-slate-500">Percobaan #{item.attempt_number ?? "—"} {paid?"· Berbayar":"· Gratis"}</p>
                    <div className="mt-3 flex items-end justify-between gap-3">
                      <div><span className="block text-xs text-slate-500">IQ Battle</span><strong className="text-2xl font-black text-white">{item.iq_estimate ?? "—"}</strong></div>
                      <div className="text-right"><span className="block text-xs text-slate-500">Battle Point</span><strong className="text-xl font-black text-cyan-300">{Number(item.battle_score||0).toLocaleString("id-ID")}</strong></div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {item.is_personal_best && <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-2 py-1 text-[9px] font-black uppercase tracking-wide text-amber-200">Personal Best</span>}
                      {item.premium_unlocked && <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2 py-1 text-[9px] font-black uppercase tracking-wide text-emerald-200">Premium Aktif</span>}
                      <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[9px] font-bold text-slate-400">{item.correct_count ?? 0}/{item.question_count ?? 0} benar</span>
                    </div>
                    <p className="mt-3 text-xs text-slate-500">{item.submitted_at ? new Date(item.submitted_at).toLocaleString("id-ID",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"}) : ""}</p>
                  </button>
                })}
            </div>
          </section>
        )}

        <section className="screen-report overflow-hidden rounded-[2.25rem] border border-white/10 bg-[#07162f]/95 shadow-[0_35px_120px_rgba(0,0,0,.45)]">
          <div className="relative overflow-hidden border-b border-white/10 p-6 sm:p-9 lg:p-11">
            <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl"/>
            <div className="absolute right-32 top-16 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl"/>
            <div className="relative grid gap-5 md:grid-cols-[minmax(0,1fr)_250px] md:items-center lg:grid-cols-[minmax(0,1fr)_310px] lg:gap-8">
              <div>
                <div className="mb-5 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[.18em] text-cyan-200">ALZAVA Battle Point</span>
                  {result.high_range_attempted ? <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-300/25 bg-violet-400/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[.12em] text-violet-200"><ShieldCheck className="h-3.5 w-3.5"/>High Range Verified</span> : <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-black uppercase tracking-[.12em] text-slate-300">Core Result</span>}
                </div>
                <p className="text-sm font-bold uppercase tracking-[.22em] text-slate-500">Cognitive Performance Report</p>
                <h1 className="mt-3 text-4xl font-black tracking-[-.05em] sm:text-6xl lg:text-7xl">{data.nickname || "Peserta"}</h1>
                <p className="mt-4 text-sm text-slate-400">{[data.district_name,data.regency_name,data.province_name].filter(Boolean).join(" · ")}</p>
                <div className="mt-7 flex flex-wrap gap-2">
                  <span className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-300">{signature.tag}</span>
                  <span className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-300">{pace.title}</span>
                  <span className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-300">{"Ranked Result"}</span>
                </div>
              </div>

              <div className="relative mx-auto h-[220px] w-[220px] sm:h-[245px] sm:w-[245px] md:h-[250px] md:w-[250px] lg:h-[300px] lg:w-[300px]">
                <div className="absolute inset-0 rounded-full bg-cyan-400/10 blur-3xl"/>
                <div className="absolute inset-4 rounded-full p-[2px]" style={{background:"conic-gradient(#67e8f9 "+iqProgress+"%, rgba(255,255,255,.08) "+iqProgress+"%)"}}>
                  <div className="grid h-full w-full place-items-center rounded-full bg-[#061329]">
                    <div className="text-center">
                      <p className="text-[11px] font-black uppercase tracking-[.18em] text-cyan-300">Estimasi IQ Battle</p>
                      <strong className="mt-2 block text-5xl font-black tracking-[-.06em] sm:text-6xl lg:text-7xl">{iq || "—"}</strong>
                      <p className="mt-1 text-sm font-bold text-slate-300">{iqTier(iq)}</p>
                      <p className="mt-2 text-xs text-slate-500">Rentang {result.iq_low ?? "—"}–{result.iq_high ?? "—"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 p-6 sm:grid-cols-2 sm:p-9 lg:grid-cols-5">
            {([
              ["Battle Point",Number(result.battle_score||0).toLocaleString("id-ID"),Zap],
              ["Ketepatan",accuracy+"%",Target],
              ["Peringkat",rankText,Trophy],
              ["Waktu",formatDuration(result.duration_ms),Timer],
              ["Rata-rata",avgSec.toFixed(1)+" dtk/soal",Gauge],
            ] as const).map(([label,value,Icon])=><div key={String(label)} className="rounded-2xl border border-white/10 bg-slate-950/35 p-5"><Icon className="h-5 w-5 text-cyan-300"/><span className="mt-4 block text-xs font-bold uppercase tracking-wider text-slate-500">{String(label)}</span><strong className="mt-1 block text-2xl font-black">{String(value)}</strong></div>)}
          </div>

          <div className="mx-6 mb-8 grid gap-4 sm:mx-9 lg:grid-cols-[1.2fr_.8fr]">
            <article className="rounded-3xl border border-indigo-300/15 bg-gradient-to-br from-indigo-500/12 to-cyan-400/[.05] p-6">
              <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-indigo-500/20"><Brain className="h-6 w-6 text-indigo-200"/></span><div><p className="text-[11px] font-black uppercase tracking-[.18em] text-indigo-300">Ringkasan Utama</p><h2 className="text-2xl font-black">{signature.title}</h2></div></div>
              <p className="mt-5 text-[15px] leading-7 text-slate-300">{signature.text}</p>
              <p className="mt-4 text-[15px] leading-7 text-slate-300">{pace.text} {strength ? "Kekuatan relatif paling menonjol terlihat pada "+strength.label+"." : ""}</p>
            </article>
            <article className="rounded-3xl border border-white/10 bg-white/[.04] p-6">
              <p className="text-[11px] font-black uppercase tracking-[.18em] text-slate-500">Benchmark Season Aktif</p>
              <div className="mt-4 flex items-end gap-2"><strong className="text-4xl font-black">#{result.national_rank ?? "—"}</strong>{data.leaderboard_total ? <span className="pb-1 text-sm text-slate-400">dari {data.leaderboard_total} peserta terverifikasi</span> : null}</div>
              {topPercent ? <p className="mt-4 text-sm leading-6 text-slate-400">Posisi saat ini berada pada <b className="text-white">Top {topPercent}%</b> dari leaderboard season yang sudah terbentuk. Persentase ini berubah ketika peserta baru masuk.</p> : <p className="mt-4 text-sm text-slate-400">Benchmark akan semakin stabil ketika jumlah peserta bertambah.</p>}
            </article>
          </div>

          {!data.premium_unlocked ? (
            <section className="mx-6 mb-10 overflow-hidden rounded-[2rem] border border-fuchsia-300/20 bg-gradient-to-br from-violet-500/15 via-fuchsia-500/10 to-cyan-400/[.06] p-6 sm:mx-9 sm:p-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-3xl">
                  <div className="flex items-center gap-2 text-violet-300"><Crown className="h-5 w-5"/><p className="text-xs font-black uppercase tracking-[.2em]">Laporan Premium</p></div>
                  <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Bukan sekadar angka. Baca cara otak Anda memecahkan masalah.</h2>
                  <p className="mt-3 leading-7 text-slate-300">Laporan Premium membuka peta kognitif visual, karakter pemecahan masalah, analisis setiap domain, 5 kekuatan utama, blind spot, strategi belajar, dan rencana peningkatan 30 hari untuk hasil tes ini.</p>
                </div>
                <button onClick={openPremium} className="no-print inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-7 py-4 font-black shadow-[0_0_35px_rgba(168,85,247,.3)]"><LockKeyhole className="h-5 w-5"/>Buka Premium Hasil Ini · Rp5.000</button>
              </div>
              <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  ["Cognitive Signature","Gaya berpikir dominan & pola keputusan"],
                  ["Peta 5 Dimensi","Logika, verbal, visual, akurasi, tempo"],
                  ["Deep Dive Domain","Makna skor dan penerapannya"],
                  ["5 Kekuatan Utama","Aset kognitif yang paling menonjol"],
                  ["Blind Spot","Risiko pola kesalahan & trade-off"],
                  ["30-Day Growth Plan","Rencana latihan yang spesifik"],
                ].map(([title,desc])=><div key={title} className="rounded-2xl border border-white/10 bg-slate-950/35 p-4"><Sparkles className="h-4 w-4 text-violet-300"/><p className="mt-3 font-black">{title}</p><p className="mt-1 text-xs leading-5 text-slate-500">{desc}</p></div>)}
              </div>
            </section>
          ) : (
            <div className="premium-body">
              <section className="report-page mx-6 mb-8 grid gap-5 sm:mx-9 lg:grid-cols-[.9fr_1.1fr]">
                <article className="rounded-[2rem] border border-cyan-300/15 bg-slate-950/35 p-6">
                  <div className="flex items-center gap-3"><Sparkles className="h-6 w-6 text-cyan-300"/><div><p className="text-[11px] font-black uppercase tracking-[.18em] text-cyan-300">Peta Kognitif</p><h2 className="text-2xl font-black">5 Dimensi Performa</h2></div></div>
                  <RadarChart domains={domains} accuracy={accuracy} pace={paceIndex}/>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-xl bg-white/5 p-3"><span className="text-slate-500">Akurasi</span><b className="block text-lg text-white">{accuracy}%</b></div>
                    <div className="rounded-xl bg-white/5 p-3"><span className="text-slate-500">Indeks tempo</span><b className="block text-lg text-white">{paceIndex}</b></div>
                  </div>
                </article>

                <article className="rounded-[2rem] border border-violet-300/15 bg-gradient-to-br from-violet-500/10 to-indigo-500/[.04] p-6 sm:p-7">
                  <p className="text-[11px] font-black uppercase tracking-[.18em] text-violet-300">Karakter Kognitif</p>
                  <h2 className="mt-2 text-3xl font-black">{signature.title}</h2>
                  <p className="mt-4 leading-7 text-slate-300">{signature.text}</p>
                  <div className="mt-6 grid gap-3">
                    <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4"><p className="text-xs font-black uppercase tracking-wider text-slate-500">Cara mengambil keputusan</p><p className="mt-2 text-sm leading-6 text-slate-300">{pace.text}</p></div>
                    <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4"><p className="text-xs font-black uppercase tracking-wider text-slate-500">Distribusi kemampuan</p><p className="mt-2 text-sm leading-6 text-slate-300">{spread<=10 ? "Profil relatif merata. Anda tidak terlalu bergantung pada satu jenis representasi masalah." : spread<=20 ? "Profil menunjukkan satu kekuatan utama, tetapi domain lain masih cukup dekat untuk mendukung fleksibilitas." : "Profil cukup terspesialisasi. Keunggulan utama sangat jelas, namun pergantian jenis soal dapat mengubah tempo dan akurasi."}</p></div>
                    <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4"><p className="text-xs font-black uppercase tracking-wider text-slate-500">Verifikasi rentang atas</p><p className="mt-2 text-sm leading-6 text-slate-300">{result.high_range_attempted ? "High Range selesai. Skor rentang atas diuji dengan soal tambahan yang lebih sulit, sehingga estimasi tinggi memiliki bukti tambahan." : "High Range tidak dikerjakan pada hasil ini. Untuk skor inti yang sangat tinggi pada format baru, sistem akan membuka tahap verifikasi tambahan."}</p></div>
                  </div>
                </article>
              </section>

              <section className="report-page mx-6 mb-8 sm:mx-9">
                <div className="mb-5 flex items-end justify-between gap-4"><div><p className="text-[11px] font-black uppercase tracking-[.18em] text-cyan-300">Deep Dive</p><h2 className="mt-1 text-3xl font-black">Apa arti profil kemampuan Anda?</h2></div><Medal className="h-8 w-8 text-amber-300"/></div>
                <div className="grid gap-4">
                  {domains.map((domain,index)=>{
                    const meaning=domainMeaning[domain.key] || domainMeaning.fluid
                    return <article key={domain.key} className="overflow-hidden rounded-3xl border border-white/10 bg-white/[.035]">
                      <div className="grid gap-5 p-5 sm:grid-cols-[110px_1fr] sm:p-6">
                        <div className="grid h-[110px] place-items-center rounded-2xl border border-white/10 bg-slate-950/45 text-center"><div><span className="text-xs text-slate-500">Indeks</span><strong className="block text-4xl font-black text-cyan-300">{domain.index}</strong><span className="text-[10px] font-bold uppercase text-slate-500">{levelLabel(domain.index)}</span></div></div>
                        <div>
                          <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-xl font-black">{index+1}. {domain.label}</h3><span className="rounded-full bg-white/5 px-3 py-1 text-xs font-bold text-slate-400">{domain.correct ?? 0}/{domain.total ?? 0} benar</span></div>
                          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-900"><div className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-indigo-400 to-violet-500" style={{width:clamp(domain.index)+"%"}}/></div>
                          <div className="mt-5 grid gap-3 lg:grid-cols-3">
                            <div className="rounded-2xl bg-slate-950/35 p-4"><p className="text-[10px] font-black uppercase tracking-wider text-emerald-300">Yang terlihat</p><p className="mt-2 text-sm leading-6 text-slate-300">{meaning.strength}</p></div>
                            <div className="rounded-2xl bg-slate-950/35 p-4"><p className="text-[10px] font-black uppercase tracking-wider text-cyan-300">Kapan berguna</p><p className="mt-2 text-sm leading-6 text-slate-300">{meaning.application}</p></div>
                            <div className="rounded-2xl bg-slate-950/35 p-4"><p className="text-[10px] font-black uppercase tracking-wider text-amber-300">Naik level</p><p className="mt-2 text-sm leading-6 text-slate-300">{meaning.growth}</p></div>
                          </div>
                        </div>
                      </div>
                    </article>
                  })}
                </div>
              </section>

              <section className="report-page mx-6 mb-8 grid gap-5 sm:mx-9 lg:grid-cols-2">
                <article className="rounded-[2rem] border border-emerald-300/15 bg-emerald-400/[.06] p-6">
                  <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-400/15"><Zap className="h-5 w-5 text-emerald-300"/></span><div><p className="text-[11px] font-black uppercase tracking-[.18em] text-emerald-300">Aset Kognitif</p><h2 className="text-2xl font-black">5 Kekuatan Utama</h2></div></div>
                  <div className="mt-5 grid gap-3">
                    {strengths.map((item,i)=><div key={i} className="flex gap-3 rounded-2xl border border-white/10 bg-slate-950/25 p-4"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-emerald-400/15 text-xs font-black text-emerald-300">{i+1}</span><p className="text-sm leading-6 text-slate-300">{item}</p></div>)}
                  </div>
                </article>

                <article className="rounded-[2rem] border border-amber-300/15 bg-amber-400/[.06] p-6">
                  <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-400/15"><Lightbulb className="h-5 w-5 text-amber-300"/></span><div><p className="text-[11px] font-black uppercase tracking-[.18em] text-amber-300">Area Waspada</p><h2 className="text-2xl font-black">Blind Spot & Trade-off</h2></div></div>
                  <div className="mt-5 grid gap-3">
                    {blindSpots.map((item,i)=><div key={i} className="rounded-2xl border border-white/10 bg-slate-950/25 p-4"><p className="text-sm leading-6 text-slate-300">{item}</p></div>)}
                  </div>
                  <p className="mt-4 text-xs leading-5 text-amber-100/60">Bagian ini menggambarkan pola performa pada tes, bukan label kepribadian permanen.</p>
                </article>
              </section>

              <section className="report-page mx-6 mb-8 overflow-hidden rounded-[2rem] border border-indigo-300/15 bg-gradient-to-br from-indigo-500/10 via-slate-950/20 to-cyan-400/[.05] sm:mx-9">
                <div className="grid lg:grid-cols-[.72fr_1.28fr]">
                  <div className="border-b border-white/10 p-6 lg:border-b-0 lg:border-r">
                    <Rocket className="h-8 w-8 text-indigo-300"/>
                    <p className="mt-5 text-[11px] font-black uppercase tracking-[.18em] text-indigo-300">Personal Growth Plan</p>
                    <h2 className="mt-2 text-3xl font-black">Naikkan ceiling, bukan hanya mengulang soal.</h2>
                    <p className="mt-4 text-sm leading-7 text-slate-400">Prioritas pertama: <b className="text-white">{development?.label || "area terendah"}</b>. Tujuan latihan adalah memperbaiki proses berpikir yang menghasilkan jawaban, bukan menghafal pola soal.</p>
                  </div>
                  <div className="grid gap-4 p-6 sm:grid-cols-2">
                    <div className="rounded-3xl border border-white/10 bg-slate-950/35 p-5"><span className="text-xs font-black uppercase tracking-wider text-cyan-300">7 Hari Pertama</span><p className="mt-3 text-sm leading-7 text-slate-300">{plan.week}</p><div className="mt-4 rounded-xl bg-cyan-400/10 px-3 py-2 text-xs font-bold text-cyan-200">Target: pahami pola kesalahan dominan</div></div>
                    <div className="rounded-3xl border border-white/10 bg-slate-950/35 p-5"><span className="text-xs font-black uppercase tracking-wider text-violet-300">30 Hari</span><p className="mt-3 text-sm leading-7 text-slate-300">{plan.month}</p><div className="mt-4 rounded-xl bg-violet-400/10 px-3 py-2 text-xs font-bold text-violet-200">Target: naikkan indeks domain terendah 8–12 poin</div></div>
                    <div className="rounded-3xl border border-white/10 bg-slate-950/35 p-5 sm:col-span-2"><span className="text-xs font-black uppercase tracking-wider text-emerald-300">Strategi Saat Tes</span><p className="mt-3 text-sm leading-7 text-slate-300">Gunakan tiga lintasan: <b className="text-white">jawab cepat</b> untuk item yang langsung terbaca, <b className="text-white">tandai mental</b> item yang membutuhkan dua langkah, dan sisakan waktu akhir untuk memeriksa kondisi yang sering terlewat. Dengan rata-rata {avgSec.toFixed(1)} detik per soal, perubahan kecil pada manajemen waktu dapat memberi ruang untuk verifikasi tanpa mengorbankan tempo.</p></div>
                  </div>
                </div>
              </section>

              <section className="report-page mx-6 mb-9 grid gap-4 sm:mx-9 lg:grid-cols-3">
                <div className="rounded-3xl border border-white/10 bg-white/[.035] p-5"><ShieldCheck className="h-6 w-6 text-cyan-300"/><h3 className="mt-4 font-black">Reliabilitas hasil</h3><p className="mt-2 text-sm leading-6 text-slate-400">{result.high_range_attempted ? "Hasil ini menyertakan High Range tambahan. Rentang atas telah mendapat pengujian ekstra." : "Hasil ini berasal dari tahap inti. Pada format baru, skor inti sangat tinggi akan diwajibkan masuk High Range."}</p></div>
                <div className="rounded-3xl border border-white/10 bg-white/[.035] p-5"><Target className="h-6 w-6 text-violet-300"/><h3 className="mt-4 font-black">Format tes</h3><p className="mt-2 text-sm leading-6 text-slate-400">{result.core_question_count || result.question_count} soal inti{result.high_range_attempted ? " + "+(result.high_range_question_count || 10)+" High Range" : ""}. Total jawaban pada hasil ini: {result.question_count}.</p></div>
                <div className="rounded-3xl border border-white/10 bg-white/[.035] p-5"><Trophy className="h-6 w-6 text-amber-300"/><h3 className="mt-4 font-black">Benchmark</h3><p className="mt-2 text-sm leading-6 text-slate-400">Peringkat dan persentase bersifat dinamis mengikuti peserta season aktif. Gunakan terutama untuk membandingkan posisi kompetitif, bukan sebagai norma populasi Indonesia.</p></div>
              </section>
            </div>
          )}

          {data.premium_unlocked && (
            <section className="mx-6 mb-8 flex flex-col items-center justify-between gap-6 rounded-[2rem] border border-amber-300/15 bg-[radial-gradient(circle_at_85%_20%,rgba(212,175,55,.12),transparent_30%),linear-gradient(135deg,rgba(15,23,42,.72),rgba(30,41,59,.42))] p-6 sm:mx-9 sm:flex-row sm:p-8">
              <div className="max-w-2xl">
                <p className="text-[11px] font-black uppercase tracking-[.2em] text-amber-300">ALZAVA Premium Seal</p>
                <h2 className="mt-2 text-2xl font-black text-white">Tanda khas laporan premium ALZAVA.</h2>
                <p className="mt-3 text-sm leading-7 text-slate-400">Setiap laporan premium memiliki nomor laporan unik yang terkait dengan satu hasil tes. <span className="mt-2 block text-slate-300"><b>No. Laporan:</b> {reportNumber} · <b>Diterbitkan:</b> {reportIssued}</span></p>
              </div>
              <PremiumSeal reference={result.attempt_id} serial={reportNumber}/>
            </section>
          )}

          <div className="border-t border-white/10 bg-slate-950/30 px-6 py-6 text-xs leading-6 text-slate-500 sm:px-9">
            <b className="text-slate-400">Catatan interpretasi:</b> Estimasi IQ Battle dan analisis kognitif di atas menggambarkan performa pada sistem ALZAVA Battle Point. Ini bukan diagnosis psikologis, tes IQ klinis terstandarisasi, penilaian kepribadian, atau pengganti asesmen oleh psikolog berwenang. Pernyataan mengenai “karakter kognitif” berarti pola pemecahan masalah yang tampak pada tes ini, bukan sifat pribadi yang permanen.
          </div>
        </section>

        {data.premium_unlocked && (
          <section className="pdf-report" aria-label="Laporan Premium PDF">
            <div className="pdf-page pdf-page-one" style={{breakAfter:"page",pageBreakAfter:"always"}}>
              <div className="pdf-brand-row">
                <div className="pdf-logo-lockup">
                  <img src="/alzava-emblem-v3.svg" alt="ALZAVA Battle Point" />
                  <div>
                    <p className="pdf-brand">ALZAVA <span>BATTLE IQ</span></p>
                    <p className="pdf-kicker">ASAH PIKIRAN. RAIH PUNCAK. · LAPORAN PREMIUM</p>
                  </div>
                </div>
                <div className="pdf-badge">{result.high_range_attempted ? "HIGH RANGE VERIFIED" : "CORE RESULT"}</div>
              </div>

              <div className="pdf-hero">
                <div>
                  <h1>{data.nickname || "Peserta"}</h1>
                  <p>{[data.district_name,data.regency_name,data.province_name].filter(Boolean).join(" · ")}</p>
                  <div className="pdf-tags">
                    <span>{signature.title}</span><span>{pace.title}</span><span>Ranked Result</span>
                  </div>
                </div>
                <div className="pdf-iq">
                  <small>ESTIMASI IQ BATTLE</small>
                  <strong>{iq || "—"}</strong>
                  <b>{iqTier(iq)}</b>
                  <span>Rentang {result.iq_low ?? "—"}–{result.iq_high ?? "—"}</span>
                </div>
              </div>

              <div className="pdf-stats">
                <div><small>BATTLE SCORE</small><b>{Number(result.battle_score||0).toLocaleString("id-ID")}</b></div>
                <div><small>KETEPATAN</small><b>{accuracy}%</b></div>
                <div><small>PERINGKAT</small><b>{rankText}</b></div>
                <div><small>WAKTU</small><b>{formatDuration(result.duration_ms)}</b></div>
                <div><small>RATA-RATA</small><b>{avgSec.toFixed(1)} dtk/soal</b></div>
              </div>

              <div className="pdf-grid-2 pdf-summary-grid">
                <article className="pdf-card">
                  <p className="pdf-section-label">RINGKASAN UTAMA</p>
                  <h2>{signature.title}</h2>
                  <p>{signature.text}</p>
                  <p>{pace.text} {strength ? "Kekuatan relatif paling menonjol terlihat pada "+strength.label+"." : ""}</p>
                  <div className="pdf-inline-note"><b>Benchmark:</b> {result.national_rank ? "peringkat #"+result.national_rank : "peringkat belum tersedia"}{data.leaderboard_total ? " dari "+data.leaderboard_total+" peserta terverifikasi" : ""}{topPercent ? " · Top "+topPercent+"%" : ""}.</div>
                </article>
                <article className="pdf-card pdf-radar-card">
                  <p className="pdf-section-label">PETA KOGNITIF · 5 DIMENSI</p>
                  <div className="pdf-radar"><RadarChart domains={domains} accuracy={accuracy} pace={paceIndex}/></div>
                  <div className="pdf-mini-stats"><span>Akurasi <b>{accuracy}%</b></span><span>Indeks tempo <b>{paceIndex}</b></span></div>
                </article>
              </div>

              <div className="pdf-grid-3 pdf-bottom-strip">
                <div><b>Cara keputusan</b><span>{pace.text}</span></div>
                <div><b>Distribusi kemampuan</b><span>{spread<=10 ? "Relatif merata lintas-domain." : spread<=20 ? "Ada satu kekuatan utama dengan dukungan domain lain yang cukup dekat." : "Cukup terspesialisasi; kekuatan utama terlihat jelas."}</span></div>
                <div><b>Verifikasi atas</b><span>{result.high_range_attempted ? "High Range selesai; rentang atas mendapat pengujian tambahan." : "Hasil berasal dari tahap inti."}</span></div>
              </div>

              <div className="pdf-page1-reference-grid">
                <article className="pdf-certificate-explainer">
                  <div className="pdf-cert-title-row">
                    <div>
                      <p className="pdf-section-label pdf-gold">SERTIFIKAT HASIL DIGITAL</p>
                      <h2>Dokumen hasil & analisis ALZAVA Battle Point</h2>
                    </div>
                    <span>Attempt #{result.attempt_number ?? "—"}</span>
                  </div>
                  <p>Halaman ini dapat diperlakukan sebagai <b>sertifikat hasil internal ALZAVA Battle Point</b>: mencatat identitas peserta, nomor laporan unik, skor, estimasi IQ Battle, profil kemampuan, waktu, dan status hasil pada satu percobaan tertentu.</p>
                  <div className="pdf-cert-meta">
                    <span><small>NO. LAPORAN</small><b>{reportNumber}</b></span>
                    <span><small>DITERBITKAN</small><b>{reportIssued}</b></span>
                    <span><small>STATUS</small><b>{data.premium_unlocked ? "Premium Verified" : "Result Record"}</b></span>
                  </div>
                  <p className="pdf-cert-disclaimer">Sertifikat hasil ini adalah dokumen capaian dalam ekosistem ALZAVA, bukan sertifikasi psikologis, diagnosis klinis, atau pengganti asesmen inteligensi yang diadministrasikan profesional.</p>
                </article>

                <article className="pdf-radar-explainer">
                  <p className="pdf-section-label">CARA MEMBACA PETA KOGNITIF</p>
                  <h2>Lima sumbu, satu gambaran performa.</h2>
                  <div className="pdf-radar-legend">
                    <div><b>Logika & Numerik</b><span>Pola angka, relasi, aturan, dan pemecahan masalah baru.</span></div>
                    <div><b>Penalaran Verbal</b><span>Makna, konsep, argumen, implikasi, dan konsistensi informasi.</span></div>
                    <div><b>Spasial & Visual</b><span>Orientasi, rotasi, posisi, transformasi, dan hubungan ruang.</span></div>
                    <div><b>Akurasi</b><span>Persentase jawaban benar; menunjukkan kontrol kesalahan.</span></div>
                    <div><b>Tempo</b><span>Indeks efisiensi berdasarkan rata-rata waktu pengerjaan per soal.</span></div>
                  </div>
                  <p className="pdf-radar-note">Semakin jauh titik dari pusat, semakin tinggi indeks relatif pada hasil tes ini. Bentuk radar digunakan untuk melihat <b>keseimbangan profil</b>, bukan hanya satu angka IQ.</p>
                </article>
              </div>

              <article className="pdf-iq-reference">
                <div className="pdf-iq-reference-head">
                  <div>
                    <p className="pdf-section-label">REFERENSI RENTANG IQ · SKALA 100/15</p>
                    <h2>Di mana posisi estimasi IQ Battle {iq || "—"}?</h2>
                  </div>
                  <span>Mean 100 · SD 15</span>
                </div>
                <div className="pdf-iq-band-grid">
                  {iqReferenceBands.map((band)=>{
                    const active=iq>=band.min && iq<=band.max
                    return <div key={band.range} className={active?"pdf-iq-band pdf-iq-band-active":"pdf-iq-band"}>
                      <b>{band.range}</b>
                      <strong>{band.id}</strong>
                      <span>{band.label}</span>
                    </div>
                  })}
                </div>
                <p className="pdf-iq-reference-note">Acuan interpretasi menggunakan kerangka deviation-IQ umum dengan rata-rata 100 dan simpangan baku sekitar 15. Nama kategori bersifat deskriptif; Pearson menegaskan label kualitatif hanyalah bantuan komunikasi dan bukan kategori diagnosis yang universal. Skor di tes berbeda juga tidak selalu ekuivalen langsung—misalnya Mensa menggunakan kriteria persentil 98, bukan satu angka IQ tunggal untuk semua tes.</p>
              </article>

              <div className="pdf-executive-footer">
                <div><span>KEKUATAN UTAMA</span><b>{strength?.label || "Profil kognitif"}</b><small>Indeks {strength?.index ?? "—"}</small></div>
                <div><span>PRIORITAS PENGEMBANGAN</span><b>{development?.label || "Area terendah"}</b><small>Indeks {development?.index ?? "—"}</small></div>
                <div><span>NO. LAPORAN PREMIUM</span><b>{reportNumber}</b><small>Diterbitkan {reportIssued}</small></div>
              </div>
            </div>

            <div className="pdf-page pdf-page-two" style={{breakAfter:"page",pageBreakAfter:"always"}}>
              <div className="pdf-page-mini-brand">
                <div className="pdf-logo-lockup">
                  <img src="/alzava-emblem-v3.svg" alt="ALZAVA Battle Point" />
                  <div>
                    <p className="pdf-brand">ALZAVA <span>BATTLE IQ</span></p>
                    <p className="pdf-kicker">COGNITIVE PROFILE · DEEP DIVE</p>
                  </div>
                </div>
                <div className="pdf-report-number">NO. {reportNumber}</div>
              </div>

              <div className="pdf-page-title pdf-deep-title">
                <div><p className="pdf-section-label">DEEP DIVE</p><h2>Apa arti profil kemampuan Anda?</h2></div>
                <span>{domains.length} domain terukur</span>
              </div>

              <div className="pdf-domain-list">
                {domains.map((domain,index)=>{
                  const meaning=domainMeaning[domain.key] || domainMeaning.fluid
                  return <article key={domain.key} className="pdf-domain-card">
                    <div className="pdf-domain-score">
                      <small>INDEKS</small>
                      <strong>{domain.index}</strong>
                      <span>{levelLabel(domain.index)}</span>
                    </div>
                    <div className="pdf-domain-body">
                      <div className="pdf-domain-head"><h3>{index+1}. {domain.label}</h3><span>{domain.correct ?? 0}/{domain.total ?? 0} benar</span></div>
                      <div className="pdf-bar"><i style={{width:clamp(domain.index)+"%"}}/></div>
                      <div className="pdf-domain-cols">
                        <div><b>YANG TERLIHAT</b><p>{meaning.strength}</p></div>
                        <div><b>KAPAN BERGUNA</b><p>{meaning.application}</p></div>
                        <div><b>NAIK LEVEL</b><p>{meaning.growth}</p></div>
                      </div>
                    </div>
                  </article>
                })}
              </div>

              <div className="pdf-interpret-box">
                <b>Interpretasi ringkas</b>
                <p>{strength ? strength.label+" adalah kekuatan paling menonjol dengan indeks "+strength.index+". " : ""}{development ? development.label+" menjadi prioritas pengembangan paling efisien dengan indeks "+development.index+". " : ""}{spread<=10 ? "Profil keseluruhan relatif seimbang." : spread<=20 ? "Perbedaan antardomain moderat dan masih mendukung fleksibilitas." : "Jarak antardomain cukup lebar sehingga jenis soal dapat memengaruhi tempo dan akurasi secara nyata."}</p>
              </div>

              <div className="pdf-profile-signature">
                <div className="pdf-profile-signature-head">
                  <div><p className="pdf-section-label">PERFORMANCE SIGNATURE</p><h2>Pola khas dari hasil tes ini</h2></div>
                  <span>{signature.title}</span>
                </div>
                <div className="pdf-grid-3">
                  <div><b>JANGKAR KINERJA</b><strong>{strength?.label || "—"}</strong><p>Domain dengan indeks tertinggi ({strength?.index ?? "—"}), menjadi modal utama saat pola soal sesuai.</p></div>
                  <div><b>LEVER PERTUMBUHAN</b><strong>{development?.label || "—"}</strong><p>Area dengan ruang peningkatan paling efisien ({development?.index ?? "—"}).</p></div>
                  <div><b>KONSISTENSI PROFIL</b><strong>{spread<=10?"Seimbang":spread<=20?"Moderat":"Terspesialisasi"}</strong><p>Selisih antardomain {spread} poin; gunakan ini untuk memilih fokus latihan berikutnya.</p></div>
                </div>
              </div>
            </div>

            <div className="pdf-page pdf-page-three" style={{breakAfter:"auto",pageBreakAfter:"auto"}}>
              <div className="pdf-page-mini-brand">
                <div className="pdf-logo-lockup">
                  <img src="/alzava-emblem-v3.svg" alt="ALZAVA Battle Point" />
                  <div>
                    <p className="pdf-brand">ALZAVA <span>BATTLE IQ</span></p>
                    <p className="pdf-kicker">ACTION PLAN · DEVELOPMENT REPORT</p>
                  </div>
                </div>
              </div>
              <div className="pdf-page-title">
                <div><p className="pdf-section-label">ACTIONABLE INSIGHT</p><h2>Kekuatan, blind spot & rencana peningkatan</h2></div>
                <span>Rencana personal · {reportNumber}</span>
              </div>

              <div className="pdf-grid-2 pdf-insight-grid">
                <article className="pdf-card">
                  <p className="pdf-section-label pdf-green">5 KEKUATAN UTAMA</p>
                  <ol className="pdf-number-list">
                    {strengths.map((item,i)=><li key={i}><b>{i+1}</b><span>{item}</span></li>)}
                  </ol>
                </article>
                <article className="pdf-card">
                  <p className="pdf-section-label pdf-gold">BLIND SPOT & TRADE-OFF</p>
                  <ul className="pdf-bullet-list">
                    {blindSpots.map((item,i)=><li key={i}>{item}</li>)}
                  </ul>
                  <p className="pdf-disclaimer-mini">Bagian ini menggambarkan pola performa pada tes, bukan label kepribadian permanen.</p>
                </article>
              </div>

              <article className="pdf-card pdf-growth">
                <div className="pdf-growth-head">
                  <div><p className="pdf-section-label">PERSONAL GROWTH PLAN</p><h2>Naikkan ceiling, bukan hanya mengulang soal.</h2></div>
                  <p>Prioritas: <b>{development?.label || "area terendah"}</b></p>
                </div>
                <div className="pdf-grid-3">
                  <div><b>7 HARI PERTAMA</b><p>{plan.week}</p><span>Target: pahami pola kesalahan dominan.</span></div>
                  <div><b>30 HARI</b><p>{plan.month}</p><span>Target: naikkan indeks domain terendah 8–12 poin.</span></div>
                  <div><b>STRATEGI SAAT TES</b><p>Jawab cepat item yang langsung terbaca, tandai mental item dua langkah, lalu sisakan waktu akhir untuk verifikasi.</p><span>Tempo saat ini: {avgSec.toFixed(1)} detik/soal.</span></div>
                </div>
              </article>

              <div className="pdf-grid-3 pdf-method">
                <div><b>Reliabilitas</b><span>{result.high_range_attempted ? "High Range tambahan telah diselesaikan." : "Hasil berasal dari tahap inti."}</span></div>
                <div><b>Format tes</b><span>{result.core_question_count || result.question_count} soal inti{result.high_range_attempted ? " + "+(result.high_range_question_count || 10)+" High Range" : ""}; total {result.question_count} jawaban.</span></div>
                <div><b>Benchmark</b><span>Peringkat dinamis mengikuti season aktif dan bukan norma populasi Indonesia.</span></div>
              </div>

              <section className="pdf-next-mission">
                <div className="pdf-next-head">
                  <div>
                    <p className="pdf-section-label">NEXT MISSION</p>
                    <h2>Satu hasil memberi gambaran. Hasil berikutnya menunjukkan perkembangan.</h2>
                  </div>
                  <span>PERSONAL BEST</span>
                </div>
                <p className="pdf-next-copy">Jangan sekadar mengejar angka IQ. Gunakan percobaan berikutnya untuk melihat apakah strategi Anda membaik: lebih akurat, lebih cepat, dan lebih stabil pada domain yang masih tertinggal.</p>
                <div className="pdf-grid-3 pdf-next-grid">
                  <div>
                    <b>01 · PERKUAT DOMAIN</b>
                    <strong>{development?.label || "Area prioritas"}</strong>
                    <span>Targetkan peningkatan 5–8 poin indeks melalui latihan yang spesifik.</span>
                  </div>
                  <div>
                    <b>02 · JAGA KETEPATAN</b>
                    <strong>{Math.min(100,Math.max(accuracy,85))}%+</strong>
                    <span>Pertahankan akurasi sambil memangkas waktu pada soal yang sudah Anda kuasai.</span>
                  </div>
                  <div>
                    <b>03 · KEJAR PERSONAL BEST</b>
                    <strong>{Number(result.battle_score||0)+20}+</strong>
                    <span>{result.national_rank===1 ? "Pertahankan posisi puncak sambil pecahkan Battle Point terbaik Anda." : "Naikkan Battle Point sedikit demi sedikit dan lihat apakah posisi season ikut bergerak."}</span>
                  </div>
                </div>
                <div className="pdf-motivation-line">“Kemajuan terbaik bukan selalu lompatan besar — tetapi bukti bahwa cara berpikir Anda semakin tajam dari percobaan ke percobaan.”</div>
              </section>

              <div className="pdf-seal-row">
                <div className="pdf-certificate-meta">
                  <p className="pdf-section-label pdf-gold">ALZAVA PREMIUM REPORT IDENTITY</p>
                  <h3>Nomor Laporan Premium</h3>
                  <b>{reportNumber}</b>
                  <div className="pdf-certificate-fields">
                    <span><small>DITERBITKAN</small>{reportIssued}</span>
                    <span><small>PEMILIK HASIL</small>{data.nickname || "Peserta"}</span>
                    <span><small>STATUS</small>Original Digital Report</span>
                  </div>
                  <p>Nomor ini mengidentifikasi dokumen hasil spesifik ini di sistem ALZAVA Battle Point. Ini adalah nomor laporan, bukan sertifikasi profesi atau kredensial psikologis.</p>
                </div>
                <PremiumSeal reference={result.attempt_id} serial={reportNumber} compact/>
              </div>

              <div className="pdf-footnote"><b>Catatan interpretasi:</b> Estimasi IQ Battle dan analisis kognitif menggambarkan performa pada sistem ALZAVA Battle Point. Ini bukan diagnosis psikologis, tes IQ klinis terstandarisasi, penilaian kepribadian, atau pengganti asesmen oleh psikolog berwenang.</div>
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
