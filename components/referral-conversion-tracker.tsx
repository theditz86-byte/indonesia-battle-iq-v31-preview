"use client"

import { useEffect } from "react"
import { getParticipantToken } from "@/lib/battle"
import {
  REFERRAL_CONVERTED_KEY,
  REFERRAL_REFERRER_KEY,
  REFERRAL_SOURCE_KEY,
  REFERRAL_VISITOR_KEY,
  referralCall,
} from "@/lib/referral"

export function ReferralConversionTracker() {
  useEffect(() => {
    let stopped = false
    let attempts = 0

    async function tryConvert() {
      if (stopped) return
      attempts += 1
      const token = getParticipantToken()
      if (!token) return
      try {
        const referrer = localStorage.getItem(REFERRAL_REFERRER_KEY) || ""
        const visitor = localStorage.getItem(REFERRAL_VISITOR_KEY) || ""
        const source = localStorage.getItem(REFERRAL_SOURCE_KEY) || "direct"
        const marker = `${referrer}:${visitor}`
        if (!/^[0-9a-f-]{36}$/i.test(referrer) || !/^[A-Za-z0-9_-]{8,80}$/.test(visitor)) return
        if (localStorage.getItem(REFERRAL_CONVERTED_KEY) === marker) return
        await referralCall({ action: "conversion", referrer_public_id: referrer, visitor_key: visitor, source }, true)
        localStorage.setItem(REFERRAL_CONVERTED_KEY, marker)
      } catch {}
    }

    void tryConvert()
    const timer = window.setInterval(() => {
      if (attempts >= 12) { window.clearInterval(timer); return }
      if (document.visibilityState === "visible") void tryConvert()
    }, 2500)
    const onFocus = () => void tryConvert()
    window.addEventListener("focus", onFocus)
    return () => { stopped = true; window.clearInterval(timer); window.removeEventListener("focus", onFocus) }
  }, [])

  return null
}
