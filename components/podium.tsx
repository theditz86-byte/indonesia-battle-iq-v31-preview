import type { BattleEntry } from "@/lib/battle"
import { formatScore } from "@/lib/battle"

function Sparkle({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={`${className} motion-safe:animate-[twinkle_1.8s_ease-in-out_infinite]`}>
      <path d="M12 0c.6 5.4 3 7.8 8.4 8.4-5.4.6-7.8 3-8.4 8.4-.6-5.4-3-7.8-8.4-8.4C9 7.8 11.4 5.4 12 0z" />
    </svg>
  )
}

function LaurelBranch({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 40" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M13 40C9 30 8 20 12 8c1.5 8 2 20-1 32z" opacity="0.9" />
      <path d="M12 34c-4-1-6-3-7-7 3 .5 5 2 7 7zM13 28c-4-1-6-3-6-8 3 1 5 3 6 8zM13 21c-3-1-5-4-5-8 3 1 4 4 5 8zM14 15c-3-1-4-4-4-8 3 1 4 4 4 8z" />
    </svg>
  )
}

type PodiumSpot = {
  place: 1 | 2 | 3
  bodyHeight: string
  bodyOverlap: string
  avatarSize: string
  laurelSize: string
  crownSize: string
  crownOffset: string
  crown: string
  laurel: string
  metal: string
  bodyGradient: string
  bodyRing: string
  ringColor: string
  glow: string
  badgeGradient: string
  numberColor: string
}

const spots: Record<number, PodiumSpot> = {
  1: {
    place: 1,
    bodyHeight: "h-48",
    bodyOverlap: "-mt-6",
    avatarSize: "h-24 w-24",
    laurelSize: "h-44 w-44",
    crownSize: "h-[72px] w-[72px]",
    crownOffset: "-top-11",
    crown: "/images/crown-gold.png?v=cf5",
    laurel: "/images/laurel-gold.png?v=cf5",
    metal: "from-yellow-300 via-amber-500 to-amber-700",
    bodyGradient: "from-amber-300 via-amber-500 to-amber-600",
    bodyRing: "ring-amber-200/70",
    ringColor: "ring-yellow-300",
    glow: "shadow-[0_0_70px_-5px_rgba(250,204,21,0.7)]",
    badgeGradient: "from-yellow-300 to-amber-600",
    numberColor: "text-amber-900/70",
  },
  2: {
    place: 2,
    bodyHeight: "h-40",
    bodyOverlap: "-mt-6",
    avatarSize: "h-20 w-20",
    laurelSize: "h-40 w-40",
    crownSize: "h-14 w-14",
    crownOffset: "-top-8",
    crown: "/images/crown-silver.png?v=cf5",
    laurel: "/images/laurel-silver.png?v=cf5",
    metal: "from-slate-200 via-slate-400 to-slate-600",
    bodyGradient: "from-slate-300 via-slate-400 to-slate-500",
    bodyRing: "ring-slate-200/70",
    ringColor: "ring-slate-200",
    glow: "shadow-[0_0_45px_-8px_rgba(203,213,225,0.55)]",
    badgeGradient: "from-slate-400 to-slate-600",
    numberColor: "text-slate-600/70",
  },
  3: {
    place: 3,
    bodyHeight: "h-32",
    bodyOverlap: "-mt-1",
    avatarSize: "h-20 w-20",
    laurelSize: "h-40 w-40",
    crownSize: "h-14 w-14",
    crownOffset: "-top-8",
    crown: "/images/crown-bronze.png?v=cf5",
    laurel: "/images/laurel-bronze.png?v=cf5",
    metal: "from-orange-300 via-orange-600 to-amber-800",
    bodyGradient: "from-orange-400 via-orange-500 to-orange-700",
    bodyRing: "ring-orange-200/70",
    ringColor: "ring-orange-400",
    glow: "shadow-[0_0_45px_-8px_rgba(251,146,60,0.55)]",
    badgeGradient: "from-orange-400 to-amber-700",
    numberColor: "text-amber-950/60",
  },
}

function initials(name?: string) {
  return (name || "BP").trim().split(/\s+/).filter(Boolean).slice(0, 2).map((v) => v[0]).join("").toUpperCase() || "BP"
}

function PodiumColumn({ place, player, className = "" }: { place: 1 | 2 | 3; player?: BattleEntry; className?: string }) {
  const s = spots[place]
  const isChampion = place === 1
  const isBronze = place === 3
  const name = player?.nickname || "Posisi terbuka"
  const region = player?.province_name || "Indonesia"

  return (
    <div className={`flex flex-col items-center justify-end ${className}`}>
      <div className="relative z-20 flex flex-col items-center">
        {isChampion && (
          <>
            <div className="pointer-events-none absolute -top-6 h-32 w-32 rounded-full bg-yellow-400/25 blur-3xl" />
            <div className="pointer-events-none absolute inset-0 -top-8">
              <Sparkle className="absolute -left-2 top-2 h-3 w-3 text-yellow-200/90 [animation-delay:0ms]" />
              <Sparkle className="absolute right-0 top-6 h-4 w-4 text-amber-300/90 [animation-delay:400ms]" />
              <Sparkle className="absolute -right-3 top-20 h-2.5 w-2.5 text-yellow-100/80 [animation-delay:800ms]" />
              <Sparkle className="absolute left-0 top-24 h-3 w-3 text-amber-200/80 [animation-delay:1200ms]" />
            </div>
          </>
        )}

        <div className={`relative flex ${s.laurelSize} items-center justify-center`}>
          <img src={s.crown} alt="" aria-hidden="true" decoding="async" className={`absolute ${s.crownOffset} left-1/2 ${s.crownSize} -translate-x-1/2 object-contain ${isChampion ? "drop-shadow-[0_0_18px_rgba(250,204,21,0.8)]" : "drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]"}`} />
          <img src={s.laurel} alt="" aria-hidden="true" decoding="async" className={`absolute inset-0 ${s.laurelSize} object-contain ${isChampion ? "drop-shadow-[0_0_16px_rgba(250,204,21,0.5)]" : "drop-shadow-[0_4px_12px_rgba(0,0,0,0.45)]"}`} />
          <div className="relative">
            <div className={`rounded-full bg-gradient-to-br ${s.metal} p-[3px] ${s.glow}`}>
              <div className="rounded-full bg-slate-950 p-[2px]">
                {player?.avatar_url ? (
                  <img src={player.avatar_url} alt={name} className={`${s.avatarSize} rounded-full object-cover ring-2 ${s.ringColor}/60`} />
                ) : (
                  <div className={`${s.avatarSize} flex items-center justify-center rounded-full bg-slate-900 text-xl font-black text-white ring-2 ${s.ringColor}/60`}>{initials(name)}</div>
                )}
              </div>
            </div>
            <span className={`absolute -bottom-2 left-1/2 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full bg-gradient-to-br ${s.badgeGradient} text-sm font-black text-white shadow-lg ring-4 ring-slate-950`}>{place}</span>
          </div>
        </div>
      </div>

      <div className={`relative z-10 ${s.bodyOverlap} flex w-full ${s.bodyHeight} flex-col items-center rounded-t-2xl bg-gradient-to-b ${s.bodyGradient} px-3 ${isBronze ? "pb-3 pt-4" : "pb-4 pt-9"} text-center ring-1 ${s.bodyRing} ${s.glow}`}>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1/3 rounded-t-2xl bg-gradient-to-b from-white/45 to-transparent" />
        <p className={`relative z-20 max-w-full shrink-0 truncate font-bold leading-tight text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.45)] ${isChampion ? "text-base" : isBronze ? "text-[13px]" : "text-sm"}`}>{name}</p>
        <p className={`relative z-20 max-w-full shrink-0 truncate font-medium leading-tight text-white/85 [text-shadow:0_1px_2px_rgba(0,0,0,0.4)] ${isBronze ? "text-[10px]" : "text-xs"}`}>{region}</p>
        <p className={`relative z-20 ${isBronze ? "mt-3" : "mt-2"} shrink-0 font-black leading-tight text-white [text-shadow:0_2px_6px_rgba(0,0,0,0.45)] ${isChampion ? "text-4xl" : "text-3xl"}`}><span className="tabular-nums">{formatScore(player?.battle_score)}</span> poin</p>
      </div>

      <div className="relative w-full">
        <div className="pointer-events-none absolute -bottom-3 left-1/2 h-7 w-[92%] -translate-x-1/2 blur-[6px]" style={{ background: "radial-gradient(closest-side, rgba(0,0,0,0.5), rgba(0,0,0,0.28) 55%, rgba(0,0,0,0) 78%)" }} />
        <div className={`relative flex ${isChampion ? "h-16" : "h-14"} w-full items-center justify-center overflow-hidden rounded-b-[26px] rounded-t-sm bg-gradient-to-b ${s.metal} ${s.glow}`}>
          <div className="absolute inset-x-3 top-0.5 h-3 rounded-full bg-white/40 blur-[3px]" />
          <div className="absolute inset-x-6 top-[3px] h-px bg-white/60" />
          <div className="absolute -inset-y-2 -left-1/3 w-1/3 rotate-12 bg-gradient-to-r from-transparent via-white/35 to-transparent blur-[2px] motion-safe:animate-[sheen_3.5s_ease-in-out_infinite]" />
          <div className="absolute inset-x-0 bottom-0 h-5 rounded-b-[26px] bg-gradient-to-t from-black/30 to-transparent" />
          <div className="absolute inset-y-0 left-0 w-1/5 rounded-bl-[26px] bg-gradient-to-r from-white/25 to-transparent" />
          <div className="absolute inset-y-0 right-0 w-1/5 rounded-br-[26px] bg-gradient-to-l from-black/25 to-transparent" />
          {isChampion ? (
            <div className="relative flex flex-col items-center leading-none">
              <div className="flex items-center justify-center"><span className={`text-3xl font-black ${s.numberColor}`}>1</span></div>
              <span className="mt-0.5 text-[9px] font-black uppercase tracking-[0.3em] text-amber-950/70">Champion</span>
            </div>
          ) : <span className={`relative text-3xl font-black ${s.numberColor}`}>{place}</span>}
        </div>
      </div>
    </div>
  )
}

export function Podium({ entries }: { entries: BattleEntry[] }) {
  const first = entries.find((e) => Number(e.national_rank) === 1) || entries[0]
  const second = entries.find((e) => Number(e.national_rank) === 2) || entries[1]
  const third = entries.find((e) => Number(e.national_rank) === 3) || entries[2]

  return (
    <div className="relative">
      <div className="pointer-events-none absolute -inset-x-6 bottom-0 top-1/3 rounded-[40px] bg-gradient-to-t from-amber-500/12 via-transparent to-transparent blur-2xl" />
      <div className="relative flex flex-wrap items-end justify-center gap-x-3 gap-y-8 lg:flex-nowrap">
        <PodiumColumn place={2} player={second} className="order-2 basis-[46%] lg:order-1 lg:basis-0 lg:flex-1" />
        <PodiumColumn place={1} player={first} className="order-1 basis-full lg:order-2 lg:basis-0 lg:flex-1" />
        <PodiumColumn place={3} player={third} className="order-3 basis-[46%] lg:order-3 lg:basis-0 lg:flex-1" />
      </div>
    </div>
  )
}
