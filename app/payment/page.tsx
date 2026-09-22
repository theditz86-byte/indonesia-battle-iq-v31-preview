"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import { ArrowLeft, CheckCircle2, CreditCard, FileText, Loader2, Trophy, UploadCloud } from "lucide-react"
import { BATTLE_API_URL, getParticipantToken } from "@/lib/battle"

const PAYMENT_API_URL = "https://efndozplpwyemzgqfnep.supabase.co/functions/v1/battle-admin"
type ProductType = "attempt_credit" | "premium_report"

type PaymentState = {
  nickname?: string
  product_type?: ProductType
  available_credits?: number
  premium_unlocked?: boolean
  attempt_id?: string | null
  latest_payment?: {
    product_type?: ProductType
    amount?: number
    status?: "pending" | "approved" | "rejected"
    admin_note?: string | null
    created_at?: string
    reviewed_at?: string | null
  } | null
}

const products = {
  attempt_credit: {
    title:"Ranked Attempt Tambahan",
    eyebrow:"Percobaan Tambahan",
    amount:5000,
    description:"1 percobaan kompetitif tambahan setelah 2 Ranked Attempt gratis habis.",
    detail:"Hasil percobaan berbayar tetap kompetitif dan dapat memperbaiki skor terbaik serta posisi leaderboard resmi.",
    icon:Trophy,
  },
  premium_report: {
    title:"Laporan Premium Hasil Ini",
    eyebrow:"Analisis Hasil",
    amount:5000,
    description:"Buka analisis kemampuan lengkap untuk hasil tes yang Anda pilih.",
    detail:"Profil domain, kekuatan, area pengembangan, rekomendasi latihan, sertifikat hasil digital, dan PDF premium untuk satu percobaan tertentu.",
    icon:FileText,
  },
} as const

async function callPaymentApi(body: Record<string, unknown>) {
  const response = await fetch(PAYMENT_API_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data?.error || "Permintaan belum dapat diproses.")
  return data
}

async function track(event_type:string,details:Record<string,unknown>={}) {
  try {
    const token=getParticipantToken()
    if(!token) return
    await fetch(BATTLE_API_URL,{
      method:"POST",
      headers:{"Content-Type":"application/json","X-Battle-Token":token},
      body:JSON.stringify({action:"track",event_type,details}),
    })
  } catch {}
}

export default function PaymentPage() {
  const [product,setProduct]=useState<ProductType>("attempt_credit")
  const [nickname, setNickname] = useState("")
  const [payerName, setPayerName] = useState("")
  const [proof, setProof] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [checking, setChecking] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [state, setState] = useState<PaymentState | null>(null)
  const [attemptId,setAttemptId]=useState<string|null>(null)

  const config=products[product]
  const Icon=config.icon

  useEffect(() => {
    const params=new URLSearchParams(window.location.search)
    const requested=params.get("product")
    const requestedAttempt=params.get("attempt")
    const initial:ProductType=requested==="premium_report"?"premium_report":"attempt_credit"
    setProduct(initial)
    setAttemptId(requestedAttempt)
    if(initial==="premium_report") void track("premium_checkout_opened",{source:"payment_page"})
    const token = getParticipantToken()
    if (!token) return
    fetch(BATTLE_API_URL, { headers: { "X-Battle-Token": token }, cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.participant?.nickname) {
          setNickname(data.participant.nickname)
          void checkStatus(data.participant.nickname,initial,requestedAttempt)
        }
      })
      .catch(() => {})
  }, [])

  function switchProduct(next:ProductType){
    setProduct(next)
    setState(null);setError("");setMessage("")
    const suffix=next==="premium_report" && attemptId ? "&attempt="+encodeURIComponent(attemptId) : ""
    window.history.replaceState(null,"",`/payment?product=${next}`+suffix)
    if(next==="premium_report") void track("premium_checkout_opened",{source:"product_switch"})
    if(nickname) void checkStatus(nickname,next)
  }

  async function checkStatus(target = nickname, targetProduct = product, targetAttempt:string|null = attemptId) {
    if (!target.trim()) {
      setError("Isi Nama Arena terlebih dahulu.")
      return
    }
    setChecking(true)
    setError("")
    setMessage("")
    try {
      const data = await callPaymentApi({ action: "payment_status", nickname: target.trim(), product_type:targetProduct, ...(targetProduct==="premium_report" && targetAttempt ? {attempt_id:targetAttempt}:{}) })
      if (!data.state) throw new Error("Nama Arena tidak ditemukan.")
      setState(data.state)
    } catch (e) {
      setState(null)
      setError(e instanceof Error ? e.message : "Status pembayaran belum dapat dicek.")
    } finally {
      setChecking(false)
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError("")
    setMessage("")
    if (!proof) {
      setError("Pilih bukti pembayaran terlebih dahulu.")
      return
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(proof.type)) {
      setError("Bukti pembayaran harus JPG, PNG, atau WebP.")
      return
    }
    if (proof.size > 4 * 1024 * 1024) {
      setError("Ukuran bukti pembayaran maksimal 4 MB.")
      return
    }
    setBusy(true)
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result).split(",")[1] || "")
        reader.onerror = () => reject(new Error("Bukti pembayaran tidak dapat dibaca."))
        reader.readAsDataURL(proof)
      })
      const data = await callPaymentApi({
        action: "payment_submit",
        product_type:product,
        nickname: nickname.trim(),
        payer_name: payerName.trim(),
        proof_mime: proof.type,
        proof_base64: base64,
        ...(product==="premium_report" && attemptId ? {attempt_id:attemptId}:{}),
      })
      setMessage(`Bukti pembayaran ${data.payment?.product_type==="premium_report"?"Laporan Premium":"Ranked Attempt Tambahan"} untuk ${data.payment?.nickname || nickname} sudah terkirim. Admin akan memverifikasinya.`)
      setProof(null)
      const input = document.getElementById("proof") as HTMLInputElement | null
      if (input) input.value = ""
      await checkStatus(nickname,product,attemptId)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bukti pembayaran belum berhasil dikirim.")
    } finally {
      setBusy(false)
    }
  }

  const status = state?.latest_payment?.status
  const statusText = status === "approved" ? "Disetujui" : status === "rejected" ? "Ditolak" : status === "pending" ? "Menunggu verifikasi" : "Belum ada pembayaran"
  const alreadyUnlocked=product==="premium_report" && state?.premium_unlocked
  const successHref=product==="premium_report" ? (attemptId?"/result?attempt="+encodeURIComponent(attemptId):"/result") : "/battle-test"
  const successLabel=product==="premium_report"?"Buka Laporan Premium":"Mulai Ranked Attempt"

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_20%_0%,rgba(56,189,248,.16),transparent_32rem),linear-gradient(180deg,#020817,#07142f_52%,#040b1c)] px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-5xl">
        <a href={product==="premium_report"?"/result":"/battle"} className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white"><ArrowLeft className="h-4 w-4" /> Kembali</a>

        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-[.2em] text-cyan-300">{config.eyebrow}</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">{config.title}</h1>
          <p className="mt-3 max-w-3xl text-slate-300">{config.description}</p>
        </div>

        <div className="mb-6 grid gap-3 sm:grid-cols-2">
          {(["attempt_credit","premium_report"] as ProductType[]).map((key)=>{
            const p=products[key]; const PIcon=p.icon
            return <button key={key} type="button" onClick={()=>switchProduct(key)} className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition-all ${product===key?"border-indigo-400 bg-indigo-500/15":"border-white/10 bg-white/5 hover:bg-white/10"}`}><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/5"><PIcon className="h-5 w-5 text-cyan-300"/></span><span><strong className="block">{p.title}</strong><span className="mt-1 block text-sm text-slate-400">Rp{p.amount.toLocaleString("id-ID")}</span></span></button>
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
          <section className="rounded-3xl border border-white/10 bg-white/[.055] p-6 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-indigo-500/20 text-indigo-200"><Icon className="h-5 w-5" /></span><div><p className="text-sm text-slate-400">Harga</p><p className="text-3xl font-black">Rp{config.amount.toLocaleString("id-ID")}</p></div></div>
            <p className="mt-4 rounded-2xl border border-white/10 bg-slate-950/35 p-4 text-sm leading-6 text-slate-300">{config.detail}</p>
            <img src="/assets/qris-alzava.png" alt="QRIS ALZAVA GROUP" className="mx-auto mt-6 w-full max-w-[360px] rounded-3xl border-[10px] border-white bg-white shadow-2xl" />
            <div className="mt-4 text-center"><p className="font-extrabold">QRIS ALZAVA GROUP</p><p className="mt-1 text-sm text-slate-400">Bayar melalui aplikasi bank atau dompet digital yang mendukung QRIS.</p></div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/[.055] p-6 shadow-2xl backdrop-blur-xl">
            <h2 className="text-xl font-extrabold">Konfirmasi pembayaran</h2>
            <p className="mt-1 text-sm text-slate-400">Tahap awal masih menggunakan verifikasi admin. {product==="premium_report"?"Premium akan dibuka khusus untuk hasil tes yang Anda pilih.":"Kredit Ranked aktif setelah bukti disetujui."}</p>

            {alreadyUnlocked ? <div className="mt-6 rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-5"><CheckCircle2 className="h-6 w-6 text-emerald-300"/><p className="mt-3 font-black">Laporan Premium untuk hasil terbaru ini sudah aktif.</p><a href="/result" className="mt-4 inline-flex rounded-xl bg-emerald-600 px-4 py-2.5 font-black">Buka laporan</a></div> :
            <form onSubmit={submit} className="mt-6 grid gap-4">
              <label className="grid gap-2 text-sm font-semibold">Nama Arena
                <input value={nickname} onChange={(e)=>setNickname(e.target.value)} required maxLength={24} className="rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 outline-none focus:border-cyan-400/60" placeholder="Nama peserta Battle IQ" />
              </label>
              <label className="grid gap-2 text-sm font-semibold">Nama pembayar
                <input value={payerName} onChange={(e)=>setPayerName(e.target.value)} maxLength={80} className="rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 outline-none focus:border-cyan-400/60" placeholder="Opsional" />
              </label>
              <label className="grid gap-2 text-sm font-semibold">Bukti pembayaran
                <span className="rounded-2xl border border-dashed border-white/15 bg-slate-950/45 p-4">
                  <input id="proof" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e)=>setProof(e.target.files?.[0] || null)} required className="block w-full text-sm text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-3 file:py-2 file:font-bold file:text-white" />
                  <span className="mt-2 flex items-center gap-2 text-xs text-slate-500"><UploadCloud className="h-4 w-4" /> JPG/PNG/WebP, maksimal 4 MB</span>
                </span>
              </label>
              {error && <div className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div>}
              {message && <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">{message}</div>}
              <div className="flex flex-col gap-3 sm:flex-row">
                <button disabled={busy} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 font-extrabold disabled:opacity-60">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}{busy ? "Mengirim..." : `Kirim Bukti Rp${config.amount.toLocaleString("id-ID")}`}</button>
                <button type="button" onClick={()=>checkStatus()} disabled={checking} className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 font-bold text-slate-200 disabled:opacity-60">{checking ? "Mengecek..." : "Cek Status"}</button>
              </div>
            </form>}

            {state && !alreadyUnlocked && <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs uppercase tracking-wider text-slate-500">Status terakhir</p><p className="font-extrabold">{statusText}</p></div>{product==="attempt_credit"?<div className="text-right"><p className="text-xs text-slate-500">Kredit Ranked tersedia</p><p className="text-2xl font-black text-cyan-300">{Number(state.available_credits || 0)}</p></div>:<div className="text-right"><p className="text-xs text-slate-500">Laporan Premium</p><p className="font-black text-cyan-300">{state.premium_unlocked?"Aktif untuk hasil ini":"Belum dibuka"}</p></div>}</div>
              {state.latest_payment?.admin_note && <p className="mt-3 text-sm text-slate-300">Catatan admin: {state.latest_payment.admin_note}</p>}
              {(status === "approved" || state.premium_unlocked) && <a href={successHref} className="mt-4 inline-flex rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-extrabold">{successLabel}</a>}
            </div>}
          </section>
        </div>
      </div>
    </main>
  )
}
