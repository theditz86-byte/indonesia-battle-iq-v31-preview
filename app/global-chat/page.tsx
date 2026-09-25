"use client"

import { useEffect, useState } from "react"
import { GlobalChat } from "@/components/global-chat"
import { SiteFooter } from "@/components/site-footer"
import { SiteNavbar } from "@/components/site-navbar"
import { fetchOverview } from "@/lib/battle"
import type { BattleParticipant } from "@/lib/battle"

export default function GlobalChatPage() {
  const [participant, setParticipant] = useState<BattleParticipant | null>(null)

  useEffect(() => {
    let cancelled = false
    void fetchOverview("country", null)
      .then((data) => { if (!cancelled) setParticipant(data.participant) })
      .catch(() => { if (!cancelled) setParticipant(null) })
    return () => { cancelled = true }
  }, [])

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_15%_0%,rgba(34,211,238,.10),transparent_28rem),radial-gradient(circle_at_90%_10%,rgba(99,102,241,.14),transparent_34rem),#020817] text-white">
      <SiteNavbar participant={participant} />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-7">
          <p className="text-xs font-black uppercase tracking-[.18em] text-cyan-300">KOMUNITAS ALZAVA</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-5xl">Chat Global</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">Tempat peserta Battle Point saling menyapa, berbagi pengalaman, dan berkenalan secara langsung.</p>
        </div>
        <GlobalChat participant={participant} />
      </main>
      <SiteFooter />
    </div>
  )
}
