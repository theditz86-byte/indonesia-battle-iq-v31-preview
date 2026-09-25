"use client"

import { useEffect, useState } from "react"
import { PrivateMessages } from "@/components/private-messages"
import { SiteFooter } from "@/components/site-footer"
import { SiteNavbar } from "@/components/site-navbar"
import { fetchOverview } from "@/lib/battle"
import type { BattleParticipant } from "@/lib/battle"

export default function MessagesPage() {
  const [participant, setParticipant] = useState<BattleParticipant | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    void fetchOverview("country", null, controller.signal)
      .then((data) => setParticipant(data.participant))
      .catch(() => setParticipant(null))
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [])

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_30%_-10%,rgba(34,211,238,.10),transparent_34rem),radial-gradient(circle_at_90%_5%,rgba(124,58,237,.10),transparent_32rem),#020617] text-white">
      <SiteNavbar participant={participant} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        {loading ? <div className="grid min-h-[540px] place-items-center text-sm text-slate-500">Memuat Pesan & Teman…</div> : <PrivateMessages participant={participant} />}
      </main>
      <SiteFooter />
    </div>
  )
}
