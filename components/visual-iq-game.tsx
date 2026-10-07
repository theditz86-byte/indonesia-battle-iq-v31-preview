"use client"

import { ArrowLeft, BrainCircuit, Clock3, LockKeyhole, Play, RotateCcw, Share2, Sparkles, Trophy } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { getParticipantToken } from "@/lib/battle"

const ACCOUNT_API = "https://efndozplpwyemzgqfnep.supabase.co/functions/v1/battle-account"
const VISUAL_IQ_API = "https://efndozplpwyemzgqfnep.supabase.co/functions/v1/battle-visual-iq"

type Pos = "tl"|"tr"|"bl"|"br"|"c"|"t"|"r"|"b"|"l"
type GlyphKind = "triangle"|"square"|"circle"|"diamond"|"pentagon"|"hexagon"|"arrow"|"corner"|"hook"|"plus"|"x"|"star"|"notch"|"bar"|"fold"|"holes"
type Glyph = {
  kind: GlyphKind
  rotation?: number
  filled?: boolean
  dot?: Pos
  dots?: Pos[]
  variant?: number
}
type Layout = "sequence"|"analogy"|"matrix2"|"matrix3"|"single"|"odd"|"combine"
type Question = {
  id: string
  stage: string
  title: string
  hint: string
  layout: Layout
  difficulty: 2|3|4
  cells: Glyph[]
  options: Glyph[]
  answer: number
}
type Participant = {
  nickname?: string
  account_ready?: boolean
}
type SaveState = "idle"|"saving"|"saved"|"error"

const g=(kind:GlyphKind,rotation=0,filled=false,dot?:Pos,dots?:Pos[],variant?:number):Glyph=>({kind,rotation,filled,dot,dots,variant})

const QUESTIONS:Question[]=[
  {id:"rot-triangle-90",stage:"Rotasi",title:"Rotasi tetap",hint:"Arah berubah dengan besar sudut yang sama.",layout:"sequence",difficulty:2,cells:[g("triangle",0),g("triangle",90),g("triangle",180)],options:[g("triangle",0),g("triangle",270),g("triangle",180),g("triangle",90)],answer:1},
  {id:"fill-alternate",stage:"Pola",title:"Bentuk dan isi",hint:"Perhatikan dua aturan sekaligus: jenis bentuk dan isi.",layout:"sequence",difficulty:2,cells:[g("circle",0,false),g("square",0,true),g("circle",0,true)],options:[g("circle",0,false),g("diamond",0,false),g("square",0,false),g("square",0,true)],answer:2},
  {id:"count-dots",stage:"Pola",title:"Pertambahan elemen",hint:"Jumlah titik mengikuti pertambahan teratur.",layout:"sequence",difficulty:2,cells:[g("circle",0,false,undefined,["c"]),g("circle",0,false,undefined,["l","r"]),g("circle",0,false,undefined,["t","bl","br"])],options:[g("circle",0,false,undefined,["tl","tr","bl","br","c"]),g("circle",0,false,undefined,["l","r"]),g("circle",0,false,undefined,["t","b","l","r","c"]),g("circle",0,false,undefined,["tl","tr","bl","br"])],answer:3},
  {id:"mirror-corner",stage:"Cermin",title:"Cermin Vertikal",hint:"Bayangkan bentuk dipantulkan dari kiri ke kanan.",layout:"single",difficulty:2,cells:[g("corner",0,false,"tl")],options:[g("corner",90,false,"tr"),g("corner",0,false,"tr"),g("corner",180,false,"br"),g("corner",270,false,"bl")],answer:0},
  {id:"matrix-position",stage:"Matriks",title:"Perpindahan posisi",hint:"Hubungan kiri-ke-kanan pada baris atas juga berlaku pada baris bawah.",layout:"matrix2",difficulty:2,cells:[g("square",0,false,"tl"),g("square",0,false,"tr"),g("square",0,false,"br")],options:[g("square",0,false,"tr"),g("square",0,false,"c"),g("square",0,false,"bl"),g("square",0,false,"tl")],answer:2},
  {id:"shape-sides",stage:"Pola",title:"Jumlah sisi",hint:"Bentuk bertambah satu sisi setiap langkah.",layout:"sequence",difficulty:2,cells:[g("triangle"),g("square"),g("pentagon")],options:[g("diamond"),g("circle"),g("hexagon"),g("star")],answer:2},

  {id:"analogy-arrow-dot",stage:"Analogi",title:"Rotasi dan titik",hint:"Gunakan perubahan pada pasangan pertama untuk menyelesaikan pasangan kedua.",layout:"analogy",difficulty:3,cells:[g("arrow",0,false,"r"),g("arrow",90,false,"b"),g("triangle",180,false,"l")],options:[g("triangle",270,false,"t"),g("triangle",90,false,"b"),g("triangle",270,false,"r"),g("triangle",0,false,"t")],answer:0},
  {id:"overlay-lines",stage:"Matriks",title:"Gabungan garis",hint:"Dua gambar pertama digabung tanpa menghilangkan garis.",layout:"analogy",difficulty:3,cells:[g("bar",0),g("bar",90),g("bar",45)],options:[g("x"),g("bar",135),g("plus"),g("star")],answer:1},
  {id:"double-rotation",stage:"Pola",title:"Rotasi bertingkat",hint:"Besar putaran bertambah: +90°, lalu +180°, lalu +270°.",layout:"sequence",difficulty:3,cells:[g("arrow",0),g("arrow",90),g("arrow",270)],options:[g("arrow",180),g("arrow",90),g("arrow",270),g("arrow",0)],answer:0},
  {id:"shape-fill-analogy",stage:"Analogi",title:"Bentuk, isi, dan rotasi",hint:"Cari transformasi yang mengubah ketiga ciri sekaligus.",layout:"analogy",difficulty:3,cells:[g("triangle",0,false,"t"),g("triangle",90,true,"r"),g("diamond",180,false,"b")],options:[g("diamond",270,false,"l"),g("diamond",270,true,"l"),g("diamond",90,true,"r"),g("diamond",180,true,"b")],answer:1},
  {id:"fold-one",stage:"Lipat Kertas",title:"Satu lipatan",hint:"Kertas dilipat ke kanan lalu satu lubang dibuat. Bagaimana hasil setelah dibuka?",layout:"single",difficulty:3,cells:[g("fold",0,false,undefined,["r"],1)],options:[g("holes",0,false,undefined,["t","b"]),g("holes",0,false,undefined,["tl","br"]),g("holes",0,false,undefined,["l","r"]),g("holes",0,false,undefined,["c"])],answer:2},
  {id:"notch-rotation",stage:"Spasial",title:"Rotasi potongan",hint:"Pilih bentuk yang sama setelah diputar 180°.",layout:"single",difficulty:3,cells:[g("notch",0)],options:[g("notch",90),g("notch",270),g("notch",0),g("notch",180)],answer:3},
  {id:"odd-dot-rule",stage:"Klasifikasi",title:"Pilih Satu Pola yang Berbeda",hint:"Tiga pilihan menempatkan titik 90° searah dari arah panah.",layout:"odd",difficulty:3,cells:[],options:[g("arrow",0,false,"r"),g("arrow",90,false,"b"),g("arrow",180,false,"r"),g("arrow",270,false,"t")],answer:2},
  {id:"matrix-fill",stage:"Matriks",title:"Isi bergantian",hint:"Bentuk tetap, tetapi posisi isi mengikuti hubungan baris dan kolom.",layout:"matrix2",difficulty:3,cells:[g("diamond",0,false),g("diamond",0,true),g("square",0,true)],options:[g("square",0,true),g("circle",0,false),g("square",0,false),g("diamond",0,false)],answer:2},
  {id:"sequence-two-rule",stage:"Logika Visual",title:"Dua aturan sekaligus",hint:"Arah berputar 90°, sementara titik bergerak berlawanan arah.",layout:"sequence",difficulty:3,cells:[g("arrow",0,false,"r"),g("arrow",90,false,"t"),g("arrow",180,false,"l")],options:[g("arrow",270,false,"b"),g("arrow",270,false,"r"),g("arrow",0,false,"b"),g("arrow",90,false,"b")],answer:0},
  {id:"combine-plus-x",stage:"Gabungan",title:"Tumpuk kedua bentuk",hint:"Gabungkan seluruh garis pada dua kotak pertama.",layout:"combine",difficulty:3,cells:[g("plus"),g("x")],options:[g("plus"),g("x"),g("star"),g("bar",45)],answer:2},
  {id:"symmetry-dot",stage:"Simetri",title:"Pilih Bentuk yang Simetris Vertikal",hint:"Pilih bentuk yang tetap sama jika dilipat tepat pada sumbu vertikal.",layout:"odd",difficulty:3,cells:[],options:[g("diamond",0,false,"l"),g("triangle",0,false,"c"),g("square",0,false,"tr"),g("pentagon",0,false,"r")],answer:1},
  {id:"mirror-compound",stage:"Cermin",title:"Cermin Vertikal · Bentuk Bertanda",hint:"Pantulkan bentuk dan posisi titik dari kiri ke kanan.",layout:"single",difficulty:3,cells:[g("corner",0,false,"br")],options:[g("corner",180,false,"tl"),g("corner",90,false,"bl"),g("corner",270,false,"tr"),g("corner",0,false,"bl")],answer:1},

  {id:"mirror-horizontal",stage:"Cermin",title:"Cermin Horizontal",hint:"Pantulkan bentuk dari atas ke bawah.",layout:"single",difficulty:3,cells:[g("corner",0,false,"tl")],options:[g("corner",180,false,"bl"),g("corner",270,false,"bl"),g("corner",90,false,"tr"),g("corner",0,false,"br")],answer:1},

  {id:"matrix-add-side",stage:"Matriks",title:"Transformasi jumlah sisi",hint:"Hubungan pada baris atas juga berlaku pada baris bawah.",layout:"matrix2",difficulty:3,cells:[g("triangle"),g("square"),g("pentagon")],options:[g("circle"),g("hexagon"),g("diamond"),g("pentagon")],answer:1},
  {id:"analogy-180-dot",stage:"Analogi",title:"Rotasi 180° bertanda",hint:"Putar bentuk dan titik dengan transformasi yang sama.",layout:"analogy",difficulty:3,cells:[g("square",0,false,"tl"),g("square",180,false,"br"),g("triangle",90,false,"tr")],options:[g("triangle",180,false,"bl"),g("triangle",270,false,"bl"),g("triangle",270,false,"tr"),g("triangle",90,false,"br")],answer:1},

  {id:"matrix-rotation-180",stage:"Matriks",title:"Rotasi dan posisi titik",hint:"Setiap gambar di kanan adalah hasil putaran 180° dari gambar di kiri.",layout:"matrix2",difficulty:4,cells:[g("arrow",0,false,"l"),g("arrow",180,false,"r"),g("triangle",90,false,"t")],options:[g("triangle",270,false,"b"),g("triangle",90,false,"b"),g("triangle",0,false,"l"),g("triangle",180,false,"t")],answer:0},
  {id:"matrix3-rotation",stage:"Matriks",title:"Rotasi lintas baris",hint:"Arah maju 90° di setiap kolom dan juga bergeser 90° pada baris berikutnya.",layout:"matrix3",difficulty:4,cells:[g("arrow",0),g("arrow",90),g("arrow",180),g("arrow",90),g("arrow",180),g("arrow",270),g("arrow",180),g("arrow",270)],options:[g("arrow",90),g("arrow",180),g("arrow",0),g("arrow",270)],answer:2},
  {id:"hard-fill-rotation",stage:"Logika Visual",title:"Rotasi, isi, dan titik",hint:"Arah berputar 90°, isi berganti, dan titik melompat ke sudut berlawanan.",layout:"sequence",difficulty:4,cells:[g("diamond",0,false,"tl"),g("diamond",90,true,"br"),g("diamond",180,false,"tr")],options:[g("diamond",270,true,"tr"),g("diamond",270,true,"bl"),g("diamond",0,true,"bl"),g("diamond",180,true,"tl")],answer:1},

  {id:"matrix3-overlay",stage:"Matriks",title:"Matriks gabungan 3 × 3",hint:"Kotak ketiga pada setiap baris adalah gabungan dua kotak sebelumnya.",layout:"matrix3",difficulty:4,cells:[g("bar",0),g("bar",90),g("plus"),g("bar",45),g("bar",135),g("x"),g("plus"),g("x")],options:[g("plus"),g("x"),g("star"),g("bar",0)],answer:2},
  {id:"fold-two",stage:"Lipat Kertas",title:"Dua lipatan",hint:"Kertas dilipat pada sumbu vertikal dan horizontal sebelum dilubangi.",layout:"single",difficulty:4,cells:[g("fold",0,false,undefined,["br"],2)],options:[g("holes",0,false,undefined,["tl","tr"]),g("holes",0,false,undefined,["tl","tr","bl","br"]),g("holes",0,false,undefined,["l","r"]),g("holes",0,false,undefined,["tl","br"])],answer:1},
  {id:"analogy-complex",stage:"Analogi",title:"Transformasi majemuk",hint:"Rotasi, isi, dan posisi titik berubah dengan aturan yang sama.",layout:"analogy",difficulty:4,cells:[g("square",0,false,"tl"),g("square",90,true,"br"),g("pentagon",180,false,"tr")],options:[g("pentagon",270,true,"bl"),g("pentagon",90,true,"tl"),g("pentagon",270,false,"bl"),g("pentagon",0,true,"br")],answer:0},
  {id:"matrix3-position",stage:"Matriks",title:"Matriks posisi 3 × 3",hint:"Titik bergeser satu sudut ke kanan pada tiap langkah; baris berikutnya melanjutkan urutan.",layout:"matrix3",difficulty:4,cells:[g("circle",0,false,"tl"),g("circle",0,false,"tr"),g("circle",0,false,"br"),g("circle",0,false,"bl"),g("circle",0,false,"tl"),g("circle",0,false,"tr"),g("circle",0,false,"br"),g("circle",0,false,"bl")],options:[g("circle",0,false,"br"),g("circle",0,false,"tr"),g("circle",0,false,"tl"),g("circle",0,false,"c")],answer:2},
  {id:"odd-rotation-equivalent",stage:"Klasifikasi",title:"Pilih Satu Bentuk yang Tidak Setara",hint:"Tiga pilihan sebenarnya bentuk yang sama setelah diputar. Satu tidak setara.",layout:"odd",difficulty:4,cells:[],options:[g("corner",0,false,"tr"),g("corner",90,false,"br"),g("corner",180,false,"bl"),g("corner",270,false,"tr")],answer:3},
  {id:"sequence-135",stage:"Rotasi",title:"Pola sudut tidak biasa",hint:"Perhatikan selisih sudut antar langkah, bukan hanya arah akhirnya.",layout:"sequence",difficulty:4,cells:[g("arrow",0),g("arrow",45),g("arrow",135)],options:[g("arrow",180),g("arrow",270),g("arrow",225),g("arrow",90)],answer:1},
  {id:"matrix-shape-cycle",stage:"Matriks",title:"Siklus bentuk dan isi",hint:"Bentuk bergeser satu posisi, sedangkan isi penuh bergerak mengikuti kolom.",layout:"matrix3",difficulty:4,cells:[g("triangle",0,true),g("square",0,false),g("circle",0,false),g("square",0,false),g("circle",0,true),g("triangle",0,false),g("circle",0,false),g("triangle",0,false)],options:[g("circle",0,true),g("square",0,true),g("triangle",0,true),g("square",0,false)],answer:1},
]

const posXY:Record<Pos,[number,number]>={
  tl:[33,33],tr:[67,33],bl:[33,67],br:[67,67],c:[50,50],t:[50,28],r:[72,50],b:[50,72],l:[28,50]
}

function GlyphView({glyph,small=false}:{glyph:Glyph;small?:boolean}){
  const size=small?"h-14 w-14":"h-20 w-20"
  const rot=glyph.rotation||0
  const dots=glyph.dots || (glyph.dot?[glyph.dot]:[])
  const fill=glyph.filled?"currentColor":"rgba(34,211,238,.08)"
  const shape=(()=>{
    switch(glyph.kind){
      case "triangle": return <polygon points="50,23 76,72 24,72" fill={fill} stroke="currentColor" strokeWidth="5"/>
      case "square": return <rect x="28" y="28" width="44" height="44" rx="5" fill={fill} stroke="currentColor" strokeWidth="5"/>
      case "circle": return <circle cx="50" cy="50" r="23" fill={fill} stroke="currentColor" strokeWidth="5"/>
      case "diamond": return <rect x="32" y="32" width="36" height="36" rx="4" transform="rotate(45 50 50)" fill={fill} stroke="currentColor" strokeWidth="5"/>
      case "pentagon": return <polygon points="50,20 76,40 66,72 34,72 24,40" fill={fill} stroke="currentColor" strokeWidth="5"/>
      case "hexagon": return <polygon points="34,22 66,22 80,50 66,78 34,78 20,50" fill={fill} stroke="currentColor" strokeWidth="5"/>
      case "arrow": return <path d="M50 76V30M50 30L37 44M50 30l13 14" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
      case "corner": return <path d="M30 68V32h36" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round"/>
      case "hook": return <path d="M32 70V34h28c10 0 15 6 15 15s-5 15-15 15H48" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round"/>
      case "plus": return <path d="M24 50h52M50 24v52" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round"/>
      case "x": return <path d="M30 30l40 40M70 30L30 70" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round"/>
      case "star": return <path d="M24 50h52M50 24v52M30 30l40 40M70 30L30 70" fill="none" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round"/>
      case "notch": return <path d="M28 28h44v44H28V58h14V42H28z" fill={fill} stroke="currentColor" strokeWidth="5"/>
      case "bar": return <path d="M24 50h52" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round"/>
      case "fold": return <><rect x="24" y="20" width="52" height="60" rx="4" fill="rgba(34,211,238,.05)" stroke="currentColor" strokeWidth="4"/>{glyph.variant===2?<><path d="M50 20v60M24 50h52" stroke="currentColor" strokeDasharray="5 5" strokeWidth="2.5"/></>:<path d="M50 20v60" stroke="currentColor" strokeDasharray="5 5" strokeWidth="2.5"/>}</>
      case "holes": return <rect x="24" y="20" width="52" height="60" rx="4" fill="none" stroke="currentColor" strokeWidth="4"/>
    }
  })()

  return <svg viewBox="0 0 100 100" className={size+" text-cyan-100"} aria-hidden="true">
    <rect x="7" y="7" width="86" height="86" rx="18" fill="rgba(15,23,42,.74)" stroke="rgba(148,163,184,.20)"/>
    <g transform={`rotate(${rot} 50 50)`}>{shape}</g>
    {dots.map((p,i)=>{const [x,y]=posXY[p];return <circle key={p+i} cx={x} cy={y} r="5" fill="#c4b5fd" stroke="#020617" strokeWidth="2"/>})}
  </svg>
}

function shuffle<T>(items:T[]){
  const arr=[...items]
  for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]]}
  return arr
}
function pick<T>(items:T[],count:number){return shuffle(items).slice(0,count)}
function makeSet(){
  let previous:string[]=[]
  try{previous=JSON.parse(localStorage.getItem("alzava.visual-iq.last-set")||"[]")}catch{}
  const fresh=QUESTIONS.filter(q=>!previous.includes(q.id))
  const source=fresh.length>=20?fresh:QUESTIONS
  const d2=source.filter(q=>q.difficulty===2)
  const d3=source.filter(q=>q.difficulty===3)
  const d4=source.filter(q=>q.difficulty===4)
  const selected=shuffle([...pick(d2,3),...pick(d3,9),...pick(d4,8)])
  if(selected.length<20){
    const used=new Set(selected.map(q=>q.id))
    selected.push(...shuffle(source.filter(q=>!used.has(q.id))).slice(0,20-selected.length))
  }
  try{localStorage.setItem("alzava.visual-iq.last-set",JSON.stringify(selected.map(q=>q.id)))}catch{}
  return selected.slice(0,20)
}
function resultFor(questions:Question[],answers:number[]){
  let correct=0,earned=0,total=0
  const breakdown:Record<string,{correct:number,total:number}>={}
  questions.forEach((q,i)=>{
    const ok=answers[i]===q.answer
    if(ok) correct++
    earned+=ok?q.difficulty:0
    total+=q.difficulty
    const current=breakdown[q.stage]||{correct:0,total:0}
    current.total++
    if(ok) current.correct++
    breakdown[q.stage]=current
  })
  const ratio=total?earned/total:0
  const iq=Math.max(70,Math.min(150,Math.round(70+80*ratio)))
  return {correct,iq,breakdown}
}
function tierFor(iq:number){
  if(iq>=145)return "MAESTRO"
  if(iq>=135)return "BERLIAN"
  if(iq>=125)return "PLATINUM"
  if(iq>=115)return "EMAS"
  if(iq>=100)return "PERAK"
  return "PERUNGGU"
}

export function VisualIqGame(){
  const [auth,setAuth]=useState<"loading"|"ready"|"guest">("loading")
  const [participant,setParticipant]=useState<Participant|null>(null)
  const [questions,setQuestions]=useState<Question[]>([])
  const [index,setIndex]=useState(0)
  const [answers,setAnswers]=useState<number[]>([])
  const [startedAt,setStartedAt]=useState(0)
  const [finishedAt,setFinishedAt]=useState(0)
  const [locked,setLocked]=useState(false)
  const [saveState,setSaveState]=useState<SaveState>("idle")
  const [saveMessage,setSaveMessage]=useState("")
  const [shareMessage,setShareMessage]=useState("")
  const [exitConfirm,setExitConfirm]=useState(false)
  const timerRef=useRef<number|null>(null)
  const savedRef=useRef(false)

  useEffect(()=>{
    const token=getParticipantToken()
    if(!token){setAuth("guest");return}
    void fetch(ACCOUNT_API,{method:"POST",headers:{"Content-Type":"application/json","X-Battle-Token":token},body:JSON.stringify({action:"me"}),cache:"no-store"})
      .then(async r=>({ok:r.ok,data:await r.json().catch(()=>({}))}))
      .then(({ok,data})=>{
        if(ok&&data?.participant?.account_ready){setParticipant(data.participant);setAuth("ready")}
        else setAuth("guest")
      })
      .catch(()=>setAuth("guest"))
  },[])

  const started=questions.length===20
  const done=started&&index>=questions.length
  const current=questions[index]
  const elapsed=Math.max(0,Math.round(((finishedAt||Date.now())-startedAt)/1000))
  const result=useMemo(()=>resultFor(questions,answers),[questions,answers])
  const accuracy=questions.length?Math.round((result.correct/questions.length)*100):0
  const tier=tierFor(result.iq)

  function start(){
    if(auth!=="ready")return
    if(timerRef.current)window.clearTimeout(timerRef.current)
    savedRef.current=false
    setQuestions(makeSet())
    setIndex(0)
    setAnswers([])
    setStartedAt(Date.now())
    setFinishedAt(0)
    setLocked(false)
    setSaveState("idle")
    setSaveMessage("")
    setShareMessage("")
    setExitConfirm(false)
  }

  function choose(option:number){
    if(locked||!current)return
    setLocked(true)
    const next=[...answers]
    next[index]=option
    setAnswers(next)
    timerRef.current=window.setTimeout(()=>{
      if(index+1>=questions.length){setFinishedAt(Date.now());setIndex(questions.length)}
      else setIndex(index+1)
      setLocked(false)
    },240)
  }

  function goBack(){
    if(locked)return
    if(index<=0){
      setExitConfirm(true)
      return
    }
    setIndex(value=>Math.max(0,value-1))
  }

  async function saveAttempt(force=false){
    if(!done)return
    if(savedRef.current&&!force)return
    savedRef.current=true
    setSaveState("saving")
    setSaveMessage("Menyimpan hasil ke akun…")
    const token=getParticipantToken()
    try{
      const response=await fetch(VISUAL_IQ_API,{
        method:"POST",
        headers:{"Content-Type":"application/json","X-Battle-Token":token},
        body:JSON.stringify({
          action:"save",
          question_ids:questions.map(q=>q.id),
          answers,
          correct_count:result.correct,
          question_count:20,
          iq_estimate:result.iq,
          duration_ms:elapsed*1000,
          breakdown:result.breakdown
        })
      })
      const data=await response.json().catch(()=>({}))
      if(!response.ok)throw new Error(data?.error||"Hasil belum tersimpan.")
      setSaveState("saved")
      setSaveMessage("✓ Hasil tersimpan di Riwayat Tes akunmu.")
    }catch(e){
      savedRef.current=false
      setSaveState("error")
      setSaveMessage(e instanceof Error?e.message:"Hasil belum tersimpan.")
    }
  }

  useEffect(()=>{
    if(done&&!savedRef.current)void saveAttempt()
    // save once when the test is completed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[done])

  function reset(){
    if(timerRef.current)window.clearTimeout(timerRef.current)
    setQuestions([])
    setIndex(0)
    setAnswers([])
    setStartedAt(0)
    setFinishedAt(0)
    setLocked(false)
    setSaveState("idle")
    setSaveMessage("")
    setShareMessage("")
    setExitConfirm(false)
    savedRef.current=false
  }

  async function makeShareImage(){
    const canvas=document.createElement("canvas")
    canvas.width=1080
    canvas.height=1350
    const ctx=canvas.getContext("2d")
    if(!ctx)return null

    const bg=ctx.createLinearGradient(0,0,1080,1350)
    bg.addColorStop(0,"#020617")
    bg.addColorStop(.48,"#11153e")
    bg.addColorStop(1,"#050818")
    ctx.fillStyle=bg
    ctx.fillRect(0,0,1080,1350)

    const glow=ctx.createRadialGradient(540,410,20,540,410,470)
    glow.addColorStop(0,"rgba(34,211,238,.24)")
    glow.addColorStop(.55,"rgba(124,58,237,.12)")
    glow.addColorStop(1,"rgba(0,0,0,0)")
    ctx.fillStyle=glow
    ctx.fillRect(0,0,1080,900)

    ctx.textAlign="center"
    ctx.fillStyle="#f8fafc"
    ctx.font="900 48px Arial"
    ctx.fillText("ALZAVA BATTLE POINT",540,100)
    ctx.fillStyle="#67e8f9"
    ctx.font="800 27px Arial"
    ctx.fillText("TES IQ VISUAL",540,150)

    ctx.fillStyle="rgba(15,23,42,.72)"
    ctx.strokeStyle="rgba(103,232,249,.30)"
    ctx.lineWidth=3
    ctx.beginPath()
    ctx.roundRect(95,205,890,755,44)
    ctx.fill()
    ctx.stroke()

    ctx.fillStyle="#cbd5e1"
    ctx.font="800 30px Arial"
    ctx.fillText(participant?.nickname?participant.nickname:"PESERTA ALZAVA",540,290)
    ctx.fillStyle="#94a3b8"
    ctx.font="800 25px Arial"
    ctx.fillText("ESTIMASI IQ VISUAL",540,350)

    const iqGradient=ctx.createLinearGradient(360,410,720,650)
    iqGradient.addColorStop(0,"#22d3ee")
    iqGradient.addColorStop(1,"#a78bfa")
    ctx.fillStyle=iqGradient
    ctx.font="900 205px Arial"
    ctx.fillText(String(result.iq),540,580)

    ctx.fillStyle="#f8fafc"
    ctx.font="900 34px Arial"
    ctx.fillText("± 5 POIN  •  "+tier,540,635)

    const statValues=[result.correct+"/20",accuracy+"%",Math.floor(elapsed/60)+":"+String(elapsed%60).padStart(2,"0")]
    const statLabels=["BENAR","AKURASI","WAKTU"]
    statValues.forEach((value,i)=>{
      const x=250+i*290
      ctx.fillStyle="rgba(255,255,255,.055)"
      ctx.beginPath()
      ctx.roundRect(x-115,710,230,140,24)
      ctx.fill()
      ctx.strokeStyle="rgba(148,163,184,.17)"
      ctx.stroke()
      ctx.fillStyle="#ffffff"
      ctx.font="900 42px Arial"
      ctx.fillText(value,x,770)
      ctx.fillStyle="#94a3b8"
      ctx.font="800 18px Arial"
      ctx.fillText(statLabels[i],x,812)
    })

    ctx.fillStyle="#fbbf24"
    ctx.font="900 39px Arial"
    ctx.fillText("BERANI KALAHKAN HASILKU?",540,1040)
    ctx.fillStyle="#e2e8f0"
    ctx.font="700 28px Arial"
    ctx.fillText("20 soal figural & spasial • ALZAVA",540,1100)
    ctx.fillStyle="#67e8f9"
    ctx.font="800 25px Arial"
    ctx.fillText("alzava-battle-iq.pages.dev/visual-iq",540,1160)
    ctx.fillStyle="#64748b"
    ctx.font="500 19px Arial"
    ctx.fillText("Estimasi indikatif, bukan hasil psikotes klinis.",540,1265)

    return await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,"image/png",.94))
  }

  async function shareResult(){
    const url=window.location.origin+"/visual-iq/"
    const text="🧠 Hasil Tes IQ Visual ALZAVA\nEstimasi IQ Visual: "+result.iq+" ± 5\n"+result.correct+"/20 benar • "+accuracy+"% akurasi • "+Math.floor(elapsed/60)+":"+String(elapsed%60).padStart(2,"0")+"\n\nBerani kalahkan hasilku? "+url
    setShareMessage("")
    try{
      const blob=await makeShareImage()
      if(blob&&typeof File!=="undefined"&&navigator.share&&navigator.canShare){
        const file=new File([blob],"hasil-iq-visual-alzava.png",{type:"image/png"})
        if(navigator.canShare({files:[file]})){
          await navigator.share({title:"Hasil Tes IQ Visual ALZAVA",text,files:[file]})
          setShareMessage("Kartu hasil siap dibagikan.")
          return
        }
      }
      if(navigator.share){
        await navigator.share({title:"Hasil Tes IQ Visual ALZAVA",text,url})
        setShareMessage("Hasil siap dibagikan.")
        return
      }
      await navigator.clipboard.writeText(text)
      setShareMessage("Hasil disalin. Tempelkan ke WhatsApp atau media sosial.")
    }catch{
      setShareMessage("")
    }
  }

  if(auth==="loading")return <main className="grid min-h-screen place-items-center bg-[#020817] text-sm font-bold text-slate-400">Memeriksa akun…</main>

  if(auth!=="ready")return <div className="min-h-screen bg-[radial-gradient(circle_at_50%_0%,rgba(67,56,202,.20),transparent_32%),linear-gradient(180deg,#020617,#061126_55%,#020617)] text-white">
    <main className="mx-auto grid min-h-screen max-w-md place-items-center px-4 py-10">
      <div className="w-full rounded-[28px] border border-cyan-300/20 bg-slate-950/60 p-6 text-center shadow-2xl backdrop-blur-xl">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-cyan-300/25 bg-cyan-300/10"><LockKeyhole className="h-7 w-7 text-cyan-300"/></div>
        <p className="mt-5 text-[11px] font-black uppercase tracking-[.18em] text-cyan-300">Tes IQ Visual ALZAVA</p>
        <h1 className="mt-2 text-3xl font-black">Daftar dulu, hasilmu akan tersimpan.</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">Tes IQ Visual hanya untuk peserta terdaftar agar hasil, estimasi IQ, dan riwayat percobaan tidak hilang saat ganti perangkat.</p>
        <a href="/account?next=/visual-iq" className="mt-6 flex min-h-13 items-center justify-center rounded-xl bg-gradient-to-r from-cyan-400 to-violet-500 px-5 py-3 text-sm font-black text-slate-950">Masuk / Daftar untuk Mulai</a>
        <a href="/battle" className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-white"><ArrowLeft className="h-4 w-4"/>Kembali ke Battle Point</a>
      </div>
    </main>
  </div>

  if(!started)return <div className="min-h-screen bg-[radial-gradient(circle_at_50%_0%,rgba(67,56,202,.22),transparent_32%),linear-gradient(180deg,#020617,#061126_55%,#020617)] text-white">
    <header className="mx-auto flex max-w-md items-center justify-between gap-3 px-4 py-4">
      <a href="/battle" className="inline-flex items-center gap-2 text-sm font-black text-slate-300 hover:text-white"><ArrowLeft className="h-4 w-4"/>Battle Point</a>
      <div className="text-xs font-black">ALZAVA <span className="text-cyan-300">Tes IQ</span></div>
    </header>
    <main className="mx-auto max-w-md px-4 pb-14 pt-3">
      <div className="rounded-[28px] border border-cyan-300/20 bg-slate-950/55 p-5 shadow-[0_24px_70px_rgba(0,0,0,.35)] backdrop-blur-xl">
        <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[.16em] text-cyan-300"><Sparkles className="h-4 w-4"/>Tes Visual Interaktif</div>
        <h1 className="mt-3 text-4xl font-black leading-[.98]">Ketahui <span className="bg-gradient-to-r from-cyan-300 via-violet-300 to-fuchsia-300 bg-clip-text text-transparent">IQ-mu</span></h1>
        <p className="mt-4 text-sm leading-6 text-slate-300">20 soal dipilih dari bank yang lebih besar. Setiap percobaan mencampur matriks, analogi, rotasi, lipat kertas, cermin, pola, klasifikasi, dan spasial.</p>
        <div className="mt-5 grid grid-cols-3 gap-2 text-center text-[10px] font-bold text-slate-300">
          <div className="rounded-xl border border-white/10 bg-white/[.04] p-3"><BrainCircuit className="mx-auto mb-1 h-5 w-5 text-cyan-300"/>20 Soal</div>
          <div className="rounded-xl border border-white/10 bg-white/[.04] p-3"><Clock3 className="mx-auto mb-1 h-5 w-5 text-violet-300"/>±12 Menit</div>
          <div className="rounded-xl border border-white/10 bg-white/[.04] p-3"><Trophy className="mx-auto mb-1 h-5 w-5 text-amber-300"/>Maks. 150</div>
        </div>
      </div>
      <button type="button" onClick={start} className="mt-4 w-full rounded-2xl border border-cyan-300/35 bg-gradient-to-r from-cyan-500/18 via-indigo-500/18 to-violet-500/18 p-5 text-left shadow-[0_0_30px_rgba(34,211,238,.10)]">
        <div className="text-xs font-black uppercase tracking-[.14em] text-cyan-300">Halo, {participant?.nickname||"Peserta"}</div>
        <div className="mt-2 text-3xl font-black">Mulai Tes IQ Visual</div>
        <div className="mt-1 text-sm text-slate-300">Hasil otomatis tersimpan ke akun dan Riwayat Tes.</div>
        <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-2.5 text-sm font-black text-slate-950"><Play className="h-4 w-4"/>MULAI 20 SOAL</div>
      </button>
      <p className="mt-4 text-center text-[11px] leading-5 text-slate-500">Estimasi IQ Visual adalah indikasi kemampuan figural-spasial, bukan diagnosis atau hasil psikotes klinis resmi.</p>
    </main>
  </div>

  if(done)return <div className="min-h-screen bg-[radial-gradient(circle_at_50%_0%,rgba(124,58,237,.25),transparent_34%),linear-gradient(180deg,#020617,#071427_55%,#020617)] text-white">
    <main className="mx-auto max-w-md px-4 pb-14 pt-7">
      <div className="overflow-hidden rounded-[30px] border border-cyan-300/20 bg-gradient-to-b from-violet-500/10 via-slate-950/70 to-slate-950/80 p-5 text-center shadow-[0_26px_70px_rgba(0,0,0,.40)]">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-amber-300/30 bg-amber-300/10 shadow-[0_0_32px_rgba(251,191,36,.15)]"><Trophy className="h-8 w-8 text-amber-300"/></div>
        <div className="mt-4 text-[11px] font-black uppercase tracking-[.22em] text-violet-300">Hasil Tes IQ Visual</div>
        <div className="mt-3 text-xs font-black uppercase tracking-[.14em] text-slate-400">{participant?.nickname||"Peserta"}</div>
        <div className="mt-1 bg-gradient-to-r from-cyan-300 to-violet-300 bg-clip-text text-7xl font-black tabular-nums text-transparent">{result.iq}</div>
        <div className="mt-1 text-sm font-black">Estimasi IQ Visual · ± 5</div>
        <div className="mt-2 inline-flex rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-[10px] font-black tracking-[.12em] text-amber-200">{tier}</div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-white/10 bg-white/[.04] p-3"><div className="text-xl font-black">{result.correct}/20</div><div className="mt-1 text-[9px] font-bold text-slate-500">BENAR</div></div>
          <div className="rounded-xl border border-white/10 bg-white/[.04] p-3"><div className="text-xl font-black">{accuracy}%</div><div className="mt-1 text-[9px] font-bold text-slate-500">AKURASI</div></div>
          <div className="rounded-xl border border-white/10 bg-white/[.04] p-3"><div className="text-xl font-black">{Math.floor(elapsed/60)}:{String(elapsed%60).padStart(2,"0")}</div><div className="mt-1 text-[9px] font-bold text-slate-500">WAKTU</div></div>
        </div>

        <div className="mt-5 rounded-2xl border border-cyan-300/15 bg-cyan-300/[.05] p-4 text-left">
          <div className="text-[10px] font-black uppercase tracking-[.14em] text-cyan-300">Gambaran Kemampuan</div>
          <p className="mt-2 text-sm leading-6 text-slate-300">{result.iq>=135?"Penalaran visual-spasialmu sangat kuat, terutama pada hubungan bentuk yang kompleks.":result.iq>=115?"Kemampuan visualmu kuat. Matriks, analogi, dan rotasi mental menjadi area yang layak terus diasah.":"Fondasi visual-spasialmu sudah terbentuk, tetapi konsistensi pada matriks dan transformasi kompleks masih bisa ditingkatkan."}</p>
        </div>

        <div className={`mt-4 rounded-xl border px-3 py-2 text-xs font-bold ${saveState==="saved"?"border-emerald-300/20 bg-emerald-300/10 text-emerald-200":saveState==="error"?"border-rose-300/20 bg-rose-300/10 text-rose-200":"border-white/10 bg-white/[.04] text-slate-400"}`}>
          {saveMessage||"Menyiapkan penyimpanan hasil…"}
          {saveState==="error"&&<button type="button" onClick={()=>void saveAttempt(true)} className="ml-2 underline">Coba lagi</button>}
        </div>
      </div>

      <button type="button" onClick={()=>void shareResult()} className="mt-4 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-400 to-violet-500 px-5 text-base font-black text-slate-950 shadow-[0_0_34px_rgba(34,211,238,.20)]"><Share2 className="h-5 w-5"/>Bagikan Kartu & Tantang Teman</button>
      {shareMessage&&<p className="mt-2 text-center text-[11px] font-bold text-cyan-200">{shareMessage}</p>}
      <div className="mt-3 grid grid-cols-2 gap-3">
        <button type="button" onClick={start} className="min-h-12 rounded-xl border border-white/10 bg-white/[.06] text-sm font-black"><RotateCcw className="mr-2 inline h-4 w-4"/>Ulangi</button>
        <a href="/account/results#riwayat-iq" className="grid min-h-12 place-items-center rounded-xl border border-white/10 bg-white/[.06] text-sm font-black">Lihat Riwayat</a>
      </div>
      <a href="/battle" className="mt-3 flex min-h-11 items-center justify-center text-sm font-bold text-slate-400 hover:text-white"><ArrowLeft className="mr-2 h-4 w-4"/>Kembali ke Battle Point</a>
      <p className="mt-2 text-center text-[10px] leading-4 text-slate-600">Estimasi indikatif dari 20 soal visual; bukan hasil psikotes klinis.</p>
    </main>
  </div>

  const progress=(index/questions.length)*100

  return <div className="min-h-screen bg-[radial-gradient(circle_at_50%_0%,rgba(14,165,233,.13),transparent_30%),linear-gradient(180deg,#020617,#071426_52%,#020617)] text-white">
    <header className="mx-auto max-w-md px-4 pt-4">
      <div className="flex items-center justify-between">
        <button type="button" onClick={goBack} aria-label={index===0?"Kembali ke halaman awal":"Kembali ke soal sebelumnya"} className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[.04] text-slate-300 transition hover:bg-white/[.08]"><ArrowLeft className="h-5 w-5"/></button>
        <div className="text-center"><div className="text-[10px] font-black uppercase tracking-[.18em] text-cyan-300">{current.stage}</div><div className="text-xs font-bold text-slate-500">{index+1} / {questions.length} · Level {current.difficulty===4?"Sulit":current.difficulty===3?"Menengah":"Dasar"}</div></div>
        <div className="grid h-10 min-w-10 place-items-center rounded-xl border border-white/10 bg-white/[.04] px-2 text-slate-300"><Clock3 className="h-4 w-4"/></div>
      </div>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 transition-all" style={{width:progress+"%"}}/></div>
    </header>

    <main className="mx-auto max-w-md px-4 pb-12 pt-6">
      <div className="text-center">
        <div className="text-[11px] font-black uppercase tracking-[.15em] text-slate-400">{current.title}</div>
      </div>

      <div className="mt-5 rounded-[28px] border border-white/10 bg-slate-950/50 p-4 backdrop-blur-xl">
        {current.layout==="sequence"&&<div className="flex min-h-[125px] items-center justify-center gap-1.5">{current.cells.map((x,i)=><div key={i} className="flex items-center gap-1.5"><GlyphView glyph={x}/>{i<current.cells.length-1&&<span className="text-lg font-black text-slate-600">→</span>}</div>)}<div className="grid h-20 w-20 place-items-center rounded-[18px] border border-dashed border-cyan-300/35 bg-cyan-300/[.04] text-3xl font-black text-cyan-300">?</div></div>}
        {current.layout==="analogy"&&<div className="grid min-h-[220px] grid-cols-[1fr_auto_1fr] items-center gap-2"><div className="flex justify-center"><GlyphView glyph={current.cells[0]}/></div><span className="text-2xl font-black text-slate-500">:</span><div className="flex justify-center"><GlyphView glyph={current.cells[1]}/></div><div className="flex justify-center"><GlyphView glyph={current.cells[2]}/></div><span className="text-2xl font-black text-slate-500">:</span><div className="flex justify-center"><div className="grid h-20 w-20 place-items-center rounded-[18px] border border-dashed border-cyan-300/35 bg-cyan-300/[.04] text-3xl font-black text-cyan-300">?</div></div></div>}
        {current.layout==="matrix2"&&<div className="mx-auto grid min-h-[210px] max-w-[200px] grid-cols-2 place-items-center gap-3"><GlyphView glyph={current.cells[0]}/><GlyphView glyph={current.cells[1]}/><GlyphView glyph={current.cells[2]}/><div className="grid h-20 w-20 place-items-center rounded-[18px] border border-dashed border-cyan-300/35 bg-cyan-300/[.04] text-3xl font-black text-cyan-300">?</div></div>}
        {current.layout==="matrix3"&&<div className="mx-auto grid min-h-[260px] max-w-[280px] grid-cols-3 place-items-center gap-1.5">{current.cells.map((x,i)=><GlyphView key={i} glyph={x} small/>)}<div className="grid h-14 w-14 place-items-center rounded-[14px] border border-dashed border-cyan-300/35 bg-cyan-300/[.04] text-2xl font-black text-cyan-300">?</div></div>}
        {current.layout==="single"&&<div className="flex min-h-[170px] items-center justify-center"><GlyphView glyph={current.cells[0]}/></div>}
        {current.layout==="combine"&&<div className="flex min-h-[170px] items-center justify-center gap-2"><GlyphView glyph={current.cells[0]}/><span className="text-2xl font-black text-slate-500">+</span><GlyphView glyph={current.cells[1]}/><span className="text-2xl font-black text-slate-500">=</span><div className="grid h-20 w-20 place-items-center rounded-[18px] border border-dashed border-cyan-300/35 bg-cyan-300/[.04] text-3xl font-black text-cyan-300">?</div></div>}

      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {current.options.map((x,i)=>{
          const selected=answers[index]===i
          return <button key={i} type="button" disabled={locked} onClick={()=>choose(i)} className={`group min-h-[118px] rounded-2xl border p-3 transition active:scale-[.98] disabled:opacity-70 ${selected?"border-cyan-300/60 bg-cyan-300/[.10] shadow-[0_0_22px_rgba(34,211,238,.10)]":"border-white/10 bg-white/[.04] hover:border-cyan-300/35 hover:bg-cyan-300/[.06]"}`}><div className="flex items-center justify-between text-[10px] font-black text-slate-500"><span>{String.fromCharCode(65+i)}</span><span className={selected?"text-cyan-300":"opacity-0 transition group-hover:opacity-100"}>{selected?"DIPILIH":"PILIH"}</span></div><div className="mt-1 flex justify-center"><GlyphView glyph={x} small/></div></button>
        })}
      </div>

      <div className="mt-5 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[.12em] text-slate-600"><Sparkles className="h-3.5 w-3.5"/>Jawaban tersimpan · bisa diubah dengan tombol kembali</div>
    </main>

    {exitConfirm&&<div className="fixed inset-0 z-[200] grid place-items-center bg-slate-950/75 px-5 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="visual-iq-exit-title">
      <div className="w-full max-w-sm rounded-[24px] border border-white/10 bg-[#071329] p-5 shadow-[0_30px_90px_rgba(0,0,0,.55)]">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-amber-300/20 bg-amber-300/10"><ArrowLeft className="h-5 w-5 text-amber-300"/></div>
        <h2 id="visual-iq-exit-title" className="mt-4 text-center text-xl font-black text-white">Kembali ke halaman awal?</h2>
        <p className="mt-2 text-center text-sm leading-6 text-slate-400">Tes yang sedang berjalan akan dibatalkan dan jawaban pada percobaan ini tidak akan disimpan.</p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button type="button" onClick={()=>setExitConfirm(false)} className="min-h-12 rounded-xl border border-white/10 bg-white/[.06] text-sm font-black text-white hover:bg-white/[.10]">Lanjut Tes</button>
          <button type="button" onClick={reset} className="min-h-12 rounded-xl bg-gradient-to-r from-amber-300 to-orange-400 px-3 text-sm font-black text-slate-950">Ke Halaman Awal</button>
        </div>
      </div>
    </div>}
  </div>
}
