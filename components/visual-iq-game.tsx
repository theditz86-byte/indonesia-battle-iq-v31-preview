"use client"

import { ArrowLeft, BrainCircuit, Clock3, Play, RotateCcw, Share2, Sparkles, Trophy, Zap } from "lucide-react"
import { useMemo, useRef, useState } from "react"

type Mode = "quick" | "full"
type PuzzleLayout = "sequence" | "analogy" | "matrix" | "single" | "odd"

type Puzzle = {
  id: string
  stage: string
  title: string
  hint: string
  layout: PuzzleLayout
  sequence: string[]
  options: string[]
  answer: number
}

const puzzles: Puzzle[] = [
  { id:"rot-1", stage:"Rotasi", title:"Rotasi berurutan", hint:"Bentuk berputar 90° ke arah yang sama.", layout:"sequence", sequence:["tri-up","tri-right","tri-down"], options:["tri-up","tri-left","tri-down","tri-right"], answer:1 },
  { id:"pattern-fill", stage:"Pola", title:"Bentuk dan isi", hint:"Perhatikan pergantian bentuk serta isi kosong/penuh.", layout:"sequence", sequence:["ring-open","square-fill","ring-fill"], options:["ring-open","diamond-open","square-open","square-fill"], answer:2 },
  { id:"count-dots", stage:"Pola", title:"Pertambahan elemen", hint:"Jumlah elemen bertambah mengikuti aturan tetap.", layout:"sequence", sequence:["dots-1","dots-2","dots-3"], options:["dots-5","dots-2","dots-6","dots-4"], answer:3 },
  { id:"analogy-corner", stage:"Analogi", title:"Analogi posisi", hint:"Perubahan pada pasangan pertama berlaku juga pada pasangan kedua.", layout:"analogy", sequence:["corner-tl","corner-tr","dot-tl"], options:["dot-center","dot-bl","dot-tr","dot-tl"], answer:2 },
  { id:"mirror-diag", stage:"Cermin", title:"Refleksi diagonal", hint:"Bayangkan bentuk dipantulkan terhadap garis diagonal.", layout:"single", sequence:["diag-a"], options:["diag-d","diag-a","diag-b","diag-c"], answer:2 },
  { id:"matrix-dot", stage:"Matriks", title:"Matriks 2 × 2", hint:"Posisi pada kolom kanan merupakan cerminan horizontal kolom kiri.", layout:"matrix", sequence:["dot-tl","dot-tr","dot-br"], options:["dot-center","dot-tr","dot-tl","dot-bl"], answer:3 },
  { id:"odd-fill", stage:"Klasifikasi", title:"Yang berbeda", hint:"Tiga bentuk mengikuti satu aturan yang sama. Pilih pengecualian.", layout:"odd", sequence:[], options:["square-open","ring-open","square-fill","diamond-open"], answer:2 },
  { id:"spatial-notch", stage:"Spasial", title:"Potongan pelengkap", hint:"Cari potongan yang paling tepat untuk menjadi pasangan bentuk ini.", layout:"single", sequence:["notch-left"], options:["notch-top","notch-right","notch-left","notch-bottom"], answer:1 },
  { id:"analogy-hook", stage:"Analogi", title:"Rotasi analogi", hint:"Gunakan perubahan arah pada pasangan pertama untuk menyelesaikan pasangan kedua.", layout:"analogy", sequence:["hook-up","hook-right","hook-down"], options:["hook-right","hook-up","hook-left","hook-down"], answer:2 },
  { id:"sequence-reflect", stage:"Pola", title:"Perpindahan garis dan titik", hint:"Garis serta lingkaran bergerak mengikuti urutan yang sama.", layout:"sequence", sequence:["diag-a","diag-b","diag-c"], options:["diag-c","diag-d","diag-a","diag-b"], answer:1 },
  { id:"fold-1", stage:"Lipat Kertas", title:"Lipat dan lubangi", hint:"Kertas dilipat ke kanan lalu dilubangi. Bayangkan hasil saat dibuka kembali.", layout:"single", sequence:["fold-sheet"], options:["holes-top","holes-diag","holes-horizontal","holes-vertical"], answer:2 },
  { id:"symmetry", stage:"Simetri", title:"Cari bentuk simetris", hint:"Pilih satu bentuk yang memiliki simetri vertikal sempurna.", layout:"odd", sequence:[], options:["asym-left","kite-sym","asym-right","hook-up"], answer:1 },
  { id:"matrix-combine", stage:"Matriks", title:"Gabungan bentuk", hint:"Kotak ketiga pada setiap baris merupakan gabungan dua kotak sebelumnya.", layout:"matrix", sequence:["bar-h","bar-v","cross-plus"], options:["bar-v","cross-x","cross-plus","bar-h"], answer:2 },
  { id:"boss-direction", stage:"Logika Visual", title:"Arah dan jumlah", hint:"Dua aturan berjalan bersama: arah berubah dan jumlah titik bertambah.", layout:"sequence", sequence:["pair-up-1","pair-right-2","pair-down-3"], options:["pair-right-4","pair-left-4","pair-up-4","pair-left-2"], answer:1 },
  { id:"final-matrix", stage:"Tantangan Akhir", title:"Matriks 3 × 3", hint:"Setiap baris menggabungkan dua garis menjadi bentuk di kolom ketiga.", layout:"matrix", sequence:["bar-h","bar-v","cross-plus","diag-slash","diag-backslash","cross-x","cross-plus","cross-x"], options:["cross-plus","diag-backslash","star-eight","bar-h"], answer:2 },
]

function Shape({ code, small=false }: { code:string; small?:boolean }) {
  const cls = small ? "h-14 w-14" : "h-20 w-20"
  const base = "stroke-current text-cyan-100"
  const dot=(x:number,y:number,r=4,fill="currentColor")=><circle cx={x} cy={y} r={r} fill={fill} />
  const common=<rect x="8" y="8" width="84" height="84" rx="18" fill="rgba(15,23,42,.72)" stroke="rgba(148,163,184,.22)" />
  let body: React.ReactNode = null

  switch(code){
    case "tri-up": body=<polygon points="50,22 76,72 24,72" fill="rgba(34,211,238,.22)" strokeWidth="5"/>; break
    case "tri-right": body=<polygon points="28,24 78,50 28,76" fill="rgba(34,211,238,.22)" strokeWidth="5"/>; break
    case "tri-down": body=<polygon points="24,28 76,28 50,78" fill="rgba(34,211,238,.22)" strokeWidth="5"/>; break
    case "tri-left": body=<polygon points="72,24 22,50 72,76" fill="rgba(34,211,238,.22)" strokeWidth="5"/>; break
    case "pair-up-1": body=<><path d="M50 74V28M50 28l-12 14M50 28l12 14" fill="none" strokeWidth="5"/>{dot(72,72)}</>; break
    case "pair-right-2": body=<><path d="M26 50h48M74 50L60 38M74 50L60 62" fill="none" strokeWidth="5"/>{dot(30,28)}{dot(30,72)}</>; break
    case "pair-down-3": body=<><path d="M50 26v48M50 74L38 60M50 74l12-14" fill="none" strokeWidth="5"/>{dot(28,28)}{dot(72,28)}{dot(50,20)}</>; break
    case "pair-left-4": body=<><path d="M74 50H26M26 50l14-12M26 50l14 12" fill="none" strokeWidth="5"/>{dot(72,24)}{dot(72,76)}{dot(58,24)}{dot(58,76)}</>; break
    case "pair-up-4": body=<><path d="M50 74V28M50 28l-12 14M50 28l12 14" fill="none" strokeWidth="5"/>{dot(28,72)}{dot(72,72)}{dot(28,58)}{dot(72,58)}</>; break
    case "pair-left-2": body=<><path d="M74 50H26M26 50l14-12M26 50l14 12" fill="none" strokeWidth="5"/>{dot(72,30)}{dot(72,70)}</>; break
    case "pair-right-4": body=<><path d="M26 50h48M74 50L60 38M74 50L60 62" fill="none" strokeWidth="5"/>{dot(28,24)}{dot(28,76)}{dot(42,24)}{dot(42,76)}</>; break
    case "dots-1": body=<>{dot(50,50,6)}</>; break
    case "dots-2": body=<>{dot(38,50,6)}{dot(62,50,6)}</>; break
    case "dots-3": body=<>{dot(30,50,6)}{dot(50,50,6)}{dot(70,50,6)}</>; break
    case "dots-4": body=<>{dot(34,34,6)}{dot(66,34,6)}{dot(34,66,6)}{dot(66,66,6)}</>; break
    case "dots-5": body=<>{dot(32,32,5)}{dot(68,32,5)}{dot(50,50,5)}{dot(32,68,5)}{dot(68,68,5)}</>; break
    case "dots-6": body=<>{[30,50,70].flatMap((x)=>[38,62].map((y)=><circle key={x+"-"+y} cx={x} cy={y} r="5" fill="currentColor"/>))}</>; break
    case "ring-open": body=<circle cx="50" cy="50" r="24" fill="none" strokeWidth="6"/>; break
    case "ring-fill": body=<circle cx="50" cy="50" r="24" fill="currentColor" opacity=".72"/>; break
    case "square-fill": body=<rect x="28" y="28" width="44" height="44" rx="6" fill="currentColor" opacity=".72"/>; break
    case "square-open": body=<rect x="28" y="28" width="44" height="44" rx="6" fill="none" strokeWidth="6"/>; break
    case "diamond-open": body=<rect x="31" y="31" width="38" height="38" transform="rotate(45 50 50)" fill="none" strokeWidth="6"/>; break
    case "corner-tl": body=<path d="M68 68H34V34h22" fill="none" strokeWidth="7" strokeLinecap="round"/>; break
    case "corner-tr": body=<path d="M32 68h34V34H44" fill="none" strokeWidth="7" strokeLinecap="round"/>; break
    case "corner-bl": body=<path d="M68 32H34v34h22" fill="none" strokeWidth="7" strokeLinecap="round"/>; break
    case "corner-br": body=<path d="M32 32h34v34H44" fill="none" strokeWidth="7" strokeLinecap="round"/>; break
    case "diag-a": body=<><path d="M28 72L72 28" strokeWidth="6"/><circle cx="34" cy="34" r="8" fill="none" strokeWidth="5"/></>; break
    case "diag-b": body=<><path d="M28 28L72 72" strokeWidth="6"/><circle cx="66" cy="34" r="8" fill="none" strokeWidth="5"/></>; break
    case "diag-c": body=<><path d="M28 28L72 72" strokeWidth="6"/><circle cx="34" cy="66" r="8" fill="none" strokeWidth="5"/></>; break
    case "diag-d": body=<><path d="M28 72L72 28" strokeWidth="6"/><circle cx="66" cy="66" r="8" fill="none" strokeWidth="5"/></>; break
    case "bar-h": body=<path d="M24 50h52" strokeWidth="8" strokeLinecap="round"/>; break
    case "bar-v": body=<path d="M50 24v52" strokeWidth="8" strokeLinecap="round"/>; break
    case "cross-plus": body=<><path d="M24 50h52M50 24v52" strokeWidth="7" strokeLinecap="round"/></>; break
    case "cross-x": body=<path d="M30 30l40 40M70 30L30 70" strokeWidth="7" strokeLinecap="round"/>; break
    case "dot-tl": body=<>{dot(32,32,8)}</>; break
    case "dot-tr": body=<>{dot(68,32,8)}</>; break
    case "dot-br": body=<>{dot(68,68,8)}</>; break
    case "dot-bl": body=<>{dot(32,68,8)}</>; break
    case "dot-center": body=<>{dot(50,50,8)}</>; break
    case "notch-left": body=<path d="M28 28h44v44H28V58h14V42H28z" fill="rgba(34,211,238,.20)" strokeWidth="5"/>; break
    case "notch-right": body=<path d="M28 28h44v14H58v16h14v14H28z" fill="rgba(34,211,238,.20)" strokeWidth="5"/>; break
    case "notch-top": body=<path d="M28 28h14v14h16V28h14v44H28z" fill="rgba(34,211,238,.20)" strokeWidth="5"/>; break
    case "notch-bottom": body=<path d="M28 28h44v44H58V58H42v14H28z" fill="rgba(34,211,238,.20)" strokeWidth="5"/>; break
    case "hook-up": body=<path d="M32 68V34h28c9 0 14 6 14 14s-5 14-14 14H48" fill="none" strokeWidth="7" strokeLinecap="round"/>; break
    case "hook-down": body=<path d="M68 32v34H40c-9 0-14-6-14-14s5-14 14-14h12" fill="none" strokeWidth="7" strokeLinecap="round"/>; break
    case "hook-left": body=<path d="M68 68H34V40c0-9 6-14 14-14s14 5 14 14v12" fill="none" strokeWidth="7" strokeLinecap="round"/>; break
    case "hook-right": body=<path d="M32 32h34v28c0 9-6 14-14 14s-14-5-14-14V48" fill="none" strokeWidth="7" strokeLinecap="round"/>; break
    case "boss-a": body=<><polygon points="50,24 70,62 30,62" fill="none" strokeWidth="5"/>{dot(50,76,5)}</>; break
    case "boss-b": body=<><polygon points="28,50 66,30 66,70" fill="none" strokeWidth="5"/>{dot(80,42,5)}{dot(80,58,5)}</>; break
    case "boss-c": body=<><polygon points="50,76 30,38 70,38" fill="none" strokeWidth="5"/>{dot(34,22,5)}{dot(50,18,5)}{dot(66,22,5)}</>; break
    case "boss-d": body=<><polygon points="72,50 34,30 34,70" fill="none" strokeWidth="5"/>{dot(18,30,4)}{dot(18,44,4)}{dot(18,58,4)}{dot(18,72,4)}</>; break
    case "final-a": body=<><rect x="26" y="26" width="48" height="48" rx="8" fill="none" strokeWidth="5"/><path d="M26 50h48" strokeWidth="4"/></>; break
    case "final-b": body=<><rect x="26" y="26" width="48" height="48" rx="8" fill="none" strokeWidth="5"/><path d="M50 26v48" strokeWidth="4"/></>; break
    case "final-c": body=<><rect x="26" y="26" width="48" height="48" rx="8" fill="none" strokeWidth="5"/><path d="M30 30l40 40" strokeWidth="4"/></>; break
    case "final-d": body=<><rect x="26" y="26" width="48" height="48" rx="8" fill="none" strokeWidth="5"/><path d="M70 30L30 70" strokeWidth="4"/></>; break
    case "diag-slash": body=<path d="M28 72L72 28" fill="none" strokeWidth="7" strokeLinecap="round"/>; break
    case "diag-backslash": body=<path d="M28 28L72 72" fill="none" strokeWidth="7" strokeLinecap="round"/>; break
    case "star-eight": body=<path d="M24 50h52M50 24v52M30 30l40 40M70 30L30 70" fill="none" strokeWidth="5.5" strokeLinecap="round"/>; break
    case "fold-sheet": body=<><rect x="24" y="20" width="52" height="60" rx="4" fill="rgba(34,211,238,.08)" strokeWidth="4"/><path d="M50 20v60" strokeDasharray="5 5" strokeWidth="3"/><path d="M35 50h30" strokeWidth="3"/>{dot(62,50,5)}</>; break
    case "holes-top": body=<><rect x="24" y="20" width="52" height="60" rx="4" fill="none" strokeWidth="4"/>{dot(38,34,5)}{dot(62,34,5)}</>; break
    case "holes-diag": body=<><rect x="24" y="20" width="52" height="60" rx="4" fill="none" strokeWidth="4"/>{dot(38,36,5)}{dot(62,64,5)}</>; break
    case "holes-horizontal": body=<><rect x="24" y="20" width="52" height="60" rx="4" fill="none" strokeWidth="4"/>{dot(38,50,5)}{dot(62,50,5)}</>; break
    case "holes-vertical": body=<><rect x="24" y="20" width="52" height="60" rx="4" fill="none" strokeWidth="4"/>{dot(50,36,5)}{dot(50,64,5)}</>; break
    case "kite-sym": body=<polygon points="50,20 72,50 50,80 28,50" fill="rgba(34,211,238,.16)" strokeWidth="5"/>; break
    case "asym-left": body=<polygon points="38,20 72,42 62,78 24,62" fill="rgba(34,211,238,.12)" strokeWidth="5"/>; break
    case "asym-right": body=<polygon points="62,20 76,62 38,78 28,42" fill="rgba(34,211,238,.12)" strokeWidth="5"/>; break
  }

  return <svg viewBox="0 0 100 100" className={cls+" "+base} aria-hidden="true">{common}{body}</svg>
}

function tierFor(score:number){
  if(score>=900) return "MAESTRO"
  if(score>=800) return "BERLIAN"
  if(score>=700) return "PLATINUM"
  if(score>=600) return "EMAS"
  if(score>=450) return "PERAK"
  return "PERUNGGU"
}

function estimateVisualIq(correct:number, elapsed:number){
  const base=[75,78,82,86,90,94,98,102,106,110,114,118,123,128,134,140][Math.max(0,Math.min(15,correct))]
  const speed=correct>=10 ? (elapsed<=180?2:elapsed<=300?1:elapsed>=600?-1:0) : 0
  return Math.max(75,Math.min(142,base+speed))
}

export function VisualIqGame(){
  const [mode,setMode]=useState<Mode|null>(null)
  const [index,setIndex]=useState(0)
  const [answers,setAnswers]=useState<number[]>([])
  const [startedAt,setStartedAt]=useState(0)
  const [finishedAt,setFinishedAt]=useState(0)
  const [locked,setLocked]=useState(false)
  const [shareStatus,setShareStatus]=useState("")
  const timerRef=useRef<number|null>(null)

  const activePuzzles=useMemo(()=>puzzles,[])
  const current=activePuzzles[index]
  const done=Boolean(mode)&&index>=activePuzzles.length
  const elapsed=Math.max(0,Math.round(((finishedAt||Date.now())-startedAt)/1000))
  const correct=done?answers.reduce((n,a,i)=>n+(a===activePuzzles[i]?.answer?1:0),0):0
  const speedBonus=done?Math.max(0,Math.round(180-elapsed*1.2)):0
  const score=done?Math.max(0,Math.min(1000,Math.round((correct/activePuzzles.length)*800+speedBonus))):0
  const tier=tierFor(score)

  function start(next:Mode){
    if(timerRef.current) window.clearTimeout(timerRef.current)
    setMode(next); setIndex(0); setAnswers([]); setStartedAt(Date.now()); setFinishedAt(0); setLocked(false); setShareStatus("")
  }

  function choose(option:number){
    if(locked||!current) return
    setLocked(true)
    const nextAnswers=[...answers,option]
    setAnswers(nextAnswers)
    timerRef.current=window.setTimeout(()=>{
      if(index+1>=activePuzzles.length){
        setFinishedAt(Date.now())
        setIndex(activePuzzles.length)
      }else{
        setIndex(index+1)
      }
      setLocked(false)
    },280)
  }

  function reset(){
    if(timerRef.current) window.clearTimeout(timerRef.current)
    setMode(null); setIndex(0); setAnswers([]); setStartedAt(0); setFinishedAt(0); setLocked(false); setShareStatus("")
  }

  async function shareResult(iq:number, accuracy:number){
    const url=`${window.location.origin}/visual-iq/`
    const text=`🧠 Hasil Tes IQ Visual ALZAVA\nEstimasi IQ Visual: ${iq} ± 5\nBenar: ${correct}/15 · Akurasi: ${accuracy}% · Waktu: ${Math.floor(elapsed/60)}:${String(elapsed%60).padStart(2,"0")}\n\nBerani kalahkan hasilku? Coba di ${url}`
    try{
      if(navigator.share){
        await navigator.share({title:"Hasil Tes IQ Visual ALZAVA",text,url})
        setShareStatus("Hasil siap dibagikan.")
        return
      }
      await navigator.clipboard.writeText(text)
      setShareStatus("Hasil disalin. Tempelkan ke WhatsApp atau media sosial.")
    }catch{
      try{
        await navigator.clipboard.writeText(text)
        setShareStatus("Hasil disalin. Tempelkan ke WhatsApp atau media sosial.")
      }catch{
        setShareStatus("Bagikan tautan halaman ini ke temanmu.")
      }
    }
  }

  if(!mode){
    return <div className="min-h-screen bg-[radial-gradient(circle_at_50%_0%,rgba(67,56,202,.22),transparent_32%),linear-gradient(180deg,#020617,#061126_55%,#020617)] text-white">
      <header className="mx-auto flex max-w-md items-center justify-between gap-3 px-4 py-4">
        <a href="/battle" className="inline-flex min-w-0 items-center gap-2 text-sm font-black text-slate-300 hover:text-white"><ArrowLeft className="h-4 w-4 shrink-0"/>Battle Point</a>
        <div className="flex shrink-0 items-center gap-2"><img src="/brand/alvaza-logo-new.svg" alt="ALZAVA" className="h-8 w-8"/><span className="text-xs font-black sm:text-sm">ALZAVA <span className="text-cyan-300">Tes IQ</span></span></div>
      </header>
      <main className="mx-auto max-w-md px-4 pb-14 pt-3">
        <div className="rounded-[28px] border border-cyan-300/20 bg-slate-950/55 p-5 shadow-[0_24px_70px_rgba(0,0,0,.35)] backdrop-blur-xl">
          <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[.16em] text-cyan-300"><Sparkles className="h-4 w-4"/>Tes Visual Interaktif</div>
          <h1 className="mt-3 text-4xl font-black leading-[.98]">Ketahui <span className="bg-gradient-to-r from-cyan-300 via-violet-300 to-fuchsia-300 bg-clip-text text-transparent">IQ-mu</span></h1>
          <p className="mt-4 text-sm leading-6 text-slate-300">Uji kemampuan figural dan spasialmu melalui tantangan visual bergaya game yang nyaman dimainkan dari HP.</p>
          <div className="mt-5 grid grid-cols-3 gap-2 text-center text-[10px] font-bold text-slate-300">
            <div className="rounded-xl border border-white/10 bg-white/[.04] p-3"><BrainCircuit className="mx-auto mb-1 h-5 w-5 text-cyan-300"/>Figural</div>
            <div className="rounded-xl border border-white/10 bg-white/[.04] p-3"><RotateCcw className="mx-auto mb-1 h-5 w-5 text-violet-300"/>Spasial</div>
            <div className="rounded-xl border border-white/10 bg-white/[.04] p-3"><Trophy className="mx-auto mb-1 h-5 w-5 text-amber-300"/>15 Soal</div>
          </div>
        </div>

        <button type="button" onClick={()=>start("full")} className="mt-4 w-full rounded-2xl border border-cyan-300/35 bg-gradient-to-r from-cyan-500/18 via-indigo-500/18 to-violet-500/18 p-5 text-left shadow-[0_0_30px_rgba(34,211,238,.10)] transition hover:border-cyan-300/55">
          <div className="flex items-center justify-between"><span className="text-xs font-black uppercase tracking-[.14em] text-cyan-300">Tes IQ Visual</span><Zap className="h-5 w-5 text-cyan-300"/></div>
          <div className="mt-2 text-3xl font-black text-white">15 Soal Figural</div>
          <div className="mt-1 text-sm text-slate-300">Sekitar 8–10 menit · hasil langsung · satu tantangan penuh</div>
          <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-2.5 text-sm font-black text-slate-950"><Play className="h-4 w-4"/>MULAI TES</div>
        </button>

        <p className="mt-4 px-2 text-center text-[11px] leading-5 text-slate-500">Hasil berupa skor dan gambaran kemampuan visual, bukan diagnosis IQ klinis resmi.</p>
      </main>
    </div>
  }

  if(done){
    const accuracy=Math.round((correct/activePuzzles.length)*100)
    const iq=estimateVisualIq(correct,elapsed)
    return <div className="min-h-screen bg-[radial-gradient(circle_at_50%_0%,rgba(124,58,237,.24),transparent_34%),linear-gradient(180deg,#020617,#071427_55%,#020617)] text-white">
      <main className="mx-auto max-w-md px-4 pb-14 pt-8">
        <div className="text-center">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl border border-amber-300/30 bg-amber-300/10 shadow-[0_0_40px_rgba(251,191,36,.16)]"><Trophy className="h-10 w-10 text-amber-300"/></div>
          <div className="mt-4 text-xs font-black uppercase tracking-[.22em] text-violet-300">Tes IQ Visual Selesai</div>
          <div className="mt-2 text-sm font-black uppercase tracking-[.12em] text-slate-400">Estimasi IQ Visual</div>
          <div className="mt-1 text-7xl font-black tabular-nums text-cyan-300">{iq}</div>
          <div className="mt-1 text-sm font-black text-slate-300">± 5 poin · {tier}</div>
          <p className="mx-auto mt-2 max-w-xs text-[11px] leading-5 text-slate-500">Estimasi indikatif dari tes visual 15 soal, bukan hasil psikotes klinis atau diagnosis profesional.</p>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-2">
          <div className="rounded-2xl border border-white/10 bg-white/[.04] p-3 text-center"><div className="text-xl font-black">{correct}/{activePuzzles.length}</div><div className="mt-1 text-[10px] font-bold text-slate-500">BENAR</div></div>
          <div className="rounded-2xl border border-white/10 bg-white/[.04] p-3 text-center"><div className="text-xl font-black">{accuracy}%</div><div className="mt-1 text-[10px] font-bold text-slate-500">AKURASI</div></div>
          <div className="rounded-2xl border border-white/10 bg-white/[.04] p-3 text-center"><div className="text-xl font-black">{Math.floor(elapsed/60)}:{String(elapsed%60).padStart(2,"0")}</div><div className="mt-1 text-[10px] font-bold text-slate-500">WAKTU</div></div>
        </div>

        <div className="mt-5 rounded-2xl border border-cyan-300/15 bg-cyan-300/[.05] p-4">
          <div className="text-xs font-black uppercase tracking-[.14em] text-cyan-300">Gambaran Kemampuan</div>
          <p className="mt-2 text-sm leading-6 text-slate-300">{accuracy>=87?"Kemampuan penalaran visual-spasialmu sangat kuat. Kamu cepat menangkap pola, rotasi, hubungan bentuk, dan transformasi visual.":accuracy>=67?"Kemampuan visualmu cukup kuat. Latihan pada matriks, analogi bentuk, dan rotasi mental akan membantu meningkatkan konsistensi.":"Masih ada ruang besar untuk meningkatkan rotasi mental, pola, matriks, dan refleksi visual."}</p>
        </div>

        <button type="button" onClick={()=>void shareResult(iq,accuracy)} className="mt-5 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-400 to-violet-500 px-5 text-base font-black text-slate-950 shadow-[0_0_34px_rgba(34,211,238,.20)]">
          <Share2 className="h-5 w-5"/> Bagikan Hasil & Tantang Teman
        </button>
        {shareStatus && <p className="mt-2 text-center text-[11px] font-bold text-cyan-200">{shareStatus}</p>}

        <div className="mt-3 grid grid-cols-2 gap-3">
          <button type="button" onClick={()=>start(mode)} className="min-h-12 rounded-xl border border-white/10 bg-white/[.06] text-sm font-black text-white hover:bg-white/[.10]"><RotateCcw className="mr-2 inline h-4 w-4"/>Ulangi</button>
          <button type="button" onClick={reset} className="min-h-12 rounded-xl border border-white/10 bg-white/[.06] text-sm font-black text-white hover:bg-white/[.10]">Menu Utama</button>
        </div>
        <a href="/battle" className="mt-3 flex min-h-11 items-center justify-center text-sm font-bold text-slate-400 hover:text-white"><ArrowLeft className="mr-2 h-4 w-4"/>Kembali ke Battle Point</a>
      </main>
    </div>
  }

  const stage=current.stage
  const progress=((index)/activePuzzles.length)*100

  return <div className="min-h-screen bg-[radial-gradient(circle_at_50%_0%,rgba(14,165,233,.13),transparent_30%),linear-gradient(180deg,#020617,#071426_52%,#020617)] text-white">
    <header className="mx-auto max-w-md px-4 pt-4">
      <div className="flex items-center justify-between">
        <button type="button" onClick={reset} className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[.04] text-slate-300"><ArrowLeft className="h-5 w-5"/></button>
        <div className="text-center"><div className="text-[10px] font-black uppercase tracking-[.18em] text-cyan-300">{stage}</div><div className="text-xs font-bold text-slate-500">{index+1} / {activePuzzles.length}</div></div>
        <div className="grid h-10 min-w-10 place-items-center rounded-xl border border-white/10 bg-white/[.04] px-2 text-slate-300"><Clock3 className="h-4 w-4"/></div>
      </div>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 transition-all" style={{width:`${progress}%`}}/></div>
    </header>

    <main className="mx-auto max-w-md px-4 pb-12 pt-6">
      <div className="text-center">
        <div className="text-[11px] font-black uppercase tracking-[.15em] text-slate-500">{current.title}</div>
        <p className="mt-2 text-sm font-medium text-slate-300">{current.hint}</p>
      </div>

      <div className="mt-5 rounded-[28px] border border-white/10 bg-slate-950/50 p-4 backdrop-blur-xl">
        {current.layout==="sequence" && <div className="flex min-h-[116px] items-center justify-center gap-1.5">
          {current.sequence.map((code,i)=><div key={code+"-"+i} className="flex items-center gap-1.5"><Shape code={code}/>{i<current.sequence.length-1&&<span className="text-xl font-black text-slate-600">→</span>}</div>)}
          <div className="ml-1 grid h-20 w-20 place-items-center rounded-[18px] border border-dashed border-cyan-300/35 bg-cyan-300/[.04] text-3xl font-black text-cyan-300">?</div>
        </div>}

        {current.layout==="analogy" && <div className="grid min-h-[220px] grid-cols-[1fr_auto_1fr] items-center gap-2">
          <div className="flex justify-center"><Shape code={current.sequence[0]}/></div><span className="text-2xl font-black text-slate-500">:</span><div className="flex justify-center"><Shape code={current.sequence[1]}/></div>
          <div className="flex justify-center"><Shape code={current.sequence[2]}/></div><span className="text-2xl font-black text-slate-500">:</span><div className="flex justify-center"><div className="grid h-20 w-20 place-items-center rounded-[18px] border border-dashed border-cyan-300/35 bg-cyan-300/[.04] text-3xl font-black text-cyan-300">?</div></div>
        </div>}

        {current.layout==="matrix" && current.sequence.length===3 && <div className="mx-auto grid min-h-[210px] max-w-[190px] grid-cols-2 place-items-center gap-3">
          <Shape code={current.sequence[0]}/><Shape code={current.sequence[1]}/><Shape code={current.sequence[2]}/><div className="grid h-20 w-20 place-items-center rounded-[18px] border border-dashed border-cyan-300/35 bg-cyan-300/[.04] text-3xl font-black text-cyan-300">?</div>
        </div>}

        {current.layout==="matrix" && current.sequence.length===8 && <div className="mx-auto grid min-h-[260px] max-w-[280px] grid-cols-3 place-items-center gap-1.5">
          {current.sequence.map((code,i)=><Shape key={code+"-"+i} code={code} small/>)}
          <div className="grid h-14 w-14 place-items-center rounded-[14px] border border-dashed border-cyan-300/35 bg-cyan-300/[.04] text-2xl font-black text-cyan-300">?</div>
        </div>}

        {current.layout==="single" && <div className="flex min-h-[170px] items-center justify-center">
          <Shape code={current.sequence[0]}/>
        </div>}

        {current.layout==="odd" && <div className="flex min-h-[116px] flex-col items-center justify-center text-center">
          <BrainCircuit className="h-10 w-10 text-violet-300"/>
          <div className="mt-3 text-sm font-black text-white">Pilih satu bentuk yang berbeda</div>
          <div className="mt-1 text-xs text-slate-500">Bandingkan aturan yang sama pada keempat pilihan.</div>
        </div>}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {current.options.map((code,i)=><button key={code+"-"+i} type="button" disabled={locked} onClick={()=>choose(i)} className="group min-h-[112px] rounded-2xl border border-white/10 bg-white/[.04] p-3 transition active:scale-[.98] disabled:opacity-70 hover:border-cyan-300/35 hover:bg-cyan-300/[.06]">
          <div className="flex items-center justify-between text-[10px] font-black text-slate-500"><span>{String.fromCharCode(65+i)}</span><span className="opacity-0 transition group-hover:opacity-100">PILIH</span></div>
          <div className="mt-1 flex justify-center"><Shape code={code} small/></div>
        </button>)}
      </div>

      <div className="mt-5 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[.12em] text-slate-600"><Sparkles className="h-3.5 w-3.5"/>Jawaban dikunci setelah dipilih</div>
    </main>
  </div>
}
