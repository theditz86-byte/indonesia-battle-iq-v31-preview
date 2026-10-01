"use client"

import { useEffect, useMemo, useState } from "react"
import { Activity, BookOpenCheck, CheckCircle2, CreditCard, Gauge, Power, RefreshCw, ShieldCheck, Trophy, Users, Wrench } from "lucide-react"

const ADMIN_API_URL="https://efndozplpwyemzgqfnep.supabase.co/functions/v1/battle-admin"
const ADMIN_TOOLS_URL="https://efndozplpwyemzgqfnep.supabase.co/functions/v1/battle-admin-tools"
const TOKEN_KEY="battle_admin_token"

type Metrics={participants?:number;season_completers?:number;gross_revenue?:number;pending_payments?:number;approved_premium_sales?:number}
type Maintenance={enabled?:boolean;note?:string;updated_at?:string}

async function post(url:string,body:Record<string,unknown>){
  const r=await fetch(url,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body),cache:"no-store"})
  const d=await r.json().catch(()=>({}))
  if(!r.ok)throw new Error(d?.error||"Data admin belum dapat dimuat.")
  return d
}

export default function AdminOverviewPage(){
  const [token,setToken]=useState("")
  const [metrics,setMetrics]=useState<Metrics>({})
  const [maintenance,setMaintenance]=useState<Maintenance>({})
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState("")
  const [syncedAt,setSyncedAt]=useState<Date|null>(null)

  useEffect(()=>{const t=window.localStorage.getItem(TOKEN_KEY)||"";if(!t){window.location.assign("/admin/");return}setToken(t)},[])
  useEffect(()=>{if(token)void load()},[token])

  async function load(){
    if(!token||busy)return
    setBusy(true);setError("")
    try{
      const [m,s]=await Promise.all([
        post(ADMIN_API_URL,{action:"admin_metrics",admin_token:token}),
        post(ADMIN_TOOLS_URL,{action:"maintenance_status",admin_token:token}),
      ])
      setMetrics(m.metrics||{})
      setMaintenance(s.status||{})
      setSyncedAt(new Date())
    }catch(e){
      const msg=e instanceof Error?e.message:"Data admin belum dapat dimuat."
      setError(msg)
      if(/sesi admin/i.test(msg)){window.localStorage.removeItem(TOKEN_KEY);window.location.assign("/admin/")}
    }finally{setBusy(false)}
  }

  const cards=useMemo(()=>[
    {label:"Total Peserta",value:Number(metrics.participants||0).toLocaleString("id-ID"),icon:Users,accent:"text-cyan-300"},
    {label:"Selesai Tes",value:Number(metrics.season_completers||0).toLocaleString("id-ID"),icon:CheckCircle2,accent:"text-emerald-300"},
    {label:"Menunggu Verifikasi",value:Number(metrics.pending_payments||0).toLocaleString("id-ID"),icon:CreditCard,accent:"text-amber-300"},
    {label:"Pendapatan Gross",value:`Rp${Number(metrics.gross_revenue||0).toLocaleString("id-ID")}`,icon:Trophy,accent:"text-violet-300"},
  ],[metrics])

  const shortcuts=[
    {title:"Peserta & Aktivitas",desc:"Pantau online, Ranked, PvP, Latihan dan live Mini SKD.",href:"/admin/peserta/",icon:Users},
    {title:"Growth & Traffic",desc:"Lihat referral, challenge funnel, pengunjung dan sumber trafik.",href:"/admin/#admin-growth",icon:Activity},
    {title:"Season & Ranking",desc:"Kelola season resmi, status ranking dan konfigurasi kompetisi.",href:"/admin/#admin-season",icon:Trophy},
    {title:"Moderasi & Pembayaran",desc:"Tinjau laporan peserta dan verifikasi transaksi.",href:"/admin/#admin-moderation",icon:ShieldCheck},
    {title:"Bank Soal SKD",desc:"Audit TWK, TIU/QIE, TKP dan item yang perlu review.",href:"/admin/bank-soal/",icon:BookOpenCheck},
    {title:"Maintenance",desc:"Aktifkan atau akhiri mode maintenance situs.",href:"/admin/maintenance/",icon:Power},
    {title:"Pemulihan Admin",desc:"Atur email pemulihan akun admin.",href:"/admin/recovery/",icon:Wrench},
  ]

  return <main className="min-h-screen bg-[radial-gradient(circle_at_18%_-10%,rgba(34,211,238,.13),transparent_34rem),linear-gradient(180deg,#020817,#07142f)] px-4 py-8 text-white sm:px-6">
    <div className="mx-auto max-w-7xl">
      <section className="rounded-[30px] border border-cyan-300/15 bg-gradient-to-br from-cyan-300/[.07] via-white/[.035] to-violet-400/[.04] p-6 shadow-2xl sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div><div className="flex items-center gap-2"><Gauge className="h-5 w-5 text-cyan-300"/><p className="text-xs font-black uppercase tracking-[.18em] text-cyan-300">Control Center</p></div><h1 className="mt-3 text-3xl font-black sm:text-4xl">Ringkasan Operasional</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Overview hanya menampilkan hal penting. Detail operasional dibuka melalui modul masing-masing agar halaman admin tetap ringan dan mudah dibaca.</p></div>
          <div className="flex items-center gap-3"><div className={`rounded-2xl border px-4 py-3 ${maintenance.enabled?"border-amber-300/20 bg-amber-300/[.08]":"border-emerald-300/20 bg-emerald-300/[.08]"}`}><p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Status Situs</p><p className={`mt-1 font-black ${maintenance.enabled?"text-amber-200":"text-emerald-300"}`}>{maintenance.enabled?"MAINTENANCE":"AKTIF"}</p></div><button onClick={()=>void load()} disabled={busy} className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/5 text-cyan-200 disabled:opacity-50"><RefreshCw className={`h-5 w-5 ${busy?"animate-spin":""}`}/></button></div>
        </div>
      </section>

      {error&&<div className="mt-5 rounded-2xl border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div>}

      <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{cards.map(({label,value,icon:Icon,accent})=><div key={label} className="rounded-2xl border border-white/10 bg-white/[.04] p-5"><Icon className={`h-5 w-5 ${accent}`}/><p className="mt-4 text-xs text-slate-500">{label}</p><p className="mt-1 text-2xl font-black">{value}</p></div>)}</section>

      <section className="mt-6 rounded-[28px] border border-white/10 bg-white/[.035] p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[.18em] text-violet-300">Akses Cepat</p><h2 className="mt-1 text-2xl font-black">Pilih modul yang ingin dikelola</h2></div><p className="text-xs text-slate-600">Sinkron terakhir {syncedAt?syncedAt.toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"}):"—"}</p></div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{shortcuts.map(({title,desc,href,icon:Icon})=><a key={title} href={href} className="group rounded-2xl border border-white/10 bg-slate-950/25 p-5 transition hover:-translate-y-0.5 hover:border-cyan-300/25 hover:bg-cyan-300/[.05]"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-300/[.08] text-cyan-300"><Icon className="h-5 w-5"/></span><h3 className="font-black group-hover:text-cyan-100">{title}</h3></div><p className="mt-3 text-xs leading-5 text-slate-500">{desc}</p></a>)}</div>
      </section>
    </div>
  </main>
}
