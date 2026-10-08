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
  family: string
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


const ROTATABLE:GlyphKind[]=["arrow","triangle","corner","notch","hook"]
const SHAPES:GlyphKind[]=["triangle","square","diamond","pentagon","hexagon","circle"]
const DOT_SHAPES:GlyphKind[]=["circle","square","diamond","pentagon"]
const CARDINAL:Pos[]=["t","r","b","l"]
const CORNERS:Pos[]=["tl","tr","br","bl"]

function normAngle(value:number){
  return ((value%360)+360)%360
}
function rotatePos(pos:Pos,turns:number):Pos{
  const rings:Pos[][]=[CARDINAL,CORNERS]
  for(const ring of rings){
    const index=ring.indexOf(pos)
    if(index>=0)return ring[(index+turns%4+4)%4]
  }
  return pos
}
function mirrorPosVertical(pos:Pos):Pos{
  const map:Partial<Record<Pos,Pos>>={tl:"tr",tr:"tl",bl:"br",br:"bl",l:"r",r:"l",t:"t",b:"b",c:"c"}
  return map[pos]||pos
}
function mirrorPosHorizontal(pos:Pos):Pos{
  const map:Partial<Record<Pos,Pos>>={tl:"bl",bl:"tl",tr:"br",br:"tr",t:"b",b:"t",l:"l",r:"r",c:"c"}
  return map[pos]||pos
}
function glyphKey(x:Glyph){
  return JSON.stringify([x.kind,normAngle(x.rotation||0),Boolean(x.filled),x.dot||"",[...(x.dots||[])].sort(),x.variant||0])
}
function optionized(
  base:Omit<Question,"options"|"answer">,
  correct:Glyph,
  distractors:Glyph[],
  seed:number,
):Question{
  const unique:Glyph[]=[]
  const seen=new Set<string>()
  for(const item of [correct,...distractors]){
    const key=glyphKey(item)
    if(!seen.has(key)){seen.add(key);unique.push(item)}
  }
  if(unique.length<4)throw new Error("visual_iq_option_collision:"+base.id)
  let options=unique.slice(0,4)
  const shift=Math.abs(seed)%4
  options=[...options.slice(shift),...options.slice(0,shift)]
  const answer=options.findIndex(item=>glyphKey(item)===glyphKey(correct))
  return {...base,options,answer}
}
function qbase(
  id:string,family:string,stage:string,title:string,hint:string,
  layout:Layout,difficulty:2|3|4,cells:Glyph[],
):Omit<Question,"options"|"answer">{
  return {id,family,stage,title,hint,layout,difficulty,cells}
}
function questionValid(q:Question){
  if(!q.id||!q.family||!q.title||q.options.length!==4)return false
  if(q.answer<0||q.answer>3)return false
  if(new Set(q.options.map(glyphKey)).size!==4)return false
  if(q.layout==="sequence"&&q.cells.length<3)return false
  if(q.layout==="analogy"&&q.cells.length!==3)return false
  if(q.layout==="matrix2"&&q.cells.length!==3)return false
  if(q.layout==="matrix3"&&q.cells.length!==8)return false
  if(q.layout==="single"&&q.cells.length!==1)return false
  if(q.layout==="combine"&&q.cells.length!==2)return false
  if((q.layout==="single"||q.layout==="odd")&&q.hint.trim().length<12)return false
  return true
}

function buildQuestionBank(){
  const bank:Question[]=[]
  const push=(item:Question)=>{if(questionValid(item))bank.push(item)}

  for(const kind of ROTATABLE){
    for(const start of [0,90,180,270]){
      for(const step of [45,90,135]){
        const correct=g(kind,normAngle(start+step*3))
        push(optionized(
          qbase("rot-fixed-"+kind+"-"+start+"-"+step,"rotasi-tetap","Rotasi","Lanjutkan Rotasi","","sequence",step===90?2:3,[
            g(kind,start),g(kind,normAngle(start+step)),g(kind,normAngle(start+step*2)),
          ]),
          correct,
          [g(kind,normAngle((correct.rotation||0)+45)),g(kind,normAngle((correct.rotation||0)+90)),g(kind,normAngle((correct.rotation||0)+180))],
          start+step
        ))
      }
    }
  }

  for(const kind of ["arrow","triangle","corner","hook"] as GlyphKind[]){
    for(const start of [0,90,180,270]){
      for(const baseStep of [45,90]){
        const a=start
        const b=normAngle(a+baseStep)
        const c1=normAngle(b+baseStep+45)
        const correct=g(kind,normAngle(c1+baseStep+90))
        push(optionized(
          qbase("rot-progressive-"+kind+"-"+start+"-"+baseStep,"rotasi-progresif","Rotasi","Rotasi Bertingkat","","sequence",4,[g(kind,a),g(kind,b),g(kind,c1)]),
          correct,
          [g(kind,normAngle((correct.rotation||0)+45)),g(kind,normAngle((correct.rotation||0)+90)),g(kind,normAngle((correct.rotation||0)+180))],
          start+baseStep+7
        ))
      }
    }
  }

  for(const kind of DOT_SHAPES){
    for(let start=0;start<4;start++){
      for(const dir of [-1,1]){
        const pos=(n:number)=>CORNERS[(start+n*dir+16)%4]
        const correct=g(kind,0,false,pos(3))
        push(optionized(
          qbase("dot-orbit-"+kind+"-"+start+"-"+dir,"orbit-titik","Pola","Perpindahan Titik","","sequence",2,[g(kind,0,false,pos(0)),g(kind,0,false,pos(1)),g(kind,0,false,pos(2))]),
          correct,
          CORNERS.filter(p=>p!==pos(3)).map(p=>g(kind,0,false,p)),
          start+(dir<0?13:3)
        ))
      }
    }
  }

  const shapePairs:[GlyphKind,GlyphKind][]=[
    ["circle","square"],["triangle","diamond"],["pentagon","hexagon"],["square","diamond"],
    ["circle","pentagon"],["triangle","hexagon"],
  ]
  shapePairs.forEach(([a,b],i)=>{
    for(const invert of [false,true]){
      const correct=g(b,0,invert)
      push(optionized(
        qbase("shape-fill-cycle-"+i+"-"+(invert?1:0),"bentuk-isi","Pola","Bentuk dan Isi","","sequence",3,[
          g(a,0,invert),g(b,0,!invert),g(a,0,!invert),
        ]),
        correct,
        [g(b,0,!invert),g(a,0,invert),g(a,0,!invert)],
        i+(invert?11:2)
      ))
    }
  })

  const dotSets:Pos[][]=[["c"],["l","r"],["t","bl","br"],["tl","tr","bl","br"],["t","b","l","r","c"]]
  SHAPES.forEach((kind,i)=>{
    for(const offset of [0,1]){
      const correctIndex=3+offset
      const cells=[0,1,2].map(n=>g(kind,0,false,undefined,dotSets[n+offset]))
      const correct=g(kind,0,false,undefined,dotSets[correctIndex])
      const distractorSets=dotSets.filter((_,idx)=>idx!==correctIndex).slice(0,3)
      push(optionized(
        qbase("count-elements-"+kind+"-"+offset,"jumlah-elemen","Pola","Pertambahan Elemen","","sequence",offset===0?2:3,cells),
        correct,
        distractorSets.map(s=>g(kind,0,false,undefined,s)),
        i*5+offset
      ))
    }
  })

  for(const kind of ["arrow","triangle","corner","hook"] as GlyphKind[]){
    for(let start=0;start<4;start++){
      for(const turns of [1,2]){
        const aAngle=start*90
        const aDot=CARDINAL[start]
        const bAngle=normAngle(aAngle+turns*90)
        const bDot=rotatePos(aDot,turns)
        const cAngle=normAngle(aAngle+180)
        const cDot=rotatePos(aDot,2)
        const correctAngle=normAngle(cAngle+turns*90)
        const correctDot=rotatePos(cDot,turns)
        const correct=g(kind,correctAngle,false,correctDot)
        push(optionized(
          qbase("analogy-rot-dot-"+kind+"-"+start+"-"+turns,"analogi-rotasi","Analogi","Analogi Rotasi dan Titik","","analogy",3,[
            g(kind,aAngle,false,aDot),g(kind,bAngle,false,bDot),g(kind,cAngle,false,cDot),
          ]),
          correct,
          [
            g(kind,correctAngle,false,cDot),
            g(kind,cAngle,false,correctDot),
            g(kind,normAngle(correctAngle+90),false,correctDot),
          ],
          start*7+turns
        ))
      }
    }
  }

  for(let i=0;i<SHAPES.length;i++){
    const a=SHAPES[i]
    const b=SHAPES[(i+2)%SHAPES.length]
    for(const turn of [90,180]){
      const correct=g(b,turn,true)
      push(optionized(
        qbase("analogy-fill-"+a+"-"+b+"-"+turn,"analogi-isi","Analogi","Analogi Bentuk dan Isi","","analogy",3,[g(a,0,false),g(a,turn,true),g(b,0,false)]),
        correct,
        [g(b,turn,false),g(b,0,true),g(a,turn,true)],
        i+turn
      ))
    }
  }

  for(const kind of DOT_SHAPES){
    for(let p=0;p<4;p++){
      for(const turns of [1,2]){
        const a=CORNERS[p]
        const b=rotatePos(a,turns)
        const cPos=CORNERS[(p+2)%4]
        const correctPos=rotatePos(cPos,turns)
        push(optionized(
          qbase("matrix2-pos-"+kind+"-"+p+"-"+turns,"matrix-posisi","Matriks","Matriks Perpindahan Posisi","","matrix2",3,[
            g(kind,0,false,a),g(kind,0,false,b),g(kind,0,false,cPos),
          ]),
          g(kind,0,false,correctPos),
          CORNERS.filter(x=>x!==correctPos).map(x=>g(kind,0,false,x)),
          p*9+turns
        ))
      }
    }
  }

  for(let i=0;i<SHAPES.length;i++){
    const a=SHAPES[i], b=SHAPES[(i+1)%SHAPES.length]
    for(const filled of [false,true]){
      push(optionized(
        qbase("matrix2-fill-"+a+"-"+b+"-"+(filled?1:0),"matrix-isi","Matriks","Matriks Perubahan Isi","","matrix2",2,[
          g(a,0,filled),g(a,0,!filled),g(b,0,filled),
        ]),
        g(b,0,!filled),
        [g(b,0,filled),g(a,0,!filled),g(SHAPES[(i+2)%SHAPES.length],0,!filled)],
        i+(filled?19:5)
      ))
    }
  }

  for(const kind of ["arrow","triangle","corner","notch"] as GlyphKind[]){
    for(const start of [0,90,180,270]){
      for(const step of [90,-90]){
        const cells:Glyph[]=[]
        for(let row=0;row<3;row++){
          for(let col=0;col<3;col++){
            if(row===2&&col===2)continue
            cells.push(g(kind,normAngle(start+(row+col)*step)))
          }
        }
        const correct=g(kind,normAngle(start+4*step))
        push(optionized(
          qbase("matrix3-rot-"+kind+"-"+start+"-"+step,"matrix3-rotasi","Matriks","Matriks Rotasi 3 × 3","","matrix3",4,cells),
          correct,
          [g(kind,normAngle((correct.rotation||0)+90)),g(kind,normAngle((correct.rotation||0)+180)),g(kind,normAngle((correct.rotation||0)+270))],
          start+(step<0?31:17)
        ))
      }
    }
  }

  for(const kind of DOT_SHAPES){
    for(let start=0;start<4;start++){
      for(const dir of [-1,1]){
        const cells:Glyph[]=[]
        for(let row=0;row<3;row++){
          for(let col=0;col<3;col++){
            if(row===2&&col===2)continue
            cells.push(g(kind,0,false,CORNERS[(start+(row+col)*dir+24)%4]))
          }
        }
        const correctPos=CORNERS[(start+4*dir+24)%4]
        push(optionized(
          qbase("matrix3-dot-"+kind+"-"+start+"-"+dir,"matrix3-titik","Matriks","Matriks Posisi Titik 3 × 3","","matrix3",4,cells),
          g(kind,0,false,correctPos),
          CORNERS.filter(x=>x!==correctPos).map(x=>g(kind,0,false,x)),
          start+(dir<0?23:11)
        ))
      }
    }
  }

  const triads:[GlyphKind,GlyphKind,GlyphKind][]=[
    ["triangle","square","circle"],["diamond","pentagon","hexagon"],["square","circle","diamond"],
    ["triangle","pentagon","circle"],["hexagon","diamond","square"],
  ]
  triads.forEach((set,offset)=>{
    for(let phase=0;phase<3;phase++){
      const cells:Glyph[]=[]
      for(let row=0;row<3;row++){
        for(let col=0;col<3;col++){
          if(row===2&&col===2)continue
          cells.push(g(set[(row+col+phase)%3],0,row===col))
        }
      }
      const correctKind=set[(phase+1)%3]
      push(optionized(
        qbase("matrix3-shape-"+offset+"-"+phase,"matrix3-bentuk","Matriks","Matriks Siklus Bentuk 3 × 3","","matrix3",4,cells),
        g(correctKind,0,true),
        [g(set[(phase+2)%3],0,true),g(correctKind,0,false),g(set[phase%3],0,false)],
        offset*7+phase
      ))
    }
  })

  for(const kind of ["arrow","triangle"] as GlyphKind[]){
    for(const angle of [0,90,180,270]){
      for(const dot of CORNERS){
        const correctAngle=normAngle(-angle)
        const correctDot=mirrorPosVertical(dot)
        push(optionized(
          qbase("mirror-v-"+kind+"-"+angle+"-"+dot,"cermin-vertikal","Cermin","Cermin Vertikal","Pantulkan bentuk dan titik dari kiri ke kanan.","single",3,[g(kind,angle,false,dot)]),
          g(kind,correctAngle,false,correctDot),
          [
            g(kind,normAngle(correctAngle+90),false,correctDot),
            g(kind,correctAngle,false,dot),
            g(kind,normAngle(correctAngle+180),false,mirrorPosHorizontal(dot)),
          ],
          angle+CORNERS.indexOf(dot)
        ))
      }
    }
  }

  for(const kind of ["arrow","triangle"] as GlyphKind[]){
    for(const angle of [0,90,180,270]){
      for(const dot of CORNERS){
        const correctAngle=normAngle(180-angle)
        const correctDot=mirrorPosHorizontal(dot)
        push(optionized(
          qbase("mirror-h-"+kind+"-"+angle+"-"+dot,"cermin-horizontal","Cermin","Cermin Horizontal","Pantulkan bentuk dan titik dari atas ke bawah.","single",3,[g(kind,angle,false,dot)]),
          g(kind,correctAngle,false,correctDot),
          [
            g(kind,normAngle(correctAngle+90),false,correctDot),
            g(kind,correctAngle,false,dot),
            g(kind,normAngle(correctAngle+180),false,mirrorPosVertical(dot)),
          ],
          angle+CORNERS.indexOf(dot)+41
        ))
      }
    }
  }

  const foldOneCases:{hole:Pos;correct:Pos[]}[]=[
    {hole:"r",correct:["l","r"]},{hole:"tr",correct:["tl","tr"]},{hole:"br",correct:["bl","br"]},
  ]
  foldOneCases.forEach((item,i)=>{
    push(optionized(
      qbase("fold-one-"+item.hole,"lipat-satu","Lipat Kertas","Satu Lipatan Vertikal","Kertas dilipat pada garis vertikal. Pilih pola lubang setelah kertas dibuka.","single",3,[g("fold",0,false,item.hole,undefined,1)]),
      g("holes",0,false,undefined,item.correct),
      [g("holes",0,false,undefined,["t","b"]),g("holes",0,false,undefined,["tl","br"]),g("holes",0,false,undefined,["c"])],
      i+7
    ))
  })
  for(const hole of CORNERS){
    push(optionized(
      qbase("fold-two-"+hole,"lipat-dua","Lipat Kertas","Dua Lipatan","Kertas dilipat pada sumbu vertikal dan horizontal. Pilih pola lubang setelah dibuka.","single",4,[g("fold",0,false,hole,undefined,2)]),
      g("holes",0,false,undefined,["tl","tr","bl","br"]),
      [g("holes",0,false,undefined,["tl","tr"]),g("holes",0,false,undefined,["l","r"]),g("holes",0,false,undefined,["tl","br"])],
      CORNERS.indexOf(hole)+19
    ))
  }

  for(const offset of [-1,1]){
    for(let anomaly=0;anomaly<4;anomaly++){
      const options=CARDINAL.map((_,i)=>{
        const normal=rotatePos(CARDINAL[i],offset)
        const dot=i===anomaly?rotatePos(normal,2):normal
        return g("arrow",i*90,false,dot)
      })
      push(optionized(
        qbase("odd-relation-"+offset+"-"+anomaly,"klasifikasi-relasi","Klasifikasi","Pilih Hubungan Arah-Titik yang Berbeda","Tiga pilihan mengikuti hubungan arah panah dan posisi titik yang sama. Pilih satu yang berbeda.","odd",3,[]),
        options[anomaly],
        options.filter((_,i)=>i!==anomaly),
        anomaly+(offset<0?29:3)
      ))
    }
  }

  const combos:{a:Glyph;b:Glyph;correct:Glyph;wrong:Glyph[]}[]=[
    {a:g("bar",0),b:g("bar",90),correct:g("plus"),wrong:[g("x"),g("bar",45),g("star")]},
    {a:g("bar",45),b:g("bar",135),correct:g("x"),wrong:[g("plus"),g("bar",0),g("star")]},
    {a:g("plus"),b:g("x"),correct:g("star"),wrong:[g("plus"),g("x"),g("bar",90)]},
  ]
  combos.forEach((item,i)=>{
    push(optionized(
      qbase("combine-lines-"+i,"gabungan-bentuk","Gabungan","Gabungkan Kedua Bentuk","","combine",3,[item.a,item.b]),
      item.correct,item.wrong,i*7
    ))
  })

  for(const kind of ["notch","corner","hook"] as GlyphKind[]){
    for(const start of [0,90,180,270]){
      for(const turn of [90,180,270]){
        const correctRotation=normAngle(start+turn)
        const distractors=[0,90,180,270].filter(v=>v!==correctRotation).map(v=>g(kind,v))
        push(optionized(
          qbase("spatial-rotation-"+kind+"-"+start+"-"+turn,"rotasi-spasial","Spasial","Manakah Hasil Rotasi "+turn+"°?","Putar bentuk "+turn+"° searah jarum jam, lalu pilih hasil yang sama.","single",turn===180?3:4,[g(kind,start)]),
          g(kind,correctRotation),
          distractors,
          start+turn+5
        ))
      }
    }
  }

  for(const kind of ["triangle","square","diamond","pentagon","hexagon","circle"] as GlyphKind[]){
    for(let variant=0;variant<3;variant++){
      const correct=g(kind,0,false,variant===0?"c":variant===1?"t":"b")
      push(optionized(
        qbase("symmetry-v-"+kind+"-"+variant,"simetri","Simetri","Pilih Bentuk yang Simetris Vertikal","Perhitungkan bentuk dan posisi titik terhadap sumbu vertikal.","odd",3,[]),
        correct,
        [g(kind,0,false,"l"),g(kind,0,false,"tr"),g(kind,0,false,"br")],
        variant+SHAPES.indexOf(kind)*5
      ))
    }
  }

  for(let i=0;i<SHAPES.length;i++){
    const a=SHAPES[i]
    const b=SHAPES[(i+3)%SHAPES.length]
    for(const turns of [1,2]){
      const startDot=CORNERS[i%4]
      const cDot=CORNERS[(i+2)%4]
      const correctDot=rotatePos(cDot,turns)
      push(optionized(
        qbase("analogy-complex-"+i+"-"+turns,"analogi-majemuk","Analogi","Transformasi Majemuk","","analogy",4,[
          g(a,0,false,startDot),g(a,turns*90,true,rotatePos(startDot,turns)),g(b,0,false,cDot),
        ]),
        g(b,turns*90,true,correctDot),
        [g(b,turns*90,false,correctDot),g(b,0,true,correctDot),g(b,turns*90,true,cDot)],
        i*13+turns
      ))
    }
  }

  const ids=new Set<string>()
  const structures=new Set<string>()
  const clean:Question[]=[]
  for(const item of bank){
    const structure=JSON.stringify([item.family,item.layout,item.cells.map(glyphKey),item.options.map(glyphKey),item.answer])
    if(ids.has(item.id)||structures.has(structure))continue
    ids.add(item.id)
    structures.add(structure)
    clean.push(item)
  }
  if(clean.length<300)throw new Error("Visual IQ bank below 300 validated variants: "+clean.length)
  return clean
}

const QUESTIONS=buildQuestionBank()

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
  let recent:string[]=[]
  try{recent=JSON.parse(localStorage.getItem("alzava.visual-iq.recent-questions")||"[]")}catch{}
  const recentSet=new Set(recent.slice(0,180))
  const fresh=QUESTIONS.filter(q=>!recentSet.has(q.id))
  const selected:Question[]=[]
  const familyCount=new Map<string,number>()

  const addFrom=(pool:Question[],needed:number)=>{
    for(const item of shuffle(pool)){
      if(selected.length>=30||needed<=0)break
      if(selected.some(x=>x.id===item.id))continue
      if((familyCount.get(item.family)||0)>=2)continue
      selected.push(item)
      familyCount.set(item.family,(familyCount.get(item.family)||0)+1)
      needed--
    }
    return needed
  }

  const quotas:[2|3|4,number][]=[[2,5],[3,15],[4,10]]
  for(const [difficulty,count] of quotas){
    let left=addFrom(fresh.filter(q=>q.difficulty===difficulty),count)
    if(left>0)addFrom(QUESTIONS.filter(q=>q.difficulty===difficulty),left)
  }
  if(selected.length<30)addFrom(fresh,30-selected.length)
  if(selected.length<30){
    for(const item of shuffle(QUESTIONS)){
      if(selected.length>=30)break
      if(!selected.some(x=>x.id===item.id))selected.push(item)
    }
  }

  const finalSet=shuffle(selected.slice(0,30))
  try{
    const currentIds=new Set(finalSet.map(q=>q.id))
    const nextRecent=[...finalSet.map(q=>q.id),...recent.filter(id=>!currentIds.has(id))].slice(0,180)
    localStorage.setItem("alzava.visual-iq.recent-questions",JSON.stringify(nextRecent))
  }catch{}
  return finalSet
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

  const started=questions.length===30
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
          question_count:30,
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

    const statValues=[result.correct+"/30",accuracy+"%",Math.floor(elapsed/60)+":"+String(elapsed%60).padStart(2,"0")]
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
    ctx.fillText("30 soal figural & spasial • ALZAVA",540,1100)
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
    const text="🧠 Hasil Tes IQ Visual ALZAVA\nEstimasi IQ Visual: "+result.iq+" ± 5\n"+result.correct+"/30 benar • "+accuracy+"% akurasi • "+Math.floor(elapsed/60)+":"+String(elapsed%60).padStart(2,"0")+"\n\nBerani kalahkan hasilku? "+url
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
        <p className="mt-4 text-sm leading-6 text-slate-300">30 soal dipilih dari bank lebih dari 300 varian tervalidasi. Setiap percobaan mencampur matriks, analogi, rotasi, lipat kertas, cermin, pola, klasifikasi, dan spasial.</p>
        <div className="mt-5 grid grid-cols-3 gap-2 text-center text-[10px] font-bold text-slate-300">
          <div className="rounded-xl border border-white/10 bg-white/[.04] p-3"><BrainCircuit className="mx-auto mb-1 h-5 w-5 text-cyan-300"/>30 Soal</div>
          <div className="rounded-xl border border-white/10 bg-white/[.04] p-3"><Clock3 className="mx-auto mb-1 h-5 w-5 text-violet-300"/>±18 Menit</div>
          <div className="rounded-xl border border-white/10 bg-white/[.04] p-3"><Trophy className="mx-auto mb-1 h-5 w-5 text-amber-300"/>Maks. 150</div>
        </div>
      </div>
      <button type="button" onClick={start} className="mt-4 w-full rounded-2xl border border-cyan-300/35 bg-gradient-to-r from-cyan-500/18 via-indigo-500/18 to-violet-500/18 p-5 text-left shadow-[0_0_30px_rgba(34,211,238,.10)]">
        <div className="text-xs font-black uppercase tracking-[.14em] text-cyan-300">Halo, {participant?.nickname||"Peserta"}</div>
        <div className="mt-2 text-3xl font-black">Mulai Tes IQ Visual</div>
        <div className="mt-1 text-sm text-slate-300">Hasil otomatis tersimpan ke akun dan Riwayat Tes.</div>
        <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-2.5 text-sm font-black text-slate-950"><Play className="h-4 w-4"/>MULAI 30 SOAL</div>
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
          <div className="rounded-xl border border-white/10 bg-white/[.04] p-3"><div className="text-xl font-black">{result.correct}/30</div><div className="mt-1 text-[9px] font-bold text-slate-500">BENAR</div></div>
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
      <p className="mt-2 text-center text-[10px] leading-4 text-slate-600">Estimasi indikatif dari 30 soal visual; bukan hasil psikotes klinis.</p>
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
        <div className="text-[11px] font-black uppercase tracking-[.15em] text-slate-300">{current.title}</div>
        {(current.layout==="odd" || current.layout==="single") && (
          <p className="mx-auto mt-2 max-w-sm text-[12px] font-semibold leading-5 text-slate-500">{current.hint}</p>
        )}
      </div>

      <div className="mt-5 rounded-[28px] border border-white/10 bg-slate-950/50 p-4 backdrop-blur-xl">
        {current.layout==="sequence"&&<div className="flex min-h-[125px] items-center justify-center gap-1.5">{current.cells.map((x,i)=><div key={i} className="flex items-center gap-1.5"><GlyphView glyph={x}/>{i<current.cells.length-1&&<span className="text-lg font-black text-slate-600">→</span>}</div>)}<div className="grid h-20 w-20 place-items-center rounded-[18px] border border-dashed border-cyan-300/35 bg-cyan-300/[.04] text-3xl font-black text-cyan-300">?</div></div>}
        {current.layout==="analogy"&&<div className="grid min-h-[220px] grid-cols-[1fr_auto_1fr] items-center gap-2"><div className="flex justify-center"><GlyphView glyph={current.cells[0]}/></div><span className="text-2xl font-black text-slate-500">:</span><div className="flex justify-center"><GlyphView glyph={current.cells[1]}/></div><div className="flex justify-center"><GlyphView glyph={current.cells[2]}/></div><span className="text-2xl font-black text-slate-500">:</span><div className="flex justify-center"><div className="grid h-20 w-20 place-items-center rounded-[18px] border border-dashed border-cyan-300/35 bg-cyan-300/[.04] text-3xl font-black text-cyan-300">?</div></div></div>}
        {current.layout==="matrix2"&&<div className="mx-auto grid min-h-[210px] max-w-[200px] grid-cols-2 place-items-center gap-3"><GlyphView glyph={current.cells[0]}/><GlyphView glyph={current.cells[1]}/><GlyphView glyph={current.cells[2]}/><div className="grid h-20 w-20 place-items-center rounded-[18px] border border-dashed border-cyan-300/35 bg-cyan-300/[.04] text-3xl font-black text-cyan-300">?</div></div>}
        {current.layout==="matrix3"&&<div className="mx-auto grid min-h-[260px] max-w-[280px] grid-cols-3 place-items-center gap-1.5">{current.cells.map((x,i)=><GlyphView key={i} glyph={x} small/>)}<div className="grid h-14 w-14 place-items-center rounded-[14px] border border-dashed border-cyan-300/35 bg-cyan-300/[.04] text-2xl font-black text-cyan-300">?</div></div>}
        {current.layout==="single"&&current.family==="rotasi-spasial"&&<div className="flex min-h-[170px] flex-col items-center justify-center">
          <GlyphView glyph={current.cells[0]}/>
          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-300/10 px-3 py-1.5 text-xs font-black text-violet-200">
            <RotateCcw className="h-4 w-4"/> ROTASI SPASIAL
          </div>
        </div>}
        {current.layout==="single"&&current.family!=="rotasi-spasial"&&<div className="flex min-h-[170px] items-center justify-center"><GlyphView glyph={current.cells[0]}/></div>}
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
