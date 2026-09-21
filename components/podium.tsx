import type { BattleEntry } from "@/lib/battle"
import { formatScore } from "@/lib/battle"

type Spot = {
  place: 1 | 2 | 3
  bodyHeight: string
  avatarSize: string
  crown: string
  crownSize: string
  metal: string
  bodyGradient: string
  glow: string
  iqColor: string
  badge: string
}

const spots: Record<number, Spot> = {
  1: { place: 1, bodyHeight: "h-60", avatarSize: "h-28 w-28", crown: "/images/crown-gold.webp", crownSize: "h-16 w-16", metal: "from-yellow-300 via-amber-500 to-amber-700", bodyGradient: "from-amber-50 via-white to-amber-100", glow: "shadow-[0_0_70px_rgba(250,204,21,.45)]", iqColor: "text-amber-600", badge: "from-yellow-300 to-amber-600" },
  2: { place: 2, bodyHeight: "h-44", avatarSize: "h-24 w-24", crown: "/images/crown-silver.webp", crownSize: "h-12 w-12", metal: "from-slate-200 via-slate-400 to-slate-600", bodyGradient: "from-white via-slate-50 to-slate-200", glow: "shadow-[0_0_45px_rgba(203,213,225,.32)]", iqColor: "text-blue-600", badge: "from-slate-400 to-slate-600" },
  3: { place: 3, bodyHeight: "h-36", avatarSize: "h-24 w-24", crown: "/images/crown-bronze.webp", crownSize: "h-12 w-12", metal: "from-orange-300 via-orange-600 to-amber-800", bodyGradient: "from-orange-50 via-white to-orange-100", glow: "shadow-[0_0_45px_rgba(251,146,60,.32)]", iqColor: "text-blue-600", badge: "from-orange-400 to-amber-700" },
}

function initials(name?: string) {
  return (name || "IQ").split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "IQ"
}

function Laurel({ place }: { place: 1 | 2 | 3 }) {
  const tone = place === 1 ? "border-amber-300/80 shadow-[0_0_28px_rgba(250,204,21,.45)]" : place === 2 ? "border-slate-200/80 shadow-[0_0_22px_rgba(226,232,240,.3)]" : "border-orange-300/80 shadow-[0_0_22px_rgba(251,146,60,.3)]"
  return (
    <div className={`absolute inset-[-18px] rounded-full border-[7px] border-dashed ${tone}`} aria-hidden="true">
      <div className="absolute inset-2 rounded-full border border-white/20" />
    </div>
  )
}

function PodiumColumn({ place, player }: { place: 1 | 2 | 3; player?: BattleEntry }) {
  const s = spots[place]
  const isChampion = place === 1
  const name = player?.nickname || "Posisi terbuka"
  const region = player?.province_name || "Indonesia"
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center justify-end">
      <div className="relative z-20 mb-1 flex flex-col items-center">
        <img src={s.crown} alt="" aria-hidden="true" className={`absolute -top-12 left-1/2 ${s.crownSize} -translate-x-1/2 object-contain drop-shadow-[0_0_16px_rgba(250,204,21,.55)]`} />
        <div className="relative">
          <Laurel place={place} />
          <div className={`rounded-full bg-gradient-to-br ${s.metal} p-[4px] ${s.glow}`}>
            <div className="rounded-full bg-slate-950 p-[3px]">
              {player?.avatar_url ? (
                <img src={player.avatar_url} alt={name} className={`${s.avatarSize} rounded-full object-cover`} />
              ) : (
                <div className={`${s.avatarSize} flex items-center justify-center rounded-full bg-gradient-to-br from-slate-800 to-slate-950 text-xl font-black text-white`}>{initials(name)}</div>
              )}
            </div>
          </div>
          <span className={`absolute -bottom-3 left-1/2 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full bg-gradient-to-br ${s.badge} text-sm font-black text-white ring-4 ring-slate-950`}>{place}</span>
        </div>
      </div>

      <div className={`relative z-10 mt-5 flex w-full ${s.bodyHeight} flex-col items-center rounded-t-2xl bg-gradient-to-b ${s.bodyGradient} px-2 pb-4 pt-8 text-center text-slate-900 ring-1 ring-white/50 ${s.glow}`}>
        <p className={`max-w-full truncate font-bold ${isChampion ? "text-base" : "text-sm"}`}>{name}</p>
        <p className="max-w-full truncate text-xs text-slate-500">{region}</p>
        <p className={`mt-1 font-black ${s.iqColor} ${isChampion ? "text-3xl" : "text-2xl"}`}>IQ {player?.iq_estimate ?? "—"}</p>
        <p className="text-xs text-slate-500">{player ? formatScore(player.battle_score) : "0"} poin</p>
      </div>

      <div className={`relative flex h-16 w-full items-center justify-center rounded-b-[26px] bg-gradient-to-b ${s.metal} ${s.glow}`}>
        <div className="absolute inset-x-4 top-1 h-2 rounded-full bg-white/30 blur-sm" />
        <span className="relative text-3xl font-black text-slate-900/65">{place}</span>
        {isChampion && <span className="absolute bottom-1 text-[9px] font-black uppercase tracking-[.25em] text-amber-950/70">Champion</span>}
      </div>
    </div>
  )
}

export function Podium({ entries }: { entries: BattleEntry[] }) {
  const first = entries.find((entry) => Number(entry.national_rank) === 1) || entries[0]
  const second = entries.find((entry) => Number(entry.national_rank) === 2) || entries[1]
  const third = entries.find((entry) => Number(entry.national_rank) === 3) || entries[2]
  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 top-1/4 rounded-[40px] bg-[radial-gradient(circle_at_50%_45%,rgba(250,204,21,.18),transparent_55%)] blur-2xl" />
      <div className="relative flex items-end gap-2 sm:gap-3">
        <PodiumColumn place={2} player={second} />
        <PodiumColumn place={1} player={first} />
        <PodiumColumn place={3} player={third} />
      </div>
    </div>
  )
}
