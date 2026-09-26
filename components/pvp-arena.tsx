"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { CheckCircle2, Clock3, RefreshCw, ShieldCheck, Swords, Timer, Trophy, Wifi, XCircle, Zap } from "lucide-react"
import { getParticipantToken } from "@/lib/battle"
import type { BattleParticipant } from "@/lib/battle"
import { SiteNavbar } from "@/components/site-navbar"
import { SiteFooter } from "@/components/site-footer"

const PVP_API = "https://efndozplpwyemzgqfnep.supabase.co/functions/v1/battle-pvp"

type Player = { public_id?:string; nickname?:string; avatar_url?:string|null; province_name?:string; regency_name?:string; district_name?:string; last_seen?:string }
type Challenge = { id?:string; created_at?:string; expires_at?:string; player?:Player }
type MatchState = {
  id?:string; status?:"ready"|"live"|"finished"|"cancelled"; started_at?:string|null; ends_at?:string|null; finished_at?:string|null;
  my_ready?:boolean; opponent_ready?:boolean; my_score?:number; opponent_score?:number; my_correct?:number; opponent_correct?:number;
  my_wrong?:number; opponent_wrong?:number; my_index?:number; opponent_index?:number; winner?:"me"|"opponent"|null
}
type Question = { index:number; category:string; prompt:string; options:string[] }
type LobbyResponse = { me?:Player; online_players?:Player[]; incoming_challenge?:Challenge|null; outgoing_challenge?:Challenge|null; active_match?:{id?:string;status?:string}|null; server_now?:string }
type StateResponse = { match?:MatchState; me?:Player; opponent?:Player; question?:Question; server_now?:string; answer_result?:{correct?:boolean;points_delta?:number;next_index?:number} }

async function pvp(body:Record<string,unknown>){
  const token=getParticipantToken()
  if(!token) throw new Error("Silakan masuk sebagai peserta terlebih dahulu.")
  const response=await fetch(PVP_API,{method:"POST",headers:{"Content-Type":"application/json","X-Battle-Token":token},body:JSON.stringify(body),cache:"no-store"})
  const data=await response.json().catch(()=>({}))
  if(!response.ok){const e=new Error(data?.error||"Arena PVP belum dapat diproses.") as Error & {code?:string};e.code=data?.code;throw e}
  return data
}

function initials(name?:string){return (name||"BP").split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]?.toUpperCase()).join("")||"BP"}
function avatar(player?:Player,size="h-12 w-12"){
  if(player?.avatar_url) return <img src={player.avatar_url} alt={player.nickname||"Pemain"} className={`${size} rounded-full object-cover ring-2 ring-cyan-300/50`} />
  return <div className={`${size} grid place-items-center rounded-full bg-gradient-to-br from-cyan-500 to-indigo-600 text-sm font-black text-white ring-2 ring-cyan-300/40`}>{initials(player?.nickname)}</div>
}
function fmtTime(ms:number){const s=Math.max(0,Math.ceil(ms/1000));return `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`}

function ReadyNotice({state,opponent,onReady,busy}:{state:MatchState;opponent?:Player;onReady:()=>void;busy:boolean}){
  return <div className="fixed inset-0 z-[120] grid place-items-center bg-black/80 p-4 backdrop-blur-md">
    <div className="w-full max-w-xl overflow-hidden rounded-3xl border border-cyan-300/20 bg-[#07152d] shadow-[0_30px_100px_rgba(0,0,0,.6)]">
      <div className="bg-gradient-to-r from-cyan-500/20 via-indigo-500/15 to-violet-500/20 px-6 py-5 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-cyan-300/30 bg-cyan-300/10 text-cyan-200"><Swords className="h-7 w-7"/></div>
        <h2 className="mt-3 text-2xl font-black text-white">Battle PVP 1v1</h2>
        <p className="mt-1 text-sm text-slate-300">Lawan: <span className="font-black text-white">{opponent?.nickname||"Pemain"}</span></p>
      </div>
      <div className="space-y-4 p-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/[.04] p-4"><Timer className="h-5 w-5 text-cyan-300"/><p className="mt-2 text-sm font-black text-white">20 menit penuh</p><p className="mt-1 text-xs leading-5 text-slate-400">Begitu pertandingan dimulai, timer terus berjalan sampai habis.</p></div>
          <div className="rounded-2xl border border-white/10 bg-white/[.04] p-4"><Zap className="h-5 w-5 text-amber-300"/><p className="mt-2 text-sm font-black text-white">Soal tidak dibatasi</p><p className="mt-1 text-xs leading-5 text-slate-400">Kerjakan sebanyak mungkin. Soal berikutnya langsung muncul setelah menjawab.</p></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-4 text-center"><p className="text-xs font-bold uppercase tracking-wider text-emerald-200">Jawaban benar</p><p className="mt-1 text-3xl font-black text-emerald-300">+50</p><p className="text-xs text-emerald-100/70">PVP Point</p></div>
          <div className="rounded-2xl border border-rose-300/20 bg-rose-400/10 p-4 text-center"><p className="text-xs font-bold uppercase tracking-wider text-rose-200">Jawaban salah</p><p className="mt-1 text-3xl font-black text-rose-300">−25</p><p className="text-xs text-rose-100/70">PVP Point</p></div>
        </div>
        <div className="rounded-2xl border border-amber-300/15 bg-amber-300/5 p-4 text-xs leading-5 text-slate-300"><ShieldCheck className="mr-2 inline h-4 w-4 text-amber-300"/>Pemenang adalah pemain dengan poin tertinggi ketika waktu habis. PVP Point bersifat skor pertandingan dan tidak mengubah Ranking Ranked Battle.</div>
        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm"><span className="text-slate-400">Status lawan</span><span className={`font-black ${state.opponent_ready?"text-emerald-300":"text-amber-300"}`}>{state.opponent_ready?"Siap":"Menunggu siap"}</span></div>
        <button onClick={onReady} disabled={busy||state.my_ready} className="w-full rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-600 px-5 py-4 text-base font-black text-white shadow-[0_0_28px_rgba(34,211,238,.24)] disabled:cursor-not-allowed disabled:opacity-60">{state.my_ready?"Anda sudah siap · menunggu lawan…":busy?"Menyiapkan arena…":"Saya Siap · Mulai Battle"}</button>
      </div>
    </div>
  </div>
}

export function PvpArena(){
  const [participant,setParticipant]=useState<BattleParticipant|null>(null)
  const [online,setOnline]=useState<Player[]>([])
  const [incoming,setIncoming]=useState<Challenge|null>(null)
  const [outgoing,setOutgoing]=useState<Challenge|null>(null)
  const [matchId,setMatchId]=useState("")
  const [state,setState]=useState<MatchState|null>(null)
  const [opponent,setOpponent]=useState<Player|undefined>()
  const [question,setQuestion]=useState<Question|undefined>()
  const [loading,setLoading]=useState(true)
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState("")
  const [now,setNow]=useState(Date.now())
  const [serverOffset,setServerOffset]=useState(0)
  const [answerFlash,setAnswerFlash]=useState<{correct:boolean;delta:number}|null>(null)
  const mounted=useRef(true)

  const syncTime=useCallback((serverNow?:string)=>{if(!serverNow)return;const n=new Date(serverNow).getTime();if(Number.isFinite(n))setServerOffset(n-Date.now())},[])

  const loadLobby=useCallback(async(background=false)=>{
    if(!getParticipantToken()){setLoading(false);return}
    if(!background)setLoading(true)
    try{
      const data=await pvp({action:"lobby"}) as LobbyResponse
      if(!mounted.current)return
      syncTime(data.server_now)
      setError("")
      setOnline(Array.isArray(data.online_players)?data.online_players:[])
      setIncoming(data.incoming_challenge||null)
      setOutgoing(data.outgoing_challenge||null)
      if(data.me)setParticipant(data.me as BattleParticipant)
      if(data.active_match?.id){setMatchId(String(data.active_match.id));setIncoming(null);setOutgoing(null)}
    }catch(e){if(mounted.current)setError(e instanceof Error?e.message:"Lobby PVP belum dapat dimuat.")}
    finally{if(mounted.current)setLoading(false)}
  },[syncTime])

  const loadState=useCallback(async(id:string)=>{
    if(!id)return
    try{
      const data=await pvp({action:"state",match_id:id}) as StateResponse
      if(!mounted.current)return
      syncTime(data.server_now)
      setState(data.match||null);setOpponent(data.opponent);setQuestion(data.question);setError("")
    }catch(e){if(mounted.current)setError(e instanceof Error?e.message:"Pertandingan belum dapat dimuat.")}
  },[syncTime])

  useEffect(()=>{mounted.current=true;void loadLobby();return()=>{mounted.current=false}},[loadLobby])
  useEffect(()=>{const t=window.setInterval(()=>setNow(Date.now()),250);return()=>window.clearInterval(t)},[])
  useEffect(()=>{
    if(matchId){void loadState(matchId);const t=window.setInterval(()=>{if(document.visibilityState==="visible")void loadState(matchId)},2000);return()=>window.clearInterval(t)}
    const t=window.setInterval(()=>{if(document.visibilityState==="visible")void loadLobby(true)},3000);return()=>window.clearInterval(t)
  },[matchId,loadLobby,loadState])

  const challenge=async(player:Player)=>{if(!player.public_id)return;setBusy(true);setError("");try{await pvp({action:"challenge",target_public_id:player.public_id});await loadLobby(true)}catch(e){setError(e instanceof Error?e.message:"Tantangan belum terkirim.")}finally{setBusy(false)}}
  const respond=async(accept:boolean)=>{if(!incoming?.id)return;setBusy(true);setError("");try{const data=await pvp({action:accept?"accept":"decline",challenge_id:incoming.id});setIncoming(null);if(accept&&data?.match_id){setMatchId(String(data.match_id));await loadState(String(data.match_id))}else await loadLobby(true)}catch(e){setError(e instanceof Error?e.message:"Tantangan belum dapat diproses.")}finally{setBusy(false)}}
  const ready=async()=>{if(!matchId)return;setBusy(true);setError("");try{const data=await pvp({action:"ready",match_id:matchId}) as StateResponse;syncTime(data.server_now);setState(data.match||null);setOpponent(data.opponent);setQuestion(data.question)}catch(e){setError(e instanceof Error?e.message:"Status siap belum tersimpan.")}finally{setBusy(false)}}
  const answer=async(index:number)=>{if(!matchId||!question||busy)return;setBusy(true);setError("");try{const data=await pvp({action:"answer",match_id:matchId,question_index:question.index,answer_index:index}) as StateResponse;syncTime(data.server_now);setState(data.match||null);setOpponent(data.opponent);setQuestion(data.question);if(data.answer_result){setAnswerFlash({correct:Boolean(data.answer_result.correct),delta:Number(data.answer_result.points_delta||0)});window.setTimeout(()=>setAnswerFlash(null),700)}}catch(e){const err=e as Error & {code?:string};setError(err.message);if(err.code==="question_out_of_sync")void loadState(matchId)}finally{setBusy(false)}}
  const backToLobby=()=>{setMatchId("");setState(null);setOpponent(undefined);setQuestion(undefined);setAnswerFlash(null);void loadLobby()}

  const serverNow=now+serverOffset
  const startsAt=state?.started_at?new Date(state.started_at).getTime():0
  const endsAt=state?.ends_at?new Date(state.ends_at).getTime():0
  const preStart=state?.status==="live"&&startsAt>serverNow
  const countdown=preStart?Math.max(0,startsAt-serverNow):0
  const remaining=state?.status==="live"?Math.max(0,endsAt-serverNow):0
  const resultTitle=state?.winner==="me"?"KAMU MENANG!":state?.winner==="opponent"?"LAWAN MENANG":"HASIL SERI"
  const region=(p?:Player)=>[p?.regency_name,p?.province_name].filter(Boolean).join(" · ")||"Indonesia"

  return <div className="min-h-screen bg-[#020817] text-white">
    <SiteNavbar participant={participant}/>
    <main className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,.12),transparent_38%),radial-gradient(circle_at_80%_30%,rgba(124,58,237,.10),transparent_30%)]"/>
      <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {!getParticipantToken() ? <div className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-white/[.04] p-8 text-center"><Swords className="mx-auto h-12 w-12 text-cyan-300"/><h1 className="mt-4 text-3xl font-black">Battle PVP 1v1</h1><p className="mt-3 text-sm leading-6 text-slate-400">Masuk atau daftar sebagai peserta agar bisa menantang pemain yang sedang online.</p><a href="/account" className="mt-6 inline-flex rounded-2xl bg-gradient-to-r from-cyan-500 to-violet-600 px-6 py-3 font-black">Masuk / Daftar</a></div> : matchId&&state ? <>
          {state.status==="ready"&&<ReadyNotice state={state} opponent={opponent} onReady={()=>void ready()} busy={busy}/>} 
          {preStart&&<div className="fixed inset-0 z-[115] grid place-items-center bg-black/75 backdrop-blur-md"><div className="text-center"><p className="text-sm font-bold uppercase tracking-[.32em] text-cyan-300">Battle dimulai dalam</p><p className="mt-3 text-[110px] font-black leading-none text-white drop-shadow-[0_0_40px_rgba(34,211,238,.7)]">{Math.max(1,Math.ceil(countdown/1000))}</p><p className="mt-4 text-slate-400">Fokus. Kerjakan sebanyak mungkin.</p></div></div>}
          {(state.status==="live"||state.status==="finished"||state.status==="cancelled")&&<div className="space-y-6">
            <div className="flex flex-col items-center justify-between gap-4 rounded-3xl border border-white/10 bg-white/[.04] p-5 md:flex-row">
              <div className="flex min-w-0 items-center gap-3">{avatar(participant as Player,"h-14 w-14")}<div><p className="text-xs font-bold uppercase tracking-wider text-cyan-300">Kamu</p><p className="truncate text-lg font-black">{participant?.nickname}</p><p className="text-xs text-slate-500">Benar {state.my_correct||0} · Salah {state.my_wrong||0} · Soal {state.my_index||0}</p></div></div>
              <div className="text-center"><p className="text-xs font-bold uppercase tracking-[.24em] text-slate-500">PVP Battle</p><p className={`mt-1 font-mono text-4xl font-black ${remaining<60000&&state.status==="live"?"text-rose-300":"text-white"}`}>{state.status==="live"?fmtTime(remaining):"00:00"}</p><div className="mt-2 flex items-center justify-center gap-2 text-[11px] text-emerald-300"><Wifi className="h-3.5 w-3.5"/>LIVE SYNC</div></div>
              <div className="flex min-w-0 items-center gap-3 text-right"><div><p className="text-xs font-bold uppercase tracking-wider text-violet-300">Lawan</p><p className="truncate text-lg font-black">{opponent?.nickname}</p><p className="text-xs text-slate-500">Benar {state.opponent_correct||0} · Salah {state.opponent_wrong||0} · Soal {state.opponent_index||0}</p></div>{avatar(opponent,"h-14 w-14")}</div>
            </div>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-3xl border border-white/10 bg-slate-950/60 p-5 text-center"><div><p className="text-xs font-bold uppercase tracking-wider text-cyan-300">{participant?.nickname}</p><p className="mt-1 text-5xl font-black">{state.my_score||0}</p></div><div className="rounded-full border border-amber-300/20 bg-amber-300/10 px-4 py-2 text-sm font-black text-amber-200">VS</div><div><p className="text-xs font-bold uppercase tracking-wider text-violet-300">{opponent?.nickname}</p><p className="mt-1 text-5xl font-black">{state.opponent_score||0}</p></div></div>
            {state.status==="live"&&!preStart&&question&&<div className="mx-auto max-w-4xl rounded-[32px] border border-cyan-300/15 bg-gradient-to-b from-[#0a1931] to-[#061126] p-6 shadow-[0_30px_90px_rgba(0,0,0,.35)] sm:p-8">
              <div className="flex items-center justify-between gap-4"><span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-xs font-black text-cyan-200">SOAL {question.index+1}</span><span className="text-xs font-bold text-slate-400">{question.category}</span></div>
              <h2 className="mt-7 text-xl font-black leading-relaxed text-white sm:text-2xl">{question.prompt}</h2>
              <div className="mt-7 grid gap-3 sm:grid-cols-2">{question.options.map((option,i)=><button key={`${question.index}-${i}`} disabled={busy} onClick={()=>void answer(i)} className="group flex min-h-[76px] items-center gap-4 rounded-2xl border border-white/10 bg-white/[.04] p-4 text-left font-bold text-slate-100 transition hover:border-cyan-300/40 hover:bg-cyan-300/10 disabled:opacity-60"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/10 bg-slate-950 text-sm font-black text-cyan-300 group-hover:border-cyan-300/30">{String.fromCharCode(65+i)}</span><span>{option}</span></button>)}</div>
              <div className="mt-5 flex items-center justify-center gap-5 text-xs font-bold"><span className="text-emerald-300">Benar +50</span><span className="text-slate-600">•</span><span className="text-rose-300">Salah −25</span></div>
              {answerFlash&&<div className={`pointer-events-none fixed inset-x-0 top-28 z-[110] mx-auto w-fit rounded-full border px-6 py-3 text-lg font-black shadow-2xl ${answerFlash.correct?"border-emerald-300/40 bg-emerald-500/90 text-white":"border-rose-300/40 bg-rose-500/90 text-white"}`}>{answerFlash.correct?"BENAR":"SALAH"} · {answerFlash.delta>0?`+${answerFlash.delta}`:answerFlash.delta}</div>}
            </div>}
            {(state.status==="finished"||state.status==="cancelled")&&<div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/[.05] p-8 text-center"><Trophy className={`mx-auto h-14 w-14 ${state.winner==="me"?"text-amber-300":"text-slate-400"}`}/><h2 className="mt-4 text-4xl font-black">{state.status==="cancelled"?"Battle dibatalkan":resultTitle}</h2><p className="mt-2 text-slate-400">Skor akhir {state.my_score||0} — {state.opponent_score||0}</p><div className="mt-6 grid grid-cols-2 gap-3 text-left"><div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4"><p className="text-xs uppercase text-slate-500">Kamu</p><p className="mt-2 font-black text-emerald-300">{state.my_correct||0} benar</p><p className="text-sm text-rose-300">{state.my_wrong||0} salah</p></div><div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4"><p className="text-xs uppercase text-slate-500">{opponent?.nickname}</p><p className="mt-2 font-black text-emerald-300">{state.opponent_correct||0} benar</p><p className="text-sm text-rose-300">{state.opponent_wrong||0} salah</p></div></div><button onClick={backToLobby} className="mt-6 rounded-2xl bg-gradient-to-r from-cyan-500 to-violet-600 px-6 py-3 font-black">Kembali ke Lobby PVP</button></div>}
          </div>}
        </> : <div className="space-y-8">
          <section className="grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
            <div className="rounded-[32px] border border-cyan-300/15 bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-violet-500/10 p-7 sm:p-9"><div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs font-black text-emerald-200"><Wifi className="h-3.5 w-3.5"/>PVP ONLINE LOBBY</div><h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">Battle PVP <span className="text-cyan-300">1v1</span></h1><p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">Tantang pemain yang sedang online. Dalam 20 menit, jawab soal sebanyak mungkin dan rebut skor tertinggi.</p><div className="mt-6 flex flex-wrap gap-3 text-sm font-black"><span className="rounded-xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-emerald-200">Benar +50</span><span className="rounded-xl border border-rose-300/20 bg-rose-300/10 px-4 py-2 text-rose-200">Salah −25</span><span className="rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-cyan-200">20 Menit</span><span className="rounded-xl border border-violet-300/20 bg-violet-300/10 px-4 py-2 text-violet-200">Soal Tak Terbatas</span></div></div>
            <div className="rounded-[32px] border border-white/10 bg-white/[.04] p-6"><p className="text-xs font-black uppercase tracking-[.2em] text-slate-500">Status Arena</p><div className="mt-5 flex items-center gap-3">{avatar(participant as Player,"h-14 w-14")}<div><p className="font-black">{participant?.nickname||"Peserta"}</p><p className="text-xs text-emerald-300">● Online · siap menerima tantangan</p></div></div><div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-center"><p className="text-3xl font-black">{online.length}</p><p className="mt-1 text-xs text-slate-500">Pemain online</p></div><div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-center"><Clock3 className="mx-auto h-6 w-6 text-cyan-300"/><p className="mt-2 text-xs text-slate-500">Update tiap 3 detik</p></div></div></div>
          </section>
          {outgoing&&<div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-amber-100"><div className="flex items-center gap-3"><RefreshCw className="h-5 w-5 animate-spin"/><div><p className="font-black">Menunggu {outgoing.player?.nickname} menerima tantangan…</p><p className="mt-1 text-xs text-amber-100/70">Tantangan berlaku sekitar 60 detik dan hanya aktif selama pemain tetap online.</p></div></div></div>}
          {error&&<div className="rounded-2xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-100">{error}</div>}
          <section><div className="mb-4 flex items-center justify-between"><div><h2 className="text-2xl font-black">Pemain Online</h2><p className="mt-1 text-sm text-slate-500">Hanya pemain aktif di Lobby PVP yang bisa ditantang.</p></div><button onClick={()=>void loadLobby()} className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[.04] text-slate-300 hover:bg-white/[.08]"><RefreshCw className={`h-4 w-4 ${loading?"animate-spin":""}`}/></button></div>
            {loading&&!online.length?<div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">{[1,2,3].map(i=><div key={i} className="h-28 animate-pulse rounded-2xl border border-white/10 bg-white/[.04]"/>)}</div>:online.length?<div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">{online.map(player=><div key={player.public_id} className="rounded-2xl border border-white/10 bg-white/[.04] p-4 transition hover:border-cyan-300/25 hover:bg-white/[.06]"><div className="flex items-center gap-3">{avatar(player)}<div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="truncate font-black">{player.nickname}</p><span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,.8)]"/></div><p className="truncate text-xs text-slate-500">{region(player)}</p></div></div><button disabled={busy||Boolean(outgoing)} onClick={()=>void challenge(player)} className="mt-4 w-full rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-2.5 text-sm font-black text-cyan-100 transition hover:bg-cyan-300/15 disabled:opacity-40"><Swords className="mr-2 inline h-4 w-4"/>Tantang PVP</button></div>)}</div>:<div className="rounded-3xl border border-dashed border-white/10 bg-white/[.025] px-6 py-12 text-center"><Wifi className="mx-auto h-10 w-10 text-slate-600"/><p className="mt-3 font-black text-slate-300">Belum ada pemain lain di Lobby PVP</p><p className="mt-1 text-sm text-slate-500">Ajak teman membuka menu Battle PVP. Saat sama-sama online, tombol tantangan akan muncul.</p></div>}
          </section>
        </div>}
      </div>
    </main>
    {incoming&&!matchId&&<div className="fixed inset-0 z-[120] grid place-items-center bg-black/75 p-4 backdrop-blur-md"><div className="w-full max-w-md rounded-3xl border border-cyan-300/20 bg-[#07152d] p-6 text-center shadow-2xl"><div className="mx-auto w-fit">{avatar(incoming.player,"h-20 w-20")}</div><p className="mt-4 text-xs font-black uppercase tracking-[.22em] text-cyan-300">Tantangan PVP Masuk</p><h2 className="mt-2 text-2xl font-black">{incoming.player?.nickname} menantangmu!</h2><p className="mt-2 text-sm text-slate-400">20 menit · soal tak terbatas · benar +50 · salah −25</p><div className="mt-6 grid grid-cols-2 gap-3"><button disabled={busy} onClick={()=>void respond(false)} className="rounded-2xl border border-white/10 bg-white/[.04] px-4 py-3 font-black text-slate-200"><XCircle className="mr-2 inline h-4 w-4"/>Tolak</button><button disabled={busy} onClick={()=>void respond(true)} className="rounded-2xl bg-gradient-to-r from-cyan-500 to-violet-600 px-4 py-3 font-black text-white"><CheckCircle2 className="mr-2 inline h-4 w-4"/>Terima</button></div></div></div>}
    <SiteFooter/>
  </div>
}
