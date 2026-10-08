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
function glyphKey(x:Glyph){
  return JSON.stringify([x.kind,normAngle(x.rotation||0),Boolean(x.filled),x.dot||"",[...(x.dots||[])].sort(),x.variant||0])
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

function questionValid(q:Question){
  if(!q.id||!q.family||!q.domain||!q.title)return false
  if(q.answer<0||q.answer>3)return false
  if(q.layout==="text"){
    return Boolean(q.prompt&&q.prompt.trim().length>5&&q.textOptions&&q.textOptions.length===4&&new Set(q.textOptions).size===4)
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
          baseQuestion("abs-m3-rot-"+kind+"-"+start+"-"+step,"matrix-rotasi","abstract","Abstrak","Matriks Rotasi 3 × 3","","matrix3",4,cells),
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
          baseQuestion("abs-m3-dot-"+kind+"-"+start+"-"+dir,"matrix-posisi","abstract","Abstrak","Matriks Posisi 3 × 3","","matrix3",4,cells),
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
          baseQuestion("abs-m2-pos-"+kind+"-"+start+"-"+turns,"matrix2-posisi","abstract","Abstrak","Matriks Transformasi Posisi","","matrix2",3,[
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
      push(optionized(
        baseQuestion("abs-m2-fill-"+a+"-"+b,"matrix2-isi","abstract","Abstrak","Matriks Bentuk dan Isi","","matrix2",3,[
          g(a,0,filled),g(a,0,!filled),g(b,0,filled)
        ]),
        g(b,0,!filled),
        [g(b,0,filled),g(a,0,!filled),g(SHAPES[(i+2)%SHAPES.length],0,!filled)],
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

  // SPATIAL REASONING — rotasi, cermin, lipat, simetri.
  for(const kind of ["notch","corner","hook"] as GlyphKind[]){
    for(const start of [0,90,180,270]){
      for(const turn of [90,180,270]){
        const correct=normAngle(start+turn)
        push(optionized(
          baseQuestion("spa-rot-"+kind+"-"+start+"-"+turn,"rotasi-spasial","spatial","Spasial","Manakah Hasil Rotasi "+turn+"°?","Putar bentuk "+turn+"° searah jarum jam, lalu pilih hasil yang sama.","single",turn===180?3:4,[g(kind,start)]),
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

  // NUMERICAL REASONING — original, rule-based.
  for(let start=1;start<=12;start++){
    for(let step=2;step<=7;step++){
      const seq=[start,start+step,start+step*2,start+step*3,start+step*4]
      const ans=start+step*5
      push(textQuestion(
        "num-arith-"+start+"-"+step,"urutan-tetap","numerical","Numerik","Urutan Angka",2,
        "Angka berikutnya adalah: "+seq.join(", ") + ", __",
        String(ans),[String(ans-step),String(ans+step),String(ans+2)],start+step
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
        String(ans),[String(ans-3),String(ans+3),String(a+8)],a+b
      ))
    }
  }

  for(let n=2;n<=18;n++){
    const add=(n%4)+2
    const samples=[2,3,5]
    const mappings=samples.map(x=>x+" → "+(x*x+add)).join(", ")
    const correct=n*n+add
    push(textQuestion(
      "num-map-"+n+"-"+add,"aturan-transformasi","numerical","Numerik","Aturan Transformasi",4,
      "Sebuah aturan memberi "+mappings+". Dengan aturan yang sama, "+n+" → ?",
      String(correct),[String(correct-add),String(correct+n),String(correct+2)],n*5+add
    ))
  }

  for(let base=2;base<=9;base++){
    const seq=[base,base*2+1,(base*2+1)*2+2,((base*2+1)*2+2)*2+3]
    const correct=seq[3]*2+4
    push(textQuestion(
      "num-muladd-"+base,"kali-tambah","numerical","Numerik","Pola Kali-Tambah",4,
      "Tentukan angka berikutnya: "+seq.join(", ") + ", __",
      String(correct),[String(correct-4),String(correct+4),String(seq[3]*2+3)],base*11
    ))
  }

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

    ["ver-cond-1","implikasi","Logika Kondisional",4,"Jika lampu merah menyala maka mesin berhenti. Lampu merah menyala. Apa yang dapat disimpulkan?","Mesin berhenti.",["Mesin pasti rusak.","Lampu hijau juga menyala.","Mesin bergerak lebih cepat."]],
    ["ver-cond-2","implikasi","Logika Kondisional",4,"Jika data lengkap maka laporan dapat diproses. Laporan belum dapat diproses. Kesimpulan yang paling tepat adalah ...","Kelengkapan data perlu diperiksa.",["Data pasti lengkap.","Laporan pasti salah.","Tidak ada hubungan dengan data."]],
    ["ver-cause-1","sebab-akibat","Hubungan Sebab-Akibat",4,"Hujan deras menyebabkan debit sungai meningkat. Jika hujan deras berlangsung lama, akibat yang paling logis adalah ...","Risiko sungai meluap meningkat.",["Debit sungai pasti turun.","Air sungai berubah menjadi asin.","Sungai berhenti mengalir."]],
    ["ver-cause-2","sebab-akibat","Hubungan Sebab-Akibat",4,"Sebuah baterai kehilangan daya saat terus digunakan. Jika perangkat dipakai lebih lama tanpa pengisian, apa yang paling mungkin terjadi?","Daya baterai semakin rendah.",["Kapasitas baterai bertambah.","Perangkat menjadi lebih ringan.","Baterai menghasilkan lebih banyak energi."]],

    ["ver-ana-5","analogi-konsep","Analogi Konsep",3,"Akar bagi pohon seperti fondasi bagi ...","bangunan",["atap","jendela","cat"]],
    ["ver-ana-6","analogi-konsep","Analogi Konsep",3,"Editor bagi naskah seperti mekanik bagi ...","kendaraan",["jalan","bensin","rambu"]],
    ["ver-ana-7","analogi-konsep","Analogi Konsep",3,"Peta bagi wilayah seperti diagram bagi ...","data",["pena","warna","kertas"]],
    ["ver-ana-8","analogi-konsep","Analogi Konsep",3,"Resep bagi masakan seperti denah bagi ...","bangunan",["bahan","koki","meja"]],
    ["ver-class-1","hubungan-konsep","Hubungan Konsep",4,"Semua X adalah Y. Sebagian Y adalah Z. Pernyataan mana yang pasti benar?","Semua X adalah Y.",["Semua X adalah Z.","Semua Z adalah X.","Tidak ada Y yang Z."]],
    ["ver-class-2","hubungan-konsep","Hubungan Konsep",4,"Tidak ada P yang Q. Semua R adalah P. Pernyataan mana yang pasti benar?","Tidak ada R yang Q.",["Semua Q adalah R.","Sebagian R adalah Q.","Semua P adalah R."]],
    ["ver-class-3","hubungan-konsep","Hubungan Konsep",4,"Semua M adalah N. Tidak ada N yang O. Apa yang pasti benar?","Tidak ada M yang O.",["Semua O adalah M.","Sebagian M adalah O.","Tidak ada M yang N."]],
    ["ver-class-4","hubungan-konsep","Hubungan Konsep",4,"Sebagian A adalah B. Semua B adalah C. Kesimpulan yang benar adalah ...","Sebagian A adalah C.",["Semua A adalah C.","Tidak ada A yang C.","Semua C adalah A."]],
  ] as const

  verbalItems.forEach((item,index)=>{
    push(textQuestion(
      item[0],item[1],"verbal","Verbal",item[2],item[3],
      item[4],item[5],[...item[6]],index*7+3
    ))
  })

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
  const recentSet=new Set(recent.slice(0,210))
  const selected:Question[]=[]

  const pickDomain=(domain:Domain,count:number,maxPerFamily:number)=>{
    const familyCount=new Map<string,number>()
    const take=(pool:Question[])=>{
      for(const q of shuffle(pool)){
        if(selected.filter(x=>x.domain===domain).length>=count)break
        if(selected.some(x=>x.id===q.id))continue
        if((familyCount.get(q.family)||0)>=maxPerFamily)continue
        selected.push(q)
        familyCount.set(q.family,(familyCount.get(q.family)||0)+1)
      }
    }
    take(QUESTIONS.filter(q=>q.domain===domain&&!recentSet.has(q.id)))
    if(selected.filter(x=>x.domain===domain).length<count)take(QUESTIONS.filter(q=>q.domain===domain))
  }

  pickDomain("abstract",18,3)
  pickDomain("spatial",4,1)
  pickDomain("numerical",4,1)
  pickDomain("verbal",4,1)

  const domainOrder:Domain[]=["abstract","abstract","numerical","abstract","spatial","abstract","verbal","abstract","abstract","numerical","abstract","spatial","abstract","verbal","abstract","abstract","numerical","abstract","spatial","abstract","verbal","abstract","abstract","numerical","abstract","spatial","abstract","verbal","abstract","abstract"]
  const queues:Record<Domain,Question[]>={
    abstract:shuffle(selected.filter(q=>q.domain==="abstract")),
    spatial:shuffle(selected.filter(q=>q.domain==="spatial")),
    numerical:shuffle(selected.filter(q=>q.domain==="numerical")),
    verbal:shuffle(selected.filter(q=>q.domain==="verbal")),
  }
  const finalSet=domainOrder.map(domain=>queues[domain].shift()).filter((q):q is Question=>Boolean(q)).slice(0,30)

  try{
    const currentIds=new Set(finalSet.map(q=>q.id))
    const nextRecent=[...finalSet.map(q=>q.id),...recent.filter(id=>!currentIds.has(id))].slice(0,210)
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
    const text="🧠 Hasil Tes IQ ALZAVA\nEstimasi IQ: "+result.iq+" ± 5\n"+result.correct+"/30 benar • "+accuracy+"% akurasi • "+Math.floor(elapsed/60)+":"+String(elapsed%60).padStart(2,"0")+"\n\nBerani kalahkan hasilku? "+url
    setShareMessage("")
    try{
      const blob=await makeShareImage()
      if(blob&&typeof File!=="undefined"&&navigator.share&&navigator.canShare){
        const file=new File([blob],"hasil-iq-visual-alzava.png",{type:"image/png"})
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

  if(auth!=="ready")return <div className="min-h-screen bg-[radial-gradient(circle_at_50%_0%,rgba(67,56,202,.20),transparent_32%),linear-gradient(180deg,#020617,#061126_55%,#020617)] text-white">
    <main className="mx-auto grid min-h-screen max-w-md place-items-center px-4 py-10">
      <div className="w-full rounded-[28px] border border-cyan-300/20 bg-slate-950/60 p-6 text-center shadow-2xl backdrop-blur-xl">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-cyan-300/25 bg-cyan-300/10"><LockKeyhole className="h-7 w-7 text-cyan-300"/></div>
        <p className="mt-5 text-[11px] font-black uppercase tracking-[.18em] text-cyan-300">Tes IQ ALZAVA</p>
        <h1 className="mt-2 text-3xl font-black">Daftar dulu, hasilmu akan tersimpan.</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">Tes IQ hanya untuk peserta terdaftar agar hasil, estimasi IQ, dan riwayat percobaan tidak hilang saat ganti perangkat.</p>
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
        <p className="mt-4 text-sm leading-6 text-slate-300">30 soal original: 18 abstrak/matriks, 4 spasial, 4 numerik, dan 4 verbal. Setiap tes mengambil kombinasi berbeda dari bank tervalidasi lebih dari 300 item.</p>
        <div className="mt-5 grid grid-cols-3 gap-2 text-center text-[10px] font-bold text-slate-300">
          <div className="rounded-xl border border-white/10 bg-white/[.04] p-3"><BrainCircuit className="mx-auto mb-1 h-5 w-5 text-cyan-300"/>30 Soal</div>
          <div className="rounded-xl border border-white/10 bg-white/[.04] p-3"><Clock3 className="mx-auto mb-1 h-5 w-5 text-violet-300"/>±18 Menit</div>
          <div className="rounded-xl border border-white/10 bg-white/[.04] p-3"><Trophy className="mx-auto mb-1 h-5 w-5 text-amber-300"/>Maks. 150</div>
        </div>
      </div>
      <button type="button" onClick={start} className="mt-4 w-full rounded-2xl border border-cyan-300/35 bg-gradient-to-r from-cyan-500/18 via-indigo-500/18 to-violet-500/18 p-5 text-left shadow-[0_0_30px_rgba(34,211,238,.10)]">
        <div className="text-xs font-black uppercase tracking-[.14em] text-cyan-300">Halo, {participant?.nickname||"Peserta"}</div>
        <div className="mt-2 text-3xl font-black">Mulai Tes IQ</div>
        <div className="mt-1 text-sm text-slate-300">Hasil otomatis tersimpan ke akun dan Riwayat Tes.</div>
        <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-2.5 text-sm font-black text-slate-950"><Play className="h-4 w-4"/>MULAI 30 SOAL</div>
      </button>
      <p className="mt-4 text-center text-[11px] leading-5 text-slate-500">Estimasi IQ adalah indikasi kemampuan figural-spasial, bukan diagnosis atau hasil psikotes klinis resmi.</p>
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
