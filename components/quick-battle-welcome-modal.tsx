"use client"

import Image from "next/image"
import { usePathname } from "next/navigation"
import { ArrowRight, Check, ClipboardList, Crown, ShieldCheck, Target, Trophy, X, Zap } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"

const DISMISS_KEY = "alzava_quickbattle_popup_dismissed_at"
const DAY_MS = 24 * 60 * 60 * 1000
const SHOW_DELAY_MS = 1500
const STAGE_W = 1380
const STAGE_H = 940

const benefits = [
  { icon: ClipboardList, lines: ["5 Soal", "Pilihan"] },
  { icon: Target, lines: ["TWK + TIU", "+ TKP"] },
  { icon: Zap, lines: ["Hasil", "Langsung"] },
  { icon: Trophy, lines: ["Tidak", "Memengaruhi", "Ranking"] },
]

function Gate({ x, y, w, h, label, accent, gold = false }: { x: number; y: number; w: number; h: number; label: string; accent: string; gold?: boolean }) {
  const mid = x + w / 2
  return <g>
    <ellipse cx={mid} cy={y + h * .54} rx={w * .72} ry={h * .62} fill={accent} opacity={gold ? .17 : .12} filter="url(#qbBlur)" />
    <path d={`M${x - 16} ${y + 26} L${mid} ${y - 30} L${x + w + 16} ${y + 26} Z`} fill={gold ? "#2a1b24" : "#081b50"} stroke={accent} strokeWidth="2" strokeOpacity=".8" />
    <rect x={x - 12} y={y + 26} width={w + 24} height="34" fill="#071435" stroke={accent} strokeWidth="2" strokeOpacity=".9" />
    <rect x={x} y={y + 60} width={w} height={h - 60} rx="4" fill={gold ? "url(#qbGoldGate)" : "url(#qbBlueGate)"} stroke={accent} strokeWidth="2" strokeOpacity=".72" />
    <rect x={x + 18} y={y + 86} width={w - 36} height={h - 102} fill="#071334" opacity=".7" stroke={accent} strokeOpacity=".55" />
    <rect x={x - 10} y={y + 60} width="16" height={h - 60} fill="#08143c" stroke="#f5bd3b" strokeOpacity=".55" />
    <rect x={x + w - 6} y={y + 60} width="16" height={h - 60} fill="#08143c" stroke="#f5bd3b" strokeOpacity=".55" />
    <text x={mid} y={y + 49} textAnchor="middle" fill={accent} fontSize={label === "CASN" ? 32 : 31} fontWeight="900" fontStyle="italic" style={{ filter: `drop-shadow(0 0 8px ${accent})` }}>{label}</text>
  </g>
}

function Person({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${s})`} opacity=".88">
    <circle cx="0" cy="0" r="18" fill="#081431" />
    <path d="M-40 108 C-38 44 -27 27 0 27 C27 27 38 44 40 108 Z" fill="#081431" />
    <path d="M-8 29 L0 66 L8 29 Z" fill="#a7b8dc" opacity=".32" />
  </g>
}

function Document({ x, y, rotate = 0 }: { x: number; y: number; rotate?: number }) {
  return <g transform={`translate(${x} ${y}) rotate(${rotate})`} filter="url(#qbSmallGlow)">
    <rect x="-34" y="-46" width="68" height="92" rx="5" fill="#f7e9c9" stroke="#ffc947" strokeWidth="2" />
    <rect x="-24" y="-28" width="12" height="12" rx="2" fill="none" stroke="#3b4160" strokeWidth="2" />
    <path d="M-7 -22 H23 M-7 -11 H17 M-24 4 H-12 M-7 10 H24 M-24 26 H-12 M-7 31 H19" stroke="#3b4160" strokeWidth="3" strokeLinecap="round" />
    <path d="M-23 -22 l4 4 l8 -9" fill="none" stroke="#f2a91d" strokeWidth="3" />
  </g>
}

function TrophyArt() {
  return <g transform="translate(985 160)" filter="url(#qbGoldGlow)">
    <circle cx="30" cy="170" r="86" fill="#211433" stroke="#ffca3b" strokeWidth="10" opacity=".92" />
    <path d="M30 102 L44 146 L90 146 L53 172 L67 216 L30 190 L-7 216 L7 172 L-30 146 L16 146 Z" fill="#ffd651" />
    <path d="M65 220 C67 300 72 338 96 380 C120 338 125 300 127 220 Z" fill="url(#qbTrophy)" stroke="#ffd45a" strokeWidth="7" />
    <path d="M68 239 C18 226 7 196 14 164 C28 178 44 187 70 190 M124 239 C174 226 185 196 178 164 C164 178 148 187 122 190" fill="none" stroke="#ffd45a" strokeWidth="17" strokeLinecap="round" />
    <rect x="75" y="374" width="42" height="42" rx="5" fill="#e79611" stroke="#ffe38a" strokeWidth="5" />
    <path d="M52 416 H140 L158 458 H34 Z" fill="#f4a917" stroke="#ffe38a" strokeWidth="6" />
    <path d="M14 14 L42 62 L75 8 L95 53 L125 5 L143 65 L176 24 L165 92 H27 Z" fill="#ffbf26" stroke="#ffe586" strokeWidth="6" />
    <circle cx="44" cy="62" r="7" fill="#ff615e" /><circle cx="94" cy="53" r="7" fill="#8e5cff" /><circle cx="143" cy="65" r="7" fill="#28d9ff" />
  </g>
}

function Scene() {
  const sparks = [[640,330,3],[700,520,2],[820,250,2],[1180,420,3],[1290,300,2],[980,610,3],[1230,640,2],[560,160,2],[1000,120,2],[760,700,2],[1320,520,3],[900,380,2],[1100,700,2],[620,640,2],[1060,80,2],[770,90,3],[1200,200,2]] as const
  return <svg aria-hidden="true" viewBox="0 0 1380 940" className="pointer-events-none absolute inset-0 h-full w-full" preserveAspectRatio="none">
    <defs>
      <linearGradient id="qbBlueGate" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#173d9a" stopOpacity=".92"/><stop offset="1" stopColor="#08102c" stopOpacity=".96"/></linearGradient>
      <linearGradient id="qbGoldGate" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5a3428" stopOpacity=".9"/><stop offset="1" stopColor="#11102d" stopOpacity=".98"/></linearGradient>
      <linearGradient id="qbTrophy" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff2a1"/><stop offset=".35" stopColor="#ffba1d"/><stop offset=".65" stopColor="#bc6f08"/><stop offset="1" stopColor="#ffd95a"/></linearGradient>
      <linearGradient id="qbRock" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1a2150"/><stop offset="1" stopColor="#03050f"/></linearGradient>
      <filter id="qbBlur" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="24"/></filter>
      <filter id="qbGoldGlow" x="-70%" y="-70%" width="240%" height="240%"><feDropShadow dx="0" dy="0" stdDeviation="15" floodColor="#ffb31f" floodOpacity=".72"/><feDropShadow dx="0" dy="0" stdDeviation="34" floodColor="#ff8d17" floodOpacity=".35"/></filter>
      <filter id="qbSmallGlow" x="-80%" y="-80%" width="260%" height="260%"><feDropShadow dx="0" dy="0" stdDeviation="8" floodColor="#ffbe38" floodOpacity=".48"/></filter>
    </defs>
    <polygon points="520,0 650,0 905,520 820,520" fill="#2f6bff" opacity=".1" />
    <polygon points="880,0 980,0 1240,590 1170,590" fill="#8b3dff" opacity=".1" />
    <polygon points="1080,0 1180,0 1380,360 1380,455" fill="#ffb02e" opacity=".08" />
    <Gate x={535} y={80} w={175} h={310} label="SKD" accent="#2ee7ff" />
    <Gate x={760} y={24} w={215} h={360} label="CASN" accent="#ffd13b" gold />
    <Gate x={1110} y={82} w={188} h={312} label="BUMN" accent="#2de3ff" />
    <Person x={620} y={245} s={1.05} /><Person x={867} y={230} s={1.08} /><Person x={1206} y={250} s={1.02} />
    <TrophyArt /><Document x={1307} y={232} rotate={13} /><Document x={604} y={438} rotate={-13} />
    <path d="M520 260 L750 114 M1000 26 L1272 210 M585 565 L735 463 M1110 88 L1380 158" stroke="#6aa8ff" strokeLinecap="round" strokeOpacity=".32" strokeWidth="1.5" fill="none" />
    {sparks.map(([x,y,r],i)=><circle key={i} cx={x} cy={y} r={r} fill={i%3===0?"#7cc4ff":"#ffd23f"} opacity=".9"/>)}
    <path d="M0 940 L0 830 L40 800 L70 825 L120 780 L170 820 L250 860 L330 840 L520 860 L700 860 L860 890 L1010 795 L1080 835 L1210 850 L1270 810 L1380 820 L1380 940 Z" fill="url(#qbRock)" />
    <path d="M70 825 L90 870 L60 910 M170 820 L190 880 M330 840 L360 890 M960 860 L980 900 M1210 850 L1240 900" stroke="#ffb02e" strokeOpacity=".82" strokeWidth="2.5" fill="none" />
    <path d="M250 860 L280 900 M520 860 L540 910 M860 890 L850 930 M1270 810 L1290 860" stroke="#4f8bff" strokeOpacity=".9" strokeWidth="2.5" fill="none" />
  </svg>
}

function ScoreCard({ compact = false }: { compact?: boolean }) {
  return <div className={`rounded-[24px] border border-cyan-300/60 bg-[#071447]/90 p-5 text-white shadow-[0_0_34px_rgba(30,144,255,.52)] ${compact ? "w-[230px]" : "w-[256px]"}`}>
    <div className="flex items-center gap-2 text-[11px] font-black"><Crown className="h-5 w-5 text-amber-300"/>Battle Point Awal</div>
    <div className="mt-2 text-right text-[32px] font-black italic">??? <span className="text-[20px]">/ 500</span></div>
    <div className="mt-3 h-3 rounded-full bg-white/10"><div className="h-3 w-[31%] rounded-full bg-gradient-to-r from-yellow-300 to-amber-500"/></div>
    <div className="mt-4 space-y-2 border-t border-white/10 pt-4 text-sm font-bold">
      {["TWK","TIU","TKP"].map(x=><div key={x} className="flex items-center justify-between"><span>{x}</span><span className="grid h-6 w-6 place-items-center rounded-full bg-cyan-400 text-slate-950"><Check className="h-4 w-4"/></span></div>)}
    </div>
  </div>
}

function MainCopy() {
  return <>
    <div className="inline-flex h-[50px] items-center gap-3 rounded-full border-2 border-amber-300 bg-[#0a1030]/75 px-6 text-[18px] font-black uppercase tracking-[.14em] text-amber-300 shadow-[0_0_22px_rgba(247,197,49,.42)]"><Zap className="h-5 w-5 fill-amber-300"/>Quick Battle Gratis</div>
    <h2 id="quick-battle-title" className="mt-3 text-[88px] font-black italic leading-[.88] tracking-[-.04em]"><span className="block bg-gradient-to-b from-white to-[#cfe0ff] bg-clip-text text-transparent">Coba</span><span className="block bg-gradient-to-r from-[#ffe21a] via-[#ffb02e] to-[#ff5fd2] bg-clip-text pr-4 text-transparent">Quick Battle</span><span className="block bg-gradient-to-r from-[#25d9ff] via-[#6aa4ff] to-[#e24bff] bg-clip-text text-transparent">Gratis! 🚀</span></h2>
    <p id="quick-battle-desc" className="mt-4 w-[485px] text-[19px] font-medium leading-[1.45] text-white/95">Uji kemampuan awalmu lewat <b>TWK, TIU, dan TKP</b> hanya dalam <b className="text-amber-300">5 soal · ±3 menit.</b> Cocok sebagai pemanasan untuk <b className="text-amber-300">SKD, CASN, dan seleksi BUMN.</b> Tanpa daftar dulu, hasil bisa disimpan setelah kamu buat akun.</p>
  </>
}

function DesktopModal({ onDismiss, onStart }: { onDismiss:()=>void; onStart:()=>void }) {
  return <div className="relative h-[940px] w-[1380px] overflow-hidden rounded-[32px] border-2 border-blue-400/80 bg-[radial-gradient(900px_700px_at_88%_38%,rgba(255,170,40,.28),transparent_60%),radial-gradient(700px_600px_at_55%_45%,rgba(40,90,255,.35),transparent_65%),linear-gradient(100deg,#040a1f_0%,#07123a_40%,#0a1a55_62%,#1a1440_85%,#060a1e_100%)] shadow-[0_35px_120px_rgba(0,0,0,.65),0_0_55px_rgba(37,99,235,.35)]">
    <Scene />
    <div className="absolute left-[46px] top-[30px] flex items-center gap-3"><Image src="/brand/alvaza-logo-new.svg" alt="" width={72} height={72} className="h-[78px] w-[78px] drop-shadow-[0_0_10px_rgba(255,190,40,.6)]"/><div><div className="text-[28px] font-black">ALZAVA <span className="text-amber-300">Battle Point</span></div><div className="mt-1 text-[13px] uppercase tracking-[.22em] text-slate-300">Raih poin. Taklukkan peringkat.</div></div></div>
    <button onClick={onDismiss} aria-label="Tutup Quick Battle" className="absolute right-6 top-6 grid h-[58px] w-[58px] place-items-center rounded-full border-2 border-slate-300/70 bg-[#0a1236]/80 text-white hover:border-cyan-300"><X className="h-7 w-7"/></button>
    <div className="absolute left-[58px] top-[115px]"><MainCopy /></div>
    <div className="absolute left-[57px] top-[565px] grid grid-cols-4 gap-[14px]">{benefits.map(({icon:Icon,lines})=><div key={lines.join("-")} className="flex h-[143px] w-[124px] flex-col items-center justify-center rounded-[18px] border border-blue-400/40 bg-[#0a1236]/75 text-center shadow-[0_0_18px_rgba(60,120,255,.22)]"><Icon className="mb-3 h-10 w-10 text-fuchsia-400"/>{lines.map(t=><div key={t} className="text-[16px] font-black leading-[1.08]">{t}</div>)}</div>)}</div>
    <div aria-hidden="true" className="absolute left-[615px] top-[150px] h-[650px] w-[530px] rounded-full bg-[radial-gradient(circle,rgba(255,196,56,.28),rgba(35,117,255,.14)_48%,transparent_72%)] blur-2xl"/>
    <Image src="/images/aditaka-quick-battle-mini.webp" alt="Host ALZAVA Battle Point" width={480} height={720} priority className="pointer-events-none absolute left-[605px] top-[105px] h-[800px] w-auto object-contain" style={{filter:"drop-shadow(0 0 4px rgba(255,230,130,.95)) drop-shadow(0 0 18px rgba(255,190,50,.82)) drop-shadow(0 0 42px rgba(255,150,20,.55)) drop-shadow(-10px 0 24px rgba(40,190,255,.28)) drop-shadow(0 20px 30px rgba(0,0,0,.7))"}}/>
    <div className="absolute left-[1070px] top-[405px] rotate-[6deg]"><ScoreCard /></div>
    <div className="absolute left-[930px] top-[720px] w-[405px] -rotate-3 text-[34px] font-black italic leading-[1.02] text-white drop-shadow-lg">Seberapa siap kamu<br/>menghadapi<br/><span className="whitespace-nowrap text-[39px] text-amber-300">SKD, CASN &amp; BUMN?</span><span className="mt-2 block h-1 w-[94%] rounded bg-gradient-to-r from-transparent via-amber-300 to-amber-300"/></div>
    <button onClick={onStart} className="absolute left-[47px] top-[728px] flex h-[88px] w-[625px] items-center justify-center gap-5 rounded-[30px] border border-white/50 bg-gradient-to-r from-[#ffd319] via-[#ffb83f] to-[#e32bf5] text-[31px] font-black text-slate-950 shadow-[0_0_30px_rgba(255,200,40,.5),0_0_44px_rgba(227,43,245,.4)] transition hover:-translate-y-0.5 hover:scale-[1.012]"><Zap className="h-8 w-8"/>Mulai Quick Battle<ArrowRight className="h-8 w-8"/></button>
    <button onClick={onDismiss} className="absolute left-[130px] top-[831px] h-[48px] w-[458px] rounded-full border border-blue-400 bg-[#0a1236]/85 text-[18px] font-bold">Nanti saja</button>
    <div className="absolute left-[130px] top-[891px] flex items-center gap-3 text-[14px] text-slate-200"><ShieldCheck className="h-5 w-5 text-violet-300"/>Tanpa login <span>•</span> Gratis <span>•</span> Tidak memengaruhi leaderboard</div>
  </div>
}

function MobileModal({ onDismiss, onStart }: { onDismiss:()=>void; onStart:()=>void }) {
  return <div className="relative max-h-[94vh] w-full overflow-y-auto overflow-x-hidden rounded-[28px] border-2 border-blue-400/80 bg-[radial-gradient(420px_360px_at_85%_22%,rgba(255,170,40,.3),transparent_65%),radial-gradient(400px_400px_at_30%_40%,rgba(40,90,255,.3),transparent_65%),linear-gradient(160deg,#040a1f_0%,#0a1a55_55%,#140f38_100%)] p-5 text-white shadow-[0_30px_100px_rgba(0,0,0,.7)]">
    <div className="flex items-center justify-between"><div className="flex items-center gap-2"><Image src="/brand/alvaza-logo-new.svg" alt="" width={44} height={44}/><div><div className="font-black">ALZAVA <span className="text-amber-300">Battle Point</span></div><div className="text-[8px] uppercase tracking-[.16em] text-slate-400">Raih poin. Taklukkan peringkat.</div></div></div><button onClick={onDismiss} aria-label="Tutup Quick Battle" className="grid h-11 w-11 place-items-center rounded-full border border-white/40 bg-white/5"><X/></button></div>
    <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-amber-300 bg-black/20 px-4 py-2 text-[11px] font-black uppercase tracking-[.12em] text-amber-300"><Zap className="h-4 w-4 fill-amber-300"/>Quick Battle Gratis</div>
    <div className="relative mt-3 min-h-[315px]"><h2 id="quick-battle-title-mobile" className="relative z-10 text-[42px] font-black italic leading-[.88]"><span className="block text-white">Coba</span><span className="block bg-gradient-to-r from-yellow-300 via-orange-300 to-pink-400 bg-clip-text text-transparent">Quick Battle</span><span className="block bg-gradient-to-r from-cyan-300 to-fuchsia-400 bg-clip-text text-transparent">Gratis! 🚀</span></h2><div className="absolute right-[-32px] top-[10px] h-[330px] w-[245px] rounded-full bg-amber-300/10 blur-xl"/><Image src="/images/aditaka-quick-battle-mini.webp" alt="Host ALZAVA Battle Point" width={480} height={720} className="pointer-events-none absolute -right-8 bottom-0 h-[315px] w-auto object-contain" style={{filter:"drop-shadow(0 0 16px rgba(255,190,50,.65)) drop-shadow(-5px 0 16px rgba(45,190,255,.24))"}}/><div className="absolute bottom-2 left-0 text-[19px] font-black text-cyan-300/45">SKD · CASN · BUMN</div></div>
    <p id="quick-battle-desc-mobile" className="mt-2 text-[14px] leading-6 text-slate-200">Uji kemampuan awalmu lewat <b>TWK, TIU, TKP</b> dalam <b className="text-amber-300">5 soal · ±3 menit.</b> Pemanasan untuk <b className="text-amber-300">SKD, CASN &amp; BUMN.</b></p>
    <div className="mt-5 grid grid-cols-2 gap-3">{benefits.map(({icon:Icon,lines})=><div key={lines.join("-")} className="flex h-[108px] flex-col items-center justify-center rounded-2xl border border-blue-400/30 bg-white/5 text-center"><Icon className="mb-2 h-7 w-7 text-fuchsia-400"/>{lines.map(t=><div key={t} className="text-[13px] font-black leading-tight">{t}</div>)}</div>)}</div>
    <div className="mx-auto mt-5 w-fit rotate-2"><ScoreCard compact /></div>
    <div className="mt-5 text-center text-[23px] font-black italic leading-tight">Seberapa siap kamu menghadapi <span className="text-amber-300">SKD, CASN &amp; BUMN?</span></div>
    <button onClick={onStart} className="mt-6 flex min-h-[62px] w-full items-center justify-center gap-3 rounded-[22px] bg-gradient-to-r from-yellow-300 via-orange-300 to-fuchsia-500 text-[20px] font-black text-slate-950"><Zap/>Mulai Quick Battle<ArrowRight/></button>
    <button onClick={onDismiss} className="mx-auto mt-4 block h-12 w-[82%] rounded-full border border-blue-400 bg-[#0a1236]/80 font-bold">Nanti saja</button>
    <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[11px] text-slate-300"><ShieldCheck className="h-4 w-4 text-violet-300"/>Tanpa login <span>•</span> Gratis <span>•</span> Tidak memengaruhi leaderboard</div>
  </div>
}

export function QuickBattleWelcomeModal() {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)
  const [size, setSize] = useState({ w: 1440, h: 900 })
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (pathname !== "/" && pathname !== "/battle") return
    const forced = new URLSearchParams(window.location.search).has("qb")
    let suppressed = false
    if (!forced) {
      try { const dismissed = Number(localStorage.getItem(DISMISS_KEY)); suppressed = Boolean(dismissed) && Date.now() - dismissed < DAY_MS } catch {}
    }
    if (suppressed) return
    const timer = window.setTimeout(() => { setMounted(true); requestAnimationFrame(()=>requestAnimationFrame(()=>setVisible(true))) }, SHOW_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [pathname])

  const dismiss = useCallback(() => {
    try { localStorage.setItem(DISMISS_KEY, Date.now().toString()) } catch {}
    setVisible(false); window.setTimeout(()=>setMounted(false),220)
  }, [])
  const start = useCallback(() => { window.location.href = "/pretest" }, [])

  useEffect(() => {
    if (!mounted) return
    const update = () => setSize({ w: window.innerWidth, h: window.innerHeight })
    update(); window.addEventListener("resize", update)
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") dismiss() }
    document.addEventListener("keydown", key)
    const prev = document.body.style.overflow; document.body.style.overflow = "hidden"
    return () => { window.removeEventListener("resize", update); document.removeEventListener("keydown", key); document.body.style.overflow = prev }
  }, [mounted, dismiss])

  useEffect(()=>{ if(visible) dialogRef.current?.focus() },[visible])

  if (!mounted) return null
  const mobile = size.w < 768
  const scale = Math.min(Math.min(size.w * .92, STAGE_W) / STAGE_W, size.h * .9 / STAGE_H)
  return <div className={`fixed inset-0 z-[9999] flex ${mobile?"items-end justify-center pb-2":"items-center justify-center"} bg-[rgba(1,7,20,.82)] backdrop-blur-[10px] transition-opacity duration-200 ${visible?"opacity-100":"opacity-0"}`} onMouseDown={e=>{if(e.target===e.currentTarget)dismiss()}}>
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={mobile?"quick-battle-title-mobile":"quick-battle-title"} aria-describedby={mobile?"quick-battle-desc-mobile":"quick-battle-desc"} tabIndex={-1} className={`outline-none transition duration-300 ${visible?"translate-y-0 scale-100 opacity-100":"translate-y-3 scale-[.97] opacity-0"}`} style={mobile?{width:"calc(100vw - 16px)"}:{width:STAGE_W*scale,height:STAGE_H*scale}}>
      {mobile ? <MobileModal onDismiss={dismiss} onStart={start}/> : <div style={{width:STAGE_W,height:STAGE_H,transform:`scale(${scale})`,transformOrigin:"top left"}}><DesktopModal onDismiss={dismiss} onStart={start}/></div>}
    </div>
  </div>
}
