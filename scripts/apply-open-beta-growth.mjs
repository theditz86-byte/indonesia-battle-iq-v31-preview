import fs from "node:fs"

const path = "app/battle-test/page.tsx"
let s = fs.readFileSync(path, "utf8")
function replace(from, to, label) {
  if (!s.includes(from)) throw new Error(`Patch target missing: ${label}`)
  s = s.replace(from, to)
}

replace(
  'import { ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight, Clock3, CreditCard, Flag, Loader2, ShieldCheck } from "lucide-react"',
  'import { ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight, Clock3, Flag, Loader2, ShieldCheck } from "lucide-react"',
  "remove payment icon"
)
replace('  const [paywall, setPaywall] = useState(false)\n', '', "remove paywall state")
s = s.replaceAll('    setPaywall(false)\n', '')
replace(
  '          <div><p className="text-xs font-black text-cyan-300">{attempt.high_range_unlocked ? "HIGH RANGE · VERIFIED PATH" : isPaidRanked ? "REMATCH / PRACTICE" : "RANKED ATTEMPT"}</p><p className="text-sm font-bold text-white">Percobaan #{attempt.attempt_number}{attempt.questions.length===20 ? " · 20 soal · 20 menit" : attempt.high_range_unlocked ? " · Tahap 2/2" : " · Tahap 1/2"}</p></div>',
  '          <div><p className="text-xs font-black text-cyan-300">{attempt.high_range_unlocked ? "HIGH RANGE · VERIFIED PATH" : isRepeatRanked ? "RANKED ATTEMPT · BEST SCORE CHASE" : "RANKED ATTEMPT"}</p><p className="text-sm font-bold text-white">Percobaan #{attempt.attempt_number} dari 3{attempt.questions.length===20 ? " · 20 soal · 20 menit" : attempt.high_range_unlocked ? " · Tahap 2/2" : " · Tahap 1/2"}</p></div>',
  "ranked attempt header"
)
replace(
`            {paywall ? (
              <a href="/payment?product=attempt_credit" className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-5 py-3.5 font-black text-slate-950"><CreditCard className="h-5 w-5"/>Buka Rematch · Rp5.000</a>
            ) : (
              <button onClick={requestStart} disabled={!integrity} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3.5 font-black disabled:cursor-not-allowed disabled:opacity-50"><Flag className="h-5 w-5"/>Mulai / Lanjutkan Tes</button>
            )}`,
`            <button onClick={requestStart} disabled={!integrity} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3.5 font-black disabled:cursor-not-allowed disabled:opacity-50"><Flag className="h-5 w-5"/>Mulai / Lanjutkan Ranked</button>`,
  "remove paid rematch CTA"
)

fs.writeFileSync(path, s)
console.log("Open Beta ranked screen cleanup applied")
