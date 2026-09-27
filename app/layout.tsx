import type { Metadata, Viewport } from "next"
import "./globals.css"
import "./attempt-history.css"
import "./pvp-result-trophy.css"
import { AccountLoginRedirect } from "@/components/account-login-redirect"
import { GrowthTracker } from "@/components/growth-tracker"
import { ReferralConversionTracker } from "@/components/referral-conversion-tracker"
import { ResultErrorAnalysis } from "@/components/result-error-analysis"
import { RankedIntegrityMonitor } from "@/components/ranked-integrity-monitor"

const BRAND_ICON = "/brand/alvaza-logo-new.svg?v=20260925-2"

export const metadata: Metadata = {
  metadataBase: new URL("https://alzava-battle-iq.pages.dev"),
  title: {
    default: "ALZAVA Battle Point — Ranked Battle & Latihan TIU Indonesia",
    template: "%s | ALZAVA Battle Point",
  },
  description:
    "Latihan TIU gratis sebagai bagian dari persiapan SKD, Simulasi TIU 35 soal, Ranked Battle 3x per minggu, Battle PVP 1v1, Battle Point, dan ranking kecamatan hingga nasional.",
  keywords: [
    "latihan TIU CPNS gratis",
    "soal TIU CPNS",
    "simulasi TIU 35 soal",
    "persiapan SKD TIU",
    "tryout TIU gratis",
    "battle point",
    "ranked battle Indonesia",
    "battle pvp",
    "game logika Indonesia",
    "peringkat kecamatan",
    "kompetisi nalar Indonesia",
  ],
  applicationName: "ALZAVA Battle Point",
  generator: "ALZAVA Battle Point",
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "https://alzava-battle-iq.pages.dev",
    siteName: "ALZAVA Battle Point",
    title: "ALZAVA Battle Point — Latihan TIU, Ranked Battle & PVP",
    description:
      "Latihan TIU gratis, uji kemampuan di Ranked Battle, duel PVP 1v1, raih Battle Point, dan kejar ranking dari kecamatan hingga nasional.",
    images: [{ url: "/images/hero-bg.png", width: 1200, height: 630, alt: "ALZAVA Battle Point" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ALZAVA Battle Point",
    description: "Latihan TIU. Raih Poin. Naik Peringkat. Battle PVP.",
    images: ["/images/hero-bg.png"],
  },
  icons: {
    icon: [{ url: BRAND_ICON, type: "image/svg+xml" }],
    shortcut: BRAND_ICON,
    apple: BRAND_ICON,
  },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#020617",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body className="antialiased">
        <AccountLoginRedirect />
        <GrowthTracker />
        <ReferralConversionTracker />
        <RankedIntegrityMonitor />
        {children}
        <ResultErrorAnalysis />
      </body>
    </html>
  )
}
