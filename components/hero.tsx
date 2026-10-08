import { ArrowRight, BarChart3, BrainCircuit, Share2, Sparkles, Swords, Trophy, Zap } from "lucide-react"
import type { BattleEntry, BattleParticipant, BattleSeason } from "@/lib/battle"
import { CountdownCard } from "./countdown-card"
import { Podium } from "./podium"

export function Hero({ season, entries, participant }: { season: BattleSeason | null; entries: BattleEntry[]; participant?: BattleParticipant | null }) {
  const leaderScore = Number(entries?.[0]?.battle_score || 0)
  const guest = !participant
  const challengeText = guest
    ? "Coba kemampuan awalmu sebelum masuk arena utama."
    : leaderScore > 0
      ? `Bisa lewati ${new Intl.NumberFormat("id-ID").format(leaderScore)} Battle Point?`
      : "Seberapa tinggi posisi kemampuanmu di Indonesia?"

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0">
        <img src="/images/hero-bg-opt.webp?v=stabilized" alt="" className="h-full w-full object-cover" fetchPriority="high" decoding="async" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/55 via-slate-950/45 to-slate-950" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(250,204,21,0.14),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_25%,rgba(56,189,248,0.14),transparent_45%)]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pb-5 pt-8 sm:px-6 lg:pb-6 lg:pt-10">
        <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,335px)_minmax(0,1fr)_minmax(0,305px)]">
          <div className="flex flex-col items-start text-left lg:-translate-y-6 lg:self-start">
            <div className="group relative w-full max-w-[21rem] overflow-hidden rounded-2xl border border-cyan-300/50 bg-gradient-to-r from-cyan-400/16 via-sky-500/10 to-indigo-500/12 px-4 py-3.5 shadow-[0_0_34px_rgba(34,211,238,.16)] ring-1 ring-cyan-200/10 backdrop-blur-md">
              <div className="pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full bg-cyan-300/15 blur-2xl" />
              <div className="relative flex items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-cyan-200/25 bg-cyan-300/10 shadow-[0_0_20px_rgba(34,211,238,.16)]">
                  <Sparkles className="h-5 w-5 text-cyan-200" />
                </span>
                <div className="min-w-0">
                  <div className="text-[12px] font-black uppercase leading-4 tracking-[.16em] text-cyan-50">Competitive Brain Game</div>
                  <div className="mt-0.5 text-[13px] font-black uppercase tracking-[.22em] text-cyan-300">Indonesia</div>
                </div>
              </div>
            </div>

            <h1 className="mt-4 text-[2.7rem] font-black leading-[0.98] tracking-tight text-white sm:text-5xl">
              <span className="bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-400 bg-clip-text text-transparent">Raih Poin.</span><br />
              <span className="bg-gradient-to-r from-amber-300 via-yellow-300 to-orange-400 bg-clip-text text-transparent">Naik Peringkat.</span>
            </h1>

            <p className="mt-4 max-w-[21rem] text-[15px] font-black leading-6 text-white">
              {challengeText}
            </p>

            <a href="/visual-iq" className="group mt-3 flex w-full max-w-[21rem] items-center gap-3 rounded-xl border border-cyan-300/25 bg-slate-950/45 px-3 py-2.5 shadow-[0_0_20px_rgba(34,211,238,.08)] backdrop-blur-md transition-all hover:border-cyan-300/45 hover:bg-cyan-300/[.07]">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-cyan-300/20 bg-cyan-300/10">
                <BrainCircuit className="h-[18px] w-[18px] text-cyan-200" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="text-[12px] font-black text-white">Tes IQ</span>
                  <span className="rounded-full bg-cyan-300 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-[.1em] text-slate-950">Baru</span>
                </span>
                <span className="mt-0.5 block truncate text-[10px] font-bold text-slate-400">Ketahui IQ-mu · 35 soal IQ multi-domain</span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-cyan-300 transition-transform group-hover:translate-x-0.5" />
            </a>

            {guest ? (
              <>
                <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-extrabold text-cyan-100/90">
                  <span>5 soal</span><span className="text-slate-500">•</span>
                  <span>±3 menit</span><span className="text-slate-500">•</span>
                  <span>tanpa daftar</span><span className="text-slate-500">•</span>
                  <span>hasil langsung</span>
                </div>
                <p className="mt-4 max-w-[20.5rem] text-sm font-medium leading-6 text-slate-300">
                  Mulai dari Pre-Test singkat TWK, TIU, dan TKP. Dapatkan Battle Point awalmu, lalu simpan hasilnya saat membuat akun gratis.
                </p>
                <div className="mt-5 w-full max-w-[21rem] rounded-2xl border border-amber-300/30 bg-gradient-to-r from-amber-300/[.10] via-cyan-300/[.07] to-violet-400/[.08] p-3 shadow-[0_0_32px_rgba(251,191,36,.14)]">
                  <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[.15em] text-amber-300"><Zap className="h-3.5 w-3.5"/>Untuk pengunjung baru</div>
                  <a href="/pretest" className="flex min-h-14 items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-orange-400 to-fuchsia-500 px-5 py-3.5 text-base font-black text-slate-950 shadow-[0_0_34px_rgba(251,191,36,.32)] transition-all hover:-translate-y-0.5 hover:scale-[1.015]">
                    <Zap className="h-5 w-5" /> Quick Battle — Pre-Test <ArrowRight className="h-5 w-5" />
                  </a>
                  <p className="mt-2 text-center text-[10px] font-bold text-slate-400">Tidak memengaruhi ranking · hasil dapat disimpan setelah daftar</p>
                </div>
                <a href="#peringkat" className="mt-3 flex min-h-11 items-center gap-2 rounded-xl border border-cyan-400/35 bg-white/[.05] px-4 py-2.5 text-sm font-extrabold text-white backdrop-blur-lg transition-colors hover:bg-white/10">
                  <BarChart3 className="h-4 w-4 text-cyan-300" /> Lihat Peringkat Dulu
                </a>
              </>
            ) : (
              <>
                <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-extrabold text-cyan-100/90">
                  <span>35 soal</span><span className="text-slate-500">•</span>
                  <span>20 menit</span><span className="text-slate-500">•</span>
                  <span>3 Ranked gratis/minggu</span><span className="text-slate-500">•</span>
                  <span>Best Score Ranking</span>
                </div>
                <p className="mt-4 max-w-[20.5rem] text-sm font-medium leading-6 text-slate-300">
                  Gunakan hingga 3 Ranked Battle kapan saja selama season mingguan—bahkan di hari yang sama—ambil skor terbaikmu, lalu rebut posisi dari kecamatan hingga Indonesia.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <a href="/battle-test" className="flex min-h-14 items-center gap-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 px-6 py-3.5 text-base font-black text-white ring-1 ring-indigo-300/30 shadow-[0_0_38px_rgba(124,58,237,.58)] transition-all hover:-translate-y-0.5 hover:scale-[1.025] hover:shadow-[0_0_46px_rgba(124,58,237,.72)]">
                    <Swords className="h-5 w-5" /> Mulai Ranked Battle <ArrowRight className="h-5 w-5" />
                  </a>
                  <a href="#peringkat" className="flex min-h-12 items-center gap-2 rounded-xl border border-cyan-400/45 bg-white/[.07] px-5 py-3 text-[15px] font-extrabold text-white backdrop-blur-lg shadow-[0_0_20px_rgba(34,211,238,0.20)] transition-colors hover:bg-white/10">
                    <BarChart3 className="h-[18px] w-[18px] text-cyan-300" /> Lihat Peringkat
                  </a>
                </div>
              </>
            )}
          </div>

          <div className="relative">
            <div className="pointer-events-none absolute inset-x-0 top-10 -z-0 mx-auto h-72 w-3/4 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(250,204,21,0.22),transparent_70%)] blur-2xl" />
            <div className="relative z-10"><Podium entries={entries} /></div>
            {leaderScore > 0 && (
              <div className="mx-auto mt-2 flex w-fit items-center gap-3 rounded-full border-2 border-amber-300/45 bg-slate-950/75 px-7 py-3.5 text-[15px] font-black text-amber-50 shadow-[0_0_34px_rgba(251,191,36,.30)] ring-1 ring-amber-200/15 backdrop-blur-lg sm:text-base">
                <Trophy className="h-5 w-5 shrink-0 text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,.65)]" />
                <span>{new Intl.NumberFormat("id-ID").format(leaderScore)} BP sedang memimpin · bisa kamu lewati?</span>
              </div>
            )}
          </div>

          <div className="flex w-full flex-col items-stretch gap-3 lg:-translate-y-6 lg:self-start">
            <div className="flex justify-end">
              <div className="flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1.5 text-[11px] font-black text-emerald-200 backdrop-blur-sm">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> Leaderboard diperbarui otomatis
              </div>
            </div>
            <p className="max-w-xs self-end text-right text-[13px] italic leading-relaxed text-cyan-100/80">&ldquo;Berapa Battle Point-mu—dan siapa yang bisa mengejarnya?&rdquo;</p>
            <CountdownCard season={season} />

            <a href="/latihan-skd" className="group flex w-full items-center gap-3 rounded-2xl border border-emerald-300/45 bg-gradient-to-r from-emerald-500/18 via-cyan-500/15 to-sky-500/18 px-4 py-3.5 text-left shadow-[0_0_28px_rgba(16,185,129,.16)] ring-1 ring-emerald-200/10 backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-emerald-300/65 hover:shadow-[0_0_36px_rgba(16,185,129,.24)]">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-400/15 ring-1 ring-emerald-300/25 transition-transform group-hover:scale-105">
                <BrainCircuit className="h-5 w-5 text-emerald-200" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-black text-white">Latihan SKD & TIU Gratis</span>
                <span className="mt-0.5 block text-[10px] font-bold text-emerald-100/70">Latihan bebas · tidak memengaruhi ranking</span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-emerald-200 transition-transform group-hover:translate-x-0.5" />
            </a>

            <div className="grid w-full grid-cols-2 gap-2 text-[11px] font-extrabold">
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/45 px-3 py-2.5 text-slate-200 backdrop-blur-sm"><Sparkles className="h-3.5 w-3.5 text-cyan-300"/>Battle Point</div>
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/45 px-3 py-2.5 text-slate-200 backdrop-blur-sm"><BarChart3 className="h-3.5 w-3.5 text-violet-300"/>Statistik</div>
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/45 px-3 py-2.5 text-slate-200 backdrop-blur-sm"><Trophy className="h-3.5 w-3.5 text-amber-300"/>Rank Nasional</div>
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/45 px-3 py-2.5 text-slate-200 backdrop-blur-sm"><Share2 className="h-3.5 w-3.5 text-emerald-300"/>Share Card</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}