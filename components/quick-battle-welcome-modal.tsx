"use client"

import { usePathname } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"
import { DESC_ID, TITLE_ID } from "./quick-battle/parts"
import { DesktopStage, STAGE_H, STAGE_W } from "./quick-battle/desktop-stage"
import { MobileSheet } from "./quick-battle/mobile-sheet"

const DISMISS_KEY = "alzava_quickbattle_popup_dismissed_at"
const DAY_MS = 24 * 60 * 60 * 1000
const SHOW_DELAY_MS = 0
const EXIT_MS = 220

function shouldSuppress(pathname: string) {
  if (pathname.startsWith("/admin") || pathname === "/pretest") return true
  try {
    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY))
    return Boolean(dismissedAt) && Date.now() - dismissedAt < DAY_MS
  } catch {
    return false
  }
}

export function QuickBattleWelcomeModal() {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)
  const [size, setSize] = useState({ w: 1440, h: 900 })
  const dialogRef = useRef<HTMLDivElement>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (pathname !== "/" && pathname !== "/battle") return
    const forced = new URLSearchParams(window.location.search).has("qb")
    if (!forced && shouldSuppress(pathname)) return
    const timer = window.setTimeout(() => {
      returnFocusRef.current = document.activeElement as HTMLElement | null
      setMounted(true)
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)))
    }, SHOW_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [pathname])

  useEffect(() => {
    if (!mounted) return
    const update = () => setSize({ w: window.innerWidth, h: window.innerHeight })
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [mounted])

  useEffect(() => {
    if (visible) dialogRef.current?.focus()
  }, [visible])

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(DISMISS_KEY, Date.now().toString())
    } catch {}
    setVisible(false)
    window.setTimeout(() => {
      setMounted(false)
      returnFocusRef.current?.focus?.()
    }, EXIT_MS)
  }, [])

  const start = useCallback(() => {
    window.location.href = "/pretest"
  }, [])

  useEffect(() => {
    if (!mounted) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss()
    }
    document.addEventListener("keydown", onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [mounted, dismiss])

  if (!mounted) return null

  const isMobile = size.w < 768
  const baseScale = Math.min((Math.min(size.w * 0.92, STAGE_W)) / STAGE_W, (size.h * 0.9) / STAGE_H)
  const scale = baseScale * 0.75

  return (
    <div
      className={`fixed inset-0 z-[9999] flex ${isMobile ? "items-end justify-center pb-2" : "items-center justify-center"} bg-[rgba(1,7,20,.82)] backdrop-blur-[10px] transition-opacity duration-[250ms] motion-reduce:transition-none ${visible ? "opacity-100" : "opacity-0"}`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) dismiss()
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={TITLE_ID}
        aria-describedby={DESC_ID}
        tabIndex={-1}
        className={`font-[family-name:var(--font-qb)] outline-none transition-all duration-[320ms] ease-out motion-reduce:transition-none ${visible ? "translate-y-0 scale-100 opacity-100" : "translate-y-[14px] scale-[0.965] opacity-0"}`}
        style={isMobile ? { width: "calc(100vw - 16px)" } : { width: STAGE_W * scale, height: STAGE_H * scale }}
      >
        {isMobile ? (
          <MobileSheet onStart={start} onDismiss={dismiss} />
        ) : (
          <div style={{ width: STAGE_W, height: STAGE_H, transform: `scale(${scale})`, transformOrigin: "top left" }}>
            <DesktopStage onStart={start} onDismiss={dismiss} />
          </div>
        )}
      </div>
    </div>
  )
}
