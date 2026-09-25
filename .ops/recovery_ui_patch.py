from pathlib import Path


def replace(path, old, new, count=1):
    p = Path(path)
    s = p.read_text()
    if old not in s:
        raise SystemExit(f"pattern not found in {path}: {old[:120]!r}")
    s = s.replace(old, new, count)
    p.write_text(s)

# Account page: API + model + state
replace("app/account/page.tsx",
'''const ACCOUNT_API = "https://efndozplpwyemzgqfnep.supabase.co/functions/v1/battle-account"''',
'''const ACCOUNT_API = "https://efndozplpwyemzgqfnep.supabase.co/functions/v1/battle-account"\nconst RECOVERY_API = "https://efndozplpwyemzgqfnep.supabase.co/functions/v1/battle-recovery"''')
replace("app/account/page.tsx",
'''  username?: string | null\n  account_ready?: boolean''',
'''  username?: string | null\n  email?: string | null\n  email_configured?: boolean\n  account_ready?: boolean''')
replace("app/account/page.tsx",
'''async function api(action: string, body: Record<string, unknown> = {}, token = "") {''',
'''async function recoveryApi(body: Record<string, unknown>, token = "") {\n  const headers: Record<string, string> = { "Content-Type": "application/json" }\n  if (token) headers["X-Battle-Token"] = token\n  const response = await fetch(RECOVERY_API, { method: "POST", headers, body: JSON.stringify(body) })\n  const data = await response.json().catch(() => ({}))\n  if (!response.ok) throw new Error(data?.error || "Layanan pemulihan akun belum tersedia.")\n  return data\n}\n\nasync function api(action: string, body: Record<string, unknown> = {}, token = "") {''')
replace("app/account/page.tsx",
'''  const [username, setUsername] = useState("")\n  const [password, setPassword] = useState("")\n  const [nickname, setNickname] = useState("")''',
'''  const [username, setUsername] = useState("")\n  const [password, setPassword] = useState("")\n  const [email, setEmail] = useState("")\n  const [nickname, setNickname] = useState("")''')
replace("app/account/page.tsx",
'''  const [editNickname, setEditNickname] = useState("")\n  const [currentPassword, setCurrentPassword] = useState("")''',
'''  const [editNickname, setEditNickname] = useState("")\n  const [recoveryEmail, setRecoveryEmail] = useState("")\n  const [currentPassword, setCurrentPassword] = useState("")''')
replace("app/account/page.tsx",
'''      setParticipant(data.participant || null)\n      setEditNickname(data.participant?.nickname || "")''',
'''      setParticipant(data.participant || null)\n      setEditNickname(data.participant?.nickname || "")\n      setRecoveryEmail(data.participant?.email || "")''', 3)
replace("app/account/page.tsx",
'''        username,\n        password,\n        nickname,''',
'''        username,\n        password,\n        email,\n        nickname,''')

# Account page: recovery actions
replace("app/account/page.tsx",
'''  async function updateNickname(event: FormEvent) {''',
'''  async function requestPasswordReset() {\n    clearMessages()\n    if (!loginUsername.trim()) { setError("Isi username terlebih dahulu, lalu tekan Lupa Password."); return }\n    setBusy(true)\n    try {\n      const data = await recoveryApi({ action: "request", kind: "participant", identifier: loginUsername.trim() })\n      setNotice(data.message || "Jika email pemulihan terdaftar, tautan reset sudah dikirim.")\n    } catch (e) { setError(messageText(e)) }\n    finally { setBusy(false) }\n  }\n\n  async function saveRecoveryEmail(event: FormEvent) {\n    event.preventDefault()\n    clearMessages()\n    setBusy(true)\n    try {\n      const data = await recoveryApi({ action: "set_email", kind: "participant", email: recoveryEmail }, token)\n      const savedEmail = data?.state?.email || recoveryEmail.trim().toLowerCase()\n      setRecoveryEmail(savedEmail)\n      setParticipant((prev) => prev ? { ...prev, email: savedEmail, email_configured: true } : prev)\n      setNotice("Email pemulihan berhasil disimpan. Gunakan email ini jika lupa password.")\n    } catch (e) { setError(messageText(e)) }\n    finally { setBusy(false) }\n  }\n\n  async function updateNickname(event: FormEvent) {''')

# Login forgot button
replace("app/account/page.tsx",
'''                <button disabled={busy} className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 font-black disabled:opacity-60">{busy ? "Memproses…" : "Masuk"}</button>''',
'''                <div className="flex flex-wrap items-center justify-between gap-3">\n                  <button type="button" disabled={busy} onClick={() => void requestPasswordReset()} className="text-sm font-bold text-cyan-300 hover:text-cyan-200 disabled:opacity-50">Lupa Password?</button>\n                  <span className="text-xs text-slate-500">Isi username terlebih dahulu</span>\n                </div>\n                <button disabled={busy} className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 font-black disabled:opacity-60">{busy ? "Memproses…" : "Masuk"}</button>''')

# Registration email
replace("app/account/page.tsx",
'''                <label className="grid gap-2 text-sm font-bold">Nama Arena\n                  <input value={nickname}''',
'''                <label className="grid gap-2 text-sm font-bold">Email <span className="font-normal text-slate-500">untuk pemulihan password</span>\n                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" placeholder="nama@email.com" className="rounded-xl border border-white/15 bg-[#06142d] px-4 py-3 font-normal outline-none focus:border-cyan-400" />\n                </label>\n                <label className="grid gap-2 text-sm font-bold">Nama Arena\n                  <input value={nickname}''')

# Logged-in recovery email card
replace("app/account/page.tsx",
'''            <div className="grid gap-5 lg:grid-cols-2">''',
'''            <section className={`rounded-3xl border p-6 ${participant.email ? "border-emerald-300/20 bg-emerald-300/[.06]" : "border-amber-300/25 bg-amber-300/10"}`}>\n              <h3 className="text-xl font-black">Email Pemulihan</h3>\n              <p className="mt-1 text-sm text-slate-300">{participant.email ? "Email ini dipakai untuk mengirim tautan reset jika Anda lupa password." : "Akun lama ini belum memiliki email. Tambahkan sekarang agar password bisa dipulihkan tanpa kehilangan skor dan riwayat."}</p>\n              <form onSubmit={saveRecoveryEmail} className="mt-5 flex flex-col gap-3 sm:flex-row">\n                <input type="email" value={recoveryEmail} onChange={(e) => setRecoveryEmail(e.target.value)} required autoComplete="email" placeholder="nama@email.com" className="min-w-0 flex-1 rounded-xl border border-white/15 bg-[#06142d] px-4 py-3 outline-none focus:border-cyan-400" />\n                <button disabled={busy} className="rounded-xl bg-emerald-500 px-5 py-3 font-black text-slate-950 disabled:opacity-60">{participant.email ? "Perbarui Email" : "Simpan Email"}</button>\n              </form>\n            </section>\n\n            <div className="grid gap-5 lg:grid-cols-2">''')

# Admin page imports/API
replace("app/admin/page.tsx",
'''import { AdminSeasonControls } from "@/components/admin-season-controls"''',
'''import { AdminSeasonControls } from "@/components/admin-season-controls"\nimport { AdminRecoveryControls } from "@/components/admin-recovery-controls"''')
replace("app/admin/page.tsx",
'''const ADMIN_API_URL = "https://efndozplpwyemzgqfnep.supabase.co/functions/v1/battle-admin"''',
'''const ADMIN_API_URL = "https://efndozplpwyemzgqfnep.supabase.co/functions/v1/battle-admin"\nconst RECOVERY_API_URL = "https://efndozplpwyemzgqfnep.supabase.co/functions/v1/battle-recovery"''')
replace("app/admin/page.tsx",
'''  async function load() {''',
'''  async function forgotPassword() {\n    setBusy(true); setError(""); setMessage("")\n    try {\n      const response = await fetch(RECOVERY_API_URL,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:"request",kind:"admin",identifier:username.trim()||"admin"})})\n      const data=await response.json().catch(()=>({}))\n      if(!response.ok) throw new Error(data?.error||"Pemulihan admin belum dapat diproses.")\n      setMessage(data.message||"Jika email pemulihan sudah terdaftar, tautan reset telah dikirim.")\n    } catch(e) { setError(e instanceof Error?e.message:"Pemulihan admin gagal.") }\n    finally { setBusy(false) }\n  }\n\n  async function load() {''')
replace("app/admin/page.tsx",
'''            {error && <div className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div>}\n            <button disabled={busy}''',
'''            <button type="button" onClick={()=>void forgotPassword()} disabled={busy} className="justify-self-start text-sm font-bold text-cyan-300 hover:text-cyan-200 disabled:opacity-50">Lupa Password?</button>\n            {error && <div className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div>}\n            {message && <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">{message}</div>}\n            <button disabled={busy}''')
replace("app/admin/page.tsx",
'''        <AdminSeasonControls token={token} />''',
'''        <AdminSeasonControls token={token} />\n        <AdminRecoveryControls token={token} />''')

# Root recovery redirect
replace("app/page.tsx",
'''import { BattleDashboard } from "@/components/battle-dashboard"\n\nexport default function Page() {\n  return <BattleDashboard />\n}''',
'''import { BattleDashboard } from "@/components/battle-dashboard"\nimport { RecoveryRedirect } from "@/components/recovery-redirect"\n\nexport default function Page() {\n  return <><RecoveryRedirect /><BattleDashboard /></>\n}''')

Path("components/admin-recovery-controls.tsx").write_text(r'''"use client"

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
''')

Path("components/recovery-redirect.tsx").write_text(r'''"use client"
import { useEffect } from "react"
export function RecoveryRedirect(){useEffect(()=>{const h=window.location.hash;if(h.includes("access_token=")&&(h.includes("type=magiclink")||h.includes("type=recovery"))){window.location.replace(`/reset-password${h}`)}},[]);return null}
''')

Path("app/reset-password").mkdir(parents=True,exist_ok=True)
Path("app/reset-password/page.tsx").write_text(r'''"use client"

import { FormEvent, useEffect, useState } from "react"

const API="https://efndozplpwyemzgqfnep.supabase.co/functions/v1/battle-recovery"

export default function ResetPasswordPage(){
  const [token,setToken]=useState("")
  const [password,setPassword]=useState("")
  const [confirm,setConfirm]=useState("")
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState("")
  const [done,setDone]=useState(false)
  const [kind,setKind]=useState("")
  useEffect(()=>{const p=new URLSearchParams(window.location.hash.replace(/^#/,""));setToken(p.get("access_token")||"");const q=new URLSearchParams(window.location.search);setKind(q.get("kind")||"")},[])
  async function submit(e:FormEvent){e.preventDefault();setError("");if(password.length<10){setError("Password baru minimal 10 karakter.");return}if(password!==confirm){setError("Konfirmasi password belum sama.");return}if(!token){setError("Tautan reset tidak valid atau sudah kedaluwarsa.");return}setBusy(true);try{const r=await fetch(API,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:"reset",kind,access_token:token,new_password:password})});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d?.error||"Password belum dapat diubah.");localStorage.removeItem("battle_admin_token");localStorage.removeItem("battle_participant_token");setKind(d?.kind||kind);setDone(true);window.history.replaceState({},"",window.location.pathname)}catch(e){setError(e instanceof Error?e.message:"Password belum dapat diubah.")}finally{setBusy(false)}}
  const target=kind==="admin"?"/admin":"/account"
  return <main className="min-h-screen bg-[radial-gradient(circle_at_20%_0%,rgba(56,189,248,.16),transparent_32rem),linear-gradient(180deg,#020817,#07142f)] px-4 py-12 text-white"><div className="mx-auto max-w-lg"><a href="/battle" className="text-sm font-bold text-slate-400 hover:text-white">← ALZAVA Battle Point</a><section className="mt-6 rounded-3xl border border-white/10 bg-white/[.055] p-7 shadow-2xl backdrop-blur-xl"><img src="/alzava-emblem-v3.svg" alt="" className="mb-4 h-14 w-14"/><h1 className="text-3xl font-black">Buat Password Baru</h1><p className="mt-2 text-sm leading-6 text-slate-400">Link email membuktikan bahwa Anda memiliki alamat pemulihan yang terhubung ke akun ALZAVA.</p>{done?<div className="mt-6"><div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-emerald-100">Password berhasil diganti. Semua sesi ALZAVA lama sudah tidak berlaku.</div><a href={target} className="mt-4 block rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 text-center font-black">Login kembali</a></div>:<form onSubmit={submit} className="mt-6 grid gap-4"><label className="grid gap-2 text-sm font-bold">Password baru<input type="password" value={password} onChange={e=>setPassword(e.target.value)} minLength={10} required autoComplete="new-password" className="rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 outline-none focus:border-cyan-400/60"/></label><label className="grid gap-2 text-sm font-bold">Ulangi password<input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} minLength={10} required autoComplete="new-password" className="rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 outline-none focus:border-cyan-400/60"/></label>{!token&&<div className="rounded-xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">Token belum ditemukan. Buka halaman ini dari link yang dikirim ke email Anda.</div>}{error&&<div className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div>}<button disabled={busy||!token} className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 font-black disabled:opacity-50">{busy?"Menyimpan...":"Simpan Password Baru"}</button></form>}</section></div></main>
}
''')
