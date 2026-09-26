"use client"

import { useEffect } from "react"
import { PARTICIPANT_TOKEN_KEY } from "@/lib/battle"

function safeNextPath() {
  const raw = new URLSearchParams(window.location.search).get("next") || ""
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/battle"
  try {
    const parsed = new URL(raw, window.location.origin)
    if (parsed.origin !== window.location.origin) return "/battle"
    return `${parsed.pathname}${parsed.search}${parsed.hash}` || "/battle"
  } catch {
    return "/battle"
  }
}

export function AccountLoginRedirect() {
  useEffect(() => {
    const path = window.location.pathname
    if (!(path === "/account" || path === "/account/")) return

    let previousHasToken = Boolean(window.localStorage.getItem(PARTICIPANT_TOKEN_KEY))
    const timer = window.setInterval(() => {
      const hasToken = Boolean(window.localStorage.getItem(PARTICIPANT_TOKEN_KEY))
      if (!previousHasToken && hasToken) {
        window.clearInterval(timer)
        window.location.replace(safeNextPath())
        return
      }
      previousHasToken = hasToken
    }, 200)

    return () => window.clearInterval(timer)
  }, [])

  return null
}
