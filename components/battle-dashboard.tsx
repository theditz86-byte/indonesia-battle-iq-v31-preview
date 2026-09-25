"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Hero } from "@/components/hero"
import { Leaderboard } from "@/components/leaderboard"
import { PathToTop, PromoBanner } from "@/components/sidebar-cards"
import { SiteFooter } from "@/components/site-footer"
import { SiteNavbar } from "@/components/site-navbar"
import { UserProfileCard } from "@/components/user-profile-card"
import {
  BattleEntry,
  BattleParticipant,
  BattleSeason,
  fetchOverview,
  removeParticipantToken,
  Scope,
} from "@/lib/battle"

export function BattleDashboard() {
  const [season, setSeason] = useState<BattleSeason | null>(null)
  const [entries, setEntries] = useState<BattleEntry[]>([])
  const [heroEntries, setHeroEntries] = useState<BattleEntry[]>([])
  const [participant, setParticipant] = useState<BattleParticipant | null>(null)
  const [scope, setScope] = useState<Scope>("country")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const participantRef = useRef<BattleParticipant | null>(null)
  const scopeRef = useRef<Scope>("country")

  useEffect(() => {
    participantRef.current = participant
  }, [participant])

  useEffect(() => {
    scopeRef.current = scope
  }, [scope])

  const load = useCallback(async (targetScope: Scope, background = false) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    if (!background) setLoading(true)
    setError("")
    try {
      const data = await fetchOverview(targetScope, participantRef.current, controller.signal)
      setSeason(data.season)
      setEntries(data.entries)
      if (targetScope === "country") setHeroEntries(data.entries)
      setParticipant(data.participant)
      participantRef.current = data.participant
      setUpdatedAt(new Date(data.generated_at || Date.now()))
      if (!data.participant && targetScope !== "country") {
        setScope("country")
        scopeRef.current = "country"
      }
      if (!data.participant) removeParticipantToken()
    } catch (err) {
      if ((err as Error)?.name !== "AbortError") {
        setError("Papan peringkat belum dapat dimuat. Periksa koneksi lalu coba lagi.")
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false)
    }
  }, [])

  useEffect(() => {
    load("country")
    const refresh = window.setInterval(() => {
      if (document.visibilityState === "visible") load(scopeRef.current, true)
    }, 60000)
    return () => {
      window.clearInterval(refresh)
      abortRef.current?.abort()
    }
  }, [load])

  const selectScope = useCallback((next: Scope) => {
    if (next !== "country" && !participantRef.current) {
      window.location.href = "/account"
      return
    }
    setScope(next)
    scopeRef.current = next
    load(next)
  }, [load])

  const ownEntry = useMemo(() => {
    if (!participant?.public_id) return undefined
    return entries.find((entry) => entry.participant_public_id === participant.public_id)
  }, [entries, participant])

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <SiteNavbar participant={participant} />
      <main>
        <Hero season={season} entries={heroEntries} />
        <div className="relative z-10 mx-auto mt-3 max-w-7xl px-4 sm:px-6 lg:mt-4">
          <UserProfileCard participant={participant} ownEntry={ownEntry} scope={scope} />
        </div>
        <div className="mx-auto mt-10 max-w-7xl px-4 pb-16 sm:px-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="min-w-0 lg:col-span-2" id="peringkat">
              <Leaderboard
                entries={entries}
                participant={participant}
                scope={scope}
                loading={loading}
                error={error}
                updatedAt={updatedAt}
                onScopeChange={selectScope}
                onRefresh={() => load(scopeRef.current)}
              />
            </div>
            <div className="flex min-w-0 flex-col gap-6">
              <PathToTop />
              <PromoBanner />
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
