"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import { PARTICIPANT_TOKEN_KEY } from "@/lib/battle"

const ACCOUNT_API = "https://efndozplpwyemzgqfnep.supabase.co/functions/v1/battle-account"

type Participant = {
  public_id?: string
  username?: string | null
  account_ready?: boolean
  nickname?: string
  avatar_url?: string | null
  province_code?: string
  province_name?: string
  regency_name?: string
  district_name?: string
  attempts_used?: number
  free_attempts_remaining?: number
  paid_credits?: number
  attempts_remaining?: number
  active_attempt_id?: string | null
}

const provinces = [
  ["11","Aceh"],["12","Sumatera Utara"],["13","Sumatera Barat"],["14","Riau"],["15","Jambi"],["16","Sumatera Selatan"],
  ["17","Bengkulu"],["18","Lampung"],["19","Kepulauan Bangka Belitung"],["21","Kepulauan Riau"],["31","DKI Jakarta"],
  ["32","Jawa Barat"],["33","Jawa Tengah"],["34","DI Yogyakarta"],["35","Jawa Timur"],["36","Banten"],["51","Bali"],
  ["52","Nusa Tenggara Barat"],["53","Nusa Tenggara Timur"],["61","Kalimantan Barat"],["62","Kalimantan Tengah"],
  ["63","Kalimantan Selatan"],["64","Kalimantan Timur"],["65","Kalimantan Utara"],["71","Sulawesi Utara"],
  ["72","Sulawesi Tengah"],["73","Sulawesi Selatan"],["74","Sulawesi Tenggara"],["75","Gorontalo"],["76","Sulawesi Barat"],
  ["81","Maluku"],["82","Maluku Utara"],["91","Papua Barat"],["92","Papua Barat Daya"],["94","Papua"],
  ["95","Papua Selatan"],["96","Papua Tengah"],["97","Papua Pegunungan"],
] as const

async function api(action: string, body: Record<string, unknown> = {}, token = "") {
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (token) headers["X-Battle-Token"] = token
  const response = await fetch(ACCOUNT_API, {
    method: "POST",
    headers,
    body: JSON.stringify({ action, ...body }),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data?.error || "Layanan akun belum dapat memproses permintaan.")
  return data
}

function messageText(error: unknown) {
  return error instanceof Error ? error.message : "Terjadi kesalahan. Silakan coba lagi."
}

export default function AccountPage() {
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [tab, setTab] = useState<"login" | "register">("login")
  const [token, setToken] = useState("")
  const [participant, setParticipant] = useState<Participant | null>(null)
  const [notice, setNotice] = useState("")
  const [error, setError] = useState("")

  const [loginUsername, setLoginUsername] = useState("")
  const [loginPassword, setLoginPassword] = useState("")

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [nickname, setNickname] = useState("")
  const [provinceCode, setProvinceCode] = useState("35")
  const [regencyName, setRegencyName] = useState("Sumenep")
  const [districtName, setDistrictName] = useState("")

  const [editNickname, setEditNickname] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [claimUsername, setClaimUsername] = useState("")
  const [claimPassword, setClaimPassword] = useState("")

  const used = Math.max(0, Number(participant?.attempts_used) || 0)
  const freeRemaining = Math.max(0, Number(participant?.free_attempts_remaining ?? 2 - used) || 0)
  const paidCredits = Math.max(0, Number(participant?.paid_credits) || 0)
  const totalRemaining = Math.max(0, Number(participant?.attempts_remaining ?? freeRemaining + paidCredits) || 0)

  const action = useMemo(() => {
    if (participant?.active_attempt_id) return { href: "/battle-test", label: "Lanjutkan tes yang aktif" }
    if (freeRemaining > 0) return { href: "/battle-test", label: `Mulai tes · sisa gratis ${freeRemaining}x` }
    if (paidCredits > 0) return { href: "/battle-test", label: `Mulai Practice · kredit ${paidCredits}x` }
    return { href: "/payment?product=attempt_credit", label: "Buka Practice · Rp5.000" }
  }, [participant?.active_attempt_id, freeRemaining, paidCredits])

  async function loadMe(rawToken: string) {
    try {
      const data = await api("me", {}, rawToken)
      setParticipant(data.participant || null)
      setEditNickname(data.participant?.nickname || "")
    } catch {
      localStorage.removeItem(PARTICIPANT_TOKEN_KEY)
      setToken("")
      setParticipant(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const saved = localStorage.getItem(PARTICIPANT_TOKEN_KEY) || ""
    if (!saved) {
      setLoading(false)
      return
    }
    setToken(saved)
    void loadMe(saved)
  }, [])

  function clearMessages() {
    setNotice("")
    setError("")
  }

  async function handleLogin(event: FormEvent) {
    event.preventDefault()
    clearMessages()
    setBusy(true)
    try {
      const data = await api("login", { username: loginUsername, password: loginPassword })
      localStorage.setItem(PARTICIPANT_TOKEN_KEY, data.token)
      setToken(data.token)
      setParticipant(data.participant || null)
      setEditNickname(data.participant?.nickname || "")
      setNotice("Berhasil masuk. Akun Battle IQ Anda sudah aktif.")
    } catch (e) {
      setError(messageText(e))
    } finally {
      setBusy(false)
    }
  }

  async function handleRegister(event: FormEvent) {
    event.preventDefault()
    clearMessages()
    setBusy(true)
    try {
      const data = await api("register", {
        username,
        password,
        nickname,
        province_code: provinceCode,
        regency_name: regencyName,
        district_name: districtName,
      })
      localStorage.setItem(PARTICIPANT_TOKEN_KEY, data.token)
      setToken(data.token)
      setParticipant(data.participant || null)
      setEditNickname(data.participant?.nickname || "")
      setNotice("Pendaftaran berhasil. Anda mendapat kuota 2x percobaan gratis pada season ini.")
    } catch (e) {
      setError(messageText(e))
    } finally {
      setBusy(false)
    }
  }

  async function updateNickname(event: FormEvent) {
    event.preventDefault()
    clearMessages()
    setBusy(true)
    try {
      const data = await api("update_profile", { nickname: editNickname }, token)
      setParticipant(data.participant || participant)
      setNotice("Nama Arena berhasil diperbarui.")
    } catch (e) {
      setError(messageText(e))
    } finally {
      setBusy(false)
    }
  }

  async function changePassword(event: FormEvent) {
    event.preventDefault()
    clearMessages()
    setBusy(true)
    try {
      await api("change_password", { current_password: currentPassword, new_password: newPassword }, token)
      setCurrentPassword("")
      setNewPassword("")
      setNotice("Password berhasil diganti.")
    } catch (e) {
      setError(messageText(e))
    } finally {
      setBusy(false)
    }
  }

  async function claimAccount(event: FormEvent) {
    event.preventDefault()
    clearMessages()
    setBusy(true)
    try {
      const data = await api("claim", { username: claimUsername, password: claimPassword }, token)
      setParticipant(data.participant || participant)
      setNotice("Akun lama berhasil diamankan dengan username dan password.")
    } catch (e) {
      setError(messageText(e))
    } finally {
      setBusy(false)
    }
  }

  async function uploadAvatar(file?: File) {
    if (!file) return
    clearMessages()
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Foto harus JPG, PNG, atau WebP.")
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Ukuran foto maksimal 2 MB.")
      return
    }
    setBusy(true)
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result || "").split(",")[1] || "")
        reader.onerror = () => reject(new Error("Foto tidak dapat dibaca."))
        reader.readAsDataURL(file)
      })
      const data = await api("upload_avatar", { mime: file.type, base64 }, token)
      setParticipant((prev) => prev ? { ...prev, avatar_url: data.avatar_url } : prev)
      setNotice("Foto profil berhasil diperbarui.")
    } catch (e) {
      setError(messageText(e))
    } finally {
      setBusy(false)
    }
  }

  function logout() {
    localStorage.removeItem(PARTICIPANT_TOKEN_KEY)
    setToken("")
    setParticipant(null)
    setNotice("")
    setError("")
    setTab("login")
  }

  if (loading) {
    return <main className="min-h-screen bg-[#020817] text-white grid place-items-center"><p className="text-slate-300">Memuat akun peserta…</p></main>
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_15%_0%,rgba(55,115,255,.20),transparent_34rem),radial-gradient(circle_at_90%_15%,rgba(42,210,255,.10),transparent_28rem),linear-gradient(180deg,#020817_0%,#07142f_46%,#050d20_100%)] text-white">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#030b1f]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <a href="/battle" className="flex items-center gap-3 font-black tracking-tight">
            <img src="/alzava-emblem-v2.png" alt="" className="h-10 w-10 rounded-xl" />
            <span>ALZAVA <span className="text-cyan-300">Battle IQ</span></span>
          </a>
          <a href="/battle" className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-bold text-slate-200 hover:bg-white/10">← Kembali ke Battle</a>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-5 py-10 sm:py-14">
        <div className="mb-7">
          <p className="text-xs font-black uppercase tracking-[.18em] text-cyan-300">AKUN PESERTA</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-6xl">Identitas Battle Anda</h1>
          <p className="mt-4 max-w-3xl leading-7 text-slate-300">Kelola akun, Nama Arena, foto profil, dan kuota percobaan. Setiap peserta mendapat <strong className="text-white">2x percobaan gratis per season</strong>. Setelah itu, Practice Attempt tambahan Rp5.000 dan tidak mengubah leaderboard resmi.</p>
        </div>

        {notice && <div className="mb-5 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">{notice}</div>}
        {error && <div className="mb-5 rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{error}</div>}

        {!participant ? (
          <div className="mx-auto max-w-2xl overflow-hidden rounded-3xl border border-white/15 bg-[#0a1a37]/90 shadow-2xl">
            <div className="grid grid-cols-2 border-b border-white/10 p-2">
              <button onClick={() => { setTab("login"); clearMessages() }} className={`rounded-2xl px-4 py-3 text-sm font-black ${tab === "login" ? "bg-indigo-600 text-white" : "text-slate-300 hover:bg-white/5"}`}>Masuk</button>
              <button onClick={() => { setTab("register"); clearMessages() }} className={`rounded-2xl px-4 py-3 text-sm font-black ${tab === "register" ? "bg-indigo-600 text-white" : "text-slate-300 hover:bg-white/5"}`}>Daftar</button>
            </div>

            {tab === "login" ? (
              <form onSubmit={handleLogin} className="grid gap-5 p-6 sm:p-8">
                <div>
                  <h2 className="text-2xl font-black">Masuk ke arena</h2>
                  <p className="mt-1 text-sm text-slate-400">Gunakan username dan password akun Battle IQ Anda.</p>
                </div>
                <label className="grid gap-2 text-sm font-bold">Username
                  <input value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)} required autoComplete="username" className="rounded-xl border border-white/15 bg-[#06142d] px-4 py-3 font-normal outline-none focus:border-cyan-400" />
                </label>
                <label className="grid gap-2 text-sm font-bold">Password
                  <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required autoComplete="current-password" className="rounded-xl border border-white/15 bg-[#06142d] px-4 py-3 font-normal outline-none focus:border-cyan-400" />
                </label>
                <button disabled={busy} className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 font-black disabled:opacity-60">{busy ? "Memproses…" : "Masuk"}</button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="grid gap-5 p-6 sm:p-8">
                <div>
                  <h2 className="text-2xl font-black">Buat akun peserta</h2>
                  <p className="mt-1 text-sm text-slate-400">Pendaftaran baru langsung mendapat <strong className="text-cyan-200">2x percobaan gratis</strong> untuk season aktif.</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm font-bold">Username
                    <input value={username} onChange={(e) => setUsername(e.target.value)} required minLength={3} maxLength={24} autoComplete="username" className="rounded-xl border border-white/15 bg-[#06142d] px-4 py-3 font-normal outline-none focus:border-cyan-400" />
                  </label>
                  <label className="grid gap-2 text-sm font-bold">Password
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete="new-password" className="rounded-xl border border-white/15 bg-[#06142d] px-4 py-3 font-normal outline-none focus:border-cyan-400" />
                  </label>
                </div>
                <label className="grid gap-2 text-sm font-bold">Nama Arena
                  <input value={nickname} onChange={(e) => setNickname(e.target.value)} required minLength={3} maxLength={24} className="rounded-xl border border-white/15 bg-[#06142d] px-4 py-3 font-normal outline-none focus:border-cyan-400" />
                </label>
                <label className="grid gap-2 text-sm font-bold">Provinsi
                  <select value={provinceCode} onChange={(e) => setProvinceCode(e.target.value)} className="rounded-xl border border-white/15 bg-[#06142d] px-4 py-3 font-normal outline-none focus:border-cyan-400">
                    {provinces.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
                  </select>
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm font-bold">Kabupaten/Kota
                    <input value={regencyName} onChange={(e) => setRegencyName(e.target.value)} required className="rounded-xl border border-white/15 bg-[#06142d] px-4 py-3 font-normal outline-none focus:border-cyan-400" />
                  </label>
                  <label className="grid gap-2 text-sm font-bold">Kecamatan
                    <input value={districtName} onChange={(e) => setDistrictName(e.target.value)} required className="rounded-xl border border-white/15 bg-[#06142d] px-4 py-3 font-normal outline-none focus:border-cyan-400" />
                  </label>
                </div>
                <button disabled={busy} className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 font-black disabled:opacity-60">{busy ? "Mendaftarkan…" : "Daftar & Masuk"}</button>
              </form>
            )}
          </div>
        ) : (
          <div className="grid gap-5">
            <section className="rounded-3xl border border-white/15 bg-[#0a1a37]/90 p-6 shadow-2xl sm:p-8">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  {participant.avatar_url ? (
                    <img src={participant.avatar_url} alt="" className="h-20 w-20 rounded-2xl object-cover ring-2 ring-cyan-400/50" />
                  ) : (
                    <div className="grid h-20 w-20 place-items-center rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-700 text-2xl font-black">{(participant.nickname || "IQ").slice(0,2).toUpperCase()}</div>
                  )}
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-cyan-300">Peserta aktif</p>
                    <h2 className="mt-1 text-2xl font-black">{participant.nickname || "Peserta"}</h2>
                    <p className="mt-1 text-sm text-slate-400">{participant.district_name}{participant.district_name ? " · " : ""}{participant.regency_name}{participant.regency_name ? " · " : ""}{participant.province_name}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a href={action.href} className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 text-sm font-black">{action.label}</a>
                  <button onClick={logout} className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-bold text-slate-200 hover:bg-white/10">Keluar</button>
                </div>
              </div>

              <div className="mt-7 grid gap-3 sm:grid-cols-4">
                <div className="rounded-2xl border border-cyan-300/25 bg-cyan-300/10 p-4"><span className="text-xs text-cyan-100">Kuota gratis / season</span><strong className="mt-1 block text-3xl font-black">2x</strong></div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><span className="text-xs text-slate-400">Gratis digunakan</span><strong className="mt-1 block text-3xl font-black">{Math.min(2, used)}/2</strong></div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><span className="text-xs text-slate-400">Sisa gratis</span><strong className="mt-1 block text-3xl font-black">{freeRemaining}x</strong></div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><span className="text-xs text-slate-400">Practice kredit</span><strong className="mt-1 block text-3xl font-black">{paidCredits}x</strong></div>
              </div>
              <p className="mt-4 text-sm text-slate-400">Total percobaan yang masih dapat dipakai sekarang: <strong className="text-white">{totalRemaining}x</strong>. Setelah 2x Ranked Attempt gratis habis, setiap Rp5.000 yang disetujui admin membuka 1 Practice Attempt yang tidak mengubah leaderboard.</p>
            </section>

            {!participant.account_ready && (
              <section className="rounded-3xl border border-amber-300/25 bg-amber-300/10 p-6">
                <h3 className="text-xl font-black">Amankan akun lama</h3>
                <p className="mt-1 text-sm text-amber-100/80">Perangkat ini memiliki identitas peserta lama yang belum mempunyai login. Buat username dan password agar akun bisa dipakai di perangkat lain.</p>
                <form onSubmit={claimAccount} className="mt-5 grid gap-4 sm:grid-cols-2">
                  <input value={claimUsername} onChange={(e) => setClaimUsername(e.target.value)} required minLength={3} maxLength={24} placeholder="Username baru" className="rounded-xl border border-white/15 bg-[#06142d] px-4 py-3 outline-none" />
                  <input type="password" value={claimPassword} onChange={(e) => setClaimPassword(e.target.value)} required minLength={8} placeholder="Password minimal 8 karakter" className="rounded-xl border border-white/15 bg-[#06142d] px-4 py-3 outline-none" />
                  <button disabled={busy} className="rounded-xl bg-amber-300 px-5 py-3 font-black text-slate-950 sm:col-span-2 disabled:opacity-60">Aktifkan Login Akun</button>
                </form>
              </section>
            )}

            <div className="grid gap-5 lg:grid-cols-2">
              <section className="rounded-3xl border border-white/15 bg-[#0a1a37]/90 p-6">
                <h3 className="text-xl font-black">Profil Arena</h3>
                <form onSubmit={updateNickname} className="mt-5 grid gap-4">
                  <label className="grid gap-2 text-sm font-bold">Nama Arena
                    <input value={editNickname} onChange={(e) => setEditNickname(e.target.value)} required minLength={3} maxLength={24} className="rounded-xl border border-white/15 bg-[#06142d] px-4 py-3 font-normal outline-none focus:border-cyan-400" />
                  </label>
                  <label className="grid gap-2 text-sm font-bold">Foto profil <span className="font-normal text-slate-500">JPG/PNG/WebP, maks. 2 MB</span>
                    <input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={(e) => void uploadAvatar(e.target.files?.[0])} className="rounded-xl border border-white/15 bg-[#06142d] px-4 py-3 text-sm font-normal" />
                  </label>
                  <button disabled={busy} className="rounded-xl bg-indigo-600 px-5 py-3 font-black disabled:opacity-60">Simpan Profil</button>
                </form>
              </section>

              {participant.account_ready !== false && (
                <section className="rounded-3xl border border-white/15 bg-[#0a1a37]/90 p-6">
                  <h3 className="text-xl font-black">Keamanan Akun</h3>
                  <p className="mt-1 text-sm text-slate-400">Ganti password tanpa mengubah skor, peringkat, atau kuota percobaan.</p>
                  <form onSubmit={changePassword} className="mt-5 grid gap-4">
                    <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required placeholder="Password saat ini" className="rounded-xl border border-white/15 bg-[#06142d] px-4 py-3 outline-none" />
                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} placeholder="Password baru minimal 8 karakter" className="rounded-xl border border-white/15 bg-[#06142d] px-4 py-3 outline-none" />
                    <button disabled={busy} className="rounded-xl border border-white/15 bg-white/10 px-5 py-3 font-black hover:bg-white/15 disabled:opacity-60">Ganti Password</button>
                  </form>
                </section>
              )}
            </div>
          </div>
        )}
      </section>
    </main>
  )
}
