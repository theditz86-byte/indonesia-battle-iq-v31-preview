"use client"

import { FormEvent, useCallback, useEffect, useState } from "react"
import { Check, Clock3, Loader2, MessageCircle, Search, UserCheck, UserMinus, UserPlus, Users, X } from "lucide-react"
import { SiteNavbar } from "@/components/site-navbar"
import { SiteFooter } from "@/components/site-footer"
import { fetchOverview } from "@/lib/battle"
import type { BattleParticipant } from "@/lib/battle"
import {
  playerProfileHref,
  socialCall,
  type FriendItem,
  type FriendSearchResponse,
  type FriendSearchResult,
  type SocialOverview,
  type SocialProfile,
} from "@/lib/social"

type Tab = "search" | "requests" | "friends"

function initials(name?: string) {
  return (name || "BP").split(/\s+/).filter(Boolean).slice(0,2).map((part)=>part[0]).join("").toUpperCase() || "BP"
}

function Avatar({ profile }: { profile?: SocialProfile | null }) {
  if (profile?.avatar_url) return <img src={profile.avatar_url} alt={profile.nickname || "Peserta"} className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-cyan-300/25" />
  return <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-cyan-500 to-indigo-700 text-xs font-black text-white ring-2 ring-cyan-300/20">{initials(profile?.nickname)}</div>
}

function locationLabel(profile?: SocialProfile | null) {
  return [profile?.district_name, profile?.regency_name, profile?.province_name].filter(Boolean).join(" · ") || "Indonesia"
}

export default function FriendsPage() {
  const [participant,setParticipant] = useState<BattleParticipant|null>(null)
  const [overview,setOverview] = useState<SocialOverview|null>(null)
  const [tab,setTab] = useState<Tab>("search")
  const [query,setQuery] = useState("")
  const [results,setResults] = useState<FriendSearchResult[]>([])
  const [loading,setLoading] = useState(true)
  const [searching,setSearching] = useState(false)
  const [busyId,setBusyId] = useState("")
  const [error,setError] = useState("")

  const loadOverview = useCallback(async()=>{
    try {
      const data=await socialCall<SocialOverview>("overview")
      setOverview(data)
      setError("")
    } catch(err) {
      setError(err instanceof Error?err.message:"Data pertemanan belum dapat dimuat.")
    }
  },[])

  useEffect(()=>{
    const controller=new AbortController()
    void fetchOverview("country",null,controller.signal)
      .then(async(data)=>{
        setParticipant(data.participant)
        if(data.participant) await loadOverview()
      })
      .catch(()=>setParticipant(null))
      .finally(()=>setLoading(false))
    return()=>controller.abort()
  },[loadOverview])

  async function runSearch(event?:FormEvent) {
    event?.preventDefault()
    const clean=query.trim()
    if(clean.length<2){setResults([]);return}
    setSearching(true);setError("")
    try {
      const data=await socialCall<FriendSearchResponse>("search",{query:clean})
      setResults(Array.isArray(data.results)?data.results:[])
    } catch(err) {
      setError(err instanceof Error?err.message:"Pencarian teman belum dapat diproses.")
    } finally { setSearching(false) }
  }

  async function refreshAll() {
    await loadOverview()
    if(query.trim().length>=2) await runSearch()
    window.dispatchEvent(new Event("alzava:social-refresh"))
  }

  async function relationAction(publicId:string|undefined, action:string) {
    if(!publicId||busyId)return
    setBusyId(publicId);setError("")
    try {
      await socialCall(action,{target_public_id:publicId})
      await refreshAll()
    } catch(err) {
      setError(err instanceof Error?err.message:"Permintaan pertemanan belum dapat diproses.")
    } finally { setBusyId("") }
  }

  function SearchAction({item}:{item:FriendSearchResult}) {
    const id=item.public_id||""
    const busy=busyId===id
    if(item.friendship_state==="friends") return <a href={`/messages?with=${encodeURIComponent(id)}`} className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-3.5 py-2 text-xs font-black text-slate-950"><MessageCircle className="h-4 w-4"/>Pesan</a>
    if(item.friendship_state==="outgoing") return <button disabled={busy} onClick={()=>void relationAction(id,"friend_cancel")} className="inline-flex items-center gap-2 rounded-xl border border-amber-300/20 bg-amber-300/10 px-3.5 py-2 text-xs font-black text-amber-200 disabled:opacity-50"><Clock3 className="h-4 w-4"/>Batalkan</button>
    if(item.friendship_state==="incoming") return <button disabled={busy} onClick={()=>void relationAction(id,"friend_accept")} className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-3.5 py-2 text-xs font-black text-slate-950 disabled:opacity-50"><Check className="h-4 w-4"/>Terima</button>
    return <button disabled={busy} onClick={()=>void relationAction(id,"friend_request")} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-3.5 py-2 text-xs font-black text-slate-950 disabled:opacity-50">{busy?<Loader2 className="h-4 w-4 animate-spin"/>:<UserPlus className="h-4 w-4"/>}Tambah Teman</button>
  }

  const incoming=overview?.incoming_requests||[]
  const outgoing=overview?.outgoing_requests||[]
  const friends=overview?.friends||[]

  return <div className="min-h-screen bg-[radial-gradient(circle_at_15%_-10%,rgba(34,211,238,.14),transparent_34rem),radial-gradient(circle_at_90%_10%,rgba(124,58,237,.12),transparent_32rem),linear-gradient(180deg,#020617,#07142e_55%,#020617)] text-white">
    <SiteNavbar participant={participant}/>
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      {loading ? <div className="grid min-h-[560px] place-items-center"><Loader2 className="h-8 w-8 animate-spin text-cyan-300"/></div> : !participant ? <section className="mx-auto max-w-2xl rounded-[30px] border border-white/10 bg-white/[.045] p-9 text-center shadow-2xl">
        <Users className="mx-auto h-12 w-12 text-cyan-300"/>
        <h1 className="mt-4 text-3xl font-black">Cari & Tambah Teman</h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-400">Masuk sebagai peserta untuk mencari pemain, menerima permintaan teman, dan mengirim pesan pribadi.</p>
        <a href="/account?next=%2Ffriends" className="mt-6 inline-flex rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 px-6 py-3 font-black">Masuk / Daftar</a>
      </section> : <>
        <section className="overflow-hidden rounded-[30px] border border-white/10 bg-[#071126]/90 shadow-[0_28px_90px_rgba(0,0,0,.34)]">
          <div className="border-b border-white/10 bg-white/[.035] p-6 sm:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div><p className="text-xs font-black uppercase tracking-[.18em] text-cyan-300">ALZAVA SOCIAL</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">Cari & Tambah Teman</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Temukan pemain lewat nickname atau username, terima permintaan pertemanan, lalu ngobrol lewat pesan pribadi.</p></div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"><strong className="block text-xl font-black">{friends.length}</strong><span className="text-[10px] text-slate-500">Teman</span></div>
                <div className="rounded-2xl border border-amber-300/15 bg-amber-300/[.06] px-4 py-3"><strong className="block text-xl font-black text-amber-300">{incoming.length}</strong><span className="text-[10px] text-slate-500">Masuk</span></div>
                <div className="rounded-2xl border border-violet-300/15 bg-violet-300/[.06] px-4 py-3"><strong className="block text-xl font-black text-violet-300">{outgoing.length}</strong><span className="text-[10px] text-slate-500">Menunggu</span></div>
              </div>
            </div>
          </div>

          <div className="border-b border-white/10 p-3 sm:px-6">
            <div className="grid grid-cols-3 gap-2">
              {([['search','Cari Teman',Search],['requests','Permintaan',UserPlus],['friends','Teman Saya',Users]] as const).map(([id,label,Icon])=><button key={id} onClick={()=>setTab(id)} className={`relative inline-flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-xs font-black transition sm:text-sm ${tab===id?"bg-white text-slate-950":"border border-white/10 bg-white/[.035] text-slate-300 hover:bg-white/[.07]"}`}><Icon className="h-4 w-4"/>{label}{id==='requests'&&incoming.length>0&&<span className="grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[9px] font-black text-white">{incoming.length}</span>}</button>)}
            </div>
          </div>

          {error&&<div className="mx-5 mt-5 rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm font-semibold text-rose-200 sm:mx-7">{error}</div>}

          <div className="min-h-[520px] p-5 sm:p-7">
            {tab==='search'&&<div>
              <form onSubmit={runSearch} className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1"><Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"/><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Cari nickname atau @username..." className="w-full rounded-2xl border border-white/10 bg-slate-950/55 py-3.5 pl-11 pr-4 text-sm outline-none transition focus:border-cyan-300/35"/></div>
                <button disabled={searching||query.trim().length<2} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-violet-600 px-6 py-3.5 text-sm font-black disabled:opacity-40">{searching?<Loader2 className="h-4 w-4 animate-spin"/>:<Search className="h-4 w-4"/>}Cari Teman</button>
              </form>
              <p className="mt-2 text-xs text-slate-600">Ketik minimal 2 karakter. Email dan data pribadi peserta tidak ditampilkan.</p>
              <div className="mt-6 grid gap-3">{query.trim().length<2?<div className="rounded-2xl border border-dashed border-white/10 py-14 text-center"><Search className="mx-auto h-8 w-8 text-slate-700"/><p className="mt-3 text-sm font-bold text-slate-500">Cari pemain berdasarkan nickname atau username.</p></div>:!searching&&results.length===0?<div className="rounded-2xl border border-dashed border-white/10 py-14 text-center text-sm text-slate-500">Tidak ada pemain yang cocok.</div>:results.map((item)=><article key={item.public_id} className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[.035] p-4 sm:flex-row sm:items-center"><a href={playerProfileHref(item.public_id)}><Avatar profile={item}/></a><div className="min-w-0 flex-1"><a href={playerProfileHref(item.public_id)} className="truncate text-base font-black hover:text-cyan-300">{item.nickname||"Peserta"}</a>{item.username&&<p className="truncate text-xs font-semibold text-cyan-300/80">@{item.username}</p>}<p className="mt-1 truncate text-xs text-slate-500">{locationLabel(item)}</p></div><div className="flex items-center gap-2"><a href={playerProfileHref(item.public_id)} className="rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-bold text-slate-300">Profil</a><SearchAction item={item}/></div></article>)}</div>
            </div>}

            {tab==='requests'&&<div className="grid gap-7 lg:grid-cols-2">
              <section><div className="mb-3 flex items-center gap-2"><UserPlus className="h-5 w-5 text-amber-300"/><h2 className="text-lg font-black">Permintaan Masuk</h2><span className="rounded-full bg-amber-300/10 px-2 py-0.5 text-xs font-black text-amber-300">{incoming.length}</span></div><div className="grid gap-3">{incoming.length===0?<div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-600">Belum ada permintaan masuk.</div>:incoming.map((item:FriendItem)=><article key={item.relation_id} className="rounded-2xl border border-amber-300/10 bg-amber-300/[.035] p-4"><div className="flex items-center gap-3"><a href={playerProfileHref(item.participant?.public_id)}><Avatar profile={item.participant}/></a><div className="min-w-0 flex-1"><a href={playerProfileHref(item.participant?.public_id)} className="truncate font-black hover:text-cyan-300">{item.participant?.nickname||"Peserta"}</a><p className="truncate text-xs text-slate-500">{locationLabel(item.participant)}</p></div></div><div className="mt-4 grid grid-cols-2 gap-2"><button disabled={busyId===item.participant?.public_id} onClick={()=>void relationAction(item.participant?.public_id,"friend_accept")} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-400 px-3 py-2.5 text-xs font-black text-slate-950"><Check className="h-4 w-4"/>Terima</button><button disabled={busyId===item.participant?.public_id} onClick={()=>void relationAction(item.participant?.public_id,"friend_reject")} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs font-black text-slate-300"><X className="h-4 w-4"/>Tolak</button></div></article>)}</div></section>
              <section><div className="mb-3 flex items-center gap-2"><Clock3 className="h-5 w-5 text-violet-300"/><h2 className="text-lg font-black">Menunggu Persetujuan</h2><span className="rounded-full bg-violet-300/10 px-2 py-0.5 text-xs font-black text-violet-300">{outgoing.length}</span></div><div className="grid gap-3">{outgoing.length===0?<div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-600">Tidak ada permintaan yang menunggu.</div>:outgoing.map((item:FriendItem)=><article key={item.relation_id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.03] p-4"><a href={playerProfileHref(item.participant?.public_id)}><Avatar profile={item.participant}/></a><div className="min-w-0 flex-1"><a href={playerProfileHref(item.participant?.public_id)} className="truncate font-black hover:text-cyan-300">{item.participant?.nickname||"Peserta"}</a><p className="truncate text-xs text-slate-500">{locationLabel(item.participant)}</p></div><button disabled={busyId===item.participant?.public_id} onClick={()=>void relationAction(item.participant?.public_id,"friend_cancel")} className="rounded-xl border border-amber-300/15 bg-amber-300/[.07] px-3 py-2 text-xs font-black text-amber-200">Batalkan</button></article>)}</div></section>
            </div>}

            {tab==='friends'&&<div><div className="mb-4 flex items-center gap-2"><UserCheck className="h-5 w-5 text-emerald-300"/><h2 className="text-lg font-black">Teman Saya</h2><span className="rounded-full bg-emerald-300/10 px-2 py-0.5 text-xs font-black text-emerald-300">{friends.length}</span></div><div className="grid gap-3 md:grid-cols-2">{friends.length===0?<div className="md:col-span-2 rounded-2xl border border-dashed border-white/10 py-14 text-center"><Users className="mx-auto h-9 w-9 text-slate-700"/><p className="mt-3 text-sm font-bold text-slate-500">Belum ada teman. Gunakan Cari Teman untuk mulai terhubung.</p></div>:friends.map((item:FriendItem)=><article key={item.relation_id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.035] p-4"><a href={playerProfileHref(item.participant?.public_id)}><Avatar profile={item.participant}/></a><div className="min-w-0 flex-1"><a href={playerProfileHref(item.participant?.public_id)} className="truncate font-black hover:text-cyan-300">{item.participant?.nickname||"Peserta"}</a><p className="truncate text-xs text-slate-500">{locationLabel(item.participant)}</p></div><a href={`/messages?with=${encodeURIComponent(item.participant?.public_id||"")}`} className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-300/10 text-cyan-300" title="Kirim pesan"><MessageCircle className="h-4 w-4"/></a><button disabled={busyId===item.participant?.public_id} onClick={()=>{if(window.confirm(`Hapus ${item.participant?.nickname||"peserta"} dari daftar teman?`))void relationAction(item.participant?.public_id,"friend_remove")}} className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/5 text-slate-500 hover:text-rose-300" title="Hapus teman"><UserMinus className="h-4 w-4"/></button></article>)}</div></div>}
          </div>
        </section>
      </>}
    </main>
    <SiteFooter/>
  </div>
}
