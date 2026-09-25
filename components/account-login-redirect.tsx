"use client"

import { useEffect } from "react"
import { PARTICIPANT_TOKEN_KEY } from "@/lib/battle"

export function AccountLoginRedirect() {
  useEffect(() => {
    const path = window.location.pathname
    if (!(path === "/account" || path === "/account/")) return

    let previousHasToken = Boolean(window.localStorage.getItem(PARTICIPANT_TOKEN_KEY))
    const timer = window.setInterval(() => {
      const hasToken = Boolean(window.localStorage.getItem(PARTICIPANT_TOKEN_KEY))
      if (!previousHasToken && hasToken) {
        window.clearInterval(timer)
        window.location.replace("/battle")
        return
      }
      previousHasToken = hasToken
    }, 200)

    return () => window.clearInterval(timer)
  }, [])

  return null
}
