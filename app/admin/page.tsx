"use client"

import { FormEvent, useEffect, useState } from "react"
import { ArrowLeft, Check, Eye, FileText, Loader2, LogOut, RefreshCw, ShieldCheck, Trophy, WalletCards, X } from "lucide-react"
import { AdminSeasonControls } from "@/components/admin-season-controls"

const ADMIN_API_URL = "https://efndozplpwyemzgqfnep.supabase.co/functions/v1/battle-admin"
const TOKEN_KEY = "battle_admin_token"

type Payment = {
  id: string
  product_type?: "attempt_credit"|"premium_report"
  nickname?: string
  regency_name?: string
  payer_name?: string | null
  amount?: number
  status?: "pending" | "approved" | "rejected"
  created_at?: string
  admin_note?: string | null
}

type Metrics = {
  participants?: number
  season_testers?: number
  season_completers?: number
  ranked_entries?: number
  approved_payments?: number
  approved_attempt_sales?: number
  approved_premium_sales?: number
  gross_revenue?: number
  pending_payments?: number
  premium_offer_views?: number
  share_clicks?: number
}

async function api(body: Record<string, unknown>) {
  const response = await fetch(ADMIN_API_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data?.error || "Permintaan admin gagal.")
  return data
}

function productLabel(type?:string){return type==="premium_report"?"Laporan Premium":"Ranked Attempt"}

export default function AdminPage() {
  const [token, setToken] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [filter, setFilter] = useState("pending")
  const [payments, setPayments] = useState<Payment[]>([])
  const [metrics,setMetrics]=useState<Metrics>({})
  const [proofs, setProofs] = useState<Record<string,string>>({})
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    const stored = window.localStorage.getItem(TOKEN_KEY) || ""
    if (stored) setToken(stored)
  }, [])

  useEffect(() => {
    if (token) void load()
  }, [token, filter])

  async function login(e: FormEvent) {
    e.preventDefault()
    setBusy(true); setError(""); setMessage("")
    try {
      const data = await api({ action:"admin_login", username:username.trim(), password })
      window.localStorage.setItem(TOKEN_KEY, data.admin_token)
      setToken(data.admin_token)
      setPassword("")
    } catch(e) {
      setError(e instanceof Error ? e.message : "Login admin gagal.")
    } finally { setBusy(false) }
  }

  async function load() {
    if (!token) return
    setBusy(true); setError("")
    try {
      const [listData,metricData]=await Promise.all([
        api({ action:"admin_list", admin_token:token, status:filter }),
        api({ action:"admin_metrics", admin_token:token }),
      ])
      setPayments(Array.isArray(listData.payments) ? listData.payments : [])
      setMetrics(metricData.metrics || {})
    } catch(e) {
      const msg=e instanceof Error ? e.message : "Data admin belum dapat dimuat."
      setError(msg)
      if (/sesi admin/i.test(msg)) {
        window.localStorage.removeItem(TOKEN_KEY)
        setToken("")
      }
    } finally { setBusy(false) }
  }

  async function showProof(paymentId:string) {
    if (proofs[paymentId]) {
      setProofs((p)=>{ const n={...p}; delete n[paymentId]; return n })
      return
    }
    try {
      const data=await api({action:"admin_proof",admin_token:token,payment_id:paymentId})
      setProofs((p)=>({...p,[paymentId]:`data:${data.proof.mime};base64,${data.proof.base64}`}))
    } catch(e) { setError(e instanceof Error ? e.message : "Bukti belum dapat dibuka.") }
  }

  async function review(payment:Payment, decision:"approved"|"rejected") {
    const note = decision==="rejected" ? (window.prompt("Alasan penolakan (opsional)") || "") : ""
    if (decision==="approved") {
      const action=payment.product_type==="premium_report"?"membuka Laporan Premium season ini":"membuka tepat 1 kredit Ranked Attempt"
      if(!window.confirm(`Setujui pembayaran ini dan ${action}?`)) return
    }
    setBusy(true); setError(""); setMessage("")
    try {
      await api({action:"admin_review",admin_token:token,payment_id:payment.id,decision,note})
      setMessage(decision==="approved" ? `Pembayaran disetujui. ${payment.product_type==="premium_report"?"Laporan Premium sudah dibuka.":"1 kredit Ranked Attempt sudah dibuka."}` : "Pembayaran ditolak.")
      await load()
    } catch(e) { setError(e instanceof Error ? e.message : "Pembayaran belum dapat diproses.") }
    finally { setBusy(false) }
  }

  async function logout() {
    try { if(token) await api({action:"admin_logout",admin_token:token}) } catch {}
    window.localStorage.removeItem(TOKEN_KEY)
    setToken(""); setPayments([]); setProofs({}); setMetrics({})
  }

  if (!token) return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_20%_0%,rgba(56,189,248,.16),transparent_32rem),linear-gradient(180deg,#020817,#07142f)] px-4 py-10 text-white">
      <div className="mx-auto max-w-xl">
        <a href="/battle" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white"><ArrowLeft className="h-4 w-4" /> Kembali</a>
        <section className="rounded-3xl border border-white/10 bg-white/[.055] p-7 shadow-2xl backdrop-blur-xl">
          <div className="mb-5 flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-indigo-500/20 text-indigo-200"><ShieldCheck className="h-6 w-6" /></span><div><h1 className="text-2xl font-black">Admin Battle IQ</h1><p className="text-sm text-slate-400">Pembayaran dan metrik bisnis season aktif.</p></div></div>
          <form onSubmit={login} className="grid gap-4">
            <label className="grid gap-2 text-sm font-semibold">Username<input value={username} onChange={(e)=>setUsername(e.target.value)} required autoComplete="username" className="rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 outline-none focus:border-cyan-400/60" /></label>
            <label className="grid gap-2 text-sm font-semibold">Password<input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required autoComplete="current-password" className="rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 outline-none focus:border-cyan-400/60" /></label>
            {error && <div className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div>}
            <button disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 font-extrabold disabled:opacity-60">{busy?<Loader2 className="h-4 w-4 animate-spin"/>:<ShieldCheck className="h-4 w-4"/>}{busy?"Memeriksa...":"Masuk Admin"}</button>
          </form>
        </section>
      </div>
    </main>
  )

  const metricCards=[
    ["Peserta",Number(metrics.participants||0).toLocaleString("id-ID"),Trophy],
    ["Selesai tes",Number(metrics.season_completers||0).toLocaleString("id-ID"),Check],
    ["Premium terjual",Number(metrics.approved_premium_sales||0).toLocaleString("id-ID"),FileText],
    ["Pendapatan gross",`Rp${Number(metrics.gross_revenue||0).toLocaleString("id-ID")}`,WalletCards],
    ["Menunggu verifikasi",Number(metrics.pending_payments||0).toLocaleString("id-ID"),RefreshCw],
  ] as const

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_20%_0%,rgba(56,189,248,.14),transparent_32rem),linear-gradient(180deg,#020817,#07142f)] px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div><p className="text-xs font-bold uppercase tracking-[.18em] text-cyan-300">Admin</p><h1 className="text-3xl font-black">Monetisasi & Pembayaran</h1><p className="mt-1 text-sm text-slate-400">Pantau funnel sederhana dan verifikasi Ranked Attempt tambahan maupun Laporan Premium.</p></div>
          <div className="flex gap-2"><button onClick={()=>load()} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 font-bold"><RefreshCw className="h-4 w-4"/> Muat ulang</button><button onClick={logout} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 font-bold"><LogOut className="h-4 w-4"/> Keluar</button></div>
        </div>

        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {metricCards.map(([label,value,Icon])=><div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-4"><Icon className="h-5 w-5 text-cyan-300"/><p className="mt-3 text-xs text-slate-400">{label}</p><p className="mt-1 text-xl font-black">{value}</p></div>)}
        </div>

        <AdminSeasonControls token={token} />

        <div className="mb-5 flex flex-wrap gap-2">
          {[["pending","Menunggu"],["approved","Disetujui"],["rejected","Ditolak"],["all","Semua"]].map(([value,label])=><button key={value} onClick={()=>setFilter(value)} className={`rounded-full px-4 py-2 text-sm font-bold ${filter===value?"bg-white text-slate-950":"border border-white/10 bg-white/5 text-slate-300"}`}>{label}</button>)}
        </div>
        {error && <div className="mb-4 rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div>}
        {message && <div className="mb-4 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">{message}</div>}

        <section className="rounded-3xl border border-white/10 bg-white/[.045] p-4 shadow-2xl backdrop-blur-xl sm:p-6">
          {busy && payments.length===0 ? <div className="flex items-center justify-center gap-2 py-12 text-slate-400"><Loader2 className="h-5 w-5 animate-spin"/> Memuat pembayaran...</div> : payments.length===0 ? <p className="py-12 text-center text-slate-400">Tidak ada pembayaran pada filter ini.</p> :
            <div className="grid gap-4">{payments.map((p)=>(
              <article key={p.id} className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div><div className="flex flex-wrap items-center gap-2"><p className="text-lg font-extrabold">{p.nickname || "Peserta"}</p><span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${p.product_type==="premium_report"?"bg-violet-500/20 text-violet-200":"bg-cyan-500/20 text-cyan-200"}`}>{productLabel(p.product_type)}</span></div><p className="mt-1 text-sm text-slate-400">{p.regency_name || "—"} · {p.created_at ? new Date(p.created_at).toLocaleString("id-ID") : "—"}</p></div>
                  <div className="text-right"><p className="font-black">Rp{Number(p.amount||0).toLocaleString("id-ID")}</p><p className="text-sm text-slate-400">Pembayar: {p.payer_name || "—"}</p><span className="mt-1 inline-flex rounded-full bg-indigo-500/15 px-2.5 py-1 text-xs font-bold uppercase text-indigo-200">{p.status}</span></div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button onClick={()=>showProof(p.id)} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-sm font-bold"><Eye className="h-4 w-4"/>{proofs[p.id]?"Tutup Bukti":"Lihat Bukti"}</button>
                  {p.status==="pending" && <><button disabled={busy} onClick={()=>review(p,"approved")} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3.5 py-2 text-sm font-extrabold disabled:opacity-60"><Check className="h-4 w-4"/> Setujui {p.product_type==="premium_report"?"Premium":"+1 Ranked"}</button><button disabled={busy} onClick={()=>review(p,"rejected")} className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-3.5 py-2 text-sm font-extrabold disabled:opacity-60"><X className="h-4 w-4"/> Tolak</button></>}
                </div>
                {proofs[p.id] && <img src={proofs[p.id]} alt={"Bukti pembayaran "+(p.nickname||"peserta")} className="mt-4 max-h-[620px] w-auto max-w-full rounded-2xl border border-white/10" />}
              </article>
            ))}</div>}
        </section>
      </div>
    </main>
  )
}
