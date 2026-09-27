import fs from "node:fs"

function read(path) { return fs.readFileSync(path, "utf8") }
function write(path, content) { fs.writeFileSync(path, content) }
function mustReplace(content, from, to, label) {
  if (!content.includes(from)) throw new Error(`Patch target missing: ${label}`)
  return content.replace(from, to)
}

// Ranked Battle: 3 official attempts/week, unlocked Mon/Wed/Fri, no paid Ranked path.
{
  const path = "app/battle-test/page.tsx"
  let s = read(path)
  s = mustReplace(s,
`  attempts_remaining?: number
  active_attempt_id?: string | null
}`,
`  attempts_remaining?: number
  weekly_attempts_remaining?: number
  ranked_slots_unlocked?: number
  next_ranked_unlock_day?: string | null
  ranked_weekly_limit?: number
  open_beta?: boolean
  active_attempt_id?: string | null
}`,
"battle participant cadence fields")

  s = mustReplace(s,
`  const isPaidRanked = Boolean(attempt && attempt.attempt_number > 1)`,
`  const isRepeatRanked = Boolean(attempt && attempt.attempt_number > 1 && attempt.attempt_number <= 3)`,
"ranked repeat flag")

  s = mustReplace(s,
`      if (response.status === 402) {
        setPaywall(true)
        setError("Ranked Attempt resmi season ini sudah digunakan. Gunakan Rematch / Practice Credit untuk latihan dan analisis tambahan tanpa mengubah leaderboard.")
        setPhase("lobby")
        return
      }`,
`      if (response.status === 402) {
        setPaywall(false)
        const weeklyRemaining = Math.max(0, Number(participant?.weekly_attempts_remaining ?? 3 - Number(participant?.attempts_used || 0)) || 0)
        const nextDay = participant?.next_ranked_unlock_day
        setError(weeklyRemaining <= 0
          ? "Tiga Ranked Battle resmi minggu ini sudah digunakan. Season berikutnya membuka 3 kesempatan baru."
          : nextDay
            ? \`Kesempatan Ranked berikutnya terbuka ${nextDay}. Kesempatan yang belum dipakai tetap tersimpan sampai akhir minggu.\`
            : "Kesempatan Ranked berikutnya belum terbuka. Coba lagi sesuai jadwal Ranked minggu ini.")
        setPhase("lobby")
        return
      }`,
"ranked 402 messaging")

  s = mustReplace(s,
`    const used = Math.max(0, Number(participant?.attempts_used) || 0)
    const freeRemaining = Math.max(0, Number(participant?.free_attempts_remaining ?? 1 - used) || 0)
    const paidCredits = Math.max(0, Number(participant?.paid_credits) || 0)`,
`    const used = Math.max(0, Number(participant?.attempts_used) || 0)
    const availableNow = Math.max(0, Number(participant?.free_attempts_remaining ?? Math.max(0, 3 - used)) || 0)
    const weeklyRemaining = Math.max(0, Number(participant?.weekly_attempts_remaining ?? Math.max(0, 3 - used)) || 0)
    const nextDay = participant?.next_ranked_unlock_day`,
"ranked lobby counters")

  s = mustReplace(s,
`Numerik, logika, verbal, dan spasial dalam satu tes. Setiap season menyediakan <b className="text-white">1 Ranked Attempt resmi gratis</b> yang menentukan leaderboard season.`,
`Numerik, logika, verbal, dan spasial dalam satu tes. Setiap season menyediakan <b className="text-white">3 Ranked Battle resmi gratis</b>. Kesempatan dibuka Senin, Rabu, dan Jumat; kesempatan yang belum dipakai tetap tersimpan sampai akhir season. <b className="text-white">Skor terbaik dari maksimal 3 attempt</b> masuk leaderboard.`,
"ranked lobby description")

  s = mustReplace(s,
`<div className="rounded-2xl border border-white/10 bg-white/5 p-4"><span className="text-xs text-slate-400">Gratis tersisa</span><strong className="mt-1 block text-3xl font-black">{freeRemaining}x</strong></div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><span className="text-xs text-slate-400">Kredit Rematch</span><strong className="mt-1 block text-3xl font-black">{paidCredits}x</strong></div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><span className="text-xs text-slate-400">Sudah digunakan</span><strong className="mt-1 block text-3xl font-black">{used}x</strong></div>`,
`<div className="rounded-2xl border border-white/10 bg-white/5 p-4"><span className="text-xs text-slate-400">Tersedia sekarang</span><strong className="mt-1 block text-3xl font-black">{availableNow}x</strong></div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><span className="text-xs text-slate-400">Sisa minggu ini</span><strong className="mt-1 block text-3xl font-black">{weeklyRemaining}x</strong></div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><span className="text-xs text-slate-400">Sudah digunakan</span><strong className="mt-1 block text-3xl font-black">{used}x</strong></div>`,
"ranked cards")

  s = mustReplace(s,
`              Setelah Ranked Attempt resmi digunakan, kredit Rp5.000 membuka <b>Rematch / Practice</b>. Hasilnya tetap mendapat Battle Point dan analisis pribadi, tetapi <b>tidak mengubah leaderboard resmi</b>.`,
`              <b>Open Beta GRATIS.</b> Semua pemain mendapat maksimal 3 Ranked Battle resmi per minggu dengan jumlah kesempatan yang sama. Tidak ada pembelian Ranked tambahan. ${"{"}nextDay ? \`Kesempatan berikutnya terbuka ${nextDay}.\` : weeklyRemaining > 0 ? "Kesempatan Ranked tersedia sesuai jadwal minggu ini." : "Tiga kesempatan minggu ini sudah digunakan."${"}"}}`,
"open beta fair-play message")

  s = mustReplace(s,
`        {isPaidRanked && <div className="mb-5 rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">Rematch / Practice — hasil tes ini tersimpan untuk analisis dan perkembangan pribadi, tetapi tidak mengubah leaderboard resmi.</div>}`,
`        {isRepeatRanked && <div className="mb-5 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm text-cyan-100">Ranked Attempt #{attempt.attempt_number} dari 3 — tetap resmi. Jika skornya lebih tinggi, skor terbaik ini akan menggantikan skor leaderboard-mu.</div>}`,
"attempt 2/3 banner")

  write(path, s)
}

// Result: attempts 1-3 are all official Ranked; surface a direct replay loop.
{
  const path = "app/result/page.tsx"
  let s = read(path)
  s = mustReplace(s,
`                <p className="mt-1 text-sm text-slate-400">Setiap percobaan menyimpan hasilnya sendiri. Laporan Premium juga melekat pada hasil yang dipilih.</p>`,
`                <p className="mt-1 text-sm text-slate-400">Setiap Ranked menyimpan hasilnya sendiri. Skor terbaik dari maksimal 3 kesempatan resmi menjadi skor leaderboard season.</p>`,
"result history description")
  s = mustReplace(s,
`                  const paid=Number(item.attempt_number||0)>1`,
`                  const legacy=Number(item.attempt_number||0)>3`,
"result attempt classification")
  s = mustReplace(s,
`{item.attempt_number ?? "—"} {paid?"· Rematch / Practice":"· Ranked Resmi"}`,
`{item.attempt_number ?? "—"} {legacy?"· Arsip Lama":"· Ranked Resmi"}`,
"result attempt label")
  s = mustReplace(s,
`{result.ranked_attempt ? "Ranked Resmi" : "Rematch / Practice"}`,
`{result.ranked_attempt ? "Ranked Resmi" : "Arsip Lama"}`,
"result badge")
  s = mustReplace(s,
`            {data.premium_unlocked && <button onClick={printPremium} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-black text-slate-950 shadow-xl"><Download className="h-4 w-4"/>Simpan PDF Premium</button>}`,
`            <a href="/battle-test" className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-2.5 text-sm font-black text-cyan-100"><Rocket className="h-4 w-4"/>Ranked Lagi</a>
            {data.premium_unlocked && <button onClick={printPremium} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-black text-slate-950 shadow-xl"><Download className="h-4 w-4"/>Simpan PDF Premium</button>}`,
"ranked result CTA")
  write(path, s)
}

// Daily Training becomes TIU Harian inside the SKD learning hub.
{
  const path = "app/daily-training/page.tsx"
  let s = read(path)
  if (!s.includes("Latihan Harian")) throw new Error("Patch target missing: daily training naming")
  s = s.split("Latihan Harian").join("TIU Harian")
  write(path, s)
}

console.log("Open Beta growth patch applied successfully")
