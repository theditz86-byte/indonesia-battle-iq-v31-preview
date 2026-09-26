"use client"

import { useEffect } from "react"
import { getParticipantToken } from "@/lib/battle"

const GROWTH_API = "https://efndozplpwyemzgqfnep.supabase.co/functions/v1/battle-growth"
const VISITOR_KEY = "alzava.growth.visitor"

function visitorKey() {
  try {
    let value = window.localStorage.getItem(VISITOR_KEY) || ""
    if (!/^[A-Za-z0-9_-]{8,80}$/.test(value)) {
      value = crypto.randomUUID().replaceAll("-", "")
      window.localStorage.setItem(VISITOR_KEY, value)
    }
    return value
  } catch {
    return `v${Math.random().toString(36).slice(2, 18)}`
  }
}

function source() {
  const params = new URLSearchParams(window.location.search)
  const explicit = params.get("utm_source") || params.get("src") || ""
  if (explicit) return explicit.slice(0, 80)
  try {
    const ref = document.referrer ? new URL(document.referrer) : null
    return ref?.hostname || "direct"
  } catch {
    return "direct"
  }
}

async function send(eventName: string, metadata: Record<string, unknown> = {}) {
  const token = getParticipantToken()
  try {
    await fetch(GROWTH_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { "X-Battle-Token": token } : {}),
      },
      body: JSON.stringify({
        event_name: eventName,
        visitor_key: visitorKey(),
        path: window.location.pathname,
        source: source(),
        metadata,
      }),
      keepalive: true,
      cache: "no-store",
    })
  } catch {}
}

function pageEvent(path: string) {
  if (path.startsWith("/battle-test")) return "page_ranked"
  if (path.startsWith("/daily-training")) return "page_daily_training"
  if (path.startsWith("/result")) return "page_result"
  if (path.startsWith("/pvp")) return "page_pvp"
  if (path.startsWith("/account")) return "page_account"
  if (path.startsWith("/share-challenge") || path.startsWith("/challenge")) return "page_share"
  if (path === "/" || path.startsWith("/battle")) return "page_battle"
  return ""
}

export function GrowthTracker() {
  useEffect(() => {
    const event = pageEvent(window.location.pathname)
    if (event) void send(event)

    const onClick = (e: MouseEvent) => {
      const target = e.target instanceof Element ? e.target.closest("a[href]") : null
      if (!(target instanceof HTMLAnchorElement)) return
      const href = target.getAttribute("href") || ""
      if (href.startsWith("/battle-test")) void send("click_ranked", { href })
      else if (href.startsWith("/daily-training")) void send("click_daily_training", { href })
      else if (href.startsWith("/pvp")) void send("click_pvp", { href })
      else if (href.startsWith("/account")) void send("click_account", { href })
    }

    window.addEventListener("click", onClick, true)
    return () => window.removeEventListener("click", onClick, true)
  }, [])

  return null
}

export function trackGrowthEvent(eventName: string, metadata: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return
  void send(eventName.slice(0, 80), metadata)
}
