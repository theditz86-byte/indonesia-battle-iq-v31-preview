"use client"

import { FormEvent, useEffect, useState } from "react"
import { ArrowLeft, CheckCircle2, CreditCard, FileText, Loader2, ShieldCheck, Trophy, UploadCloud } from "lucide-react"
import { getParticipantToken } from "@/lib/battle"

const PAYMENT_API_URL = "https://efndozplpwyemzgqfnep.supabase.co/functions/v1/battle-payment"
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
    title: "Rematch / Practice Credit",
    eyebrow: "Rematch & Practice",
    amount: 5000,
    description: "1 kredit Rematch / Practice setelah Tes Resmi gratis season ini digunakan.",
    detail: "Rematch tetap menghasilkan Battle Point, analisis, dan riwayat tes pribadi, tetapi tidak mengubah skor resmi leaderboard season.",
    icon: Trophy,
  },
  premium_report: {
    title: "Laporan Premium Hasil Ini",
    eyebrow: "Analisis Hasil",
    amount: 5000,
    description: "Buka analisis kemampuan lengkap untuk hasil tes yang Anda pilih.",
    detail: "Profil kemampuan, kekuatan relatif, area pengembangan, rekomendasi latihan, sertifikat hasil digital, dan PDF premium untuk satu hasil tes.",
    icon: FileText,
  },
} as const

async function callPaymentApi(body: Record<string, unknown>) {
  const token = getParticipantToken()
  if (!token) throw new Error("Silakan masuk sebagai peserta terlebih dahulu.")
  const response = await fetch(PAYMENT_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Battle-Token": token },
    body: JSON.stringify(body),
    cache: "no-store",
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data?.error || "Permintaan pembayaran belum dapat diproses.")
  return data
}

export default function PaymentPage() {
  const [product, setProduct] = useState<ProductType>("attempt_credit")
  const [attemptId, setAttemptId] = useState<string | null>(null)
  const [payerName, setPayerName] = useState("")
  const [proof, setProof] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [checking, setChecking] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [state, setState] = useState<PaymentState | null>(null)

  const config = products[product]
  const Icon = config.icon

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const initial: ProductType = params.get("product") === "premium_report" ? "premium_report" : "attempt_credit"
    const requestedAttempt = params.get("attempt")
    setProduct(initial)
    setAttemptId(requestedAttempt)
    if (!getParticipantToken()) {
      setError("Silakan masuk sebagai peserta terlebih dahulu. Pembayaran sekarang terikat langsung ke akun yang sedang login.")
      return
    }
    void checkStatus(initial, requestedAttempt)
  }, [])

  async function checkStatus(targetProduct = product, targetAttempt = attemptId) {
    setChecking(true)
    setError("")
    setMessage("")
    try {
      const data = await callPaymentApi({
        action: "status",
        product_type: targetProduct,
        ...(targetProduct === "premium_report" && targetAttempt ? { attempt_id: targetAttempt } : {}),
      })
      setState(data.state || null)
    } catch (e) {
      setState(null)
      setError(e instanceof Error ? e.message : "Status pembayaran belum dapat dicek.")
    } finally {
      setChecking(false)
    }
  }

  function switchProduct(next: ProductType) {
    setProduct(next)
    setState(null)
    setError("")
    setMessage("")
    const suffix = next === "premium_report" && attemptId ? `&attempt=${encodeURIComponent(attemptId)}` : ""
    window.history.replaceState(null, "", `/payment?product=${next}${suffix}`)
    if (getParticipantToken()) void checkStatus(next, attemptId)
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError("")
    setMessage("")
    if (!getParticipantToken()) {
      setError("Silakan masuk sebagai peserta terlebih dahulu.")
      return
    }
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
      const proofBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result).split(",")[1] || "")
        reader.onerror = () => reject(new Error("Bukti pembayaran tidak dapat dibaca."))
        reader.readAsDataURL(proof)
      })

      const data = await callPaymentApi({
        action: "submit",
        product_type: product,
        payer_name: payerName.trim(),
        proof_mime: proof.type,
        proof_base64: proofBase64,
        ...(product === "premium_report" && attemptId ? { attempt_id: attemptId } : {}),
      })

      setMessage(`Bukti pembayaran untuk ${data.payment?.nickname || state?.nickname || "akun Anda"} sudah terkirim. Admin akan memverifikasinya.`)
      setProof(null)
      const input = document.getElementById("proof") as HTMLInputElement | null
      if (input) input.value = ""
      await checkStatus(product, attemptId)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bukti pembayaran belum berhasil dikirim.")
    } finally {
      setBusy(false)
    }
  }

  const status = state?.latest_payment?.status
  const statusText = status === "approved" ? "Disetujui" : status === "rejected" ? "Ditolak" : status === "pending" ? "Menunggu verifikasi" : "Belum ada pembayaran"
  const alreadyUnlocked = product === "premium_report" && state?.premium_unlocked
  const successHref = product === "premium_report" ? (attemptId ? `/result?attempt=${encodeURIComponent(attemptId)}` : "/result") : "/battle-test"
  const successLabel = product === "premium_report" ? "Buka Laporan Premium" : "Mulai Rematch"

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_20%_0%,rgba(56,189,248,.16),transparent_32rem),linear-gradient(180deg,#020817,#07142f_52%,#040b1c)] px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-5xl">
        <a href={product === "premium_report" ? "/result" : "/battle"} className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white"><ArrowLeft className="h-4 w-4" /> Kembali</a>

        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-[.2em] text-cyan-300">{config.eyebrow}</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">{config.title}</h1>
          <p className="mt-3 max-w-3xl text-slate-300">{config.description}</p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-xs font-bold text-emerald-200"><ShieldCheck className="h-4 w-4" /> Pembayaran otomatis terikat ke akun yang sedang login{state?.nickname ? `: ${state.nickname}` : ""}</div>
        </div>

        <div className="mb-6 grid gap-3 sm:grid-cols-2">
          {(["attempt_credit", "premium_report"] as ProductType[]).map((key) => {
            const item = products[key]
            const ProductIcon = item.icon
            return <button key={key} type="button" onClick={() => switchProduct(key)} className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition-all ${product === key ? "border-indigo-400 bg-indigo-500/15" : "border-white/10 bg-white/5 hover:bg-white/10"}`}><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/5"><ProductIcon className="h-5 w-5 text-cyan-300" /></span><span><strong className="block">{item.title}</strong><span className="mt-1 block text-sm text-slate-400">Rp{item.amount.toLocaleString("id-ID")}</span></span></button>
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
            <p className="mt-1 text-sm text-slate-400">Tidak perlu mengetik Nama Panggilan. Sistem menggunakan identitas akun yang sedang login untuk mencegah kredit masuk ke akun yang salah.</p>

            {alreadyUnlocked ? (
              <div className="mt-6 rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-5"><CheckCircle2 className="h-6 w-6 text-emerald-300" /><p className="mt-3 font-black">Laporan Premium untuk hasil ini sudah aktif.</p><a href={successHref} className="mt-4 inline-flex rounded-xl bg-emerald-600 px-4 py-2.5 font-black">{successLabel}</a></div>
            ) : (
              <form onSubmit={submit} className="mt-6 grid gap-4">
                <label className="grid gap-2 text-sm font-semibold">Nama pembayar <span className="font-normal text-slate-500">opsional, hanya untuk membantu verifikasi</span><input value={payerName} onChange={(e) => setPayerName(e.target.value)} maxLength={80} className="rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 outline-none focus:border-cyan-400/60" placeholder="Nama pada rekening/dompet digital" /></label>
                <label className="grid gap-2 text-sm font-semibold">Bukti pembayaran<span className="rounded-2xl border border-dashed border-white/15 bg-slate-950/45 p-4"><input id="proof" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setProof(e.target.files?.[0] || null)} required className="block w-full text-sm text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-3 file:py-2 file:font-bold file:text-white" /><span className="mt-2 flex items-center gap-2 text-xs text-slate-500"><UploadCloud className="h-4 w-4" /> JPG/PNG/WebP, maksimal 4 MB</span></span></label>
                {error && <div className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div>}
                {message && <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">{message}</div>}
                {!getParticipantToken() && <a href="/account" className="rounded-xl bg-white px-5 py-3 text-center font-black text-slate-950">Masuk / Daftar Peserta</a>}
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button disabled={busy || !getParticipantToken()} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 font-extrabold disabled:opacity-50">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}{busy ? "Mengirim..." : `Kirim Bukti Rp${config.amount.toLocaleString("id-ID")}`}</button>
                  <button type="button" onClick={() => void checkStatus()} disabled={checking || !getParticipantToken()} className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 font-bold text-slate-200 disabled:opacity-50">{checking ? "Mengecek..." : "Cek Status"}</button>
                </div>
              </form>
            )}

            {state && !alreadyUnlocked && <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/50 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs uppercase tracking-wider text-slate-500">Status terakhir</p><p className="font-extrabold">{statusText}</p></div>{product === "attempt_credit" ? <div className="text-right"><p className="text-xs text-slate-500">Kredit Rematch tersedia</p><p className="text-2xl font-black text-cyan-300">{Number(state.available_credits || 0)}</p></div> : <div className="text-right"><p className="text-xs text-slate-500">Laporan Premium</p><p className="font-black text-cyan-300">{state.premium_unlocked ? "Aktif" : "Belum aktif"}</p></div>}</div>{state.latest_payment?.admin_note && <p className="mt-3 rounded-xl bg-white/5 px-3 py-2 text-sm text-slate-300">Catatan admin: {state.latest_payment.admin_note}</p>}{status === "approved" && <a href={successHref} className="mt-4 inline-flex rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-black">{successLabel}</a>}</div>}
          </section>
        </div>
      </div>
    </main>
  )
}
