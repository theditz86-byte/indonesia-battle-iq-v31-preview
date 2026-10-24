"use client"

import { ArrowLeft, BrainCircuit, Clock3, LockKeyhole, Play, RotateCcw, Share2, Sparkles, Trophy } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { getParticipantToken } from "@/lib/battle"
import { VisualIqLeaderboard, type VisualIqRankItem } from "@/components/visual-iq-leaderboard"
import { VisualIqCertificateModal } from "@/components/visual-iq-certificate"

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
type Layout = "sequence"|"analogy"|"matrix2"|"matrix3"|"single"|"odd"|"combine"|"text"
type Domain = "abstract"|"spatial"|"numerical"|"verbal"
type Question = {
  id: string
  family: string
  domain: Domain
  stage: string
  title: string
  hint: string
  layout: Layout
  difficulty: 2|3|4
  cells: Glyph[]
  options: Glyph[]
  prompt?: string
  textOptions?: string[]
  answer: number
}
type Participant = {
  nickname?: string
  account_ready?: boolean
  public_id?: string
  avatar_url?: string
  province_name?: string
  regency_name?: string
}
type SaveState = "idle"|"saving"|"saved"|"error"

const g=(kind:GlyphKind,rotation=0,filled=false,dot?:Pos,dots?:Pos[],variant?:number):Glyph=>({kind,rotation,filled,dot,dots,variant})



const ROTATABLE:GlyphKind[]=["arrow","triangle","corner","notch","hook"]
const SHAPES:GlyphKind[]=["triangle","square","diamond","pentagon","hexagon","circle"]
const DOT_SHAPES:GlyphKind[]=["circle","square","diamond","pentagon"]
const CARDINAL:Pos[]=["t","r","b","l"]
const CORNERS:Pos[]=["tl","tr","br","bl"]

function normAngle(value:number){ return ((value%360)+360)%360 }

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
function visualRotation(kind:GlyphKind,rotation:number){
  const angle=normAngle(rotation)
  const period:Partial<Record<GlyphKind,number>>={
    circle:1,
    square:90,
    diamond:90,
    triangle:120,
    pentagon:72,
    hexagon:60,
    plus:90,
    x:90,
    star:45,
    bar:180,
    fold:180,
    holes:180,
  }
  const p=period[kind]
  return p ? angle%p : angle
}

function visibleFill(kind:GlyphKind,filled?:boolean){
  const fillSensitive:GlyphKind[]=["triangle","square","circle","diamond","pentagon","hexagon","notch"]
  return fillSensitive.includes(kind)?Boolean(filled):false
}

function visibleVariant(kind:GlyphKind,variant?:number){
  return kind==="fold" ? (variant||0) : 0
}

function glyphKey(x:Glyph){
  // Compare what the player can actually see, not raw generator properties.
  // Dots are drawn outside the rotated <g>, so their screen position is independent of shape rotation.
  return JSON.stringify([
    x.kind,
    visualRotation(x.kind,x.rotation||0),
    visibleFill(x.kind,x.filled),
    x.dot||"",
    [...(x.dots||[])].sort(),
    visibleVariant(x.kind,x.variant),
  ])
}

function baseQuestion(
  id:string,family:string,domain:Domain,stage:string,title:string,hint:string,
  layout:Layout,difficulty:2|3|4,cells:Glyph[]
):Omit<Question,"options"|"answer">{
  return {id,family,domain,stage,title,hint,layout,difficulty,cells}
}

function optionized(
  base:Omit<Question,"options"|"answer">,
  correct:Glyph,
  distractors:Glyph[],
  seed:number
):Question{
  const unique:Glyph[]=[]
  const seen=new Set<string>()
  const add=(item:Glyph)=>{
    const key=glyphKey(item)
    if(!seen.has(key)){seen.add(key);unique.push(item)}
  }
  add(correct)
  distractors.forEach(add)

  // Quality-safe fallback: keep distractors visually related to the target
  // instead of allowing duplicate answers or unrelated anomaly options.
  const fallback:Glyph[]=[]
  if(ROTATABLE.includes(correct.kind)){
    fallback.push(
      g(correct.kind,normAngle((correct.rotation||0)+90),Boolean(correct.filled),correct.dot,correct.dots,correct.variant),
      g(correct.kind,normAngle((correct.rotation||0)+180),Boolean(correct.filled),correct.dot,correct.dots,correct.variant),
      g(correct.kind,normAngle((correct.rotation||0)+270),Boolean(correct.filled),correct.dot,correct.dots,correct.variant),
    )
  }
  if(correct.dot){
    fallback.push(
      g(correct.kind,correct.rotation||0,Boolean(correct.filled),rotatePos(correct.dot,1),correct.dots,correct.variant),
      g(correct.kind,correct.rotation||0,Boolean(correct.filled),rotatePos(correct.dot,2),correct.dots,correct.variant),
      g(correct.kind,correct.rotation||0,Boolean(correct.filled),rotatePos(correct.dot,3),correct.dots,correct.variant),
    )
  }
  fallback.push(g(correct.kind,correct.rotation||0,!Boolean(correct.filled),correct.dot,correct.dots,correct.variant))
  for(const kind of [...SHAPES,...ROTATABLE,"plus","x","star","bar"] as GlyphKind[]){
    if(kind!==correct.kind){
      fallback.push(g(kind,correct.rotation||0,Boolean(correct.filled),correct.dot,correct.dots,correct.variant))
    }
  }
  for(const item of fallback){
    if(unique.length>=4)break
    add(item)
  }
  if(unique.length<4)throw new Error("visual_iq_option_collision_unresolved:"+base.id)

  let options=unique.slice(0,4)
  const shift=Math.abs(seed)%4
  options=[...options.slice(shift),...options.slice(0,shift)]
  const answer=options.findIndex(item=>glyphKey(item)===glyphKey(correct))
  return {...base,options,answer}
}

function textQuestion(
  id:string,family:string,domain:Domain,stage:string,title:string,
  difficulty:2|3|4,prompt:string,correct:string,distractors:string[],seed:number
):Question{
  const unique=[correct,...distractors].filter((value,index,array)=>array.indexOf(value)===index)
  if(unique.length<4)throw new Error("visual_iq_text_option_collision:"+id)
  let textOptions=unique.slice(0,4)
  const shift=Math.abs(seed)%4
  textOptions=[...textOptions.slice(shift),...textOptions.slice(0,shift)]
  return {
    id,family,domain,stage,title,hint:"",layout:"text",difficulty,
    cells:[],options:[],prompt,textOptions,
    answer:textOptions.indexOf(correct),
  }
}

function normalizedQuestionText(value:string){
  return value
    .toLowerCase()
    .replace(/[^a-z0-9À-ÿ]+/g," ")
    .replace(/\s+/g," ")
    .trim()
}

function textAnswerLeaked(q:Question){
  if(q.layout!=="text"||!q.prompt||!q.textOptions)return false
  const correct=q.textOptions[q.answer]?.trim()
  if(!correct)return false

  const prompt=normalizedQuestionText(q.prompt)
  const answer=normalizedQuestionText(correct)
  if(!answer)return false

  // Angka jawaban tidak boleh sudah tampil sebagai token di stimulus.
  if(/^\d+$/.test(answer)){
    return prompt.split(" ").includes(answer)
  }

  // Kalimat/frasa jawaban yang sudah tertulis verbatim membuat soal bocor.
  // Jawaban pendek seperti nama/opsi A-B-C sengaja tidak diblok karena
  // memang dapat disebut sebagai objek di premis tanpa membocorkan solusi.
  return answer.length>=7&&prompt.includes(answer)
}

function questionValid(q:Question){
  if(!q.id||!q.family||!q.domain||!q.title)return false
  if(q.answer<0||q.answer>3)return false
  if(q.layout==="text"){
    return Boolean(
      q.prompt&&
      q.prompt.trim().length>5&&
      q.textOptions&&
      q.textOptions.length===4&&
      new Set(q.textOptions).size===4&&
      !textAnswerLeaked(q)
    )
  }
  if(q.options.length!==4||new Set(q.options.map(glyphKey)).size!==4)return false
  if(q.layout==="sequence"&&q.cells.length<3)return false
  if(q.layout==="analogy"&&q.cells.length!==3)return false
  if(q.layout==="matrix2"&&q.cells.length!==3)return false
  if(q.layout==="matrix3"&&q.cells.length!==8)return false
  if(q.layout==="single"&&q.cells.length!==1)return false
  if(q.layout==="combine"&&q.cells.length!==2)return false
  if((q.layout==="single"||q.layout==="odd")&&q.hint.trim().length<12)return false
  return true
}
function questionSafeForDisplay(q:Question){
  if(!questionValid(q))return false
  if(q.layout==="text")return Boolean(q.textOptions&&new Set(q.textOptions.map(x=>x.trim().toLowerCase())).size===4)
  return new Set(q.options.map(glyphKey)).size===4
}

function buildQuestionBank(){
  const bank:Question[]=[]
  const push=(q:Question)=>{ if(questionValid(q)) bank.push(q) }

  // ABSTRACT REASONING — dominan matrix/pattern, bukan sekadar satu bentuk diputar.
  // 1) Matrix 3x3 rotation: aturan baris dan kolom.
  for(const kind of ["arrow","triangle","corner","notch","hook"] as GlyphKind[]){
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
          baseQuestion("abs-m3-rot-"+kind+"-"+start+"-"+step,"matrix-rotasi","abstract","Abstrak","Matriks Rotasi 3 × 3","","matrix3",2,cells),
          correct,
          [g(kind,normAngle((correct.rotation||0)+90)),g(kind,normAngle((correct.rotation||0)+180)),g(kind,normAngle((correct.rotation||0)+270))],
          start+(step<0?17:5)
        ))
      }
    }
  }

  // 2) Matrix 3x3 dot orbit.
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
          baseQuestion("abs-m3-dot-"+kind+"-"+start+"-"+dir,"matrix-posisi","abstract","Abstrak","Matriks Posisi 3 × 3","","matrix3",2,cells),
          g(kind,0,false,correctPos),
          CORNERS.filter(p=>p!==correctPos).map(p=>g(kind,0,false,p)),
          start+(dir<0?29:7)
        ))
      }
    }
  }

  // 3) Matrix shape cycle + fill diagonal.
  const triads:[GlyphKind,GlyphKind,GlyphKind][]=[
    ["triangle","square","circle"],["diamond","pentagon","hexagon"],["square","diamond","circle"],
    ["triangle","pentagon","circle"],["hexagon","square","diamond"],["circle","pentagon","square"],
    ["triangle","diamond","hexagon"],["circle","square","pentagon"],
  ]
  triads.forEach((set,ti)=>{
    for(let phase=0;phase<3;phase++){
      for(const diagMode of [0,1]){
        const cells:Glyph[]=[]
        for(let row=0;row<3;row++){
          for(let col=0;col<3;col++){
            if(row===2&&col===2)continue
            const kind=set[(row+col+phase)%3]
            const filled=diagMode===0?row===col:row+col===2
            cells.push(g(kind,0,filled))
          }
        }
        const correctKind=set[(4+phase)%3]
        const correctFilled=diagMode===0
        const wrongKindA=set[(phase+2)%3]
        const wrongKindB=set[phase%3]
        push(optionized(
          baseQuestion("abs-m3-shape-"+ti+"-"+phase+"-"+diagMode,"matrix-bentuk","abstract","Abstrak","Matriks Bentuk dan Isi 3 × 3","","matrix3",4,cells),
          g(correctKind,0,correctFilled),
          [
            g(correctKind,0,!correctFilled),
            g(wrongKindA,0,correctFilled),
            g(wrongKindB,0,!correctFilled),
          ],
          ti*11+phase*3+diagMode
        ))
      }
    }
  })

  // 4) Matrix 2x2: same position transform applied to another shape.
  for(const kind of DOT_SHAPES){
    for(let start=0;start<4;start++){
      for(const turns of [1,2,3]){
        const a=CORNERS[start]
        const b=rotatePos(a,turns)
        const cPos=CORNERS[(start+2)%4]
        const correctPos=rotatePos(cPos,turns)
        push(optionized(
          baseQuestion("abs-m2-pos-"+kind+"-"+start+"-"+turns,"matrix2-posisi","abstract","Abstrak","Matriks Transformasi Posisi","","matrix2",2,[
            g(kind,0,false,a),g(kind,0,false,b),g(kind,0,false,cPos)
          ]),
          g(kind,0,false,correctPos),
          CORNERS.filter(p=>p!==correctPos).map(p=>g(kind,0,false,p)),
          start*13+turns
        ))
      }
    }
  }

  // 5) Matrix 2x2: fill toggle plus shape substitution.
  for(let i=0;i<SHAPES.length;i++){
    for(let j=0;j<SHAPES.length;j++){
      if(i===j)continue
      const a=SHAPES[i],b=SHAPES[j]
      const filled=(i+j)%2===0
      const otherShape=SHAPES.find(kind=>kind!==a&&kind!==b) || "circle"
      push(optionized(
        baseQuestion("abs-m2-fill-"+a+"-"+b,"matrix2-isi","abstract","Abstrak","Matriks Bentuk dan Isi","","matrix2",3,[
          g(a,0,filled),g(a,0,!filled),g(b,0,filled)
        ]),
        g(b,0,!filled),
        [g(b,0,filled),g(a,0,!filled),g(otherShape,0,!filled)],
        i*17+j
      ))
    }
  }

  // 6) Analogy: rotation + dot movement.
  for(const kind of ["arrow","triangle","corner","hook"] as GlyphKind[]){
    for(let start=0;start<4;start++){
      for(const turns of [1,2,3]){
        const aAngle=start*90
        const aDot=CORNERS[start]
        const bAngle=normAngle(aAngle+turns*90)
        const bDot=rotatePos(aDot,turns)
        const cAngle=normAngle(aAngle+180)
        const cDot=CORNERS[(start+1)%4]
        const correctAngle=normAngle(cAngle+turns*90)
        const correctDot=rotatePos(cDot,turns)
        push(optionized(
          baseQuestion("abs-ana-rot-"+kind+"-"+start+"-"+turns,"analogi-transformasi","abstract","Abstrak","Analogi Transformasi","","analogy",3,[
            g(kind,aAngle,false,aDot),g(kind,bAngle,false,bDot),g(kind,cAngle,false,cDot)
          ]),
          g(kind,correctAngle,false,correctDot),
          [
            g(kind,correctAngle,false,cDot),
            g(kind,cAngle,false,correctDot),
            g(kind,normAngle(correctAngle+90),false,correctDot),
          ],
          start*19+turns
        ))
      }
    }
  }

  // 7) Sequence with two simultaneous rules.
  for(const kind of ["arrow","triangle","diamond","square","pentagon"] as GlyphKind[]){
    for(let start=0;start<4;start++){
      for(const dir of [-1,1]){
        const p0=CORNERS[start]
        const p1=rotatePos(p0,-dir)
        const p2=rotatePos(p1,-dir)
        const correctPos=rotatePos(p2,-dir)
        const correctAngle=normAngle(start*90+dir*270)
        push(optionized(
          baseQuestion("abs-seq-dual-"+kind+"-"+start+"-"+dir,"pola-ganda","abstract","Abstrak","Pola Ganda","","sequence",3,[
            g(kind,start*90,false,p0),
            g(kind,normAngle(start*90+dir*90),true,p1),
            g(kind,normAngle(start*90+dir*180),false,p2)
          ]),
          g(kind,correctAngle,true,correctPos),
          [
            g(kind,correctAngle,false,correctPos),
            g(kind,correctAngle,true,p2),
            g(kind,normAngle(correctAngle+90),true,correctPos)
          ],
          start+(dir<0?31:9)
        ))
      }
    }
  }

  // 8) Overlay/composition logic.
  const overlays:{a:Glyph;b:Glyph;correct:Glyph;wrong:Glyph[]}[]=[
    {a:g("bar",0),b:g("bar",90),correct:g("plus"),wrong:[g("x"),g("bar",45),g("star")]},
    {a:g("bar",45),b:g("bar",135),correct:g("x"),wrong:[g("plus"),g("bar",0),g("star")]},
    {a:g("plus"),b:g("x"),correct:g("star"),wrong:[g("plus"),g("x"),g("bar",90)]},
  ]
  overlays.forEach((item,i)=>{
    for(let variant=0;variant<16;variant++){
      push(optionized(
        baseQuestion("abs-overlay-"+i+"-"+variant,"komposisi-bentuk","abstract","Abstrak","Gabungan Bentuk","","combine",3,[item.a,item.b]),
        item.correct,item.wrong,i*23+variant
      ))
    }
  })

  // 9) Sequence: position orbit + alternating fill.
  for(const kind of ["triangle","square","diamond","pentagon","hexagon"] as GlyphKind[]){
    for(let start=0;start<4;start++){
      for(const dir of [-1,1]){
        const p0=CORNERS[start]
        const p1=rotatePos(p0,dir)
        const p2=rotatePos(p1,dir)
        const correctPos=rotatePos(p2,dir)
        const cells=[
          g(kind,0,false,p0),
          g(kind,0,true,p1),
          g(kind,0,false,p2),
        ]
        push(optionized(
          baseQuestion("abs-seq-orbit-fill-"+kind+"-"+start+"-"+dir,"orbit-posisi-isi","abstract","Abstrak","Orbit Posisi dan Isi","","sequence",3,cells),
          g(kind,0,true,correctPos),
          [
            g(kind,0,false,correctPos),
            g(kind,0,true,p2),
            g(kind,0,false,p1),
          ],
          start*37+(dir<0?13:7)
        ))
      }
    }
  }

  // 10) Matrix: rotation and fill both change across row/column.
  for(const kind of ["arrow","triangle","corner","notch"] as GlyphKind[]){
    for(const start of [0,90,180,270]){
      for(const step of [90,-90]){
        const cells:Glyph[]=[]
        for(let row=0;row<3;row++){
          for(let col=0;col<3;col++){
            if(row===2&&col===2)continue
            const angle=normAngle(start+(row+col)*step)
            const filled=(row+col)%2===0
            cells.push(g(kind,angle,filled))
          }
        }
        const correctAngle=normAngle(start+4*step)
        push(optionized(
          baseQuestion("abs-m3-rot-fill-"+kind+"-"+start+"-"+step,"matrix-rotasi-isi","abstract","Abstrak","Matriks Rotasi dan Isi 3 × 3","","matrix3",3,cells),
          g(kind,correctAngle,true),
          [
            g(kind,correctAngle,false),
            g(kind,normAngle(correctAngle+90),true),
            g(kind,normAngle(correctAngle+180),false),
          ],
          start+(step<0?73:47)
        ))
      }
    }
  }

  // 11) Hard matrix: three simultaneous rules (rotation + dot orbit + fill parity).
  // This family is intentionally harder than plain rotation/position questions.
  for(const start of [0,90,180,270]){
    for(let dotStart=0;dotStart<4;dotStart++){
      for(const dir of [-1,1]){
        const cells:Glyph[]=[]
        for(let row=0;row<3;row++){
          for(let col=0;col<3;col++){
            if(row===2&&col===2)continue
            const angle=normAngle(start+(row*2+col)*dir*90)
            const dot=CORNERS[(dotStart+row+2*col*dir+40)%4]
            const filled=(row+col+dotStart)%2===0
            cells.push(g("notch",angle,filled,dot))
          }
        }
        const correctAngle=normAngle(start+(2*2+2)*dir*90)
        const correctDot=CORNERS[(dotStart+2+2*2*dir+40)%4]
        const correctFilled=(2+2+dotStart)%2===0
        push(optionized(
          baseQuestion("abs-m3-triple-"+start+"-"+dotStart+"-"+dir,"matrix-tiga-aturan","abstract","Abstrak","Matriks Tiga Aturan 3 × 3","","matrix3",4,cells),
          g("notch",correctAngle,correctFilled,correctDot),
          [
            g("notch",correctAngle,!correctFilled,correctDot),
            g("notch",normAngle(correctAngle+90),correctFilled,correctDot),
            g("notch",correctAngle,correctFilled,rotatePos(correctDot,1)),
          ],
          start+dotStart*41+(dir<0?97:53)
        ))
      }
    }
  }

  // 12) Four-rule matrix: shape cycle + rotation + dot orbit + fill parity.
  // The family is advanced and may appear at most once in a 35-question package.
  for(const phase of [0,1,2]){
    for(const start of [0,90,180,270]){
      for(let dotStart=0;dotStart<4;dotStart++){
        const dir=phase%2===0?1:-1
        const cells:Glyph[]=[]
        for(let row=0;row<3;row++){
          for(let col=0;col<3;col++){
            if(row===2&&col===2)continue
            const kind=SHAPES[(row+col+phase)%3]
            const angle=normAngle(start+(row*2+col)*dir*90)
            const dot=CORNERS[(dotStart+row+2*col*dir+40)%4]
            const filled=(row+col+dotStart+phase)%2===0
            cells.push(g(kind,angle,filled,dot))
          }
        }
        const correctKind=SHAPES[(4+phase)%3]
        const correctAngle=normAngle(start+6*dir*90)
        const correctDot=CORNERS[(dotStart+2+4*dir+40)%4]
        const correctFilled=(4+dotStart+phase)%2===0
        push(optionized(
          baseQuestion("abs-m3-quad-"+start+"-"+phase+"-"+dotStart,"matrix-empat-aturan","abstract","Abstrak","Matriks Empat Aturan 3 × 3","","matrix3",4,cells),
          g(correctKind,correctAngle,correctFilled,correctDot),
          [
            g(correctKind,correctAngle,!correctFilled,correctDot),
            g(correctKind,normAngle(correctAngle+90),correctFilled,correctDot),
            g(correctKind,correctAngle,correctFilled,rotatePos(correctDot,1)),
          ],
          start+phase*37+dotStart*11+5
        ))
      }
    }
  }

  // 13) Hard analogy: apply rotation, dot movement, and fill toggle together.
  for(let start=0;start<4;start++){
    for(const turns of [1,2,3]){
      for(const fillMode of [0,1]){
        const aAngle=start*90
        const aDot=CORNERS[start]
        const aFilled=fillMode===1
        const bAngle=normAngle(aAngle+turns*90)
        const bDot=rotatePos(aDot,turns)
        const bFilled=!aFilled

        const cAngle=normAngle(aAngle+180)
        const cDot=CORNERS[(start+2)%4]
        const cFilled=!aFilled
        const correctAngle=normAngle(cAngle+turns*90)
        const correctDot=rotatePos(cDot,turns)
        const correctFilled=!cFilled

        push(optionized(
          baseQuestion("abs-ana-triple-"+start+"-"+turns+"-"+fillMode,"analogi-tiga-aturan","abstract","Abstrak","Analogi Tiga Aturan","","analogy",4,[
            g("notch",aAngle,aFilled,aDot),
            g("notch",bAngle,bFilled,bDot),
            g("notch",cAngle,cFilled,cDot),
          ]),
          g("notch",correctAngle,correctFilled,correctDot),
          [
            g("notch",correctAngle,!correctFilled,correctDot),
            g("notch",cAngle,correctFilled,correctDot),
            g("notch",correctAngle,correctFilled,cDot),
          ],
          start*43+turns*7+fillMode
        ))
      }
    }
  }

  // SPATIAL REASONING — rotasi, cermin, lipat, simetri.
  for(const kind of ["notch","corner","hook"] as GlyphKind[]){
    for(const start of [0,90,180,270]){
      for(const turn of [90,180,270]){
        const correct=normAngle(start+turn)
        push(optionized(
          baseQuestion("spa-rot-"+kind+"-"+start+"-"+turn,"rotasi-spasial","spatial","Spasial","Manakah Hasil Rotasi "+turn+"°?","Putar bentuk "+turn+"° searah jarum jam, lalu pilih hasil yang sama.","single",2,[g(kind,start)]),
          g(kind,correct),
          [0,90,180,270].filter(v=>v!==correct).map(v=>g(kind,v)),
          start+turn
        ))
      }
    }
  }

  for(const kind of ["arrow","triangle"] as GlyphKind[]){
    for(const angle of [0,90,180,270]){
      for(const dot of CORNERS){
        const vAngle=normAngle(-angle)
        const hAngle=normAngle(180-angle)
        push(optionized(
          baseQuestion("spa-mirror-v-"+kind+"-"+angle+"-"+dot,"cermin-vertikal","spatial","Spasial","Cermin Vertikal","Pantulkan bentuk dan titik dari kiri ke kanan.","single",3,[g(kind,angle,false,dot)]),
          g(kind,vAngle,false,mirrorPosVertical(dot)),
          [
            g(kind,normAngle(vAngle+90),false,mirrorPosVertical(dot)),
            g(kind,vAngle,false,dot),
            g(kind,normAngle(vAngle+180),false,mirrorPosHorizontal(dot)),
          ],
          angle+CORNERS.indexOf(dot)
        ))
        push(optionized(
          baseQuestion("spa-mirror-h-"+kind+"-"+angle+"-"+dot,"cermin-horizontal","spatial","Spasial","Cermin Horizontal","Pantulkan bentuk dan titik dari atas ke bawah.","single",3,[g(kind,angle,false,dot)]),
          g(kind,hAngle,false,mirrorPosHorizontal(dot)),
          [
            g(kind,normAngle(hAngle+90),false,mirrorPosHorizontal(dot)),
            g(kind,hAngle,false,dot),
            g(kind,normAngle(hAngle+180),false,mirrorPosVertical(dot)),
          ],
          angle+CORNERS.indexOf(dot)+41
        ))
      }
    }
  }

  const foldOne:{hole:Pos;correct:Pos[]}[]=[
    {hole:"r",correct:["l","r"]},
    {hole:"tr",correct:["tl","tr"]},
    {hole:"br",correct:["bl","br"]},
  ]
  foldOne.forEach((item,i)=>{
    push(optionized(
      baseQuestion("spa-fold-one-"+item.hole,"lipat-kertas","spatial","Spasial","Satu Lipatan Vertikal","Kertas dilipat pada garis vertikal. Pilih pola lubang setelah kertas dibuka.","single",3,[g("fold",0,false,item.hole,undefined,1)]),
      g("holes",0,false,undefined,item.correct),
      [g("holes",0,false,undefined,["t","b"]),g("holes",0,false,undefined,["tl","br"]),g("holes",0,false,undefined,["c"])],
      i+3
    ))
  })

  for(const hole of CORNERS){
    push(optionized(
      baseQuestion("spa-fold-two-"+hole,"lipat-kertas-ganda","spatial","Spasial","Dua Lipatan","Kertas dilipat vertikal dan horizontal. Pilih pola lubang setelah kertas dibuka.","single",4,[g("fold",0,false,hole,undefined,2)]),
      g("holes",0,false,undefined,["tl","tr","bl","br"]),
      [g("holes",0,false,undefined,["tl","tr"]),g("holes",0,false,undefined,["l","r"]),g("holes",0,false,undefined,["tl","br"])],
      CORNERS.indexOf(hole)+11
    ))
  }

  for(const kind of ["triangle","square","diamond","pentagon","hexagon","circle"] as GlyphKind[]){
    for(const pos of ["c","t","b"] as Pos[]){
      push(optionized(
        baseQuestion("spa-sym-v-"+kind+"-"+pos,"simetri","spatial","Spasial","Pilih Bentuk yang Simetris Vertikal","Perhitungkan bentuk dan posisi titik terhadap sumbu vertikal.","odd",3,[]),
        g(kind,0,false,pos),
        [g(kind,0,false,"l"),g(kind,0,false,"tr"),g(kind,0,false,"br")],
        SHAPES.indexOf(kind)*5+CORNERS.indexOf("tl")
      ))
    }
  }

  // Combined spatial transform: rotate, then mirror.
  for(const kind of ["arrow","triangle","corner","hook"] as GlyphKind[]){
    for(const angle of [0,90,180,270]){
      for(const dot of CORNERS){
        const rotatedAngle=normAngle(angle+90)
        const rotatedDot=rotatePos(dot,1)
        const correctAngle=normAngle(-rotatedAngle)
        const correctDot=mirrorPosVertical(rotatedDot)
        push(optionized(
          baseQuestion("spa-rot-mirror-"+kind+"-"+angle+"-"+dot,"rotasi-cermin","spatial","Spasial","Rotasi lalu Cermin","Putar 90° searah jarum jam, lalu cerminkan kiri ke kanan.","single",4,[g(kind,angle,false,dot)]),
          g(kind,correctAngle,false,correctDot),
          [
            g(kind,rotatedAngle,false,rotatedDot),
            g(kind,correctAngle,false,rotatedDot),
            g(kind,normAngle(correctAngle+180),false,correctDot),
          ],
          angle+CORNERS.indexOf(dot)*17+5
        ))
      }
    }
  }

  // NUMERICAL REASONING — original, rule-based.
  for(let start=1;start<=12;start++){
    for(let step=2;step<=7;step++){
      const seq=[start,start+step,start+step*2,start+step*3,start+step*4]
      const ans=start+step*5
      push(textQuestion(
        "num-arith-"+start+"-"+step,"urutan-tetap","numerical","Numerik","Urutan Angka",2,
        "Angka berikutnya adalah: "+seq.join(", ") + ", __",
        String(ans),[String(ans-step),String(ans+step),String(ans+step*2)],start+step
      ))
    }
  }

  for(let start=1;start<=10;start++){
    for(let d=1;d<=4;d++){
      const values=[start]
      let current=start
      for(let k=0;k<4;k++){current+=d+k;values.push(current)}
      const ans=current+d+4
      push(textQuestion(
        "num-grow-"+start+"-"+d,"selisih-bertambah","numerical","Numerik","Selisih Bertambah",3,
        "Tentukan angka berikutnya: "+values.join(", ") + ", __",
        String(ans),[String(ans-1),String(ans+1),String(ans+(d+4))],start*7+d
      ))
    }
  }

  for(let a=1;a<=8;a++){
    for(let b=8;b<=14;b+=2){
      const seq=[a,b,a+2,b+3,a+4,b+6,a+6]
      const ans=b+9
      push(textQuestion(
        "num-alt-"+a+"-"+b,"dua-urutan","numerical","Numerik","Dua Urutan Bergantian",3,
        "Tentukan angka berikutnya: "+seq.join(", ") + ", __",
        String(ans),[String(ans-3),String(ans+3),String(ans+6)],a+b
      ))
    }
  }

  for(let n=2;n<=18;n++){
    const add=(n%4)+2
    // Target tidak boleh muncul di contoh; jika muncul, jawaban akan bocor di stimulus.
    const samplePool=[2,3,4,5,6,7,8,9]
    const samples=samplePool.filter(x=>x!==n).slice(0,3)
    const mappings=samples.map(x=>x+" → "+(x*x+add)).join(", ")
    const correct=n*n+add
    push(textQuestion(
      "num-map-"+n+"-"+add,"aturan-transformasi","numerical","Numerik","Aturan Transformasi",3,
      "Sebuah aturan memberi "+mappings+". Dengan aturan yang sama, "+n+" → ?",
      String(correct),[String(n*n),String(correct+n),String(correct+n+add)],n*5+add
    ))
  }

  for(let base=2;base<=9;base++){
    const seq=[base,base*2+1,(base*2+1)*2+2,((base*2+1)*2+2)*2+3]
    const correct=seq[3]*2+4
    push(textQuestion(
      "num-muladd-"+base,"kali-tambah","numerical","Numerik","Pola Kali-Tambah",3,
      "Tentukan angka berikutnya: "+seq.join(", ") + ", __",
      String(correct),[String(correct-4),String(correct+4),String(seq[3]*2+3)],base*11
    ))
  }

  // Increasing square differences: +1², +2², +3², ...
  for(let base=3;base<=14;base++){
    const seq=[base]
    let current=base
    for(let k=1;k<=4;k++){current+=k*k;seq.push(current)}
    const correct=current+25
    push(textQuestion(
      "num-square-gap-"+base,"selisih-kuadrat","numerical","Numerik","Selisih Kuadrat",4,
      "Tentukan angka berikutnya: "+seq.join(", ") + ", __",
      String(correct),[String(correct-9),String(correct-16),String(correct+11)],base*19
    ))
  }

  // Alternating × / + operations, requiring two interleaved rules.
  for(let base=2;base<=9;base++){
    for(const add of [2,3,4]){
      const a=base
      const b=a*2
      const d=b+add
      const e=d*2
      const f=e+add
      const correct=f*2
      const seq=[a,b,d,e,f]
      push(textQuestion(
        "num-alt-op-"+base+"-"+add,"operasi-selang-seling","numerical","Numerik","Operasi Selang-seling",4,
        "Tentukan angka berikutnya: "+seq.join(", ") + ", __",
        String(correct),[String(correct-add),String(f+add),String(correct+add)],base*23+add
      ))
    }
  }

  // Additional TIU-style numerical families to keep the 35-question set varied.
  // These are different reasoning forms, not cosmetic rewrites of number sequences.

  // Percentage change.
  for(let base=120;base<=400;base+=40){
    const pct=[10,15,20,25][(base/40)%4]
    const correct=base+(base*pct/100)
    push(textQuestion(
      "num-pct-"+base+"-"+pct,"persentase-perubahan","numerical","Numerik","Persentase Perubahan",3,
      "Nilai awal "+base+" meningkat "+pct+"%. Berapa nilai akhirnya?",
      String(correct),[String(base),String(base+(base*(pct-5)/100)),String(base+(base*(pct+5)/100))],base+pct
    ))
  }

  // Ratio and total.
  const ratioCases:[[number,number,number]]|any=[
    [2,3,75],[3,5,96],[4,7,121],[5,8,156],[3,7,150],[5,9,196],[7,8,225],[4,9,169]
  ]
  ratioCases.forEach(([a,b,total]:[number,number,number],i:number)=>{
    const unit=total/(a+b)
    const correct=a*unit
    push(textQuestion(
      "num-ratio-"+i,"rasio-total","numerical","Numerik","Rasio dan Total",3,
      "Jumlah dua nilai adalah "+total+" dengan rasio "+a+" : "+b+". Berapa nilai bagian pertama?",
      String(correct),[String(correct+unit),String(correct+2*unit),String(Math.max(0,correct-unit))],i*31+7
    ))
  })

  // Speed-distance-time.
  const speedCases=[[60,2],[72,3],[80,4],[90,2],[48,5],[75,4],[64,3],[84,5]] as const
  speedCases.forEach(([speed,hours],i)=>{
    const correct=speed*hours
    push(textQuestion(
      "num-speed-"+speed+"-"+hours,"kecepatan-jarak","numerical","Numerik","Kecepatan dan Jarak",3,
      "Sebuah kendaraan melaju rata-rata "+speed+" km/jam selama "+hours+" jam. Berapa jarak yang ditempuh?",
      String(correct),[String(correct-speed),String(correct+speed),String(speed+hours)],i*37+11
    ))
  })

  // Combined work rate with integer-friendly cases.
  const workCases=[[6,3],[8,8],[12,6],[10,5],[15,10],[18,9],[20,5],[24,8]] as const
  workCases.forEach(([a,b],i)=>{
    const correct=(a*b)/(a+b)
    if(!Number.isInteger(correct))return
    push(textQuestion(
      "num-work-"+a+"-"+b,"kerja-bersama","numerical","Numerik","Kerja Bersama",4,
      "A menyelesaikan suatu pekerjaan sendiri dalam "+a+" jam dan B dalam "+b+" jam. Jika bekerja bersama dengan laju tetap, pekerjaan selesai dalam berapa jam?",
      String(correct),[String(correct+1),String(correct+2),String(correct+3)],i*41+13
    ))
  })

  // Age relation.
  const ageCases=[[4,3,24],[5,2,30],[6,4,42],[7,3,35],[8,5,52],[9,4,45],[10,6,64],[12,5,60]] as const
  ageCases.forEach(([gap,years,youngerNow],i)=>{
    const olderNow=youngerNow+gap
    const correct=olderNow+years
    push(textQuestion(
      "num-age-"+gap+"-"+years+"-"+youngerNow,"usia-relasi","numerical","Numerik","Relasi Usia",3,
      "Usia Rani sekarang "+gap+" tahun lebih tua daripada Dita. Jika usia Dita sekarang "+youngerNow+" tahun, berapa usia Rani "+years+" tahun lagi?",
      String(correct),[String(olderNow),String(youngerNow+years),String(correct+gap)],i*43+17
    ))
  })

  // Average after replacing one score.
  const avgCases=[[70,5,60,80],[72,5,62,82],[75,4,66,86],[78,5,68,88],[80,4,70,90],[82,5,72,92],[84,4,74,94],[86,5,76,96]] as const
  avgCases.forEach(([avg,count,oldValue,newValue],i)=>{
    const correct=(avg*count-oldValue+newValue)/count
    push(textQuestion(
      "num-avg-"+i,"rata-rata-perubahan","numerical","Numerik","Rata-rata",4,
      "Rata-rata "+count+" nilai adalah "+avg+". Salah satu nilai "+oldValue+" diganti menjadi "+newValue+". Berapa rata-rata barunya?",
      String(correct),[String(avg),String(correct-2),String(correct+2)],i*47+19
    ))
  })

  // Simple algebraic quantitative relation.
  const algebraCases=[[3,7,34],[4,5,37],[5,6,51],[6,4,52],[7,3,59],[8,2,66],[9,5,86],[10,7,107]] as const
  algebraCases.forEach(([coef,add,result],i)=>{
    const correct=(result-add)/coef
    if(!Number.isInteger(correct))return
    push(textQuestion(
      "num-algebra-"+coef+"-"+add+"-"+result,"relasi-aljabar","numerical","Numerik","Relasi Aljabar",3,
      "Jika "+coef+"x + "+add+" = "+result+", berapakah nilai x?",
      String(correct),[String(correct+1),String(Math.max(0,correct-1)),String(correct+2)],i*53+23
    ))
  })


  // Bank TIU lanjutan: tiap family mewakili METODE penalaran yang berbeda.
  const advancedNum=(
    id:string,family:string,title:string,prompt:string,
    correct:string|number,wrong:(string|number)[],seed:number
  )=>{
    const answer=String(correct)
    const distractors=[...new Set(wrong.map(String))].filter(x=>x!==answer)
    // Pertahankan tepat empat opsi unik sekalipun parameter soal berimpit.
    if(distractors.length<3&&Number.isFinite(Number(answer))){
      let offset=1
      while(distractors.length<3){
        const candidate=String(Number(answer)+offset*7)
        if(candidate!==answer&&!distractors.includes(candidate))distractors.push(candidate)
        offset++
      }
    }
    if(distractors.length<3)throw new Error("numerical_distractor_collision:"+id)
    push(textQuestion(id,family,"numerical","Numerik",title,4,prompt,answer,distractors,seed))
  }
  const nGcd=(a:number,b:number):number=>{
    while(b){const next=a%b;a=b;b=next}
    return a
  }
  const nFrac=(a:number,b:number)=>{const d=nGcd(a,b);return (a/d)+"/"+(b/d)}
  const nC=(n:number,k:number)=>{
    let count=1
    for(let j=1;j<=k;j++)count=count*(n-k+j)/j
    return Math.round(count)
  }

  // Deret menengah/sulit: rekursif dan pergantian dua subderet berbeda.
  for(let a=2;a<=11;a++){
    const b=a+3,shift=a%3+1,seq=[a,b]
    for(let i=2;i<5;i++)seq.push(seq[i-1]+seq[i-2]+shift)
    const answer=seq[3]+seq[4]+shift
    advancedNum("num-recur-"+a,"rekursif-dua-suku","Deret Rekursif",
      "Tentukan suku berikutnya: "+seq.join(", ")+", __",
      answer,[answer-shift,answer+shift,answer+b],a*61)
  }
  for(let a=4;a<=13;a++){
    const b=a+15,seq=[a,b,a+3,2*b-1,a+9,4*b-3],answer=a+18
    advancedNum("num-cross-"+a,"deret-seling-majemuk","Deret Dua Aturan",
      "Tentukan suku berikutnya: "+seq.join(", ")+", __",
      answer,[answer-3,answer+3,answer+6],a*67)
  }

  // Rasio tiga variabel, rasio yang berubah, dan proporsi mesin+efisiensi.
  const ratioChains=[[2,3,4,5,3],[3,4,5,7,2],[4,5,3,7,2],[3,7,2,5,4],
    [5,6,3,4,2],[2,5,4,7,3],[4,7,3,5,2],[5,8,2,3,3]]
  ratioChains.forEach(([a,b,c,d,unit],i)=>{
    const p=a*c*unit,q=b*c*unit,r=b*d*unit
    advancedNum("num-ratio-chain-"+i,"rasio-berantai","Rasio Bertingkat",
      "P : Q = "+a+" : "+b+" dan Q : R = "+c+" : "+d+
      ". Jumlah P, Q, dan R adalah "+(p+q+r)+". Berapa nilai R?",
      r,[r-unit,r+unit,r+b*unit],i*71+3)
  })
  const ratioChanges=[[2,3,12,6,6],[3,5,10,10,5],[4,7,9,8,7],[5,8,8,12,8],
    [3,4,15,9,5],[2,5,11,10,5],[4,9,7,14,7],[3,7,12,8,6]]
  ratioChanges.forEach(([a,b,unit,plus,minus],i)=>{
    const afterA=a*unit+plus,afterB=b*unit-minus
    if(afterB<=0)return
    const div=nGcd(afterA,afterB),answer=(a+b)*unit
    advancedNum("num-ratio-change-"+i,"rasio-berubah","Rasio Setelah Perubahan",
      "Awalnya A : B = "+a+" : "+b+". Setelah A bertambah "+plus+
      " dan B berkurang "+minus+", rasionya menjadi "+(afterA/div)+" : "+(afterB/div)+
      ". Berapa jumlah A dan B sebelum perubahan?",
      answer,[answer-unit,answer+unit,answer+3*unit],i*73+5)
  })
  const machines=[[4,3,12,6,5,80],[3,5,10,8,3,75],[5,4,8,6,5,75],[4,6,10,9,4,80],
    [6,3,12,8,5,75],[3,4,16,5,6,75],[5,6,8,10,3,80],[4,5,12,8,5,75]]
  machines.forEach(([m,h,rate,m2,h2,eff],i)=>{
    const base=m*h*rate,raw=m2*h2*rate,answer=Math.round(raw*eff/100)
    advancedNum("num-machines-"+i,"produktivitas-proporsional","Proporsi Produktivitas",
      m+" mesin menghasilkan "+base+" unit selama "+h+" jam. Berapa hasil "+m2+
      " mesin selama "+h2+" jam dengan efisiensi "+eff+"% dari semula?",
      answer,[raw,answer+rate,answer-rate],i*79+7)
  })

  // Persentase multi-tahap (bukan soal naik/turun satu langkah).
  const discounts=[[200000,20,10,10],[300000,10,20,10],[400000,20,15,10],[600000,15,20,10],
    [800000,25,10,10],[500000,10,15,10],[240000,20,25,10],[360000,25,20,10]]
  discounts.forEach(([price,d1,d2,tax],i)=>{
    const first=price*(100-d1)/100,after=first*(100-d2)/100
    const answer=Math.round(after*(100+tax)/100)
    advancedNum("num-discounts-"+i,"diskon-pajak-bertahap","Diskon dan Pajak",
      "Harga Rp"+price+" didiskon "+d1+"%, lalu "+d2+
      "% dari harga tersisa, kemudian dikenai pajak "+tax+"%. Berapa total bayar?",
      answer,[Math.round(after),Math.round(first*(100+tax)/100),answer+price/20],i*83+11)
  })
  const growths=[[800,20,10],[1000,30,20],[1200,30,10],[1600,10,25],
    [2000,25,10],[2400,20,15],[3200,15,20],[4000,30,25]]
  growths.forEach(([initial,up,down],i)=>{
    const answer=Math.round(initial*(100+up)/100*(100-down)/100)
    advancedNum("num-compound-"+i,"pertumbuhan-majemuk","Persentase Bertahap",
      "Produksi "+initial+" unit meningkat "+up+
      "% lalu berkurang "+down+"% dari hasil terakhir. Berapa produksi akhirnya?",
      answer,[Math.round(initial*(100+up-down)/100),answer+initial/20,answer-initial/20],i*89+13)
  })
  const margins=[[160000,25,20],[240000,20,25],[320000,25,20],[400000,20,20],
    [480000,25,25],[600000,20,25],[640000,25,20],[800000,20,20]]
  margins.forEach(([cost,profit,discount],i)=>{
    const answer=Math.round(cost*(100+profit)/(100-discount))
    advancedNum("num-margin-"+i,"margin-diskon","Laba dan Harga Label",
      "Modal Rp"+cost+". Penjual menargetkan keuntungan "+profit+
      "% dari modal setelah memberikan diskon "+discount+"%. Berapa harga label awal?",
      answer,[Math.round(cost*(100+profit)/100),answer+cost/10,answer-cost/10],i*97+17)
  })

  // Analitis: dua variabel, kongruensi, batas kendala, dan digit.
  const equations=[[9,3,2,3,3,2],[12,4,3,2,2,5],[14,5,2,5,3,4],[16,6,4,3,2,5],
    [18,7,3,4,5,2],[11,3,5,2,2,3],[13,4,3,5,4,2],[15,5,2,3,3,4]]
  equations.forEach(([x,y,a,b,c,d],i)=>{
    const first=a*x+b*y,second=c*x+d*y,answer=2*x-y
    advancedNum("num-equations-"+i,"sistem-linear","Sistem Persamaan",
      "Jika "+a+"x + "+b+"y = "+first+" dan "+c+"x + "+d+
      "y = "+second+", tentukan 2x - y.",
      answer,[answer-y,answer+y,answer+2],i*101+19)
  })
  const remainders=[[4,1,5,2,50],[3,2,7,4,60],[5,1,8,3,80],[7,4,9,2,100],
    [4,3,7,2,90],[5,4,9,1,110],[3,1,8,5,75],[7,2,8,3,95]]
  remainders.forEach(([m1,r1,m2,r2,threshold],i)=>{
    let answer=threshold+1
    while(answer%m1!==r1||answer%m2!==r2)answer++
    advancedNum("num-remainders-"+i,"aritmetika-sisa","Logika Sisa Pembagian",
      "Bilangan bulat terkecil di atas "+threshold+" jika dibagi "+m1+
      " bersisa "+r1+" dan jika dibagi "+m2+" bersisa "+r2+". Berapakah bilangannya?",
      answer,[answer-m1,answer+m1,answer+m2],i*103+23)
  })
  const digits=[[5,1],[5,2],[6,2],[6,3],[7,2],[7,3],[8,2],[8,3]]
  digits.forEach(([a,b],i)=>{
    const answer=10*a+b
    advancedNum("num-digits-"+i,"digit-bersyarat","Digit Bersyarat",
      "Jumlah dua digit sebuah bilangan adalah "+(a+b)+
      ". Bilangan tersebut "+(9*(a-b))+" lebih besar daripada bilangan hasil pembalikan digitnya. Bilangan awal?",
      answer,[answer-9,answer+9,10*b+a],i*107+29)
  })
  const optimizations=[[3,5,24,2,1,12,7,8],[4,3,28,1,2,12,8,7],
    [5,4,34,2,1,13,12,9],[3,4,27,1,2,12,6,9],
    [4,6,36,2,1,14,10,11],[5,3,30,2,2,14,13,8],
    [6,4,38,1,2,13,13,11],[4,5,33,2,1,14,9,10]]
  optimizations.forEach(([ca,cb,budget,ta,tb,time,pa,pb],i)=>{
    let answer=0
    for(let a=0;a<=budget/ca;a++)for(let b=0;b<=budget/cb;b++){
      if(a*ca+b*cb<=budget&&a*ta+b*tb<=time)answer=Math.max(answer,a*pa+b*pb)
    }
    advancedNum("num-optimize-"+i,"optimasi-dua-kendala","Optimasi Dua Kendala",
      "Unit A membutuhkan biaya "+ca+" dan waktu "+ta+" untuk "+pa+
      " poin. Unit B membutuhkan biaya "+cb+" dan waktu "+tb+" untuk "+pb+
      " poin. Biaya maksimal "+budget+", waktu maksimal "+time+
      ". Berapa poin maksimum untuk jumlah unit bulat tidak negatif?",
      answer,[answer-2,answer+2,answer+5],i*109+31)
  })

  // Probabilitas dan kombinatorika murni (tanpa pengembalian dan batasan anggota).
  const balls=[[4,3],[5,4],[6,5],[7,4],[8,5],[5,6],[6,4],[7,6]]
  balls.forEach(([red,blue],i)=>{
    const total=nC(red+blue,2),both=nC(red,2),one=red*blue
    advancedNum("num-two-red-"+i,"peluang-tanpa-pengembalian","Peluang Pengambilan",
      "Ada "+red+" bola merah dan "+blue+
      " bola biru. Jika dua bola diambil sekaligus tanpa pengembalian, berapa peluang keduanya merah?",
      nFrac(both,total),[nFrac(both-1,total),nFrac(both+1,total),nFrac(both+2,total)],i*113+37)
    advancedNum("num-one-red-"+i,"peluang-tepat-satu","Peluang Tepat Satu",
      "Ada "+red+" bola merah dan "+blue+
      " bola biru. Jika dua bola diambil sekaligus, berapa peluang tepat satu bola merah?",
      nFrac(one,total),[nFrac(one-1,total),nFrac(one+1,total),nFrac(one+2,total)],i*131+43)
  })
  const teams=[[7,3],[8,3],[8,4],[9,3],[9,4],[10,3],[10,4],[11,4]]
  teams.forEach(([count,size],i)=>{
    const answer=nC(count,size)-nC(count-2,size-2)
    advancedNum("num-teams-"+i,"kombinasi-syarat","Kombinasi Bersyarat",
      "Dari "+count+" orang dipilih tim berisi "+size+
      " orang. Dua orang tertentu tidak boleh berada dalam satu tim. Berapa banyak susunan tim?",
      answer,[nC(count,size),answer-1,answer+1],i*127+41)
  })

  // Soal cerita multi-tahap (sebagian tidak bergantung pada deret).
  const productions=[[40,3,4,25,10],[60,2,3,25,10],[80,3,5,25,20],[100,4,3,20,10],
    [120,3,4,25,10],[80,4,5,20,10],[60,3,4,20,10],[100,3,5,25,20]]
  productions.forEach(([daily,d1,d2,rate,reject],i)=>{
    const total=daily*d1+daily*(100+rate)/100*d2
    const answer=Math.round(total*(100-reject)/100)
    advancedNum("num-production-"+i,"produksi-bertahap","Produksi Dua Tahap",
      "Produksi "+daily+" unit/hari selama "+d1+" hari, lalu meningkat "+rate+
      "% selama "+d2+" hari. Jika "+reject+"% dari seluruh hasil ditolak, berapa yang lolos?",
      answer,[total,answer+daily,answer-daily],i*137+47)
  })
  const pursuits=[[60,90,45],[40,60,60],[50,75,45],[60,100,60],
    [80,120,45],[75,105,48],[45,75,60],[70,110,60]]
  pursuits.forEach(([a,b,minutes],i)=>{
    const answer=Math.round(b*(a*minutes/60/(b-a))*10)/10
    const round=(x:number)=>Number(x.toFixed(1)).toString()
    advancedNum("num-catchup-"+i,"kejar-mengejar","Kejar Mengejar",
      "A berangkat "+minutes+" menit lebih awal dengan kecepatan "+a+
      " km/jam. B berangkat dari titik yang sama dengan kecepatan "+b+
      " km/jam. Di jarak berapa km B menyusul A? Bulatkan satu desimal bila perlu.",
      round(answer),[round(answer+10),round(answer-10),round(answer+20)],i*139+53)
  })
  const mixtures=[[5,20,5,40,2.5],[8,20,2,50,2],[4,15,6,35,2],
    [6,25,4,45,2],[3,20,7,30,2],[4,10,8,40,3],
    [5,30,5,50,5],[8,15,4,45,3]]
  mixtures.forEach(([v1,c1,v2,c2,water],i)=>{
    const answer=Math.round((v1*c1+v2*c2)/(v1+v2+water)*10)/10
    const percent=(x:number)=>x.toFixed(1).replace(".",",")+"%"
    advancedNum("num-mixture-"+i,"campuran-bertingkat","Campuran Bertingkat",
      "Campurkan "+v1+" liter larutan "+c1+"% dan "+v2+" liter larutan "+c2+
      "%, lalu tambahkan "+water+" liter air. Berapa kadar akhir? Bulatkan satu desimal.",
      percent(answer),[percent(answer+2),percent(answer-2),percent(answer+4)],i*149+59)
  })
  const operations=[[100000,8000,50,14000,5],[180000,9000,60,17000,10],
    [120000,10000,40,18000,5],[250000,10000,70,18000,10],
    [160000,7000,80,13000,5],[200000,12000,60,20000,10],
    [300000,9000,90,17000,5],[240000,11000,80,19000,10]]
  operations.forEach(([fixed,cost,qty,sale,fee],i)=>{
    const omzet=qty*sale,answer=Math.round(omzet*(100-fee)/100-qty*cost-fixed)
    if(answer<=0)return
    advancedNum("num-operations-"+i,"laba-operasional","Laba Operasional",
      "Biaya tetap Rp"+fixed+" dan biaya variabel Rp"+cost+" per unit. Terjual "+qty+
      " unit dengan harga Rp"+sale+"/unit. Komisi penjualan "+fee+
      "% dari omzet. Berapa laba bersih sebelum pajak?",
      answer,[answer+fixed,answer-fixed,answer+Math.round(omzet*fee/100)],i*151+61)
  })

  // Daily hard batch 2026-10-21: one new item in each existing quota family.
  advancedNum("num-daily-20261021-01","rekursif-dua-suku","Deret Rekursif Berantai",
    "Tentukan suku berikutnya: 6, 11, 18, 30, 49, __.",
    80,[79,82,91],20261021)
  advancedNum("num-daily-20261021-02","rasio-berantai","Perbandingan Tiga Kelompok",
    "P : Q = 3 : 5 dan Q : R = 4 : 7. Jika jumlah P, Q, dan R adalah 134, berapa nilai R?",
    70,[66,74,80],20261022)
  advancedNum("num-daily-20261021-03","persentase-perubahan","Persentase Beruntun",
    "Harga barang Rp600.000 naik 12%, lalu diberi diskon 15% dari harga setelah kenaikan. Berapa harga akhirnya?",
    571200,[568000,576000,580000],20261023)
  advancedNum("num-daily-20261021-04","sistem-linear","Sistem Persamaan",
    "Diketahui 2x + 3y = 25 dan x + y = 11. Berapa nilai x?",
    8,[7,9,10],20261024)
  advancedNum("num-daily-20261021-05","kombinasi-syarat","Kombinatorika dengan Larangan",
    "Dari 9 kandidat dipilih 3 orang. Dua kandidat tertentu tidak boleh terpilih bersama. Berapa banyak tim yang mungkin?",
    77,[70,78,84],20261025)
  advancedNum("num-daily-20261021-06","kerja-bersama","Laju Kerja Gabungan",
    "A menyelesaikan pekerjaan dalam 8 hari dan B dalam 12 hari. Jika bekerja bersama dengan laju tetap, berapa hari yang diperlukan?",
    "4,8 hari",["4 hari","5 hari","6 hari"],20261026)

  // Daily hard batch 2026-10-24: new methods, with distinct families.
  advancedNum("num-daily-20261024-01","deret-operasi-selang-seling","Deret Operasi Bergantian",
    "Tentukan suku berikutnya: 4, 12, 14, 42, 44, 132, __.",
    134,[396,136,130],2026102401)
  advancedNum("num-daily-20261024-02","produktivitas-multi-faktor","Produktivitas Multi-Faktor",
    "Tiga printer identik mencetak 540 halaman dalam 6 menit. Dengan laju tetap, berapa halaman yang dicetak 5 printer dalam 8 menit?",
    1200,[1080,1350,1500],2026102402)
  advancedNum("num-daily-20261024-03","geometri-perimeter-luas","Perimeter dan Luas",
    "Sebuah persegi panjang berkeliling 84 cm. Panjangnya 3 cm lebih besar daripada dua kali lebarnya. Berapa luasnya?",
    377,[364,390,406],2026102403)
  advancedNum("num-daily-20261024-04","kecepatan-rerata-jarak-sama","Kecepatan Rata-Rata untuk Jarak Sama",
    "Kendaraan menempuh 120 km dengan kecepatan 40 km/jam dan 120 km berikutnya dengan kecepatan 60 km/jam. Berapa kecepatan rata-rata seluruh perjalanan?",
    48,[50,45,52],2026102404)
  advancedNum("num-daily-20261024-05","rasio-persentase-ekuivalen","Rasio dari Persentase",
    "Jika 80% dari x sama dengan 120% dari y, dengan x dan y positif, berapa rasio x : y?",
    "3:2",["2:3","4:5","5:4"],2026102405)
  advancedNum("num-daily-20261024-06","rata-rata-antar-kelompok","Rata-Rata Antar Kelompok",
    "Rata-rata 12 nilai adalah 68. Rata-rata 5 nilai pertama adalah 72. Berapa rata-rata 7 nilai sisanya?",
    "65 1/7",["64","66","67"],2026102406)

  // VERBAL REASONING — original Indonesian items, deliberately separate from MyIQTested wording.
  const verbalItems=[
    ["ver-ana-1","analogi-fungsi","Analogi Kata",2,"Kompas berhubungan dengan arah seperti termometer berhubungan dengan ...","suhu",["waktu","tekanan","jarak"]],
    ["ver-ana-2","analogi-fungsi","Analogi Kata",2,"Kunci berhubungan dengan membuka seperti pensil berhubungan dengan ...","menulis",["menghapus","membaca","mengukur"]],
    ["ver-ana-3","analogi-bagian","Analogi Kata",2,"Halaman berhubungan dengan buku seperti kamar berhubungan dengan ...","rumah",["pintu","meja","jalan"]],
    ["ver-ana-4","analogi-bagian","Analogi Kata",2,"Roda berhubungan dengan mobil seperti baling-baling berhubungan dengan ...","helikopter",["jalan","mesin","bandara"]],
    ["ver-cat-1","kategori","Klasifikasi Kata",2,"Manakah yang tidak termasuk kelompok yang sama?","kaca",["besi","tembaga","aluminium"]],
    ["ver-cat-2","kategori","Klasifikasi Kata",2,"Manakah yang tidak termasuk kelompok yang sama?","elang",["mawar","melati","anggrek"]],
    ["ver-ant-1","lawan-kata","Hubungan Kata",2,"Pilih pasangan dengan hubungan berlawanan yang paling tepat.","naik — turun",["tinggi — besar","cepat — segera","jauh — panjang"]],
    ["ver-ant-2","lawan-kata","Hubungan Kata",2,"Pilih pasangan dengan hubungan berlawanan yang paling tepat.","hemat — boros",["cerdas — pandai","sunyi — sepi","luas — lapang"]],

    ["ver-log-1","deduksi","Logika Pernyataan",3,"Semua arsitek teliti. Sebagian orang teliti suka menggambar. Kesimpulan yang pasti benar adalah ...","Semua arsitek termasuk orang yang teliti.",["Semua arsitek suka menggambar.","Sebagian arsitek pasti suka menggambar.","Tidak ada arsitek yang suka menggambar."]],
    ["ver-log-2","deduksi","Logika Pernyataan",3,"Semua lumba-lumba adalah mamalia. Tidak ada mamalia yang merupakan ikan. Kesimpulan yang benar adalah ...","Lumba-lumba bukan ikan.",["Semua ikan adalah mamalia.","Sebagian lumba-lumba adalah ikan.","Tidak ada mamalia hidup di air."]],
    ["ver-log-3","deduksi","Logika Pernyataan",3,"Tidak ada benda rapuh yang tahan benturan keras. Semua gelas kristal rapuh. Maka ...","Gelas kristal tidak tahan benturan keras.",["Semua benda tahan benturan adalah kristal.","Sebagian kristal tahan benturan keras.","Tidak ada benda rapuh yang terbuat dari kaca."]],
    ["ver-log-4","deduksi","Logika Pernyataan",3,"Semua peserta final memakai kartu identitas. Rina adalah peserta final. Maka ...","Rina memakai kartu identitas.",["Rina adalah panitia.","Semua pemakai kartu identitas adalah finalis.","Rina pasti juara."]],

    ["ver-order-1","urutan-logis","Urutan Logis",3,"A lebih tinggi dari B. B lebih tinggi dari C. Siapa yang paling rendah?","C",["A","B","Tidak dapat ditentukan"]],
    ["ver-order-2","urutan-logis","Urutan Logis",3,"Dina tiba sebelum Raka. Raka tiba sebelum Sinta. Siapa yang tiba paling akhir?","Sinta",["Dina","Raka","Tidak dapat ditentukan"]],
    ["ver-order-3","urutan-logis","Urutan Logis",3,"Kotak P lebih berat dari Q. Q lebih berat dari R. Kotak mana yang paling ringan?","R",["P","Q","P dan Q sama"]],
    ["ver-order-4","urutan-logis","Urutan Logis",3,"Nia lebih muda dari Sari. Sari lebih muda dari Tika. Siapa yang paling tua?","Tika",["Nia","Sari","Tidak dapat ditentukan"]],

    ["ver-cond-1","implikasi","Logika Kondisional",3,"Jika lampu merah menyala maka mesin berhenti. Lampu merah menyala. Apa yang dapat disimpulkan?","Mesin berhenti.",["Mesin pasti rusak.","Lampu hijau juga menyala.","Mesin bergerak lebih cepat."]],
    ["ver-cond-2","implikasi","Logika Kondisional",3,"Jika data lengkap maka laporan dapat diproses. Laporan belum dapat diproses. Kesimpulan yang paling tepat adalah ...","Kelengkapan data perlu diperiksa.",["Data pasti lengkap.","Laporan pasti salah.","Tidak ada hubungan dengan data."]],
    ["ver-cause-1","sebab-akibat","Hubungan Sebab-Akibat",3,"Hujan deras menyebabkan debit sungai meningkat. Jika hujan deras berlangsung lama, akibat yang paling logis adalah ...","Risiko sungai meluap meningkat.",["Debit sungai pasti turun.","Air sungai berubah menjadi asin.","Sungai berhenti mengalir."]],
    ["ver-cause-2","sebab-akibat","Hubungan Sebab-Akibat",3,"Sebuah baterai kehilangan daya saat terus digunakan. Jika perangkat dipakai lebih lama tanpa pengisian, apa yang paling mungkin terjadi?","Daya baterai semakin rendah.",["Kapasitas baterai bertambah.","Perangkat menjadi lebih ringan.","Baterai menghasilkan lebih banyak energi."]],

    ["ver-ana-5","analogi-konsep","Analogi Konsep",3,"Akar bagi pohon seperti fondasi bagi ...","bangunan",["atap","jendela","cat"]],
    ["ver-ana-6","analogi-konsep","Analogi Konsep",3,"Editor bagi naskah seperti mekanik bagi ...","kendaraan",["jalan","bensin","rambu"]],
    ["ver-ana-7","analogi-konsep","Analogi Konsep",3,"Peta bagi wilayah seperti diagram bagi ...","data",["pena","warna","kertas"]],
    ["ver-ana-8","analogi-konsep","Analogi Konsep",3,"Resep bagi masakan seperti denah bagi ...","bangunan",["bahan","koki","meja"]],
    ["ver-class-1","hubungan-konsep","Hubungan Konsep",3,"Semua X adalah Y. Tidak ada Y yang Z. Pernyataan mana yang pasti benar?","Tidak ada X yang Z.",["Semua X adalah Z.","Sebagian X adalah Z.","Semua Z adalah X."]],
    ["ver-class-2","hubungan-konsep","Hubungan Konsep",3,"Tidak ada P yang Q. Semua R adalah P. Pernyataan mana yang pasti benar?","Tidak ada R yang Q.",["Semua Q adalah R.","Sebagian R adalah Q.","Semua P adalah R."]],
    ["ver-class-3","hubungan-konsep","Hubungan Konsep",3,"Semua M adalah N. Tidak ada N yang O. Apa yang pasti benar?","Tidak ada M yang O.",["Semua O adalah M.","Sebagian M adalah O.","Tidak ada M yang N."]],
    ["ver-class-4","hubungan-konsep","Hubungan Konsep",3,"Sebagian A adalah B. Semua B adalah C. Kesimpulan yang benar adalah ...","Sebagian A adalah C.",["Semua A adalah C.","Tidak ada A yang C.","Semua C adalah A."]],
    ["ver-chain-1","deduksi-berantai","Deduksi Berantai",4,"Semua analis teliti. Semua orang teliti memeriksa ulang pekerjaannya. Dira adalah analis. Kesimpulan yang pasti benar adalah ...","Dira memeriksa ulang pekerjaannya.",["Dira tidak pernah salah.","Semua yang memeriksa ulang adalah analis.","Dira adalah satu-satunya analis."]],
    ["ver-chain-2","deduksi-berantai","Deduksi Berantai",4,"Tidak ada benda cair yang memiliki bentuk tetap. Semua zat dalam wadah X adalah cair. Maka ...","Zat dalam wadah X tidak memiliki bentuk tetap.",["Wadah X tidak memiliki bentuk tetap.","Semua benda tanpa bentuk tetap adalah cair.","Zat dalam wadah X selalu berwarna bening."]],
    ["ver-order-5","urutan-majemuk","Urutan Majemuk",4,"Lima orang P, Q, R, S, T berdiri berurutan. P di depan Q. R di belakang Q. S di depan P. T di belakang R. Siapa yang pasti paling depan?","S",["P","Q","Tidak dapat ditentukan"]],
    ["ver-order-6","urutan-majemuk","Urutan Majemuk",4,"K lebih cepat dari L. M lebih lambat dari L. N lebih cepat dari K. O lebih lambat dari M. Siapa yang pasti paling cepat?","N",["K","L","Tidak dapat ditentukan"]],
  ] as const

  verbalItems.forEach((item,index)=>{
    push(textQuestion(
      item[0],item[1],"verbal","Verbal",item[2],item[3],
      item[4],item[5],[...item[6]],index*7+3
    ))
  })

  const dailyLogicItems=[
    ["daily-logic-20261021-01","silogisme-tiga-premis","Silogisme Tiga Premis",4,
      "Semua auditor teliti. Sebagian analis adalah auditor. Tidak ada orang teliti yang ceroboh. Kesimpulan yang pasti benar adalah ...",
      "Sebagian analis tidak ceroboh",
      ["Semua analis teliti","Semua orang teliti adalah auditor","Sebagian auditor ceroboh"]],
    ["daily-logic-20261021-02","implikasi-kontraposisi","Implikasi Berantai",4,
      "Jika laporan disetujui, audit selesai. Audit selesai hanya jika bukti lengkap. Bukti belum lengkap. Kesimpulan yang pasti adalah ...",
      "Laporan tidak disetujui",
      ["Audit pasti selesai","Bukti pasti lengkap","Laporan pasti disetujui"]],
    ["daily-logic-20261021-03","urutan-transitif","Urutan Multi-Kendala",4,
      "P harus sebelum Q, Q sebelum R, dan S sesudah R. Pernyataan mana yang pasti benar?",
      "P sebelum S",
      ["Q sebelum P","S sebelum P","R sebelum Q"]],
    ["daily-logic-20261021-04","negasi-kuantor","Negasi Pernyataan Universal",4,
      "Negasi yang tepat dari 'Setiap peserta yang lulus numerik juga lulus logika' adalah ...",
      "Ada peserta yang lulus numerik tetapi tidak lulus logika",
      ["Semua peserta gagal numerik","Tidak ada peserta yang lulus logika","Ada peserta yang gagal pada kedua tes"]],
    ["daily-logic-20261024-01","silogisme-arsip-audit","Silogisme Arsip dan Audit",4,
      "Semua arsiparis teliti. Tidak ada orang teliti yang mengabaikan jejak audit. Sebagian staf pengadaan adalah arsiparis. Kesimpulan yang pasti benar adalah ...",
      "Sebagian staf pengadaan teliti dan tidak mengabaikan jejak audit",
      ["Semua staf pengadaan adalah arsiparis","Tidak ada arsiparis yang staf pengadaan","Semua orang teliti adalah arsiparis"]],
    ["daily-logic-20261024-02","implikasi-kontraposisi-berantai","Implikasi Berantai",4,
      "Jika proposal disetujui, anggaran diberikan. Jika anggaran diberikan, pelaksanaan dimulai. Pelaksanaan belum dimulai. Kesimpulan yang pasti adalah ...",
      "Proposal tidak disetujui",
      ["Proposal disetujui","Anggaran pasti diberikan","Pelaksanaan sudah dimulai"]],
    ["daily-logic-20261024-03","relasi-urutan-simbolik","Relasi Urutan Simbolik",4,
      "Gunakan aturan: X ≻ Y berarti X lebih tinggi dari Y; X ≺ Y berarti X lebih rendah dari Y; X ≡ Y berarti setingkat. Diketahui P ≻ Q, Q ≺ R, R ≡ S, dan S ≻ T. Pernyataan mana yang pasti benar?",
      "R lebih tinggi daripada Q",
      ["P lebih tinggi daripada S","Q lebih tinggi daripada T","T lebih tinggi daripada R"]],
    ["daily-logic-20261024-04","kondisi-bikondisional-sensor","Kondisi Dua Sensor",4,
      "Sistem menyala jika dan hanya jika kedua sensor A dan B aktif. Saat pengujian, sistem tidak menyala. Kesimpulan yang pasti adalah ...",
      "Setidaknya satu sensor tidak aktif",
      ["Kedua sensor pasti aktif","Kedua sensor pasti tidak aktif","Sistem pasti aktif"]],
    ["daily-logic-20261024-05","syarat-finalisasi-bukti","Syarat Finalisasi Bukti",4,
      "Jika proyek lolos audit, laporan final diterbitkan. Laporan final diterbitkan hanya jika seluruh bukti telah diverifikasi. Ada bukti yang belum diverifikasi. Kesimpulan yang pasti adalah ...",
      "Proyek tidak lolos audit",
      ["Laporan final pasti diterbitkan","Seluruh bukti telah diverifikasi","Proyek pasti lolos audit"]],
  ] as const
  dailyLogicItems.forEach((item,index)=>{
    push(textQuestion(item[0],item[1],"verbal","Verbal",item[2],item[3],item[4],item[5],[...item[6]],index*7+3))
  })

  push(textQuestion(
    "abstract-daily-20261024-01","abstrak-tiga-aturan-urutan","abstract","Abstrak",
    "Pola Multi-Aturan",4,
    "Bentuk berganti segitiga dan persegi. Isian mengikuti siklus tanpa isi, berisi, berisi, tanpa isi. Titik bergerak searah jarum jam: kiri atas, kanan atas, kanan bawah, kiri bawah. Urutan: 1) segitiga tanpa isi titik kiri atas; 2) persegi berisi titik kanan atas; 3) segitiga berisi titik kanan bawah; 4) persegi tanpa isi titik kiri bawah; 5) segitiga tanpa isi titik kiri atas. Simbol ke-6 adalah ...",
    "Persegi penuh, titik kanan atas",
    ["Segitiga penuh, titik kanan atas","Persegi kosong, titik kanan atas","Persegi penuh, titik kiri atas"],2026102407
  ))

  for(const q of bank){
    if(textAnswerLeaked(q)){
      throw new Error("visual_iq_answer_leak:"+q.id)
    }
    if(q.family==="aturan-transformasi"&&q.layout==="text"){
      const match=q.prompt?.match(/yang sama,\s*(\d+)\s*→\s*\?/)
      if(match&&q.prompt?.includes(match[1]+" → "+q.textOptions?.[q.answer])){
        throw new Error("visual_iq_answer_leak:"+q.id)
      }
    }
  }

  const ids=new Set<string>()
  const structures=new Set<string>()
  const clean:Question[]=[]
  for(const q of bank){
    const structure=q.layout==="text"
      ? JSON.stringify([q.family,q.prompt,q.textOptions])
      : JSON.stringify([q.family,q.layout,q.cells.map(glyphKey),q.options.map(glyphKey),q.answer])
    if(ids.has(q.id)||structures.has(structure))continue
    ids.add(q.id);structures.add(structure);clean.push(q)
  }

  const domainCounts=clean.reduce<Record<Domain,number>>((acc,q)=>{acc[q.domain]++;return acc},{abstract:0,spatial:0,numerical:0,verbal:0})
  if(clean.length<300)throw new Error("Visual IQ bank below 300 validated items: "+clean.length)
  if(domainCounts.abstract<180||domainCounts.spatial<50||domainCounts.numerical<80||domainCounts.verbal<24){
    throw new Error("Visual IQ domain pool too small: "+JSON.stringify(domainCounts))
  }
  return clean
}

const QUESTIONS=buildQuestionBank()

// Easy-pattern exposure policy:
// each simple variation may appear at most once in a single test package.
// This prevents repeated dot moves / simple rotations from inflating high scores.
const SIMPLE_VARIATION_FAMILIES=new Set<string>([
  "matrix-rotasi",
  "matrix-posisi",
  "matrix2-posisi",
  "orbit-posisi-isi",
  "analogi-transformasi",
  "pola-ganda",
  "rotasi-spasial",
])

// Families below may look different, but they still rely on a basic visual transformation:
// move a dot, toggle fill, swap one shape, mirror one object, or rotate one object.
// Across the whole 35-question package, at most ONE question from this easy-visual group is allowed.
const SIMPLE_GEOMETRIC_GROUP=new Set<string>([
  "matrix-rotasi",
  "matrix-posisi",
  "matrix-bentuk",
  "matrix2-posisi",
  "matrix2-isi",
  "orbit-posisi-isi",
  "matrix-rotasi-isi",
  "analogi-transformasi",
  "pola-ganda",
  "komposisi-bentuk",
  "rotasi-spasial",
  "cermin-vertikal",
  "cermin-horizontal",
  "simetri",
  "lipat-kertas",
])

// Normal Tes IQ no longer draws basic visual families at all.
// Only high-complexity visual reasoning can enter the 35-question package.
const ADVANCED_VISUAL_FAMILIES=new Set<string>([
  "matrix-tiga-aturan",
  "matrix-empat-aturan",
  "analogi-tiga-aturan",
  "lipat-kertas-ganda",
  "rotasi-cermin",
])

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

function stableHash(value:string){
  let hash=2166136261
  for(let i=0;i<value.length;i++){
    hash^=value.charCodeAt(i)
    hash=Math.imul(hash,16777619)
  }
  return hash>>>0
}

function localDayIndex(){
  // Rotasi bank harus mengikuti kalender Indonesia (WIB), bukan zona waktu perangkat.
  const parts=new Intl.DateTimeFormat("en-CA",{
    timeZone:"Asia/Jakarta",year:"numeric",month:"2-digit",day:"2-digit"
  }).formatToParts(new Date())
  const value=(type:string)=>Number(parts.find(part=>part.type===type)?.value||0)
  return Math.floor(Date.UTC(value("year"),value("month")-1,value("day"))/86400000)
}

function dailyFamilyMultiplier(family:string){
  const day=localDayIndex()
  const bucket=stableHash(day+"|"+family)%61
  return 0.75+bucket/100 // 0.75× sampai 1.35×, berubah otomatis tiap hari.
}

function dailyActiveFamilies(bank:Question[]){
  const quota:Record<Domain,number>={abstract:7,spatial:3,numerical:5,verbal:5}
  const stride:Record<Domain,number>={abstract:3,spatial:2,numerical:3,verbal:5}
  const day=localDayIndex()
  const result:Record<Domain,Set<string>>={
    abstract:new Set<string>(),
    spatial:new Set<string>(),
    numerical:new Set<string>(),
    verbal:new Set<string>(),
  }

  for(const domain of ["abstract","spatial","numerical","verbal"] as Domain[]){
    const families=[...new Set(bank.filter(q=>q.domain===domain).map(q=>q.family))]
      .sort((a,b)=>stableHash(domain+"|"+a)-stableHash(domain+"|"+b))
    if(!families.length)continue
    const start=(day*stride[domain])%families.length
    for(let i=0;i<Math.min(quota[domain],families.length);i++){
      result[domain].add(families[(start+i)%families.length])
    }
  }
  return result
}

// Dasar tetap tersedia dengan bobot 0,5×, Sulit 1,35×.
// Family aktif harian mendapat prioritas tambahan; set aktif sendiri berganti tiap hari.
function difficultyWeightedOrder(items:Question[],activeFamilies?:Set<string>){
  return items
    .map(q=>{
      const difficultyWeight=q.difficulty===2?0.5:q.difficulty===4?1.35:1
      const activeWeight=activeFamilies?.has(q.family)?1.5:1
      const weight=difficultyWeight*dailyFamilyMultiplier(q.family)*activeWeight
      const random=Math.max(Number.EPSILON,Math.random())
      return {q,key:-Math.log(random)/weight}
    })
    .sort((a,b)=>a.key-b.key)
    .map(item=>item.q)
}


type NumericalBucket="arith"|"growing"|"complex"|"ratio"|"applied"|"analysis"|"probability"|"story"

// Porsi 20 numerik di dalam paket Tes IQ multi-domain 35 soal.
// Satu family = satu metode berpikir; maksimal SATU per paket.
const NUMERICAL_FAMILY_BUCKET:Record<string,NumericalBucket>={
  "urutan-tetap":"arith","selisih-bertambah":"growing",
  "dua-urutan":"complex","kali-tambah":"complex","selisih-kuadrat":"complex",
  "operasi-selang-seling":"complex","rekursif-dua-suku":"complex","deret-seling-majemuk":"complex",
  "deret-operasi-selang-seling":"complex",
  "produktivitas-multi-faktor":"ratio","rasio-persentase-ekuivalen":"ratio",
  "geometri-perimeter-luas":"analysis",
  "kecepatan-rerata-jarak-sama":"story","rata-rata-antar-kelompok":"story",
  "rasio-total":"ratio","rasio-berantai":"ratio","rasio-berubah":"ratio",
  "produktivitas-proporsional":"ratio",
  "persentase-perubahan":"applied","diskon-pajak-bertahap":"applied",
  "pertumbuhan-majemuk":"applied","margin-diskon":"applied",
  "aturan-transformasi":"analysis","relasi-aljabar":"analysis","sistem-linear":"analysis",
  "aritmetika-sisa":"analysis","digit-bersyarat":"analysis","optimasi-dua-kendala":"analysis",
  "peluang-tanpa-pengembalian":"probability","kombinasi-syarat":"probability",
  "peluang-tepat-satu":"probability",
  "kecepatan-jarak":"story","kerja-bersama":"story","usia-relasi":"story",
  "rata-rata-perubahan":"story","produksi-bertahap":"story","kejar-mengejar":"story",
  "campuran-bertingkat":"story","laba-operasional":"story",
}

// Keluarga satu-langkah hanya dipakai sebagai fallback jika kuota keluarga sulit kurang.
const NUMERICAL_ONE_STEP_FAMILIES=new Set<string>([
  "rasio-total","persentase-perubahan","aturan-transformasi",
  "relasi-aljabar","kecepatan-jarak","usia-relasi",
])

function pickBalancedNumerical(
  bank:Question[],active:Set<string>,recent:Set<string>,selected:Question[]
){
  // Maksimal satu keluarga deret sederhana per paket; peluang total tetap 20%.
  const includeSimpleSequence=Math.random()<0.2
  const simpleSequence:"arith"|"growing"|null=includeSimpleSequence
    ?(Math.random()<0.5?"arith":"growing")
    :null
  const arith=simpleSequence==="arith"?1:0
  const growing=simpleSequence==="growing"?1:0
  const quotas:Record<NumericalBucket,number>={
    arith,growing,complex:3,ratio:3,applied:3,analysis:4,probability:2,
    story:5-arith-growing,
  }
  const bucketOrder:NumericalBucket[]=[
    "arith","growing","complex","ratio","applied","analysis","probability","story",
  ]
  const usedFamilies=new Set<string>()
  for(const bucket of shuffle(bucketOrder)){
    const needed=quotas[bucket]
    let count=0
    // Prioritas: keluarga aktif hari ini, soal belum dikerjakan,
    // dan soal multi-langkah. Soal lama mudah hanya fallback terakhir.
    const passes=[
      {unseen:true,advanced:true,activeOnly:true},
      {unseen:true,advanced:true,activeOnly:false},
      {unseen:false,advanced:true,activeOnly:false},
      {unseen:true,advanced:false,activeOnly:false},
      {unseen:false,advanced:false,activeOnly:false},
    ]
    for(const pass of passes){
      if(count>=needed)break
      const candidates=bank.filter(q=>
        q.domain==="numerical"&&NUMERICAL_FAMILY_BUCKET[q.family]===bucket&&
        !usedFamilies.has(q.family)&&!selected.some(x=>x.id===q.id)&&
        (!pass.unseen||!recent.has(q.id))&&
        (!pass.advanced||!NUMERICAL_ONE_STEP_FAMILIES.has(q.family))&&
        (!pass.activeOnly||active.has(q.family))
      )
      for(const q of difficultyWeightedOrder(candidates,active)){
        if(count>=needed)break
        if(usedFamilies.has(q.family)||!questionSafeForDisplay(q))continue
        selected.push(q)
        usedFamilies.add(q.family)
        count++
      }
    }
    if(count!==needed){
      throw new Error("visual_iq_numerical_bucket_shortage:"+bucket+":"+count+"/"+needed)
    }
  }
  if(selected.filter(q=>q.domain==="numerical").length!==20){
    throw new Error("visual_iq_numerical_quota_mismatch")
  }
}

function makeSet(){
  let recent:string[]=[]
  try{recent=JSON.parse(localStorage.getItem("alzava.visual-iq.recent-questions")||"[]")}catch{}
  const recentSet=new Set(recent.slice(0,245))
  const selected:Question[]=[]
  const safeBank=QUESTIONS.filter(questionSafeForDisplay)
  const activeToday=dailyActiveFamilies(safeBank)

  const pickDomain=(domain:Domain,count:number,maxPerFamily:number)=>{
    const familyCount=new Map<string,number>()
    const take=(pool:Question[],activeOnly=false)=>{
      const active=activeToday[domain]
      const domainPool=(domain==="abstract"||domain==="spatial")
        ? pool.filter(q=>ADVANCED_VISUAL_FAMILIES.has(q.family))
        : pool
      const source=activeOnly?domainPool.filter(q=>active.has(q.family)):domainPool
      for(const q of difficultyWeightedOrder(source,active)){
        if(selected.filter(x=>x.domain===domain).length>=count)break
        if(selected.some(x=>x.id===q.id))continue
        const familyLimit=(q.difficulty===2||SIMPLE_VARIATION_FAMILIES.has(q.family))?1:maxPerFamily
        if((familyCount.get(q.family)||0)>=familyLimit)continue
        if(SIMPLE_GEOMETRIC_GROUP.has(q.family)&&selected.some(x=>SIMPLE_GEOMETRIC_GROUP.has(x.family)))continue
        if(!questionSafeForDisplay(q))continue
        selected.push(q)
        familyCount.set(q.family,(familyCount.get(q.family)||0)+1)
      }
    }

    // Prioritas pertama: family paket harian + belum muncul di riwayat terbaru.
    take(safeBank.filter(q=>q.domain===domain&&!recentSet.has(q.id)),true)
    // Jika belum cukup, tetap di family paket harian tetapi abaikan recent.
    if(selected.filter(x=>x.domain===domain).length<count)take(safeBank.filter(q=>q.domain===domain),true)
    // Safety fallback: seluruh bank agar sesi tidak gagal jika family harian terkena quality gate.
    if(selected.filter(x=>x.domain===domain).length<count)take(safeBank.filter(q=>q.domain===domain))
  }

  // Revised after repeated live QA screenshots:
  // 32 of 35 questions are now text-based TIU/logical reasoning.
  // Only three advanced visual questions remain, and basic shape/dot/fill patterns are excluded.
  pickDomain("abstract",2,1)
  pickDomain("spatial",1,1)
  pickBalancedNumerical(safeBank,activeToday.numerical,recentSet,selected)
  pickDomain("verbal",12,1)

  const remaining:Record<Domain,number>={abstract:2,spatial:1,numerical:20,verbal:12}
  const domainOrder:Domain[]=[]
  let previous:Domain|null=null
  while(domainOrder.length<35){
    const choices=(["abstract","spatial","numerical","verbal"] as Domain[])
      .filter(d=>remaining[d]>0)
      .sort((a,b)=>remaining[b]-remaining[a])
    const next=(choices.find(d=>d!==previous) ?? choices[0]) as Domain
    domainOrder.push(next)
    remaining[next]--
    previous=next
  }
  const queues:Record<Domain,Question[]>={
    abstract:shuffle(selected.filter(q=>q.domain==="abstract")),
    spatial:shuffle(selected.filter(q=>q.domain==="spatial")),
    numerical:shuffle(selected.filter(q=>q.domain==="numerical")),
    verbal:shuffle(selected.filter(q=>q.domain==="verbal")),
  }
  const finalSet=domainOrder.map(domain=>queues[domain].shift()).filter((q):q is Question=>Boolean(q)).slice(0,35)
  if(finalSet.length!==35||finalSet.some(q=>!questionSafeForDisplay(q))){
    throw new Error("visual_iq_session_quality_gate")
  }
  const simpleFamilySeen=new Set<string>()
  let simpleGeometricCount=0
  for(const q of finalSet){
    if(q.difficulty===2||SIMPLE_VARIATION_FAMILIES.has(q.family)){
      if(simpleFamilySeen.has(q.family))throw new Error("visual_iq_easy_family_repeat:"+q.family)
      simpleFamilySeen.add(q.family)
    }
    if(SIMPLE_GEOMETRIC_GROUP.has(q.family)){
      simpleGeometricCount++
      if(simpleGeometricCount>1)throw new Error("visual_iq_simple_geometric_repeat")
    }
  }

  try{
    const currentIds=new Set(finalSet.map(q=>q.id))
    const nextRecent=[...finalSet.map(q=>q.id),...recent.filter(id=>!currentIds.has(id))].slice(0,245)
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
    const label=q.domain==="abstract"?"Abstrak":q.domain==="spatial"?"Spasial":q.domain==="numerical"?"Numerik":"Verbal"
    const current=breakdown[label]||{correct:0,total:0}
    current.total++
    if(ok) current.correct++
    breakdown[label]=current
  })
  const ratio=total?earned/total:0
  const accuracy=questions.length?correct/questions.length:0

  // Upper-end calibration is intentionally non-linear:
  // - difficulty-weighted performance still matters;
  // - raw accuracy acts as a ceiling so a few easy/high-weight items cannot inflate IQ.
  // With 35 questions, IQ 140+ requires at least 32 correct.
  const weightedEstimate=Math.round(70+80*Math.pow(ratio,1.6))
  const accuracyCeiling=Math.round(70+80*Math.pow(accuracy,1.5))
  const iq=Math.max(70,Math.min(150,weightedEstimate,accuracyCeiling))
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
function iqLevelFor(iq:number){
  if(iq>=140)return "Genius"
  if(iq>=130)return "Sangat Superior"
  if(iq>=120)return "Superior"
  if(iq>=110)return "Di Atas Rata-rata"
  if(iq>=90)return "Rata-rata"
  if(iq>=80)return "Rata-rata Rendah"
  return "Di Bawah Rata-rata"
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
  const [homeView,setHomeView]=useState<"test"|"ranking">("test")
  const [savedAttempt,setSavedAttempt]=useState<{id?:string;created_at?:string}|null>(null)
  const [rankingMe,setRankingMe]=useState<VisualIqRankItem|null>(null)
  const [certificateOpen,setCertificateOpen]=useState(false)
  const timerRef=useRef<number|null>(null)
  const savedRef=useRef(false)

  useEffect(()=>{
    const registerUrl="/account?next=%2Fvisual-iq&mode=register"
    const token=getParticipantToken()
    if(!token){
      window.location.replace(registerUrl)
      return
    }
    void fetch(ACCOUNT_API,{method:"POST",headers:{"Content-Type":"application/json","X-Battle-Token":token},body:JSON.stringify({action:"me"}),cache:"no-store"})
      .then(async r=>({ok:r.ok,data:await r.json().catch(()=>({}))}))
      .then(({ok,data})=>{
        if(ok&&data?.participant?.account_ready===true){
          setParticipant(data.participant)
          setAuth("ready")
          return
        }
        window.location.replace(registerUrl)
      })
      .catch(()=>window.location.replace(registerUrl))
  },[])

  useEffect(()=>{
    if(new URLSearchParams(window.location.search).get("view")==="ranking")setHomeView("ranking")
  },[])

  const started=questions.length===35
  const done=started&&index>=questions.length
  const current=questions[index]
  const elapsed=Math.max(0,Math.round(((finishedAt||Date.now())-startedAt)/1000))
  const result=useMemo(()=>resultFor(questions,answers),[questions,answers])
  const accuracy=questions.length?Math.round((result.correct/questions.length)*100):0
  const tier=tierFor(result.iq)
  const iqLevel=iqLevelFor(result.iq)

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
    setSavedAttempt(null)
    setRankingMe(null)
    setCertificateOpen(false)
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

  async function loadNationalRanking(){
    const token=getParticipantToken()
    if(!token)return
    try{
      const response=await fetch(VISUAL_IQ_API,{
        method:"POST",
        headers:{"Content-Type":"application/json","X-Battle-Token":token},
        body:JSON.stringify({action:"leaderboard",scope:"national",limit:50}),
        cache:"no-store",
      })
      const data=await response.json().catch(()=>({}))
      if(response.ok&&data?.me)setRankingMe(data.me as VisualIqRankItem)
    }catch{}
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
          question_count:35,
          iq_estimate:result.iq,
          duration_ms:elapsed*1000,
          breakdown:result.breakdown
        })
      })
      const data=await response.json().catch(()=>({}))
      if(!response.ok)throw new Error(data?.error||"Hasil belum tersimpan.")
      if(data?.result)setSavedAttempt({id:data.result.id,created_at:data.result.created_at})
      setSaveState("saved")
      setSaveMessage("✓ Hasil tersimpan di Riwayat Tes akunmu.")
      await loadNationalRanking()
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
    setSavedAttempt(null)
    setRankingMe(null)
    setCertificateOpen(false)
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
    ctx.fillText("TES IQ",540,150)

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
    ctx.fillText("ESTIMASI IQ",540,350)

    const iqGradient=ctx.createLinearGradient(360,410,720,650)
    iqGradient.addColorStop(0,"#22d3ee")
    iqGradient.addColorStop(1,"#a78bfa")
    ctx.fillStyle=iqGradient
    ctx.font="900 205px Arial"
    ctx.fillText(String(result.iq),540,580)

    ctx.fillStyle="#f8fafc"
    ctx.font="900 34px Arial"
    ctx.fillText("± 5 POIN  •  "+tier,540,625)
    ctx.fillStyle="#cbd5e1"
    ctx.font="800 25px Arial"
    ctx.fillText("TINGKAT IQ: "+iqLevel.toUpperCase(),540,668)

    const statValues=[result.correct+"/35",accuracy+"%",Math.floor(elapsed/60)+":"+String(elapsed%60).padStart(2,"0")]
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
    ctx.fillText("35 soal IQ multi-domain • ALZAVA",540,1100)
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
    const text="🧠 Hasil Tes IQ ALZAVA\nEstimasi IQ: "+result.iq+" ± 5\nTingkat IQ: "+iqLevel+"\n"+result.correct+"/35 benar • "+accuracy+"% akurasi • "+Math.floor(elapsed/60)+":"+String(elapsed%60).padStart(2,"0")+"\n\nBerani kalahkan hasilku? "+url
    setShareMessage("")
    try{
      const blob=await makeShareImage()
      if(blob&&typeof File!=="undefined"&&navigator.share&&navigator.canShare){
        const file=new File([blob],"hasil-iq-alzava.png",{type:"image/png"})
        if(navigator.canShare({files:[file]})){
          await navigator.share({title:"Hasil Tes IQ ALZAVA",text,files:[file]})
          setShareMessage("Kartu hasil siap dibagikan.")
          return
        }
      }
      if(navigator.share){
        await navigator.share({title:"Hasil Tes IQ ALZAVA",text,url})
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

  if(auth!=="ready")return <main className="grid min-h-screen place-items-center bg-[#020817] px-6 text-center text-white">
    <div>
      <LockKeyhole className="mx-auto h-8 w-8 text-cyan-300"/>
      <p className="mt-3 text-sm font-black">Mengarahkan ke pendaftaran akun…</p>
      <p className="mt-1 text-xs text-slate-500">Akun wajib dibuat sebelum Tes IQ dapat dimulai.</p>
    </div>
  </main>

  if(!started)return <div className="min-h-screen bg-[radial-gradient(circle_at_50%_0%,rgba(67,56,202,.22),transparent_32%),linear-gradient(180deg,#020617,#061126_55%,#020617)] text-white">
    <header className="mx-auto flex max-w-md items-center justify-between gap-3 px-4 py-4">
      <a href="/battle" className="inline-flex items-center gap-2 text-sm font-black text-slate-300 hover:text-white"><ArrowLeft className="h-4 w-4"/>Battle Point</a>
      <div className="text-xs font-black">ALZAVA <span className="text-cyan-300">Tes IQ</span></div>
    </header>
    <main className="mx-auto max-w-md px-4 pb-14 pt-3">
      <div className="mb-4 grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-slate-950/45 p-1.5">
        <button type="button" onClick={()=>setHomeView("test")} className={`rounded-xl px-3 py-2.5 text-sm font-black transition ${homeView==="test"?"bg-white text-slate-950":"text-slate-400 hover:text-white"}`}>Tes IQ</button>
        <button type="button" onClick={()=>setHomeView("ranking")} className={`rounded-xl px-3 py-2.5 text-sm font-black transition ${homeView==="ranking"?"bg-white text-slate-950":"text-slate-400 hover:text-white"}`}>Ranking IQ</button>
      </div>

      {homeView==="ranking" ? <VisualIqLeaderboard participant={participant} onStart={()=>setHomeView("test")}/> : <>
        <div className="rounded-[28px] border border-cyan-300/20 bg-slate-950/55 p-5 shadow-[0_24px_70px_rgba(0,0,0,.35)] backdrop-blur-xl">
          <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[.16em] text-cyan-300"><Sparkles className="h-4 w-4"/>Tes IQ Multi-Domain</div>
          <h1 className="mt-3 text-4xl font-black leading-[.98]">Ketahui <span className="bg-gradient-to-r from-cyan-300 via-violet-300 to-fuchsia-300 bg-clip-text text-transparent">IQ-mu</span></h1>
          <p className="mt-4 text-sm leading-6 text-slate-300">35 soal original: 2 abstrak tingkat lanjut, 1 spasial tingkat lanjut, 20 numerik/TIU, dan 12 verbal/logika. Pola visual sederhana seperti perpindahan titik, isi/kosong, pergantian bentuk, dan rotasi dasar tidak lagi masuk paket Tes IQ normal.</p>
          <div className="mt-5 grid grid-cols-3 gap-2 text-center text-[10px] font-bold text-slate-300">
            <div className="rounded-xl border border-white/10 bg-white/[.04] p-3"><BrainCircuit className="mx-auto mb-1 h-5 w-5 text-cyan-300"/>35 Soal</div>
            <div className="rounded-xl border border-white/10 bg-white/[.04] p-3"><Clock3 className="mx-auto mb-1 h-5 w-5 text-violet-300"/>±22 Menit</div>
            <div className="rounded-xl border border-white/10 bg-white/[.04] p-3"><Trophy className="mx-auto mb-1 h-5 w-5 text-amber-300"/>Maks. 150</div>
          </div>
        </div>
        <button type="button" onClick={start} className="mt-4 w-full rounded-2xl border border-cyan-300/35 bg-gradient-to-r from-cyan-500/18 via-indigo-500/18 to-violet-500/18 p-5 text-left shadow-[0_0_30px_rgba(34,211,238,.10)]">
          <div className="text-xs font-black uppercase tracking-[.14em] text-cyan-300">Halo, {participant?.nickname||"Peserta"}</div>
          <div className="mt-2 text-3xl font-black">Mulai Tes IQ</div>
          <div className="mt-1 text-sm text-slate-300">Hasil otomatis tersimpan ke akun, masuk ranking jika menjadi hasil terbaik, dan tersedia sebagai sertifikat.</div>
          <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-2.5 text-sm font-black text-slate-950"><Play className="h-4 w-4"/>MULAI 35 SOAL</div>
        </button>
        <p className="mt-4 text-center text-[11px] leading-5 text-slate-500">Estimasi IQ adalah indikasi kemampuan penalaran multi-domain, bukan diagnosis atau hasil psikotes klinis resmi.</p>
      </>}
    </main>
  </div>

  if(done)return <div className="min-h-screen bg-[radial-gradient(circle_at_50%_0%,rgba(124,58,237,.25),transparent_34%),linear-gradient(180deg,#020617,#071427_55%,#020617)] text-white">
    <main className="mx-auto max-w-md px-4 pb-14 pt-7">
      <div className="overflow-hidden rounded-[30px] border border-cyan-300/20 bg-gradient-to-b from-violet-500/10 via-slate-950/70 to-slate-950/80 p-5 text-center shadow-[0_26px_70px_rgba(0,0,0,.40)]">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-amber-300/30 bg-amber-300/10 shadow-[0_0_32px_rgba(251,191,36,.15)]"><Trophy className="h-8 w-8 text-amber-300"/></div>
        <div className="mt-4 text-[11px] font-black uppercase tracking-[.22em] text-violet-300">Hasil Tes IQ</div>
        <div className="mt-3 text-xs font-black uppercase tracking-[.14em] text-slate-400">{participant?.nickname||"Peserta"}</div>
        <div className="mt-1 bg-gradient-to-r from-cyan-300 to-violet-300 bg-clip-text text-7xl font-black tabular-nums text-transparent">{result.iq}</div>
        <div className="mt-1 text-sm font-black">Estimasi IQ · ± 5</div>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          <span className="inline-flex rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-[10px] font-black tracking-[.12em] text-amber-200">{tier}</span>
          <span className="inline-flex rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[10px] font-black tracking-[.08em] text-cyan-100">TINGKAT IQ · {iqLevel}</span>
        </div>
        {rankingMe&&<div className="mt-3 inline-flex rounded-full border border-violet-300/20 bg-violet-300/10 px-3 py-1.5 text-[10px] font-black text-violet-100">RANKING NASIONAL #{rankingMe.rank} · TOP {rankingMe.percentile}%</div>}

        <div className="mt-5 grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-white/10 bg-white/[.04] p-3"><div className="text-xl font-black">{result.correct}/35</div><div className="mt-1 text-[9px] font-bold text-slate-500">BENAR</div></div>
          <div className="rounded-xl border border-white/10 bg-white/[.04] p-3"><div className="text-xl font-black">{accuracy}%</div><div className="mt-1 text-[9px] font-bold text-slate-500">AKURASI</div></div>
          <div className="rounded-xl border border-white/10 bg-white/[.04] p-3"><div className="text-xl font-black">{Math.floor(elapsed/60)}:{String(elapsed%60).padStart(2,"0")}</div><div className="mt-1 text-[9px] font-bold text-slate-500">WAKTU</div></div>
        </div>

        <div className="mt-5 rounded-2xl border border-cyan-300/15 bg-cyan-300/[.05] p-4 text-left">
          <div className="text-[10px] font-black uppercase tracking-[.14em] text-cyan-300">Gambaran Kemampuan</div>
          <p className="mt-2 text-sm leading-6 text-slate-300">{result.iq>=140?"Hasil berada pada tingkat Genius dalam estimasi ALZAVA. Konsistensi sangat tinggi pada kombinasi abstrak, spasial, numerik, dan verbal.":result.iq>=130?"Performa penalaran sangat superior pada kombinasi abstrak, spasial, numerik, dan verbal.":result.iq>=115?"Performa penalaran berada di atas rata-rata. Pertahankan konsistensi pada matriks, numerik, verbal, dan rotasi spasial.":"Fondasi penalaran sudah terbentuk. Konsistensi pada matriks, numerik, verbal, dan transformasi spasial masih dapat ditingkatkan."}</p>
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
        <button type="button" onClick={()=>{reset();setHomeView("ranking")}} className="min-h-12 rounded-xl border border-violet-300/20 bg-violet-300/[.07] text-sm font-black text-violet-100">Ranking IQ</button>
        <button type="button" disabled={saveState!=="saved"} onClick={()=>setCertificateOpen(true)} className="min-h-12 rounded-xl border border-amber-300/25 bg-amber-300/[.08] text-sm font-black text-amber-100 disabled:cursor-not-allowed disabled:opacity-40">Sertifikat</button>
        <a href="/account/results#riwayat-iq" className="grid min-h-12 place-items-center rounded-xl border border-white/10 bg-white/[.06] text-sm font-black">Lihat Riwayat</a>
      </div>
      <a href="/battle" className="mt-3 flex min-h-11 items-center justify-center text-sm font-bold text-slate-400 hover:text-white"><ArrowLeft className="mr-2 h-4 w-4"/>Kembali ke Battle Point</a>
      <p className="mt-2 text-center text-[10px] leading-4 text-slate-600">Estimasi indikatif dari 35 soal multi-domain; bukan hasil psikotes klinis.</p>
    </main>
    <VisualIqCertificateModal
      open={certificateOpen}
      onClose={()=>setCertificateOpen(false)}
      data={{
        participantName:participant?.nickname||"Peserta ALZAVA",
        iqScore:result.iq,
        iqLevel,
        createdAt:savedAttempt?.created_at||(finishedAt?new Date(finishedAt).toISOString():undefined),
        attemptId:savedAttempt?.id,
        rank:rankingMe?.rank,
        total:rankingMe?.total,
        percentile:rankingMe?.percentile,
      }}
    />
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
        <div className="text-[12px] font-black uppercase tracking-[.12em] text-slate-200 sm:text-[13px]">{current.title}</div>
        {(current.layout==="odd" || current.layout==="single") && (
          <p className="mx-auto mt-2 max-w-sm px-2 text-[15px] font-semibold leading-[1.5] text-slate-200 sm:text-base">{current.hint}</p>
        )}
      </div>

      {current.layout!=="odd"&&<div className="mt-5 rounded-[28px] border border-white/10 bg-slate-950/50 p-4 backdrop-blur-xl">
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
        {current.layout==="text"&&<div className="flex min-h-[190px] items-center justify-center px-4 text-center">
          <p className="text-lg font-black leading-8 text-slate-100">{current.prompt}</p>
        </div>}
      </div>}

      <div className={current.layout==="text"?"mt-5 grid grid-cols-1 gap-3":"mt-5 grid grid-cols-2 gap-3"}>
        {current.layout==="text" ? current.textOptions?.map((label,i)=>{
          const selected=answers[index]===i
          return <button key={i} type="button" disabled={locked} onClick={()=>choose(i)} className={`flex min-h-16 items-center gap-3 rounded-2xl border px-4 py-3 text-left transition active:scale-[.99] disabled:opacity-70 ${selected?"border-cyan-300/60 bg-cyan-300/[.10] shadow-[0_0_22px_rgba(34,211,238,.10)]":"border-white/10 bg-white/[.04] hover:border-cyan-300/35 hover:bg-cyan-300/[.06]"}`}>
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/10 bg-slate-950/45 text-xs font-black text-cyan-200">{String.fromCharCode(65+i)}</span>
            <span className="text-sm font-bold leading-6 text-slate-100">{label}</span>
          </button>
        }) : current.options.map((x,i)=>{
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
