"use client"

import { useEffect, useState } from "react"
import { KeyRound, ShieldCheck } from "lucide-react"
import { AdminRecoveryControls } from "@/components/admin-recovery-controls"

const TOKEN_KEY="battle_admin_token"

export default function AdminRecoveryPage(){
  const [token,setToken]=useState("")

  useEffect(()=>{
    const t=window.localStorage.getItem(TOKEN_KEY)||""
    if(!t){window.location.assign("/admin/");return}
    setToken(t)
  },[])

  if(!token)return <main className="min-h-screen bg-[#020817]"/>

  return <main className="min-h-screen bg-[radial-gradient(circle_at_18%_-10%,rgba(34,211,238,.12),transparent_34rem),linear-gradient(180deg,#020817,#07142f)] px-4 py-8 text-white sm:px-6">
    <div className="mx-auto max-w-5xl">
      <section className="rounded-[30px] border border-cyan-300/15 bg-gradient-to-br from-cyan-300/[.07] via-white/[.035] to-violet-400/[.04] p-6 shadow-2xl sm:p-8">
        <div className="flex items-start gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-cyan-300/10 text-cyan-300"><KeyRound className="h-6 w-6"/></span><div><p className="text-xs font-black uppercase tracking-[.18em] text-cyan-300">Keamanan Admin</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">Pemulihan Akun Admin</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">Halaman ini khusus untuk mengatur email pemulihan akun admin. Tidak ada tools lain di sini agar fungsi pemulihan tetap jelas dan mudah ditemukan.</p></div></div>
      </section>

      <div className="mt-6"><AdminRecoveryControls token={token}/></div>

      <section className="rounded-2xl border border-white/10 bg-white/[.035] p-5 text-sm text-slate-400"><div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300"/><p>Email ini digunakan untuk proses <b className="text-white">Lupa Password</b> admin. Password asli tidak ditampilkan atau disimpan sebagai teks biasa.</p></div></section>
    </div>
  </main>
}
