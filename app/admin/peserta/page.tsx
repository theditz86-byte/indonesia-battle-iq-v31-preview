"use client"

import { useEffect, useState } from "react"
import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react"
import { AdminParticipantMonitor } from "@/components/admin-participant-monitor"
import { AdminSkdLiveScoreboard } from "@/components/admin-skd-live-scoreboard"

const TOKEN_KEY="battle_admin_token"

export default function AdminParticipantsPage(){
  const [token,setToken]=useState<string|null>(null)

  useEffect(()=>{setToken(window.localStorage.getItem(TOKEN_KEY)||"")},[])

  if(token===null)return <main className="grid min-h-screen place-items-center bg-[#020817] text-slate-400"><div className="flex items-center gap-2"><Loader2 className="h-5 w-5 animate-spin"/>Memuat sesi admin...</div></main>

  if(!token)return <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_20%_0%,rgba(56,189,248,.14),transparent_32rem),linear-gradient(180deg,#020817,#07142f)] px-4 text-white"><section className="max-w-md rounded-3xl border border-white/10 bg-white/5 p-7 text-center shadow-2xl"><ShieldCheck className="mx-auto h-9 w-9 text-cyan-300"/><h1 className="mt-4 text-2xl font-black">Sesi Admin Diperlukan</h1><p className="mt-2 text-sm leading-6 text-slate-400">Masuk ke Dashboard Admin terlebih dahulu untuk membuka monitor peserta.</p><a href="/admin/" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-3 font-black"><ArrowLeft className="h-4 w-4"/>Ke Login Admin</a></section></main>

  return <main className="min-h-screen bg-[radial-gradient(circle_at_20%_0%,rgba(56,189,248,.14),transparent_32rem),linear-gradient(180deg,#020817,#07142f)] px-4 py-8 text-white sm:px-6">
    <div className="mx-auto max-w-7xl">
      <div className="mb-6"><p className="text-xs font-black uppercase tracking-[.18em] text-cyan-300">Admin · Operasional</p><h1 className="mt-1 text-3xl font-black">Peserta & Aktivitas</h1><p className="mt-2 text-sm text-slate-400">Pantau siapa yang online, aktivitas yang sedang berlangsung, dan progres Mini SKD secara live.</p></div>
      <AdminSkdLiveScoreboard token={token}/>
      <AdminParticipantMonitor token={token}/>
    </div>
  </main>
}
