"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

const textReplacements: Record<string, string> = {
  "Latihan SKD": "Latihan",
  "Battle PVP": "Battle",
  "History Ranking": "Riwayat Season",
  "PLAYER PROFILE": "PROFIL PEMAIN",
  "Player Profile": "Profil Pemain",
  "Progress Ranking": "Progres Peringkat",
}

function replaceExactText(root: ParentNode = document) {
  const nodes = root.querySelectorAll<HTMLElement>("a,button,span,p,h1,h2,h3")
  nodes.forEach((node) => {
    if (node.children.length > 0) return
    const clean = (node.textContent || "").trim()
    const replacement = textReplacements[clean]
    if (replacement && clean !== replacement) node.textContent = replacement
  })
}

function tuneNavigation() {
  const header = document.querySelector<HTMLElement>("header")
  if (!header) return

  const authenticated = Boolean(header.querySelector('[data-alzava-profile-menu="controlled"]'))
  header.classList.toggle("alzava-authenticated-nav", authenticated)
  replaceExactText(header)

  const menu = header.querySelector<HTMLElement>('[role="menu"]')
  if (!menu || menu.querySelector('[data-premium-extra="true"]')) return

  const separator = document.createElement("div")
  separator.dataset.premiumExtra = "true"
  separator.className = "my-0.5 border-t border-white/10"

  const extras = [
    ["/history-ranking", "Riwayat Season"],
    ["/global-chat", "Chat Global"],
    ["/help", "Bantuan & Aturan"],
  ] as const

  const wrapper = document.createElement("div")
  wrapper.dataset.premiumExtra = "true"
  wrapper.className = "grid gap-0.5"

  extras.forEach(([href, label]) => {
    const link = document.createElement("a")
    link.href = href
    link.textContent = label
    link.className = "flex items-center rounded-lg px-2.5 py-1.5 text-[12px] font-bold text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
    wrapper.appendChild(link)
  })

  menu.append(separator, wrapper)
}

function tunePlayerPage(pathname: string | null) {
  if (!pathname?.startsWith("/player")) return
  replaceExactText(document.querySelector("main") || document)
}

export function PremiumUxPass() {
  const pathname = usePathname()

  useEffect(() => {
    let scheduled = 0
    const apply = () => {
      window.clearTimeout(scheduled)
      scheduled = window.setTimeout(() => {
        document.body.dataset.alzavaRoute = pathname || ""
        tuneNavigation()
        tunePlayerPage(pathname)
      }, 30)
    }

    const observer = new MutationObserver(apply)
    observer.observe(document.body, { childList: true, subtree: true, characterData: true })
    apply()

    return () => {
      window.clearTimeout(scheduled)
      observer.disconnect()
    }
  }, [pathname])

  return (
    <style>{`
      @media (min-width:1280px){
        header.alzava-authenticated-nav nav a[href="/history-ranking"],
        header.alzava-authenticated-nav nav a[href="/global-chat"],
        header.alzava-authenticated-nav nav a[href="/help"]{display:none!important}
      }

      body[data-alzava-route="/battle"] main .text-slate-500,
      body[data-alzava-route="/battle/"] main .text-slate-500,
      body[data-alzava-route="/battle"] main .text-slate-600,
      body[data-alzava-route="/battle/"] main .text-slate-600{
        color:rgb(148 163 184)!important;
      }

      body[data-alzava-route="/battle"] main > section:first-child [class*="shadow-[0_0_"],
      body[data-alzava-route="/battle/"] main > section:first-child [class*="shadow-[0_0_"]{
        filter:saturate(.96);
      }

      body[data-alzava-route="/battle"] main > section:first-child,
      body[data-alzava-route="/battle/"] main > section:first-child{
        border-bottom:1px solid rgba(255,255,255,.035);
      }

      body[data-alzava-route="/battle-test"] button,
      body[data-alzava-route="/battle-test/"] button,
      body[data-alzava-route="/battle-test"] a,
      body[data-alzava-route="/battle-test/"] a{
        transition-duration:160ms!important;
      }

      body[data-alzava-route="/battle-test"] main,
      body[data-alzava-route="/battle-test/"] main{
        letter-spacing:-.005em;
      }

      body[data-alzava-route="/player"] main h1,
      body[data-alzava-route="/player/"] main h1{
        text-wrap:balance;
      }

      @media (prefers-reduced-motion:reduce){
        *{scroll-behavior:auto!important;animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}
      }
    `}</style>
  )
}
