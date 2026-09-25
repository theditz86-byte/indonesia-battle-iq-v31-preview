"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import { PARTICIPANT_TOKEN_KEY } from "@/lib/battle"

const ACCOUNT_API = "https://efndozplpwyemzgqfnep.supabase.co/functions/v1/battle-account"
const RECOVERY_API = "https://efndozplpwyemzgqfnep.supabase.co/functions/v1/battle-recovery"

type Participant = {
  public_id?: string
  username?: string | null
  email?: string | null
  email_configured?: boolean
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

type RegionOption = { code: string; name: string }

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

async function recoveryApi(body: Record<string, unknown>, token = "") {
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (token) headers["X-Battle-Token"] = token
  const response = await fetch(RECOVERY_API, { method: "POST", headers, body: JSON.stringify(body) })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data?.error || "Layanan pemulihan akun belum tersedia.")
  return data
}

async function api(action: string, body: Record<string, unknown> = {}, token = "") {
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (token) headers["X-Battle-Token"] = token
  const response = await fetch(ACCOUNT_API, { method: "POST", headers, body: JSON.stringify({ action, ...body }) })
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
  const [email, setEmail] = useState("")
  const [nickname, setNickname] = useState("")
  const [provinceCode, setProvinceCode] = useState("35")
  const [regencyCode, setRegencyCode] = useState("")
  const [districtCode, setDistrictCode] = useState("")
  const [regencies, setRegencies] = useState<RegionOption[]>([])
  const [districts, setDistricts] = useState<RegionOption[]>([])
  const [regionsLoading, setRegionsLoading] = useState(false)
  const [regionError, setRegionError] = useState("")

  const [editNickname, setEditNickname] = useState("")
  const [recoveryEmail, setRecoveryEmail] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [claimUsername, setClaimUsername] = useState("")
  const [claimPassword, setClaimPassword] = useState("")

  const used = Math.max(0, Number(participant?.attempts_used) || 0)
  const freeRemaining = Math.max(0, Number(participant?.free_attempts_remaining ?? 1 - used) || 0)
  const paidCredits = Math.max(0, Number(participant?.paid_credits) || 0)
  const totalRemaining = Math.max(0, Number(participant?.attempts_remaining ?? freeRemaining + paidCredits) || 0)

  const action = useMemo(() => {
    if (participant?.active_attempt_id) return { href: "/battle-test", label: "Lanjutkan tes yang aktif" }
    if (freeRemaining > 0) return { href: "/battle-test", label: `Mulai tes · sisa gratis ${freeRemaining}x` }
    if (paidCredits > 0) return { href: "/battle-test", label: `Mulai Rematch · kredit ${paidCredits}x` }
    return { href: "/payment?product=attempt_credit", label: "Buka Rematch · Rp5.000" }
  }, [participant?.active_attempt_id, freeRemaining, paidCredits])

  async function loadMe(rawToken: string) {
    try {
      const data = await api("me", {}, rawToken)
      setParticipant(data.participant || null)
      setEditNickname(data.participant?.nickname || "")
      setRecoveryEmail(data.participant?.email || "")
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
    if (!saved) { setLoading(false); return }
    setToken(saved)
    void loadMe(saved)
  }, [])

  useEffect(() => {
    let cancelled = false
    setRegencyCode("")
    setDistrictCode("")
    setDistricts([])
    setRegionError("")
    setRegionsLoading(true)
    void api("regions", { level: "regencies", province_code: provinceCode })
      .then((data) => { if (!cancelled) setRegencies(Array.isArray(data?.data) ? data.data : []) })
      .catch((e) => { if (!cancelled) { setRegencies([]); setRegionError(messageText(e)) } })
      .finally(() => { if (!cancelled) setRegionsLoading(false) })
    return () => { cancelled = true }
  }, [provinceCode])

  useEffect(() => {
    if (!regencyCode) { setDistricts([]); setDistrictCode(""); return }
    let cancelled = false
    setDistrictCode("")
    setRegionError("")
    setRegionsLoading(true)
    void api("regions", { level: "districts", regency_code: regencyCode })
      .then((data) => { if (!cancelled) setDistricts(Array.isArray(data?.data) ? data.data : []) })
      .catch((e) => { if (!cancelled) { setDistricts([]); setRegionError(messageText(e)) } })
      .finally(() => { if (!cancelled) setRegionsLoading(false) })
    return () => { cancelled = true }
  }, [regencyCode])

  function clearMessages() { setNotice(""); setError("") }

  async function handleLogin(event: FormEvent) {
    event.preventDefault(); clearMessages()
    if (loginUsername.trim().toLowerCase() === "admin") { window.location.href = "/admin"; return }
    setBusy(true)
    try {
      const data = await api("login", { username: loginUsername, password: loginPassword })
      localStorage.setItem(PARTICIPANT_TOKEN_KEY, data.token)
      setToken(data.token); setParticipant(data.participant || null)
      setEditNickname(data.participant?.nickname || ""); setRecoveryEmail(data.participant?.email || "")
      setNotice("Berhasil masuk. Akun Battle Point Anda sudah aktif.")
    } catch (e) { setError(messageText(e)) } finally { setBusy(false) }
  }

  async function handleRegister(event: FormEvent) {
    event.preventDefault(); clearMessages()
    if (!regencyCode || !districtCode) { setError("Pilih kabupaten/kota dan kecamatan dari daftar resmi."); return }
    setBusy(true)
    try {
      const data = await api("register", { username, password, email, nickname, province_code: provinceCode, regency_code: regencyCode, district_code: districtCode })
      localStorage.setItem(PARTICIPANT_TOKEN_KEY, data.token)
      setToken(data.token); setParticipant(data.participant || null)
      setEditNickname(data.participant?.nickname || ""); setRecoveryEmail(data.participant?.email || "")
      setNotice("Pendaftaran berhasil. Wilayah akun sudah dikunci dari daftar resmi dan Anda mendapat 1 Ranked Attempt gratis.")
    } catch (e) { setError(messageText(e)) } finally { setBusy(false) }
  }

  async function requestPasswordReset() {
    clearMessages()
    if (!loginUsername.trim()) { setError("Isi username terlebih dahulu, lalu tekan Lupa Password."); return }
    setBusy(true)
    try { const data = await recoveryApi({ action: "request", kind: "participant", identifier: loginUsername.trim() }); setNotice(data.message || "Jika email pemulihan terdaftar, tautan reset sudah dikirim.") }
    catch (e) { setError(messageText(e)) } finally { setBusy(false) }
  }

  async function saveRecoveryEmail(event: FormEvent) {
    event.preventDefault(); clearMessages(); setBusy(true)
    try {
      const data = await recoveryApi({ action: "set_email", kind: "participant", email: recoveryEmail }, token)
      const savedEmail = data?.state?.email || recoveryEmail.trim().toLowerCase()
      setRecoveryEmail(savedEmail); setParticipant((prev) => prev ? { ...prev, email: savedEmail, email_configured: true } : prev)
      setNotice("Email pemulihan berhasil disimpan.")
    } catch (e) { setError(messageText(e)) } finally { setBusy(false) }
  }

  async function updateNickname(event: FormEvent) {
    event.preventDefault(); clearMessages(); setBusy(true)
    try { const data = await api("update_profile", { nickname: editNickname }, token); setParticipant(data.participant || participant); setNotice("Nama panggilan berhasil diperbarui.") }
    catch (e) { setError(messageText(e)) } finally { setBusy(false) }
  }

  async function changePassword(event: FormEvent) {
    event.preventDefault(); clearMessages(); setBusy(true)
    try { await api("change_password", { current_password: currentPassword, new_password: newPassword }, token); setCurrentPassword(""); setNewPassword(""); setNotice("Password berhasil diganti.") }
    catch (e) { setError(messageText(e)) } finally { setBusy(false) }
  }

  async function claimAccount(event: FormEvent) {
    event.preventDefault(); clearMessages(); setBusy(true)
    try { const data = await api("claim", { username: claimUsername, password: claimPassword }, token); setParticipant(data.participant || participant); setNotice("Akun lama berhasil diamankan dengan username dan password.") }
    catch (e) { setError(messageText(e)) } finally { setBusy(false) }
  }

  async function uploadAvatar(file?: File) {
    if (!file) return
    clearMessages()
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) { setError("Foto harus JPG, PNG, atau WebP."); return }
    if (file.size > 2 * 1024 * 1024) { setError("Ukuran foto maksimal 2 MB."); return }
    setBusy(true)
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader(); reader.onload = () => resolve(String(reader.result || "").split(",")[1] || ""); reader.onerror = () => reject(new Error("Foto tidak dapat dibaca.")); reader.readAsDataURL(file)
      })
      const data = await api("upload_avatar", { mime: file.type, base64 }, token)
      setParticipant((prev) => prev ? { ...prev, avatar_url: data.avatar_url } : prev); setNotice("Foto profil berhasil diperbarui.")
    } catch (e) { setError(messageText(e)) } finally { setBusy(false) }
  }

  function logout() {
    localStorage.removeItem(PARTICIPANT_TOKEN_KEY); setToken(""); setParticipant(null); setNotice(""); setError(""); setTab("login")
  }

  if (loading) return <main className="grid min-h-screen place-items-center bg-[#020817] text-white"><p className="text-slate-300">Memuat akun peserta…</p></main>

  const fieldClass = "rounded-xl border border-white/15 bg-[#06142d] px-4 py-3 font-normal outline-none focus:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_15%_0%,rgba(55,115,255,.20),transparent_34rem),radial-gradient(circle_at_90%_15%,rgba(42,210,255,.10),transparent_28rem),linear-gradient(180deg,#020817_0%,#07142f_46%,#050d20_100%)] text-white">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#030b1f]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <a href="/battle" className="flex items-center gap-3 font-black tracking-tight"><img src="/brand/alvaza-logo-new.svg" alt="" className="h-10 w-10 rounded-xl object-contain" /><span>ALZAVA <span className="text-cyan-300">Battle Point</span></span></a>
          <a href="/battle" className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-bold text-slate-200 hover:bg-white/10">← Kembali ke Battle</a>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-5 py-10 sm:py-14">
        <div className="mb-7">
          <p className="text-xs font-black uppercase tracking-[.18em] text-cyan-300">AKUN PESERTA</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-6xl">Identitas Battle Anda</h1>
          <p className="mt-4 max-w-3xl leading-7 text-slate-300">Kelola akun, nama panggilan, foto profil, dan kuota percobaan. Setiap peserta mendapat <strong className="text-white">1x percobaan gratis per season</strong>.</p>
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
                <div><h2 className="text-2xl font-black">Masuk ke arena</h2><p className="mt-1 text-sm text-slate-400">Gunakan username dan password akun Battle Point Anda.</p></div>
                <label className="grid gap-2 text-sm font-bold">Username<input value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)} required autoComplete="username" className={fieldClass} /></label>
                <label className="grid gap-2 text-sm font-bold">Password<input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required autoComplete="current-password" className={fieldClass} /></label>
                <div className="flex flex-wrap items-center justify-between gap-3"><button type="button" disabled={busy} onClick={() => void requestPasswordReset()} className="text-sm font-bold text-cyan-300 hover:text-cyan-200 disabled:opacity-50">Lupa Password?</button><span className="text-xs text-slate-500">Isi username terlebih dahulu</span></div>
                <button disabled={busy} className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 font-black disabled:opacity-60">{busy ? "Memproses…" : "Masuk"}</button>
                <div className="text-center text-xs text-slate-500">Pengelola ALZAVA? <a href="/admin" className="font-bold text-cyan-300 hover:text-cyan-200">Masuk sebagai Admin</a></div>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="grid gap-5 p-6 sm:p-8">
                <div><h2 className="text-2xl font-black">Buat akun peserta</h2><p className="mt-1 text-sm text-slate-400">Wilayah sekarang dipilih dari daftar sistem agar ranking Kecamatan/Kabupaten tidak terpecah karena beda penulisan.</p></div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm font-bold">Username<input value={username} onChange={(e) => setUsername(e.target.value)} required minLength={3} maxLength={24} autoComplete="username" className={fieldClass} /></label>
                  <label className="grid gap-2 text-sm font-bold">Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete="new-password" className={fieldClass} /></label>
                </div>
                <label className="grid gap-2 text-sm font-bold">Email <span className="font-normal text-slate-500">untuk pemulihan password</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" placeholder="nama@email.com" className={fieldClass} /></label>
                <label className="grid gap-2 text-sm font-bold">Nama Panggilan <span className="font-normal text-slate-500">nama yang tampil di peringkat</span><input value={nickname} onChange={(e) => setNickname(e.target.value)} required minLength={3} maxLength={24} placeholder="Contoh: Aditakaa" className={fieldClass} /></label>
                <label className="grid gap-2 text-sm font-bold">Provinsi<select value={provinceCode} onChange={(e) => setProvinceCode(e.target.value)} className={fieldClass}>{provinces.map(([code, name]) => <option key={code} value={code}>{name}</option>)}</select></label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm font-bold">Kabupaten/Kota<select value={regencyCode} onChange={(e) => setRegencyCode(e.target.value)} required disabled={regionsLoading || regencies.length === 0} className={fieldClass}><option value="">{regionsLoading ? "Memuat…" : "Pilih kabupaten/kota"}</option>{regencies.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}</select></label>
                  <label className="grid gap-2 text-sm font-bold">Kecamatan<select value={districtCode} onChange={(e) => setDistrictCode(e.target.value)} required disabled={!regencyCode || regionsLoading || districts.length === 0} className={fieldClass}><option value="">{regionsLoading && regencyCode ? "Memuat…" : "Pilih kecamatan"}</option>{districts.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}</select></label>
                </div>
                {regionError ? <p className="text-sm font-semibold text-rose-300">{regionError}</p> : <p className="text-xs leading-5 text-slate-500">Kabupaten/kota dan kecamatan diambil dari referensi wilayah resmi sistem; peserta tidak lagi mengetik nama wilayah sendiri.</p>}
                <button disabled={busy || regionsLoading || !regencyCode || !districtCode} className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 font-black disabled:opacity-60">{busy ? "Mendaftarkan…" : "Daftar & Masuk"}</button>
              </form>
            )}
          </div>
        ) : (
          <div className="grid gap-5">
            <section className="rounded-3xl border border-white/15 bg-[#0a1a37]/90 p-6 shadow-2xl sm:p-8">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  {participant.avatar_url ? <img src={participant.avatar_url} alt="" className="h-20 w-20 rounded-2xl object-cover ring-2 ring-cyan-400/50" /> : <div className="grid h-20 w-20 place-items-center rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-700 text-2xl font-black">{(participant.nickname || "BP").slice(0,2).toUpperCase()}</div>}
                  <div><p className="text-xs font-black uppercase tracking-widest text-cyan-300">Peserta aktif</p><h2 className="mt-1 text-2xl font-black">{participant.nickname || "Peserta"}</h2><p className="mt-1 text-sm text-slate-400">{participant.district_name}{participant.district_name ? " · " : ""}{participant.regency_name}{participant.regency_name ? " · " : ""}{participant.province_name}</p></div>
                </div>
                <div className="flex flex-wrap gap-2"><a href={action.href} className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 text-sm font-black">{action.label}</a><button onClick={logout} className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-bold text-slate-200 hover:bg-white/10">Keluar</button></div>
              </div>
              <div className="mt-7 grid gap-3 sm:grid-cols-4">
                <div className="rounded-2xl border border-cyan-300/25 bg-cyan-300/10 p-4"><span className="text-xs text-cyan-100">Kuota gratis / season</span><strong className="mt-1 block text-3xl font-black">1x</strong></div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><span className="text-xs text-slate-400">Gratis digunakan</span><strong className="mt-1 block text-3xl font-black">{Math.min(1, used)}/1</strong></div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><span className="text-xs text-slate-400">Sisa gratis</span><strong className="mt-1 block text-3xl font-black">{freeRemaining}x</strong></div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><span className="text-xs text-slate-400">Kredit Rematch</span><strong className="mt-1 block text-3xl font-black">{paidCredits}x</strong></div>
              </div>
              <p className="mt-4 text-sm text-slate-400">Total percobaan yang masih dapat dipakai sekarang: <strong className="text-white">{totalRemaining}x</strong>.</p>
            </section>

            {!participant.account_ready && <section className="rounded-3xl border border-amber-300/25 bg-amber-300/10 p-6"><h3 className="text-xl font-black">Amankan akun lama</h3><p className="mt-1 text-sm text-amber-100/80">Buat username dan password agar akun lama bisa dipakai di perangkat lain.</p><form onSubmit={claimAccount} className="mt-5 grid gap-4 sm:grid-cols-2"><input value={claimUsername} onChange={(e) => setClaimUsername(e.target.value)} required minLength={3} maxLength={24} placeholder="Username baru" className={fieldClass} /><input type="password" value={claimPassword} onChange={(e) => setClaimPassword(e.target.value)} required minLength={8} placeholder="Password minimal 8 karakter" className={fieldClass} /><button disabled={busy} className="rounded-xl bg-amber-300 px-5 py-3 font-black text-slate-950 sm:col-span-2 disabled:opacity-60">Aktifkan Login Akun</button></form></section>}

            <section className={`rounded-3xl border p-6 ${participant.email ? "border-emerald-300/20 bg-emerald-300/[.06]" : "border-amber-300/25 bg-amber-300/10"}`}><h3 className="text-xl font-black">Email Pemulihan</h3><p className="mt-1 text-sm text-slate-300">{participant.email ? "Email ini dipakai untuk mengirim tautan reset jika Anda lupa password." : "Tambahkan email agar password bisa dipulihkan tanpa kehilangan skor dan riwayat."}</p><form onSubmit={saveRecoveryEmail} className="mt-5 flex flex-col gap-3 sm:flex-row"><input type="email" value={recoveryEmail} onChange={(e) => setRecoveryEmail(e.target.value)} required autoComplete="email" placeholder="nama@email.com" className={`${fieldClass} min-w-0 flex-1`} /><button disabled={busy} className="rounded-xl bg-emerald-500 px-5 py-3 font-black text-slate-950 disabled:opacity-60">{participant.email ? "Perbarui Email" : "Simpan Email"}</button></form></section>

            <div className="grid gap-5 lg:grid-cols-2">
              <section className="rounded-3xl border border-white/15 bg-[#0a1a37]/90 p-6"><h3 className="text-xl font-black">Profil Arena</h3><form onSubmit={updateNickname} className="mt-5 grid gap-4"><label className="grid gap-2 text-sm font-bold">Nama Panggilan<input value={editNickname} onChange={(e) => setEditNickname(e.target.value)} required minLength={3} maxLength={24} className={fieldClass} /></label><label className="grid gap-2 text-sm font-bold">Foto profil <span className="font-normal text-slate-500">JPG/PNG/WebP, maks. 2 MB</span><input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={(e) => void uploadAvatar(e.target.files?.[0])} className={fieldClass} /></label><button disabled={busy} className="rounded-xl bg-indigo-600 px-5 py-3 font-black disabled:opacity-60">Simpan Profil</button></form></section>
              {participant.account_ready !== false && <section className="rounded-3xl border border-white/15 bg-[#0a1a37]/90 p-6"><h3 className="text-xl font-black">Keamanan Akun</h3><p className="mt-1 text-sm text-slate-400">Ganti password tanpa mengubah skor, peringkat, atau kuota.</p><form onSubmit={changePassword} className="mt-5 grid gap-4"><input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required placeholder="Password saat ini" className={fieldClass} /><input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} placeholder="Password baru minimal 8 karakter" className={fieldClass} /><button disabled={busy} className="rounded-xl border border-white/15 bg-white/10 px-5 py-3 font-black hover:bg-white/15 disabled:opacity-60">Ganti Password</button></form></section>}
            </div>
          </div>
        )}
      </section>
    </main>
  )
}
