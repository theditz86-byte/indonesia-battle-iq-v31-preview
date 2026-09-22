"use client"

import { FormEvent, useEffect, useState } from "react"
import { ArrowLeft, CheckCircle2, CreditCard, Loader2, UploadCloud } from "lucide-react"
import { BATTLE_API_URL, getParticipantToken } from "@/lib/battle"

const PAYMENT_API_URL = "https://efndozplpwyemzgqfnep.supabase.co/functions/v1/battle-admin"

type PaymentState = {
  nickname?: string
  available_credits?: number
  latest_payment?: {
    status?: "pending" | "approved" | "rejected"
    admin_note?: string | null
    created_at?: string
    reviewed_at?: string | null
  } | null
}

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

export default function PaymentPage() {
  const [nickname, setNickname] = useState("")
  const [payerName, setPayerName] = useState("")
  const [proof, setProof] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [checking, setChecking] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [state, setState] = useState<PaymentState | null>(null)

  useEffect(() => {
    const token = getParticipantToken()
    if (!token) return
    fetch(BATTLE_API_URL, { headers: { "X-Battle-Token": token }, cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.participant?.nickname) setNickname(data.participant.nickname)
      })
      .catch(() => {})
  }, [])

  async function checkStatus(target = nickname) {
    if (!target.trim()) {
      setError("Isi Nama Arena terlebih dahulu.")
      return
    }
    setChecking(true)
    setError("")
    setMessage("")
    try {
      const data = await callPaymentApi({ action: "payment_status", nickname: target.trim() })
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
        nickname: nickname.trim(),
        payer_name: payerName.trim(),
        proof_mime: proof.type,
        proof_base64: base64,
      })
      setMessage(`Bukti pembayaran untuk ${data.payment?.nickname || nickname} sudah terkirim. Admin akan memverifikasi pembayaran sebelum 1 kredit percobaan dibuka.`)
      setProof(null)
      const input = document.getElementById("proof") as HTMLInputElement | null
      if (input) input.value = ""
      await checkStatus(nickname)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bukti pembayaran belum berhasil dikirim.")
    } finally {
      setBusy(false)
    }
  }

  const status = state?.latest_payment?.status
  const statusText = status === "approved" ? "Disetujui" : status === "rejected" ? "Ditolak" : status === "pending" ? "Menunggu verifikasi" : "Belum ada pembayaran"

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_20%_0%,rgba(56,189,248,.16),transparent_32rem),linear-gradient(180deg,#020817,#07142f_52%,#040b1c)] px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-5xl">
        <a href="/battle" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white"><ArrowLeft className="h-4 w-4" /> Kembali ke Battle</a>

        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-[.2em] text-cyan-300">Percobaan Tambahan</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">Buka 1 kredit Battle IQ</h1>
          <p className="mt-3 max-w-3xl text-slate-300">Setiap season mendapat <b className="text-white">2 percobaan gratis</b>. Setelah keduanya terpakai, percobaan tambahan dapat dibuka Rp5.000 per kredit.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
          <section className="rounded-3xl border border-white/10 bg-white/[.055] p-6 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-indigo-500/20 text-indigo-200"><CreditCard className="h-5 w-5" /></span><div><p className="text-sm text-slate-400">Harga per kredit</p><p className="text-3xl font-black">Rp5.000</p></div></div>
            <img src="/assets/qris-alzava.jpg" alt="QRIS ALZAVA GROUP" className="mx-auto mt-6 w-full max-w-[360px] rounded-3xl border-[10px] border-white bg-white shadow-2xl" />
            <div className="mt-4 text-center"><p className="font-extrabold">QRIS ALZAVA GROUP</p><p className="mt-1 text-sm text-slate-400">Bayar melalui aplikasi bank atau dompet digital yang mendukung QRIS.</p></div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/[.055] p-6 shadow-2xl backdrop-blur-xl">
            <h2 className="text-xl font-extrabold">Konfirmasi pembayaran</h2>
            <p className="mt-1 text-sm text-slate-400">Kredit baru aktif setelah bukti disetujui admin.</p>
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
                <button disabled={busy} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 font-extrabold disabled:opacity-60">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}{busy ? "Mengirim..." : "Kirim untuk Diverifikasi"}</button>
                <button type="button" onClick={()=>checkStatus()} disabled={checking} className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 font-bold text-slate-200 disabled:opacity-60">{checking ? "Mengecek..." : "Cek Status"}</button>
              </div>
            </form>

            {state && <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs uppercase tracking-wider text-slate-500">Status terakhir</p><p className="font-extrabold">{statusText}</p></div><div className="text-right"><p className="text-xs text-slate-500">Kredit tersedia</p><p className="text-2xl font-black text-cyan-300">{Number(state.available_credits || 0)}</p></div></div>
              {state.latest_payment?.admin_note && <p className="mt-3 text-sm text-slate-300">Catatan admin: {state.latest_payment.admin_note}</p>}
              {status === "approved" && <a href="/battle-test" className="mt-4 inline-flex rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-extrabold">Mulai percobaan berbayar</a>}
            </div>}
          </section>
        </div>
      </div>
    </main>
  )
}
