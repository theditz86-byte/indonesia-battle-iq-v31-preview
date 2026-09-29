"use client"

import { useEffect, useMemo, useState } from "react"
import { PvpBattleResultModal, type PvpPlayerResult } from "@/components/pvp-battle-result-modal"

const PROFILE_API = "https://efndozplpwyemzgqfnep.supabase.co/functions/v1/battle-profile"

type Profile = {
  public_id?: string
  nickname?: string
  avatar_url?: string | null
}

type PvpHistoryRow = {
  id?: string
  my_score?: number | null
  opponent_score?: number | null
  my_correct?: number | null
  my_wrong?: number | null
  opponent_correct?: number | null
  opponent_wrong?: number | null
  result?: "win" | "loss" | "draw" | string
  opponent_public_id?: string | null
  opponent_nickname?: string | null
  opponent_avatar_url?: string | null
}

type ProfilePayload = {
  profile?: Profile
  pvp_history?: PvpHistoryRow[]
}

function asPlayer(nickname: string | undefined, avatarUrl: string | null | undefined, score: number | null | undefined, correct: number | null | undefined, wrong: number | null | undefined): PvpPlayerResult {
  const c = Number(correct || 0)
  const w = Number(wrong || 0)
  return {
    nickname: nickname || "Pemain",
    avatarUrl: avatarUrl || null,
    score: Number(score || 0),
    correct: c,
    wrong: w,
    totalQuestions: c + w,
  }
}

export function PvpHistoryShareBridge() {
  const [payload, setPayload] = useState<ProfilePayload | null>(null)
  const [selected, setSelected] = useState<PvpHistoryRow | null>(null)

  useEffect(() => {
    if (!window.location.pathname.startsWith("/player")) return
    const id = new URLSearchParams(window.location.search).get("id") || ""
    if (!id) return
    const controller = new AbortController()
    void fetch(`${PROFILE_API}?id=${encodeURIComponent(id)}`, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) return null
        return await response.json().catch(() => null) as ProfilePayload | null
      })
      .then((data) => { if (data) setPayload(data) })
      .catch(() => {})
    return () => controller.abort()
  }, [])

  useEffect(() => {
    const rows = Array.isArray(payload?.pvp_history) ? payload!.pvp_history! : []
    if (!rows.length || !window.location.pathname.startsWith("/player")) return

    const cleanup: Array<() => void> = []
    let stopped = false

    const enhance = () => {
      if (stopped) return
      const heading = Array.from(document.querySelectorAll("h2")).find((node) => node.textContent?.trim() === "Riwayat Battle PVP")
      const section = heading?.closest("section")
      if (!section) return
      const list = Array.from(section.querySelectorAll(":scope > div.mt-5.space-y-3 > div")) as HTMLElement[]
      list.slice(0, rows.length).forEach((card, index) => {
        if (card.dataset.pvpHistoryEnhanced === "1") return
        const row = rows[index]
        if (!row) return
        card.dataset.pvpHistoryEnhanced = "1"
        card.classList.add("cursor-pointer", "transition", "duration-200", "hover:border-cyan-300/35", "hover:bg-cyan-300/[.06]", "hover:-translate-y-0.5")
        card.setAttribute("role", "button")
        card.setAttribute("tabindex", "0")
        card.setAttribute("aria-label", `Lihat dan bagikan hasil PVP melawan ${row.opponent_nickname || "lawan"}`)
        card.title = "Klik untuk lihat & bagikan hasil PVP"
        const open = (event: Event) => {
          const target = event.target as HTMLElement | null
          if (target?.closest("a")) return
          setSelected(row)
        }
        const key = (event: KeyboardEvent) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            setSelected(row)
          }
        }
        card.addEventListener("click", open)
        card.addEventListener("keydown", key)
        cleanup.push(() => {
          card.removeEventListener("click", open)
          card.removeEventListener("keydown", key)
          delete card.dataset.pvpHistoryEnhanced
        })
      })
    }

    enhance()
    const observer = new MutationObserver(enhance)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => {
      stopped = true
      observer.disconnect()
      cleanup.forEach((fn) => fn())
    }
  }, [payload])

  const pair = useMemo(() => {
    if (!selected || !payload?.profile) return null
    const me = asPlayer(payload.profile.nickname, payload.profile.avatar_url, selected.my_score, selected.my_correct, selected.my_wrong)
    const rival = asPlayer(selected.opponent_nickname || undefined, selected.opponent_avatar_url, selected.opponent_score, selected.opponent_correct, selected.opponent_wrong)
    if (selected.result === "loss") return { winner: rival, opponent: me }
    return { winner: me, opponent: rival }
  }, [payload, selected])

  if (!selected || !pair) return null

  return (
    <PvpBattleResultModal
      open={Boolean(selected)}
      onClose={() => setSelected(null)}
      onViewDetails={() => setSelected(null)}
      onRematch={() => { window.location.href = "/pvp" }}
      durationSeconds={600}
      winner={pair.winner}
      opponent={pair.opponent}
    />
  )
}
