"use client"

import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react"
import { getParticipantToken } from "@/lib/battle"
import { PvpBattleResultModal, type PvpPlayerResult } from "@/components/pvp-battle-result-modal"

const PVP_API = "https://efndozplpwyemzgqfnep.supabase.co/functions/v1/battle-pvp"

type CapturedPlayer = {
  public_id?: string
  nickname?: string
  avatar_url?: string | null
}

type CapturedMatch = {
  id?: string
  status?: string
  winner?: "me" | "opponent" | null
  my_score?: number
  opponent_score?: number
  my_correct?: number
  opponent_correct?: number
  my_wrong?: number
  opponent_wrong?: number
  my_index?: number
  opponent_index?: number
}

type CapturedResult = {
  match: CapturedMatch
  me: CapturedPlayer
  opponent: CapturedPlayer
}

function asResult(player: CapturedPlayer, score: number, correct: number, wrong: number, index: number): PvpPlayerResult {
  return {
    nickname: player.nickname || "Pemain",
    avatarUrl: player.avatar_url || null,
    score,
    correct,
    wrong,
    totalQuestions: Math.max(index, correct + wrong),
  }
}

function requestUrl(input: RequestInfo | URL) {
  if (typeof input === "string") return input
  if (input instanceof URL) return input.toString()
  return input.url
}

function parseBody(init?: RequestInit) {
  if (typeof init?.body !== "string") return null
  try { return JSON.parse(init.body) as Record<string, unknown> } catch { return null }
}

export function PvpResultBridge() {
  const [captured, setCaptured] = useState<CapturedResult | null>(null)
  const [open, setOpen] = useState(false)
  const dismissed = useRef(new Set<string>())

  useLayoutEffect(() => {
    const originalFetch = window.fetch.bind(window)

    const patchedFetch: typeof window.fetch = async (input, init) => {
      const response = await originalFetch(input, init)
      try {
        const url = requestUrl(input)
        const body = parseBody(init)
        const action = String(body?.action || "")
        if (url.includes("/functions/v1/battle-pvp") && response.ok && ["state", "ready", "answer"].includes(action)) {
          const data = await response.clone().json().catch(() => null) as { match?: CapturedMatch; me?: CapturedPlayer; opponent?: CapturedPlayer } | null
          const match = data?.match
          const matchId = String(match?.id || body?.match_id || "")
          if (match?.status === "finished" && matchId && data?.me && data?.opponent && !dismissed.current.has(matchId)) {
            setCaptured({ match, me: data.me, opponent: data.opponent })
            setOpen(true)
          }
        }
      } catch {
        // Result interception must never interfere with the actual PVP request.
      }
      return response
    }

    window.fetch = patchedFetch
    return () => {
      if (window.fetch === patchedFetch) window.fetch = originalFetch
    }
  }, [])

  const dismiss = useCallback(() => {
    const id = captured?.match.id
    if (id) dismissed.current.add(id)
    setOpen(false)
  }, [captured?.match.id])

  const pair = useMemo(() => {
    if (!captured) return null
    const match = captured.match
    const me = asResult(
      captured.me,
      Number(match.my_score || 0),
      Number(match.my_correct || 0),
      Number(match.my_wrong || 0),
      Number(match.my_index || 0),
    )
    const rival = asResult(
      captured.opponent,
      Number(match.opponent_score || 0),
      Number(match.opponent_correct || 0),
      Number(match.opponent_wrong || 0),
      Number(match.opponent_index || 0),
    )
    if (match.winner === "opponent") return { winner: rival, opponent: me }
    return { winner: me, opponent: rival }
  }, [captured])

  const rematch = useCallback(async () => {
    if (!captured?.opponent.public_id) return
    const id = captured.match.id
    if (id) dismissed.current.add(id)
    setOpen(false)
    const token = getParticipantToken()
    if (!token) return
    try {
      const headers = { "Content-Type": "application/json", "X-Battle-Token": token }
      await window.fetch(PVP_API, { method: "POST", headers, body: JSON.stringify({ action: "lobby" }), cache: "no-store" })
      const response = await window.fetch(PVP_API, {
        method: "POST",
        headers,
        body: JSON.stringify({ action: "challenge", target_public_id: captured.opponent.public_id }),
        cache: "no-store",
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data?.error || "Tantangan ulang belum dapat dikirim.")
      window.location.reload()
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Tantangan ulang belum dapat dikirim.")
    }
  }, [captured])

  if (!captured || !pair) return null

  return (
    <PvpBattleResultModal
      open={open}
      onClose={dismiss}
      onViewDetails={dismiss}
      onRematch={() => void rematch()}
      durationSeconds={600}
      winner={pair.winner}
      opponent={pair.opponent}
    />
  )
}

export default PvpResultBridge
