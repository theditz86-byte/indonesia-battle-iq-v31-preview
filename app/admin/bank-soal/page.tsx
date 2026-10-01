"use client"

import { useEffect, useMemo, useState } from "react"
import { AlertTriangle, BookOpenCheck, CheckCircle2, Eye, Loader2, RefreshCw, Search, ToggleLeft, ToggleRight } from "lucide-react"

const ADMIN_TOOLS_URL="https://efndozplpwyemzgqfnep.supabase.co/functions/v1/battle-admin-tools"
const TOKEN_KEY="battle_admin_token"

type Stats={
  total?:number;active?:number;review?:number;
  twk?:number;twk_active?:number;
  tkp?:number;tkp_active?:number;
  qie_recipes?:number;qie_active?:number;qie_disabled?:number;
  qa_errors?:number
}

type Item={
  id:number;item_key:string;section:"twk"|"tiu"|"tkp";category:string;subcategory:string;difficulty:string;
  prompt:string;options:string[];correct_index?:number|null;option_scores?:number[]|null;explanation:string;
  source_title?:string|null;source_ref?:string|null;status:string;blueprint_key:string;variant_no:number;updated_at?:string;
  is_recipe?:boolean;family_code?:string;target_code?:string;context_code?:string;enabled?:boolean
}

type TiuPreview={
  recipe_id:number;family_code?:string;target_code?:string;context_code?:string;enabled?:boolean;category?:string;
  prompt:string;options:string[];answer:number;family?:number;target?:number;context?:number;engine?:string
}

async function tools(body:Record<string,unknown>){
  const r=await fetch(ADMIN_TOOLS_URL,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body),cache:"no-store"})
  const d=await r.json().catch(()=>({}))
  if(!r.ok)throw new Error(d?.error||"Bank soal belum dapat dimuat.")
  return d
}

export default function AdminQuestionBankPage(){
  const [token,setToken]=useState("")
  const [items,setItems]=useState<Item[]>([])
  const [stats,setStats]=useState<Stats>({})
  const [section,setSection]=useState("all")
  const [status,setStatus]=useState("all")
  const [difficulty,setDifficulty]=useState("all")
  const [search,setSearch]=useState("")
  const [query,setQuery]=useState("")
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState("")
  const [message,setMessage]=useState("")
  const [previews,setPreviews]=useState<Record<number,TiuPreview>>({})
  const [previewBusy,setPreviewBusy]=useState<number|null>(null)

  useEffect(()=>{const t=window.localStorage.getItem(TOKEN_KEY)||"";if(!t){window.location.assign("/admin/");return}setToken(t)},[])
  useEffect(()=>{if(token)void load()},[token,section,status,difficulty,query])

  async function load(){
    setBusy(true);setError("")
    try{
      const d=await tools({action:"skd_bank",admin_token:token,section,status,difficulty,search:query})
      setItems(Array.isArray(d.items)?d.items:[])
      setStats(d.stats||{})
    }catch(e){
      const msg=e instanceof Error?e.message:"Bank soal belum dapat dimuat."
      setError(msg)
      if(/sesi admin/i.test(msg)){window.localStorage.removeItem(TOKEN_KEY);window.location.assign("/admin/")}
    }finally{setBusy(false)}
  }

  async function changeStatus(item:Item,next:"active"|"review"){
    if(item.section==="tiu")return
    const action=next==="review"?"menonaktifkan dari pool peserta":"mengaktifkan kembali ke pool peserta"
    const reason=window.prompt(`Alasan ${action} ${item.item_key}:`,next==="review"?"Perlu review kualitas soal":"Sudah diperiksa dan layak aktif")||""
    if(reason.trim().length<3)return
    if(!window.confirm(`${item.item_key} akan ${next==="review"?"dikeluarkan dari pool aktif":"diaktifkan kembali"}. Lanjutkan?`))return
    setBusy(true);setError("");setMessage("")
    try{
      await tools({action:"skd_bank_status",admin_token:token,item_key:item.item_key,status:next,reason})
      setMessage(`${item.item_key} sekarang berstatus ${next.toUpperCase()}.`)
      await load()
    }catch(e){setError(e instanceof Error?e.message:"Status soal belum dapat diubah.")}
    finally{setBusy(false)}
  }

  async function previewTiu(item:Item){
    if(!item.is_recipe)return
    if(previews[item.id]){setPreviews(prev=>{const next={...prev};delete next[item.id];return next});return}
    setPreviewBusy(item.id);setError("")
    try{
      const d=await tools({action:"skd_tiu_preview",admin_token:token,recipe_id:item.id})
      if(d?.preview)setPreviews(prev=>({...prev,[item.id]:d.preview}))
    }catch(e){setError(e instanceof Error?e.message:"Preview TIU belum dapat dibuat.")}
    finally{setPreviewBusy(null)}
  }

  function quickFilter(nextSection:string,nextStatus:string){
    setSection(nextSection);setStatus(nextStatus);setDifficulty("all");setSearch("");setQuery("")
    window.setTimeout(()=>document.getElementById("bank-filter")?.scrollIntoView({behavior:"smooth",block:"start"}),40)
  }

  const visible=useMemo(()=>items,[items])
  const twkReview=Math.max(0,Number(stats.twk||0)-Number(stats.twk_active||0))
  const tkpReview=Math.max(0,Number(stats.tkp||0)-Number(stats.tkp_active||0))

  return <main className="min-h-screen bg-[radial-gradient(circle_at_15%_-10%,rgba(34,211,238,.13),transparent_34rem),linear-gradient(180deg,#020817,#07142f)] px-4 py-8 text-white sm:px-6"><div className="mx-auto max-w-7xl">
    <section className="rounded-[30px] border border-cyan-300/15 bg-white/[.045] p-6 shadow-2xl sm:p-8"><div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-xs font-black uppercase tracking-[.18em] text-cyan-300">Quality Control</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">Bank Soal SKD</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">Pantau 400 TWK, 1.000 recipe TIU/QIE, dan 600 TKP. Item bermasalah bisa ditinjau tanpa menghapus histori peserta.</p></div><button onClick={()=>void load()} disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm font-black text-cyan-100 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${busy?"animate-spin":""}`}/>Muat ulang</button></div></section>

    <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <Card label="TWK Aktif" value={`${stats.twk_active??0}/${stats.twk??0}`} ok={(stats.twk_active??0)===(stats.twk??0)} hint={twkReview?`${twkReview} item perlu review · klik untuk lihat`:"Semua TWK aktif"} onClick={()=>quickFilter("twk",twkReview?"review":"active")}/>
      <Card label="TKP Aktif" value={`${stats.tkp_active??0}/${stats.tkp??0}`} ok={(stats.tkp_active??0)===(stats.tkp??0)} hint={tkpReview?`${tkpReview} item perlu review · klik untuk lihat`:"Semua TKP aktif"} onClick={()=>quickFilter("tkp",tkpReview?"review":"active")}/>
      <Card label="TIU / QIE Aktif" value={`${stats.qie_active??0}/${stats.qie_recipes??0}`} ok={(stats.qie_active??0)===(stats.qie_recipes??0)} hint="Klik untuk membuka bank recipe TIU/QIE" onClick={()=>quickFilter("tiu","all")}/>
      <Card label="Perlu Review" value={String(stats.review??0)} ok={(stats.review??0)===0} hint={(stats.review??0)>0?"Klik untuk melihat seluruh item review":"Tidak ada item review"} onClick={()=>quickFilter("all","review")}/>
      <Card label="QA Error" value={String(stats.qa_errors??0)} ok={(stats.qa_errors??0)===0} hint={(stats.qa_errors??0)>0?"Ada error struktur yang perlu diperiksa":"Tidak ada error struktur"}/>
    </section>

    <section id="bank-filter" className="mt-5 scroll-mt-28 rounded-[26px] border border-white/10 bg-white/[.04] p-4 sm:p-5"><div className="grid gap-3 lg:grid-cols-[1fr_auto_auto_auto]"><form onSubmit={e=>{e.preventDefault();setQuery(search.trim())}} className="flex gap-2"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari ID, kategori, recipe, target, context, atau isi soal…" className="w-full rounded-xl border border-white/10 bg-slate-950/55 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-cyan-300/40"/></div><button className="rounded-xl bg-white px-4 py-2.5 text-sm font-black text-slate-950">Cari</button></form><Select value={section} onChange={setSection} options={[["all","Semua Bank"],["twk","TWK"],["tiu","TIU / QIE"],["tkp","TKP"]]}/><Select value={difficulty} onChange={setDifficulty} options={[["all","Semua Level"],["mudah","Mudah"],["menengah","Menengah"],["sulit","Sulit"]]}/><Select value={status} onChange={setStatus} options={[["all","Semua Status"],["active","Aktif"],["review","Perlu Review"]]}/></div>{error&&<div className="mt-4 rounded-xl border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div>}{message&&<div className="mt-4 rounded-xl border border-emerald-300/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">{message}</div>}</section>

    <section className="mt-5 grid gap-4">{busy&&visible.length===0?<div className="grid place-items-center rounded-3xl border border-white/10 bg-white/[.035] py-16"><Loader2 className="h-7 w-7 animate-spin text-cyan-300"/></div>:visible.length===0?<div className="rounded-3xl border border-dashed border-white/10 py-16 text-center text-sm text-slate-500">Tidak ada item sesuai filter.</div>:visible.map(item=>item.is_recipe?<TiuRecipeCard key={item.item_key} item={item} preview={previews[item.id]} previewBusy={previewBusy===item.id} onPreview={()=>void previewTiu(item)}/>:<QuestionCard key={item.item_key} item={item} busy={busy} onChangeStatus={changeStatus}/>)}</section>
    <p className="mt-5 text-center text-xs text-slate-600">Maksimal 150 item ditampilkan per pencarian. TIU/QIE menampilkan recipe generator; gunakan Preview Soal untuk melihat contoh keluaran 5 opsi.</p>
  </div></main>
}

function QuestionCard({item,busy,onChangeStatus}:{item:Item;busy:boolean;onChangeStatus:(item:Item,next:"active"|"review")=>Promise<void>}){
  return <article className={`rounded-[26px] border p-5 sm:p-6 ${item.status==="active"?"border-white/10 bg-white/[.04]":"border-amber-300/20 bg-amber-300/[.055]"}`}><div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase ${item.section==="twk"?"border-emerald-300/20 bg-emerald-300/10 text-emerald-200":"border-violet-300/20 bg-violet-300/10 text-violet-200"}`}>{item.section}</span><span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-black text-slate-300">{item.category}</span><span className="text-[11px] font-bold text-slate-500">{item.subcategory} · {item.difficulty}</span><code className="text-[10px] text-cyan-300/80">{item.item_key}</code></div><p className="mt-4 text-sm font-bold leading-6 text-white sm:text-base">{item.prompt}</p><div className="mt-4 grid gap-2">{item.options.map((o,i)=><div key={i} className="flex items-start gap-2 rounded-xl border border-white/5 bg-slate-950/25 px-3 py-2 text-xs leading-5 text-slate-300"><b className="text-slate-500">{String.fromCharCode(65+i)}.</b><span>{o}</span>{item.section==="twk"&&item.correct_index===i&&<span className="ml-auto shrink-0 font-black text-emerald-300">KUNCI</span>}{item.section==="tkp"&&Array.isArray(item.option_scores)&&<span className="ml-auto shrink-0 font-black text-violet-300">{item.option_scores[i]} poin</span>}</div>)}</div><p className="mt-3 text-xs leading-5 text-slate-500"><b className="text-slate-400">Pembahasan:</b> {item.explanation}</p>{item.source_title&&<p className="mt-2 text-[10px] text-slate-600">Sumber: {item.source_title}</p>}</div><div className="shrink-0 xl:w-52"><div className={`rounded-xl border px-3 py-2 text-center text-xs font-black ${item.status==="active"?"border-emerald-300/20 bg-emerald-300/10 text-emerald-200":"border-amber-300/20 bg-amber-300/10 text-amber-200"}`}>{item.status==="active"?"AKTIF DI POOL":"PERLU REVIEW"}</div><button disabled={busy} onClick={()=>void onChangeStatus(item,item.status==="active"?"review":"active")} className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs font-black text-slate-200 disabled:opacity-50">{item.status==="active"?<ToggleLeft className="h-4 w-4 text-amber-300"/>:<ToggleRight className="h-4 w-4 text-emerald-300"/>}{item.status==="active"?"Keluarkan dari Pool":"Aktifkan Kembali"}</button><p className="mt-2 text-center text-[10px] text-slate-600">Blueprint: {item.blueprint_key} · V{item.variant_no}</p></div></div></article>
}

function TiuRecipeCard({item,preview,previewBusy,onPreview}:{item:Item;preview?:TiuPreview;previewBusy:boolean;onPreview:()=>void}){
  return <article className="rounded-[26px] border border-cyan-300/12 bg-cyan-300/[.025] p-5 sm:p-6"><div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2.5 py-1 text-[10px] font-black uppercase text-cyan-200">TIU / QIE</span><span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-black text-slate-300">{item.category}</span><span className="text-[11px] font-bold text-slate-500">{item.target_code} · {item.context_code}</span><code className="text-[10px] text-cyan-300/80">{item.item_key}</code></div><p className="mt-4 text-base font-black text-white">Recipe generator {item.family_code}</p><p className="mt-2 text-xs leading-5 text-slate-500">Satu recipe dapat menghasilkan variasi angka/konteks sesuai seed peserta. Preview di bawah adalah contoh audit admin, bukan soal statis peserta.</p>{preview&&<div className="mt-5 rounded-2xl border border-cyan-300/15 bg-slate-950/35 p-4"><div className="mb-3 flex flex-wrap items-center gap-2"><span className="text-[10px] font-black uppercase tracking-wider text-cyan-300">Preview Soal</span><span className="text-[10px] text-slate-600">{preview.category} · engine {preview.engine}</span></div><p className="text-sm font-bold leading-6 text-white">{preview.prompt}</p><div className="mt-3 grid gap-2">{preview.options.map((o,i)=><div key={i} className={`flex items-start gap-2 rounded-xl border px-3 py-2 text-xs ${preview.answer===i?"border-emerald-300/20 bg-emerald-300/10 text-emerald-100":"border-white/5 bg-white/[.02] text-slate-300"}`}><b className="text-slate-500">{String.fromCharCode(65+i)}.</b><span>{o}</span>{preview.answer===i&&<span className="ml-auto shrink-0 font-black text-emerald-300">KUNCI</span>}</div>)}</div></div>}</div><div className="shrink-0 xl:w-52"><div className={`rounded-xl border px-3 py-2 text-center text-xs font-black ${item.enabled!==false?"border-emerald-300/20 bg-emerald-300/10 text-emerald-200":"border-amber-300/20 bg-amber-300/10 text-amber-200"}`}>{item.enabled!==false?"RECIPE AKTIF":"RECIPE NONAKTIF"}</div><button onClick={onPreview} disabled={previewBusy} className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-3 py-2.5 text-xs font-black text-cyan-100 disabled:opacity-50">{previewBusy?<Loader2 className="h-4 w-4 animate-spin"/>:<Eye className="h-4 w-4"/>}{preview?"Tutup Preview":"Preview Soal"}</button><p className="mt-2 text-center text-[10px] text-slate-600">Struktur: {item.blueprint_key}</p></div></div></article>
}

function Card({label,value,ok,hint,onClick}:{label:string;value:string;ok:boolean;hint?:string;onClick?:()=>void}){
  return <button type="button" onClick={onClick} disabled={!onClick} className={`rounded-2xl border border-white/10 bg-white/[.04] p-4 text-left transition ${onClick?"hover:-translate-y-0.5 hover:border-cyan-300/25 hover:bg-white/[.06]":"cursor-default"}`}><div className="flex items-center justify-between"><BookOpenCheck className="h-5 w-5 text-cyan-300"/>{ok?<CheckCircle2 className="h-4 w-4 text-emerald-300"/>:<AlertTriangle className="h-4 w-4 text-amber-300"/>}</div><p className="mt-3 text-xs text-slate-500">{label}</p><p className="mt-1 text-xl font-black text-white">{value}</p>{hint&&<p className={`mt-2 text-[10px] leading-4 ${ok?"text-slate-600":"text-amber-300/80"}`}>{hint}</p>}</button>
}

function Select({value,onChange,options}:{value:string;onChange:(v:string)=>void;options:string[][]}){
  return <select value={value} onChange={e=>onChange(e.target.value)} className="rounded-xl border border-white/10 bg-[#081327] px-3 py-2.5 text-sm font-bold text-slate-200 outline-none">{options.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select>
}
