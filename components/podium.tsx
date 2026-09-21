import type { BattleEntry } from "@/lib/battle"
import { formatScore } from "@/lib/battle"

type Visual = {
  crown: string
  laurel: string
  metal: string
  panel: string
  iq: string
  glow: string
  ring: string
}

const visuals: Record<1|2|3, Visual> = {
  1: {
    crown:"/images/crown-gold.svg",
    laurel:"/images/laurel-gold.svg",
    metal:"from-[#ffd966] via-[#f6b70a] to-[#c77600]",
    panel:"from-[#fffdf5] via-[#fffaf0] to-[#fff0bc]",
    iq:"text-[#d48800]",
    glow:"shadow-[0_0_38px_rgba(251,191,36,.58)]",
    ring:"ring-[#ffd34e]"
  },
  2: {
    crown:"/images/crown-silver.svg",
    laurel:"/images/laurel-silver.svg",
    metal:"from-[#f8fafc] via-[#b8c7d9] to-[#66768b]",
    panel:"from-[#ffffff] via-[#f8fbff] to-[#e8eef7]",
    iq:"text-[#3459e6]",
    glow:"shadow-[0_0_24px_rgba(203,213,225,.42)]",
    ring:"ring-[#dbe7f5]"
  },
  3: {
    crown:"/images/crown-bronze.svg",
    laurel:"/images/laurel-bronze.svg",
    metal:"from-[#ffc28f] via-[#e97c38] to-[#a33f12]",
    panel:"from-[#fffaf6] via-[#fff7f1] to-[#ffe8da]",
    iq:"text-[#3459e6]",
    glow:"shadow-[0_0_24px_rgba(251,146,60,.42)]",
    ring:"ring-[#f59b5a]"
  },
}

function initials(name?:string){
  return (name||"IQ").trim().split(/\s+/).filter(Boolean).slice(0,2).map(s=>s[0]).join("").toUpperCase() || "IQ"
}

function playerAt(entries:BattleEntry[], rank:number){
  return entries.find(e=>Number(e.national_rank)===rank) || entries[rank-1]
}

function PlayerHead({place, player}:{place:1|2|3; player?:BattleEntry}){
  const v=visuals[place]
  const name=player?.nickname || "Posisi terbuka"
  const avatarSize=place===1 ? "h-[116px] w-[116px]" : "h-[92px] w-[92px]"
  const wreathSize=place===1 ? "h-[190px] w-[190px]" : "h-[154px] w-[154px]"
  const crownSize=place===1 ? "h-[76px] w-[112px] -top-[52px]" : "h-[58px] w-[88px] -top-[38px]"
  return (
    <div className={`relative flex ${wreathSize} items-center justify-center`}>
      <img src={v.laurel} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-contain drop-shadow-[0_0_12px_rgba(255,255,255,.18)]"/>
      <img src={v.crown} alt="" aria-hidden="true" className={`absolute left-1/2 ${crownSize} -translate-x-1/2 object-contain drop-shadow-[0_0_18px_rgba(251,191,36,.55)]`}/>
      <div className={`relative rounded-full bg-[#06142f] p-[5px] ring-4 ${v.ring} ${v.glow}`}>
        {player?.avatar_url
          ? <img src={player.avatar_url} alt={name} className={`${avatarSize} rounded-full object-cover`}/>
          : <div className={`${avatarSize} flex items-center justify-center rounded-full bg-gradient-to-br from-[#132c5e] to-[#050d20] text-2xl font-black text-white`}>{initials(name)}</div>
        }
        <span className={`absolute -bottom-2 left-1/2 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full bg-gradient-to-b ${v.metal} text-sm font-black text-white ring-[4px] ring-[#06142f]`}>{place}</span>
      </div>
    </div>
  )
}

function PodiumBlock({place, player}:{place:1|2|3; player?:BattleEntry}){
  const v=visuals[place]
  const isOne=place===1
  const infoHeight=isOne ? "h-[150px]" : place===2 ? "h-[124px]" : "h-[112px]"
  const baseHeight=isOne ? "h-[82px]" : "h-[66px]"
  const name=player?.nickname || "Posisi terbuka"
  const region=player?.province_name || "Indonesia"
  return (
    <div className={`flex min-w-0 flex-1 flex-col items-center justify-end ${isOne ? "z-20" : "z-10"}`}>
      <div className={`${isOne ? "mb-[-7px]" : "mb-[-5px]"}`}>
        <PlayerHead place={place} player={player}/>
      </div>
      <div className={`relative w-full overflow-hidden rounded-t-[20px] bg-gradient-to-b ${v.panel} ${infoHeight} px-2 pt-8 text-center text-slate-900 ring-1 ring-white/70 ${v.glow}`}>
        <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-white/80 to-transparent"/>
        <p className={`relative truncate font-extrabold ${isOne ? "text-[17px]" : "text-sm"}`}>{name}</p>
        <p className="relative mt-1 truncate text-[11px] text-slate-500">{region}</p>
        <p className={`relative mt-2 font-black ${v.iq} ${isOne ? "text-[30px]" : "text-[23px]"}`}>IQ {player?.iq_estimate ?? "—"}</p>
        <p className="relative text-[11px] font-medium text-slate-500">{player ? formatScore(player.battle_score) : "0"} poin</p>
      </div>
      <div className={`relative flex w-full ${baseHeight} items-center justify-center overflow-hidden rounded-b-[18px] bg-gradient-to-b ${v.metal} ${v.glow}`}>
        <div className="absolute inset-x-4 top-1.5 h-2 rounded-full bg-white/35 blur-[2px]"/>
        <div className="absolute inset-x-0 bottom-0 h-4 bg-black/15"/>
        <span className={`${isOne ? "text-[34px]" : "text-[30px]"} font-black text-white drop-shadow`}>{place}</span>
        {isOne && <span className="absolute bottom-2 text-[9px] font-black uppercase tracking-[.28em] text-[#784a00]">Champion</span>}
      </div>
    </div>
  )
}

export function Podium({entries}:{entries:BattleEntry[]}){
  const first=playerAt(entries,1)
  const second=playerAt(entries,2)
  const third=playerAt(entries,3)
  return (
    <div className="relative mx-auto w-full max-w-[650px]">
      <div className="pointer-events-none absolute left-1/2 top-[35%] h-[280px] w-[390px] -translate-x-1/2 rounded-full bg-amber-300/18 blur-[70px]"/>
      <div className="relative grid grid-cols-[.92fr_1.14fr_.92fr] items-end gap-2 sm:gap-3">
        <PodiumBlock place={2} player={second}/>
        <PodiumBlock place={1} player={first}/>
        <PodiumBlock place={3} player={third}/>
      </div>
    </div>
  )
}
