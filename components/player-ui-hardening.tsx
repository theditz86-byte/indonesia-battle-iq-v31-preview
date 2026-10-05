"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

const PROFILE_API = "https://efndozplpwyemzgqfnep.supabase.co/functions/v1/battle-profile"

type RankedRow = {
  season_label?: string | null
  season_number?: number | null
  national_rank?: number | null
  battle_score?: number | null
  achieved_at?: string | null
}

type BattleTitle = {
  title?: string | null
  final_rank?: number | null
  battle_score?: number | null
}

type ProfilePayload = {
  history?: RankedRow[]
  featured_title?: BattleTitle | null
}

function seasonLabel(row?: RankedRow | null) {
  const label = String(row?.season_label || "").trim()
  if (label) return label
  const number = Number(row?.season_number)
  return Number.isFinite(number) && number > 0 ? `Season ${number}` : ""
}

function expandPlayerNames() {
  const links = document.querySelectorAll<HTMLElement>('a[href^="/player"], a[href*="/player?id="]')
  links.forEach((link) => {
    if (!link.classList.contains("truncate")) return
    link.classList.remove("truncate")
    link.classList.add("whitespace-normal", "break-words")
    link.style.overflow = "visible"
    link.style.textOverflow = "clip"
    link.style.whiteSpace = "normal"
    link.style.maxWidth = "100%"
  })

  if (window.location.pathname.startsWith("/player")) {
    document.querySelectorAll<HTMLElement>("main h1.truncate").forEach((heading) => {
      heading.classList.remove("truncate")
      heading.classList.add("break-words")
      heading.style.overflow = "visible"
      heading.style.textOverflow = "clip"
      heading.style.whiteSpace = "normal"
    })
  }
}

function applyChampionSeason(title: string, label: string) {
  if (!title || !label) return
  const badges = Array.from(document.querySelectorAll<HTMLElement>("main span"))
  const badge = badges.find((element) => {
    const text = (element.childNodes[0]?.textContent || element.textContent || "").trim()
    return text.includes(title) && text.includes("★")
  })
  if (!badge) return

  badge.style.display = "inline-flex"
  badge.style.flexDirection = "column"
  badge.style.alignItems = "center"
  badge.style.justifyContent = "center"
  badge.style.lineHeight = "1.05"
  badge.style.paddingTop = "0.35rem"
  badge.style.paddingBottom = "0.35rem"

  let sub = badge.querySelector<HTMLElement>(".alzava-champion-season")
  if (!sub) {
    sub = document.createElement("span")
    sub.className = "alzava-champion-season"
    sub.style.fontSize = "9px"
    sub.style.fontWeight = "800"
    sub.style.letterSpacing = ".04em"
    sub.style.opacity = ".78"
    sub.style.marginTop = "2px"
    badge.appendChild(sub)
  }
  sub.textContent = label
}

export function PlayerUiHardening() {
  const pathname = usePathname()

  useEffect(() => {
    let cancelled = false
    let championTitle = ""
    let championSeason = ""

    const apply = () => {
      expandPlayerNames()
      if (championTitle && championSeason) applyChampionSeason(championTitle, championSeason)
    }

    const observer = new MutationObserver(apply)
    observer.observe(document.body, { childList: true, subtree: true })
    apply()

    if (pathname?.startsWith("/player")) {
      const publicId = new URLSearchParams(window.location.search).get("id") || ""
      if (publicId) {
        void fetch(`${PROFILE_API}?id=${encodeURIComponent(publicId)}`, { cache: "no-store" })
          .then(async (response) => response.ok ? response.json() as Promise<ProfilePayload> : null)
          .then((payload) => {
            if (cancelled || !payload?.featured_title?.title) return
            const featured = payload.featured_title
            if (!String(featured.title).toLowerCase().includes("champion")) return

            const history = Array.isArray(payload.history) ? payload.history : []
            const exact = history
              .filter((row) => Number(row.national_rank) === Number(featured.final_rank || 1))
              .filter((row) => featured.battle_score == null || Number(row.battle_score) === Number(featured.battle_score))
              .sort((a, b) => Number(b.season_number || 0) - Number(a.season_number || 0))[0]
            const fallback = history
              .filter((row) => Number(row.national_rank) === 1)
              .sort((a, b) => Number(b.season_number || 0) - Number(a.season_number || 0))[0]

            championTitle = String(featured.title)
            championSeason = seasonLabel(exact || fallback)
            apply()
          })
          .catch(() => {})
      }
    }

    return () => {
      cancelled = true
      observer.disconnect()
    }
  }, [pathname])

  return null
}
