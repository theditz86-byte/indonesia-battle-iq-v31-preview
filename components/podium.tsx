import type { BattleEntry } from "@/lib/battle"
import { formatScore } from "@/lib/battle"

type Metal = "gold" | "silver" | "bronze"

const palette: Record<Metal, { light:string; mid:string; dark:string; glow:string; crown:string; body:string; base:string; text:string }> = {
  gold:{light:"#fff0a6",mid:"#f7c62a",dark:"#b56b00",glow:"rgba(250,204,21,.58)",crown:"/images/crown-gold.svg",body:"from-[#ffcf45] via-[#f59e0b] to-[#e57d00]",base:"from-[#ffd766] via-[#f4b40b] to-[#b96400]",text:"text-[#7a4200]"},
  silver:{light:"#f8fbff",mid:"#cdd9e7",dark:"#65768b",glow:"rgba(203,213,225,.42)",crown:"/images/crown-silver.svg",body:"from-[#eef4fb] via-[#aebfd1] to-[#72849a]",base:"from-[#f4f7fb] via-[#bcc9d8] to-[#6f8196]",text:"text-[#435268]"},
  bronze:{light:"#ffd3ad",mid:"#ef8d4a",dark:"#9a3f16",glow:"rgba(251,146,60,.46)",crown:"/images/crown-bronze.svg",body:"from-[#ffab6f] via-[#f16c18] to-[#c54708]",base:"from-[#ffc18e] via-[#e97831] to-[#9f3a10]",text:"text-[#6c2b0e]"},
}

function initials(name?: string) {
  return (name || "IQ").trim().split(/\s+/).filter(Boolean).slice(0,2).map(v=>v[0]).join("").toUpperCase() || "IQ"
}

function Wreath({ metal, size=154 }: { metal: Metal; size?: number }) {
  const p=palette[metal]
  const leaves = Array.from({length:9},(_,i)=>i)
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} aria-hidden="true" className="absolute inset-1/2 -translate-x-1/2 -translate-y-1/2 overflow-visible">
      <defs>
        <linearGradient id={`g-${metal}`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor={p.light}/>
          <stop offset=".48" stopColor={p.mid}/>
          <stop offset="1" stopColor={p.dark}/>
        </linearGradient>
        <filter id={`gl-${metal}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <circle cx="100" cy="100" r="73" fill="none" stroke={p.mid} strokeOpacity=".45" strokeWidth="3"/>
      <g fill={`url(#g-${metal})`} filter={`url(#gl-${metal})`}>
        {leaves.map(i=>{
          const a=-140+i*12
          const rad=a*Math.PI/180
          const x=100+78*Math.cos(rad), y=100+78*Math.sin(rad)
          return <ellipse key={`l-${i}`} cx={x} cy={y} rx="7.5" ry="16" transform={`rotate(${a+90} ${x} ${y})`} />
        })}
        {leaves.map(i=>{
          const a=-40+i*12
          const rad=a*Math.PI/180
          const x=100+78*Math.cos(rad), y=100+78*Math.sin(rad)
          return <ellipse key={`r-${i}`} cx={x} cy={y} rx="7.5" ry="16" transform={`rotate(${a-90} ${x} ${y})`} />
        })}
      </g>
      <path d="M49 150 C65 174, 84 184, 100 187" fill="none" stroke={p.mid} strokeWidth="5" strokeLinecap="round"/>
      <path d="M151 150 C135 174, 116 184, 100 187" fill="none" stroke={p.mid} strokeWidth="5" strokeLinecap="round"/>
    </svg>
  )
}

function PlayerHead({ place, player }: { place:1|2|3; player?:BattleEntry }) {
  const metal:Metal=place===1?"gold":place===2?"silver":"bronze"
  const p=palette[metal]
  const name=player?.nickname || "Posisi terbuka"
  const avatar=place===1?104:86
  const wrap=place===1?166:142
  return (
    <div className="relative flex items-center justify-center" style={{width:wrap,height:wrap}}>
      <div className="absolute inset-3 rounded-full blur-2xl" style={{background:p.glow}}/>
      <Wreath metal={metal} size={wrap}/>
      <img src={p.crown} alt="" aria-hidden="true" className={`absolute left-1/2 z-20 -translate-x-1/2 object-contain drop-shadow-[0_0_16px_rgba(255,210,80,.45)] ${place===1?"-top-9 h-16 w-20":"-top-5 h-12 w-16"}`}/>
      <div className="relative z-10 rounded-full p-[4px]" style={{background:`linear-gradient(145deg,${p.light},${p.mid} 55%,${p.dark})`,boxShadow:`0 0 26px ${p.glow}`}}>
        <div className="rounded-full bg-[#06122a] p-[3px]">
          {player?.avatar_url
            ? <img src={player.avatar_url} alt={name} className="rounded-full object-cover" style={{width:avatar,height:avatar}}/>
            : <div className="grid place-items-center rounded-full bg-gradient-to-br from-[#19305b] to-[#040b19] text-xl font-black text-white" style={{width:avatar,height:avatar}}>{initials(name)}</div>}
        </div>
      </div>
      <span className="absolute bottom-0 left-1/2 z-30 grid h-9 w-9 -translate-x-1/2 place-items-center rounded-full text-sm font-black text-white ring-4 ring-[#071226]"
        style={{background:`linear-gradient(145deg,${p.light},${p.mid} 55%,${p.dark})`,boxShadow:`0 5px 14px ${p.glow}`}}>
        {place}
      </span>
    </div>
  )
}

function Column({place,player}:{place:1|2|3;player?:BattleEntry}) {
  const metal:Metal=place===1?"gold":place===2?"silver":"bronze"
  const p=palette[metal]
  const one=place===1
  const name=player?.nickname || "Posisi terbuka"
  const region=player?.province_name || "Indonesia"
  const bodyH=one?"h-[168px]":place===2?"h-[136px]":"h-[120px]"
  return (
    <div className={`flex min-w-0 flex-1 flex-col items-center justify-end ${one?"z-20":"z-10"}`}>
      <div className={one?"mb-[-9px]":"mb-[-7px]"}><PlayerHead place={place} player={player}/></div>
      <div className={`relative w-full overflow-hidden rounded-t-[20px] bg-gradient-to-b ${p.body} ${bodyH} px-3 pt-8 text-center text-white shadow-[0_0_34px_rgba(0,0,0,.18)] ring-1 ring-white/35`}>
        <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-white/35 to-transparent"/>
        <p className={`relative truncate font-extrabold drop-shadow ${one?"text-[17px]":"text-sm"}`}>{name}</p>
        <p className="relative mt-1 truncate text-[11px] font-medium text-white/90">{region}</p>
        <p className={`relative mt-2 font-black tracking-tight text-white [text-shadow:0_2px_7px_rgba(0,0,0,.28)] ${one?"text-[31px]":"text-[25px]"}`}>IQ {player?.iq_estimate ?? "—"}</p>
        <p className="relative text-[11px] font-semibold text-white/90">{formatScore(player?.battle_score)} poin</p>
      </div>
      <div className={`relative flex w-full items-center justify-center overflow-hidden rounded-b-[22px] bg-gradient-to-b ${p.base} ${one?"h-[68px]":"h-[58px]"}`} style={{boxShadow:`0 12px 32px ${p.glow}`}}>
        <div className="absolute inset-x-4 top-1 h-2 rounded-full bg-white/40 blur-[2px]"/>
        <div className="absolute inset-x-0 bottom-0 h-4 bg-black/18"/>
        <span className={`${p.text} font-black ${one?"text-[32px]":"text-[29px]"}`}>{place}</span>
        {one && <span className="absolute bottom-1.5 text-[8px] font-black uppercase tracking-[.3em] text-[#6e4100]">Champion</span>}
      </div>
    </div>
  )
}

export function Podium({entries}:{entries:BattleEntry[]}) {
  const first=entries.find(e=>Number(e.national_rank)===1)||entries[0]
  const second=entries.find(e=>Number(e.national_rank)===2)||entries[1]
  const third=entries.find(e=>Number(e.national_rank)===3)||entries[2]
  return (
    <div className="relative mx-auto w-full max-w-[630px]">
      <div className="pointer-events-none absolute left-1/2 top-[35%] h-[260px] w-[400px] -translate-x-1/2 rounded-full bg-amber-300/14 blur-[65px]"/>
      <div className="relative grid grid-cols-[.92fr_1.13fr_.92fr] items-end gap-2.5">
        <Column place={2} player={second}/>
        <Column place={1} player={first}/>
        <Column place={3} player={third}/>
      </div>
    </div>
  )
}
