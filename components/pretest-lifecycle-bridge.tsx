"use client"

import { useEffect, useRef } from "react"
import { PARTICIPANT_TOKEN_KEY } from "@/lib/battle"
import { PRETEST_API, PRETEST_CLAIMED_KEY, PRETEST_GUEST_KEY } from "@/components/pretest-experience"

export function PretestLifecycleBridge() {
  const claiming = useRef(false)
  const registerOpened = useRef(false)

  useEffect(() => {
    let stopped = false

    function openRegisterTab() {
      if (registerOpened.current || window.location.pathname !== "/account") return
      const params = new URLSearchParams(window.location.search)
      if (params.get("pretest") !== "register") return
      const button = Array.from(document.querySelectorAll("button")).find((el) => el.textContent?.trim() === "Daftar") as HTMLButtonElement | undefined
      if (button) { registerOpened.current = true; button.click() }
    }

    async function claim() {
      if (claiming.current) return
      const guest = localStorage.getItem(PRETEST_GUEST_KEY) || ""
      const participant = localStorage.getItem(PARTICIPANT_TOKEN_KEY) || ""
      if (!guest || !participant || localStorage.getItem(PRETEST_CLAIMED_KEY) === guest) return
      claiming.current = true
      try {
        const response = await fetch(PRETEST_API, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Pretest-Token": guest, "X-Battle-Token": participant },
          body: JSON.stringify({ action: "claim" }),
          cache: "no-store",
        })
        const data = await response.json().catch(() => ({}))
        if (response.ok && data?.claimed) {
          localStorage.setItem(PRETEST_CLAIMED_KEY, guest)
          localStorage.removeItem(PRETEST_GUEST_KEY)
          window.dispatchEvent(new CustomEvent("alzava-pretest-claimed", { detail: data.baseline || null }))
        }
      } finally { claiming.current = false }
    }

    const tick = () => { if (!stopped) { openRegisterTab(); void claim() } }
    tick()
    const timer = window.setInterval(tick, 1500)
    const onFocus = () => tick()
    const onCompleted = () => tick()
    window.addEventListener("focus", onFocus)
    window.addEventListener("alzava-pretest-completed", onCompleted)
    return () => { stopped = true; window.clearInterval(timer); window.removeEventListener("focus", onFocus); window.removeEventListener("alzava-pretest-completed", onCompleted) }
  }, [])

  return null
}