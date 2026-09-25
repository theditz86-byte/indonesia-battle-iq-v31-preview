"use client"

import { FormEvent, useEffect, useState } from "react"

const API="https://efndozplpwyemzgqfnep.supabase.co/functions/v1/battle-recovery"

export function AdminRecoveryControls({token}:{token:string}){
  const [email,setEmail]=useState("")
  const [busy,setBusy]=useState(false)
  const [message,setMessage]=useState("")
  const [error,setError]=useState("")

  useEffect(()=>{if(!token)return;void (async()=>{try{const r=await fetch(API,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:"state",kind:"admin",admin_token:token})});const d=await r.json();if(r.ok)setEmail(d?.state?.recovery_email||"")}catch{}})()},[token])

  async function save(e:FormEvent){e.preventDefault();setBusy(true);setError("");setMessage("");try{const r=await fetch(API,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:"set_email",kind:"admin",admin_token:token,email})});const d=await r.json();if(!r.ok)throw new Error(d?.error||"Email belum dapat disimpan.");setEmail(d?.state?.recovery_email||email.trim().toLowerCase());setMessage("Email pemulihan admin tersimpan. Tombol Lupa Password sekarang dapat digunakan.")}catch(e){setError(e instanceof Error?e.message:"Email belum dapat disimpan.")}finally{setBusy(false)}}

  return <section className="mb-6 rounded-3xl border border-cyan-400/15 bg-cyan-400/[.055] p-5 sm:p-6">
    <div><p className="text-xs font-black uppercase tracking-[.18em] text-cyan-300">Keamanan Admin</p><h2 className="mt-1 text-xl font-black">Email Pemulihan</h2><p className="mt-2 text-sm text-slate-400">Tautan reset password admin hanya dikirim ke email ini. Password asli tidak pernah disimpan dalam bentuk teks.</p></div>
    <form onSubmit={save} className="mt-4 flex flex-col gap-3 sm:flex-row"><input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="email@contoh.com" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 outline-none focus:border-cyan-400/60"/><button disabled={busy} className="rounded-xl bg-cyan-400 px-5 py-3 font-black text-slate-950 disabled:opacity-60">{busy?"Menyimpan...":"Simpan Email"}</button></form>
    {message&&<p className="mt-3 text-sm text-emerald-300">{message}</p>}{error&&<p className="mt-3 text-sm text-rose-300">{error}</p>}
  </section>
}
