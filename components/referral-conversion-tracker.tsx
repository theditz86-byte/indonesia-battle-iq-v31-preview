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
    const token = getParticipantToken()
    if (!token) return
    try {
      const referrer = localStorage.getItem(REFERRAL_REFERRER_KEY) || ""
      const visitor = localStorage.getItem(REFERRAL_VISITOR_KEY) || ""
      const source = localStorage.getItem(REFERRAL_SOURCE_KEY) || "direct"
      const marker = `${referrer}:${visitor}`
      if (!/^[0-9a-f-]{36}$/i.test(referrer) || !/^[A-Za-z0-9_-]{8,80}$/.test(visitor)) return
      if (localStorage.getItem(REFERRAL_CONVERTED_KEY) === marker) return
      void referralCall({ action: "conversion", referrer_public_id: referrer, visitor_key: visitor, source }, true)
        .then(() => localStorage.setItem(REFERRAL_CONVERTED_KEY, marker))
        .catch(() => {})
    } catch {}
  }, [])

  return null
}
