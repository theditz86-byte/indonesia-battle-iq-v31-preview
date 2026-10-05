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
  season_label?: string | null
  season_number?: number | null
}

type ProfilePayload = {
  history?: RankedRow[]
  featured_title?: BattleTitle | null
}

function seasonLabel(row?: RankedRow | BattleTitle | null) {
  const label = String(row?.season_label || "").trim()
  if (label) return label
  const number = Number(row?.season_number)
  return Number.isFinite(number) && number > 0 ? `Season ${number}` : ""
}

function makeNameFullyVisible(element: HTMLElement) {
  element.classList.remove("truncate")
  element.classList.add("whitespace-normal", "break-words")
  element.style.overflow = "visible"
  element.style.textOverflow = "clip"
  element.style.whiteSpace = "normal"
  element.style.maxWidth = "100%"
}

function expandPlayerNames() {
  const playerLinks = document.querySelectorAll<HTMLElement>('a[href^="/player"], a[href*="/player?id="]')
  playerLinks.forEach((link) => {
    if (link.classList.contains("truncate")) makeNameFullyVisible(link)
    link.querySelectorAll<HTMLElement>(".truncate").forEach(makeNameFullyVisible)
    const fullName = (link.textContent || "").trim()
    if (fullName && !link.getAttribute("title")) link.setAttribute("title", fullName)
  })

  document.querySelectorAll<HTMLElement>(".truncate").forEach((element) => {
    const text = (element.textContent || "").trim()
    const nearby = (element.parentElement?.textContent || "").toLowerCase()
    if (text && text.length <= 24 && nearby.includes("panggilan")) makeNameFullyVisible(element)
  })

  if (window.location.pathname.startsWith("/player")) {
    document.querySelectorAll<HTMLElement>("main h1.truncate").forEach(makeNameFullyVisible)
  }
}

function findChampionBadge(title: string) {
  const wanted = title.toLowerCase().trim()
  const badges = Array.from(document.querySelectorAll<HTMLElement>("main span"))

  return badges.find((element) => {
    const text = (element.textContent || "").toLowerCase().replace(/\s+/g, " ").trim()
    return text.includes(wanted) || (wanted.includes("champion") && text.includes("champion indonesia"))
  }) || null
}

function applyPremiumChampionBadge(title: string, label: string) {
  if (!title || !label) return
  const badge = findChampionBadge(title)
  if (!badge) return

  const signature = `${title}|${label}`

  badge.style.position = "relative"
  badge.style.display = "inline-flex"
  badge.style.flexDirection = "column"
  badge.style.alignItems = "flex-start"
  badge.style.justifyContent = "center"
  badge.style.gap = "2px"
  badge.style.minHeight = "42px"
  badge.style.padding = "7px 13px 7px 14px"
  badge.style.borderRadius = "14px"
  badge.style.border = "1px solid rgba(251, 191, 36, .62)"
  badge.style.background = "linear-gradient(135deg, rgba(251,191,36,.20) 0%, rgba(180,120,18,.14) 46%, rgba(78,52,8,.26) 100%)"
  badge.style.color = "rgb(254 243 199)"
  badge.style.boxShadow = "0 0 0 1px rgba(255,224,128,.08), 0 0 18px rgba(251,191,36,.24), 0 0 34px rgba(245,158,11,.13), inset 0 1px 0 rgba(255,255,255,.12)"
  badge.style.textShadow = "0 0 12px rgba(251,191,36,.22)"
  badge.style.overflow = "visible"
  badge.style.lineHeight = "1.05"
  badge.style.letterSpacing = "0"
  badge.style.whiteSpace = "nowrap"

  if (badge.dataset.alzavaPremiumChampion !== signature) {
    badge.dataset.alzavaPremiumChampion = signature
    badge.replaceChildren()

    const titleRow = document.createElement("span")
    titleRow.style.display = "inline-flex"
    titleRow.style.alignItems = "center"
    titleRow.style.gap = "6px"
    titleRow.style.fontSize = "11px"
    titleRow.style.fontWeight = "900"
    titleRow.style.color = "rgb(254 240 138)"
    titleRow.style.whiteSpace = "nowrap"

    const mark = document.createElement("span")
    mark.textContent = "✦"
    mark.style.fontSize = "12px"
    mark.style.color = "rgb(253 224 71)"
    mark.style.filter = "drop-shadow(0 0 6px rgba(250,204,21,.65))"

    const titleText = document.createElement("span")
    titleText.textContent = title

    const season = document.createElement("span")
    season.textContent = label.toUpperCase()
    season.style.fontSize = "9px"
    season.style.fontWeight = "900"
    season.style.letterSpacing = ".14em"
    season.style.color = "rgba(254,243,199,.76)"
    season.style.paddingLeft = "18px"

    titleRow.append(mark, titleText)
    badge.append(titleRow, season)
  }
}

export function PlayerUiHardening() {
  const pathname = usePathname()

  useEffect(() => {
    let cancelled = false
    let championTitle = ""
    let championSeason = ""
    let scheduled = 0

    const apply = () => {
      window.clearTimeout(scheduled)
      scheduled = window.setTimeout(() => {
        expandPlayerNames()
        if (championTitle && championSeason) applyPremiumChampionBadge(championTitle, championSeason)
      }, 20)
    }

    const observer = new MutationObserver(apply)
    observer.observe(document.body, { childList: true, subtree: true, characterData: true })
    apply()

    if (pathname?.startsWith("/player")) {
      const publicId = new URLSearchParams(window.location.search).get("id") || ""
      if (publicId) {
        void fetch(`${PROFILE_API}?id=${encodeURIComponent(publicId)}&v=${Date.now()}`, { cache: "no-store" })
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
            championSeason = seasonLabel(featured) || seasonLabel(exact || fallback)
            apply()
          })
          .catch(() => {})
      }
    }

    return () => {
      cancelled = true
      window.clearTimeout(scheduled)
      observer.disconnect()
    }
  }, [pathname])

  return null
}
