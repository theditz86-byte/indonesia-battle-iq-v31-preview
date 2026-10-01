import { BUMN_ASSET, SKD_ASSET } from "./scene-gates"
import { CASN_ASSET } from "./scene-casn"
import { TROPHY_ASSET } from "./scene-trophy"

const SPARKS = [
  [640, 330, 3], [700, 520, 2], [820, 250, 2], [1180, 420, 3], [1290, 300, 2],
  [980, 610, 3], [1230, 640, 2], [560, 160, 2], [1000, 120, 2], [760, 700, 2],
  [1320, 520, 3], [900, 380, 2], [1100, 700, 2], [620, 640, 2], [1060, 80, 2],
  [770, 90, 3], [1200, 200, 2],
]

function Paper({ left, top, rotate = 0, flip = false, size = 96 }: { left:number; top:number; rotate?:number; flip?:boolean; size?:number }) {
  return <div aria-hidden="true" className="pointer-events-none absolute rounded-md border-2 border-amber-300 bg-[#f7e9c9] shadow-[0_0_18px_rgba(255,190,40,.5)]" style={{left,top,width:size*.68,height:size,transform:`rotate(${rotate}deg) scaleX(${flip?-1:1})`}}>
    <div className="absolute left-[14%] top-[18%] h-[12%] w-[18%] rounded-sm border-2 border-slate-600"/>
    <div className="absolute left-[39%] top-[20%] h-[4%] w-[45%] rounded bg-slate-600"/>
    <div className="absolute left-[39%] top-[33%] h-[4%] w-[35%] rounded bg-slate-600"/>
    <div className="absolute left-[14%] top-[51%] h-[10%] w-[16%] rounded-sm border-2 border-slate-600"/>
    <div className="absolute left-[39%] top-[53%] h-[4%] w-[45%] rounded bg-slate-600"/>
    <div className="absolute left-[39%] top-[66%] h-[4%] w-[36%] rounded bg-slate-600"/>
  </div>
}

function Coin() {
  return <div aria-hidden="true" className="pointer-events-none absolute left-[648px] top-[388px] grid h-[120px] w-[120px] place-items-center rounded-full border-[8px] border-amber-300 bg-[radial-gradient(circle,#27306a_0%,#121432_67%)] shadow-[0_0_28px_rgba(255,190,40,.82)]">
    <span className="text-[74px] leading-none text-amber-300 drop-shadow-[0_0_12px_rgba(255,190,40,.8)]">✦</span>
  </div>
}

export function SceneArt() {
  return (
    <>
      <svg aria-hidden="true" viewBox="0 0 1380 940" className="pointer-events-none absolute inset-0 h-full w-full" preserveAspectRatio="none">
        <g opacity="0.55">
          <polygon points="560,0 640,0 900,520 820,520" fill="#2f6bff" opacity="0.14" />
          <polygon points="900,0 960,0 1250,600 1180,600" fill="#8b3dff" opacity="0.14" />
          <polygon points="1100,0 1140,0 1380,380 1380,440" fill="#ffb02e" opacity="0.1" />
        </g>
        <g stroke="#6aa8ff" strokeLinecap="round" fill="none">
          <path d="M560 250 L760 120" strokeOpacity="0.45" strokeWidth="1.5" />
          <path d="M1010 30 L1250 210" strokeOpacity="0.4" strokeWidth="1.5" />
          <path d="M600 560 L720 470" strokeOpacity="0.4" strokeWidth="1.5" />
          <path d="M1120 90 L1380 150" strokeOpacity="0.35" strokeWidth="1.5" />
        </g>
      </svg>

      <img src={CASN_ASSET} alt="" className="pointer-events-none absolute" style={{ left:700, top:-40, width:450, height:450 }} />
      <img src={SKD_ASSET} alt="" className="pointer-events-none absolute" style={{ left:470, top:40, width:400, height:400 }} />
      <img src={BUMN_ASSET} alt="" className="pointer-events-none absolute" style={{ left:1085, top:20, width:310, height:310 }} />

      <div aria-hidden="true" className="pointer-events-none absolute mix-blend-screen" style={{ left:540, top:20, width:660, height:700, background:"radial-gradient(closest-side, rgba(255,200,70,.75), rgba(255,140,30,.3) 55%, transparent 100%)" }} />

      <img src={TROPHY_ASSET} alt="" className="pointer-events-none absolute" style={{ left:940, top:100, width:360, height:360, filter:"drop-shadow(0 0 30px rgba(255,170,30,.7))" }} />
      <Coin />
      <Paper left={1262} top={170} rotate={12} size={110} />
      <Paper left={596} top={440} rotate={-14} flip size={96} />

      <svg aria-hidden="true" viewBox="0 0 1380 940" className="pointer-events-none absolute inset-0 h-full w-full" preserveAspectRatio="none">
        {SPARKS.map(([x,y,r],i)=><circle key={i} cx={x} cy={y} r={r} fill={i%3===0?"#7cc4ff":"#ffd23f"} opacity="0.9" />)}
      </svg>
    </>
  )
}

export function RockForeground() {
  return (
    <>
      <svg aria-hidden="true" viewBox="0 0 1380 200" className="pointer-events-none absolute bottom-0 left-0 h-[200px] w-full" preserveAspectRatio="none">
        <defs><linearGradient id="rockFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1a2150"/><stop offset="1" stopColor="#03050f"/></linearGradient></defs>
        <path d="M0 200 L0 90 L40 60 L70 85 L120 40 L170 80 L210 70 L250 120 L330 100 L400 135 L520 120 L600 150 L700 120 L780 130 L860 150 L940 120 L1010 55 L1080 95 L1140 70 L1210 110 L1270 70 L1330 100 L1380 80 L1380 200 Z" fill="url(#rockFill)"/>
        <path d="M70 85 L90 130 L60 170 M170 80 L190 140 M330 100 L360 150 L330 190 M700 120 L720 160 M960 120 L980 160 L950 195 M1080 95 L1100 150 M1210 110 L1240 160 L1210 195" stroke="#ffb02e" strokeOpacity=".85" strokeWidth="2.5" fill="none"/>
        <path d="M250 120 L280 160 M520 120 L540 170 M600 150 L630 190 M1270 70 L1290 120 M860 150 L850 190" stroke="#4f8bff" strokeOpacity=".9" strokeWidth="2.5" fill="none"/>
      </svg>
      <div className="pointer-events-none absolute bottom-0 left-[690px] h-[130px] w-[340px]">
        <div className="absolute bottom-0 left-0 h-[100px] w-full bg-gradient-to-b from-[#1b2150] to-[#04060f] [clip-path:polygon(8%_100%,0_55%,20%_30%,70%_10%,100%_45%,92%_100%)]"/>
        <div className="absolute inset-x-[30%] bottom-[14px] h-[84px] rounded-full bg-amber-400/40 blur-2xl"/>
      </div>
    </>
  )
}
