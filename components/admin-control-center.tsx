"use client"

import { useEffect, useMemo, useState } from "react"
import {
  BarChart3,
  BookOpenCheck,
  Gauge,
  LogOut,
  Menu,
  Power,
  RefreshCw,
  ShieldCheck,
  Trophy,
  Users,
  Wrench,
  X,
} from "lucide-react"

const ADMIN_API_URL="https://efndozplpwyemzgqfnep.supabase.co/functions/v1/battle-admin"
const TOKEN_KEY="battle_admin_token"

const sections=[
  {id:"admin-overview",label:"Overview",icon:Gauge,target:"admin-overview",match:"Dashboard ALZAVA Battle Point"},
  {id:"admin-participants",label:"Peserta & Aktivitas",icon:Users,route:"/admin/peserta/"},
  {id:"admin-growth-traffic",label:"Growth & Traffic",icon:BarChart3,target:"admin-growth",match:"Referral & Challenge Funnel"},
  {id:"admin-season",label:"Season & Ranking",icon:Trophy,target:"admin-season",match:"Season resmi terpisah dari testing"},
  {id:"admin-moderation-payment",label:"Moderasi & Pembayaran",icon:ShieldCheck,target:"admin-moderation",match:"Laporan Peserta"},
  {id:"admin-bank",label:"Bank Soal SKD",icon:BookOpenCheck,route:"/admin/bank-soal/"},
  {id:"admin-maintenance",label:"Maintenance",icon:Power,route:"/admin/maintenance/"},
  {id:"admin-tools",label:"Recovery & Tools",icon:Wrench,target:"admin-tools",match:"Recovery"},
]

const groupedTargets=[
  {id:"admin-traffic",match:"Pengunjung Situs",navId:"admin-growth-traffic"},
  {id:"admin-payment",match:"Verifikasi Transaksi",navId:"admin-moderation-payment"},
]

function findHeading(match:string){
  const nodes=Array.from(document.querySelectorAll("h1,h2,h3")) as HTMLElement[]
  return nodes.find(el=>(el.textContent||"").toLowerCase().includes(match.toLowerCase()))||null
}

function sectionForPath(pathname:string){
  if(pathname.startsWith("/admin/peserta"))return"admin-participants"
  if(pathname.startsWith("/admin/bank-soal"))return"admin-bank"
  if(pathname.startsWith("/admin/maintenance"))return"admin-maintenance"
  return"admin-overview"
}

function isStandaloneAdminPage(pathname:string){
  return pathname.startsWith("/admin/peserta")||pathname.startsWith("/admin/bank-soal")||pathname.startsWith("/admin/maintenance")
}

export function AdminControlCenter(){
  const [enabled,setEnabled]=useState(false)
  const [open,setOpen]=useState(false)
  const [refreshing,setRefreshing]=useState(false)
  const [lastSync,setLastSync]=useState<Date|null>(null)
  const [active,setActive]=useState("admin-overview")

  useEffect(()=>{
    if(!window.location.pathname.startsWith("/admin"))return
    const token=window.localStorage.getItem(TOKEN_KEY)||""
    if(!token)return
    setEnabled(true)
    setActive(sectionForPath(window.location.pathname))
    document.body.classList.add("admin-control-center-enabled")
    setLastSync(new Date())

    const assignIds=()=>{
      sections.forEach(s=>{
        if(!s.match)return
        const h=findHeading(s.match)
        const section=(h?.closest("section")||h?.parentElement) as HTMLElement|null
        const target=s.target||s.id
        if(section&&!section.id)section.id=target
      })
      groupedTargets.forEach(s=>{
        const h=findHeading(s.match)
        const section=(h?.closest("section")||h?.parentElement) as HTMLElement|null
        if(section&&!section.id)section.id=s.id
      })
      const root=document.querySelector("main > div") as HTMLElement|null
      if(root&&!document.getElementById("admin-overview")&&!isStandaloneAdminPage(window.location.pathname))root.id="admin-overview"
    }
    assignIds()
    const mo=new MutationObserver(assignIds)
    mo.observe(document.body,{subtree:true,childList:true})
    return()=>{
      mo.disconnect()
      document.body.classList.remove("admin-control-center-enabled")
    }
  },[])

  useEffect(()=>{
    if(!enabled||isStandaloneAdminPage(window.location.pathname))return
    const onScroll=()=>{
      let best="admin-overview",bestDist=Infinity
      sections.forEach(s=>{
        if(s.route)return
        const el=document.getElementById(s.target||s.id)
        if(!el)return
        const d=Math.abs(el.getBoundingClientRect().top-110)
        if(d<bestDist){bestDist=d;best=s.id}
      })
      groupedTargets.forEach(s=>{
        const el=document.getElementById(s.id)
        if(!el)return
        const d=Math.abs(el.getBoundingClientRect().top-110)
        if(d<bestDist){bestDist=d;best=s.navId}
      })
      setActive(best)
    }
    onScroll();window.addEventListener("scroll",onScroll,{passive:true})
    return()=>window.removeEventListener("scroll",onScroll)
  },[enabled])

  const syncLabel=useMemo(()=>lastSync?lastSync.toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"}):"—",[lastSync])
  const activeLabel=sections.find(section=>section.id===active)?.label||"Dashboard Admin"

  async function refresh(){
    if(refreshing)return
    setRefreshing(true)
    setLastSync(new Date())
    window.setTimeout(()=>window.location.reload(),180)
  }

  async function logout(){
    const token=window.localStorage.getItem(TOKEN_KEY)||""
    try{if(token)await fetch(ADMIN_API_URL,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:"admin_logout",admin_token:token})})}catch{}
    window.localStorage.removeItem(TOKEN_KEY)
    window.location.assign("/admin/")
  }

  function jump(id:string,route?:string,target?:string){
    setOpen(false);setActive(id)
    if(route){window.location.assign(route);return}
    const anchor=target||id
    if(isStandaloneAdminPage(window.location.pathname)){window.location.assign(`/admin/#${anchor}`);return}
    const el=document.getElementById(anchor)
    if(el)window.scrollTo({top:window.scrollY+el.getBoundingClientRect().top-98,behavior:"smooth"})
  }

  if(!enabled)return null

  return <>
    <style>{`
      @media (min-width: 1100px){
        body.admin-control-center-enabled main{padding-left:290px!important;padding-top:104px!important}
        body.admin-control-center-enabled main>div{max-width:1400px!important}
        body.admin-control-center-enabled main>div>div:first-child{display:none!important}
      }
      @media (max-width:1099px){
        body.admin-control-center-enabled main{padding-top:92px!important}
        body.admin-control-center-enabled main>div>div:first-child{display:none!important}
      }
      body.admin-control-center-enabled section{scroll-margin-top:110px}
    `}</style>

    <aside className={`fixed inset-y-0 left-0 z-[150] w-[270px] border-r border-white/10 bg-[#041022]/95 p-4 shadow-2xl backdrop-blur-2xl transition-transform duration-300 lg:translate-x-0 ${open?"translate-x-0":"-translate-x-full"}`}>
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between rounded-2xl border border-cyan-300/15 bg-gradient-to-br from-cyan-400/10 to-violet-500/10 p-4">
          <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-cyan-300/10 text-cyan-300"><ShieldCheck className="h-5 w-5"/></span><div><p className="text-[10px] font-black uppercase tracking-[.2em] text-cyan-300">ALZAVA</p><p className="text-sm font-black text-white">Admin Control</p></div></div>
          <button onClick={()=>setOpen(false)} className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/5 text-slate-300 lg:hidden"><X className="h-4 w-4"/></button>
        </div>

        <nav className="mt-5 grid gap-1.5 overflow-y-auto pr-1">
          {sections.map(({id,label,icon:Icon,route,target})=><button key={id} onClick={()=>jump(id,route,target)} className={`group flex items-center gap-3 rounded-2xl px-3.5 py-3 text-left text-sm font-bold transition ${active===id?"border border-cyan-300/20 bg-cyan-300/10 text-white shadow-[0_0_25px_rgba(34,211,238,.08)]":"border border-transparent text-slate-400 hover:border-white/10 hover:bg-white/5 hover:text-white"}`}><Icon className={`h-4 w-4 ${active===id?"text-cyan-300":"text-slate-500 group-hover:text-cyan-300"}`}/><span>{label}</span>{active===id&&<span className="ml-auto h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,.9)]"/>}</button>)}
        </nav>

        <div className="mt-auto rounded-2xl border border-emerald-300/15 bg-emerald-300/[.06] p-4">
          <div className="flex items-center gap-2 text-xs font-black text-emerald-300"><span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,.8)]"/>SISTEM ONLINE</div>
          <p className="mt-2 text-[11px] leading-5 text-slate-500">Control center aktif. Semua modul admin tetap memakai backend produksi.</p>
        </div>
      </div>
    </aside>

    {open&&<button aria-label="Tutup menu" onClick={()=>setOpen(false)} className="fixed inset-0 z-[140] bg-black/65 backdrop-blur-sm lg:hidden"/>}

    <header className="fixed left-0 right-0 top-0 z-[130] border-b border-white/10 bg-[#020918]/90 shadow-[0_20px_50px_rgba(0,0,0,.25)] backdrop-blur-2xl lg:left-[270px]">
      <div className="flex min-h-[82px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button onClick={()=>setOpen(true)} className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/5 text-white lg:hidden"><Menu className="h-5 w-5"/></button>
          <div className="min-w-0"><div className="flex items-center gap-2"><p className="truncate text-lg font-black text-white sm:text-xl">{activeLabel}</p><span className="hidden rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2.5 py-1 text-[10px] font-black uppercase text-emerald-300 sm:inline">Live</span></div><p className="truncate text-xs text-slate-500">Control center · terakhir sinkron {syncLabel}</p></div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <a href="/battle/" className="hidden rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs font-black text-slate-300 transition hover:border-cyan-300/20 hover:text-white sm:inline-flex">Lihat Situs</a>
          <button onClick={()=>void refresh()} disabled={refreshing} className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/25 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 px-3.5 py-2.5 text-xs font-black text-cyan-100 shadow-[0_0_28px_rgba(34,211,238,.08)] transition hover:-translate-y-0.5 hover:border-cyan-300/50 hover:bg-cyan-400/20 disabled:opacity-60 sm:px-4 sm:text-sm"><RefreshCw className={`h-4 w-4 ${refreshing?"animate-spin":""}`}/><span className="hidden xs:inline">Muat ulang</span></button>
          <button onClick={()=>void logout()} className="inline-flex items-center gap-2 rounded-xl border border-rose-300/20 bg-rose-500/10 px-3.5 py-2.5 text-xs font-black text-rose-200 transition hover:-translate-y-0.5 hover:border-rose-300/45 hover:bg-rose-500/20 sm:px-4 sm:text-sm"><LogOut className="h-4 w-4"/><span className="hidden sm:inline">Keluar</span></button>
        </div>
      </div>
    </header>
  </>
}
