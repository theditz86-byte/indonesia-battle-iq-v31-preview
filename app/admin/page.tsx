"use client"

import { FormEvent, useEffect, useState } from "react"
import { ArrowLeft, Check, Eye, FileText, Flag, Loader2, LogOut, MousePointerClick, RefreshCw, Share2, ShieldCheck, Trophy, UserRoundPlus, WalletCards, X } from "lucide-react"
import { AdminSeasonControls } from "@/components/admin-season-controls"
import { AdminRecoveryControls } from "@/components/admin-recovery-controls"

const ADMIN_API_URL = "https://efndozplpwyemzgqfnep.supabase.co/functions/v1/battle-admin"
const ADMIN_TOOLS_URL = "https://efndozplpwyemzgqfnep.supabase.co/functions/v1/battle-admin-tools"
const RECOVERY_API_URL = "https://efndozplpwyemzgqfnep.supabase.co/functions/v1/battle-recovery"
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

type GrowthMetrics = {
  opens?: number
  accepts?: number
  conversions?: number
  shares?: number
  conversion_rate?: number
  opens_7d?: number
  accepts_7d?: number
  conversions_7d?: number
  shares_7d?: number
  conversion_rate_7d?: number
  top_source?: string
}

type SocialReport = {
  id: string
  reason?: string
  details?: string | null
  status?: "open" | "reviewed" | "dismissed" | "actioned"
  created_at?: string
  reviewed_at?: string | null
  reporter_public_id?: string
  reporter_nickname?: string
  target_public_id?: string
  target_nickname?: string
  target_avatar_url?: string | null
  target_regency_name?: string
  target_province_name?: string
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

async function toolsApi(body: Record<string, unknown>) {
  const response = await fetch(ADMIN_TOOLS_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data?.error || "Data growth/moderasi belum dapat dimuat.")
  return data
}

function productLabel(type?:string){return type==="premium_report"?"Laporan Premium":"Ranked Attempt"}

function reportStatusLabel(status?: string) {
  if (status === "actioned") return "Ditangani"
  if (status === "dismissed") return "Diabaikan"
  if (status === "reviewed") return "Ditinjau"
  return "Baru"
}

export default function AdminPage() {
  const [token, setToken] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [filter, setFilter] = useState("pending")
  const [reportFilter, setReportFilter] = useState("open")
  const [payments, setPayments] = useState<Payment[]>([])
  const [reports, setReports] = useState<SocialReport[]>([])
  const [metrics,setMetrics]=useState<Metrics>({})
  const [growth,setGrowth]=useState<GrowthMetrics>({})
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
  }, [token, filter, reportFilter])

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

  async function forgotPassword() {
    setBusy(true); setError(""); setMessage("")
    try {
      const response = await fetch(RECOVERY_API_URL,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:"request",kind:"admin",identifier:username.trim()||"admin"})})
      const data=await response.json().catch(()=>({}))
      if(!response.ok) throw new Error(data?.error||"Pemulihan admin belum dapat diproses.")
      setMessage(data.message||"Jika email pemulihan sudah terdaftar, tautan reset telah dikirim.")
    } catch(e) { setError(e instanceof Error?e.message:"Pemulihan admin gagal.") }
    finally { setBusy(false) }
  }

  async function load() {
    if (!token) return
    setBusy(true); setError("")
    try {
      const [listData,metricData,growthData,reportData]=await Promise.all([
        api({ action:"admin_list", admin_token:token, status:filter }),
        api({ action:"admin_metrics", admin_token:token }),
        toolsApi({ action:"growth_metrics", admin_token:token }),
        toolsApi({ action:"report_list", admin_token:token, status:reportFilter }),
      ])
      setPayments(Array.isArray(listData.payments) ? listData.payments : [])
      setMetrics(metricData.metrics || {})
      setGrowth(growthData.metrics || {})
      setReports(Array.isArray(reportData.reports) ? reportData.reports : [])
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

  async function reviewReport(report: SocialReport, status: "reviewed" | "dismissed" | "actioned") {
    const verb=status==="actioned"?"ditandai sudah ditangani":status==="dismissed"?"diabaikan":"ditandai sudah ditinjau"
    if(!window.confirm(`Laporan terhadap ${report.target_nickname || "pemain"} akan ${verb}. Lanjutkan?`)) return
    setBusy(true); setError(""); setMessage("")
    try {
      await toolsApi({action:"report_review",admin_token:token,report_id:report.id,status})
      setMessage(`Laporan ${report.target_nickname || "pemain"} berhasil diperbarui.`)
      await load()
    } catch(e) { setError(e instanceof Error ? e.message : "Laporan belum dapat diperbarui.") }
    finally { setBusy(false) }
  }

  async function logout() {
    try { if(token) await api({action:"admin_logout",admin_token:token}) } catch {}
    window.localStorage.removeItem(TOKEN_KEY)
    setToken(""); setPayments([]); setProofs({}); setMetrics({}); setGrowth({}); setReports([])
  }

  if (!token) return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_20%_0%,rgba(56,189,248,.16),transparent_32rem),linear-gradient(180deg,#020817,#07142f)] px-4 py-10 text-white">
      <div className="mx-auto max-w-xl">
        <a href="/battle" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white"><ArrowLeft className="h-4 w-4" /> Kembali</a>
        <section className="rounded-3xl border border-white/10 bg-white/[.055] p-7 shadow-2xl backdrop-blur-xl">
          <div className="mb-5 flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-indigo-500/20 text-indigo-200"><ShieldCheck className="h-6 w-6" /></span><div><h1 className="text-2xl font-black">Admin Battle Point</h1><p className="text-sm text-slate-400">Pembayaran, growth organik, dan moderasi komunitas.</p></div></div>
          <form onSubmit={login} className="grid gap-4">
            <label className="grid gap-2 text-sm font-semibold">Username<input value={username} onChange={(e)=>setUsername(e.target.value)} required autoComplete="username" className="rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 outline-none focus:border-cyan-400/60" /></label>
            <label className="grid gap-2 text-sm font-semibold">Password<input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required autoComplete="current-password" className="rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 outline-none focus:border-cyan-400/60" /></label>
            <button type="button" onClick={()=>void forgotPassword()} disabled={busy} className="justify-self-start text-sm font-bold text-cyan-300 hover:text-cyan-200 disabled:opacity-50">Lupa Password?</button>
            {error && <div className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div>}
            {message && <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">{message}</div>}
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

  const growthCards=[
    ["Link dibuka",Number(growth.opens||0).toLocaleString("id-ID"),Number(growth.opens_7d||0),MousePointerClick],
    ["Tantangan diterima",Number(growth.accepts||0).toLocaleString("id-ID"),Number(growth.accepts_7d||0),Trophy],
    ["Peserta baru",Number(growth.conversions||0).toLocaleString("id-ID"),Number(growth.conversions_7d||0),UserRoundPlus],
    ["Dibagikan",Number(growth.shares||0).toLocaleString("id-ID"),Number(growth.shares_7d||0),Share2],
  ] as const

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_20%_0%,rgba(56,189,248,.14),transparent_32rem),linear-gradient(180deg,#020817,#07142f)] px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div><p className="text-xs font-bold uppercase tracking-[.18em] text-cyan-300">Admin</p><h1 className="text-3xl font-black">Dashboard ALZAVA Battle Point</h1><p className="mt-1 text-sm text-slate-400">Pantau peserta, growth organik, pembayaran, dan keamanan komunitas dalam satu tempat.</p></div>
          <div className="flex gap-2"><button onClick={()=>load()} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 font-bold"><RefreshCw className="h-4 w-4"/> Muat ulang</button><button onClick={logout} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 font-bold"><LogOut className="h-4 w-4"/> Keluar</button></div>
        </div>

        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {metricCards.map(([label,value,Icon])=><div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-4"><Icon className="h-5 w-5 text-cyan-300"/><p className="mt-3 text-xs text-slate-400">{label}</p><p className="mt-1 text-xl font-black">{value}</p></div>)}
        </div>

        <section className="mb-6 rounded-3xl border border-cyan-300/15 bg-cyan-300/[.035] p-5 sm:p-6">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[.16em] text-cyan-300">Growth Organik</p><h2 className="mt-1 text-2xl font-black">Referral & Challenge Funnel</h2><p className="mt-1 text-sm text-slate-400">Melihat apakah kartu/link tantangan benar-benar membawa pemain baru.</p></div><div className="rounded-2xl border border-emerald-300/15 bg-emerald-300/[.07] px-4 py-3 text-right"><p className="text-xs text-slate-400">Conversion rate</p><p className="text-2xl font-black text-emerald-300">{Number(growth.conversion_rate||0).toFixed(1)}%</p><p className="text-[10px] text-slate-500">7 hari: {Number(growth.conversion_rate_7d||0).toFixed(1)}%</p></div></div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{growthCards.map(([label,value,last7,Icon])=><div key={label} className="rounded-2xl border border-white/10 bg-slate-950/35 p-4"><Icon className="h-5 w-5 text-cyan-300"/><p className="mt-3 text-xs text-slate-400">{label}</p><p className="mt-1 text-2xl font-black">{value}</p><p className="mt-1 text-[11px] text-slate-500">+{last7} dalam 7 hari</p></div>)}</div>
          <p className="mt-4 text-xs text-slate-500">Sumber trafik referral teratas: <b className="text-slate-300">{growth.top_source || "—"}</b></p>
        </section>

        <AdminSeasonControls token={token} />
        <AdminRecoveryControls token={token} />

        <section className="mb-6 rounded-3xl border border-amber-300/15 bg-white/[.045] p-5 shadow-xl sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-3"><div><div className="flex items-center gap-2 text-amber-300"><Flag className="h-5 w-5"/><p className="text-xs font-black uppercase tracking-[.16em]">Moderasi Komunitas</p></div><h2 className="mt-2 text-2xl font-black">Laporan Peserta</h2><p className="mt-1 text-sm text-slate-400">Laporan dari profil atau Chat Global masuk ke sini untuk ditinjau manusia.</p></div><div className="flex flex-wrap gap-2">{[["open","Baru"],["reviewed","Ditinjau"],["actioned","Ditangani"],["dismissed","Diabaikan"],["all","Semua"]].map(([value,label])=><button key={value} onClick={()=>setReportFilter(value)} className={`rounded-full px-3.5 py-2 text-xs font-bold ${reportFilter===value?"bg-amber-300 text-slate-950":"border border-white/10 bg-white/5 text-slate-300"}`}>{label}</button>)}</div></div>
          <div className="mt-5 grid gap-3">{reports.length===0?<div className="rounded-2xl border border-dashed border-white/10 py-9 text-center text-sm text-slate-500">Tidak ada laporan pada filter ini.</div>:reports.map((r)=><article key={r.id} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4"><div className="flex flex-wrap items-start justify-between gap-4"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><a href={r.target_public_id?`/player/?id=${encodeURIComponent(r.target_public_id)}`:"#"} className="font-black text-white hover:text-cyan-300 hover:underline">{r.target_nickname||"Peserta"}</a><span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-black uppercase text-slate-300">{reportStatusLabel(r.status)}</span></div><p className="mt-1 text-xs text-slate-500">Dilaporkan oleh {r.reporter_nickname||"peserta"} · {r.created_at?new Date(r.created_at).toLocaleString("id-ID"):"—"}</p><p className="mt-3 text-sm font-bold text-amber-200">Alasan: {r.reason||"—"}</p>{r.details&&<p className="mt-2 whitespace-pre-wrap break-words rounded-xl border border-white/5 bg-black/20 p-3 text-xs leading-5 text-slate-300">{r.details}</p>}</div><div className="text-right text-xs text-slate-500">{[r.target_regency_name,r.target_province_name].filter(Boolean).join(" · ")}</div></div>{r.status!=="dismissed"&&r.status!=="actioned"&&<div className="mt-4 flex flex-wrap gap-2"><button disabled={busy} onClick={()=>void reviewReport(r,"reviewed")} className="rounded-xl border border-cyan-300/15 bg-cyan-300/10 px-3.5 py-2 text-xs font-bold text-cyan-100 disabled:opacity-50">Sudah Ditinjau</button><button disabled={busy} onClick={()=>void reviewReport(r,"actioned")} className="rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-black disabled:opacity-50">Tandai Ditangani</button><button disabled={busy} onClick={()=>void reviewReport(r,"dismissed")} className="rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-bold text-slate-300 disabled:opacity-50">Abaikan</button></div>}</article>)}</div>
        </section>

        <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[.16em] text-violet-300">Pembayaran</p><h2 className="mt-1 text-2xl font-black">Verifikasi Transaksi</h2></div><div className="flex flex-wrap gap-2">{[["pending","Menunggu"],["approved","Disetujui"],["rejected","Ditolak"],["all","Semua"]].map(([value,label])=><button key={value} onClick={()=>setFilter(value)} className={`rounded-full px-4 py-2 text-sm font-bold ${filter===value?"bg-white text-slate-950":"border border-white/10 bg-white/5 text-slate-300"}`}>{label}</button>)}</div></div>
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
