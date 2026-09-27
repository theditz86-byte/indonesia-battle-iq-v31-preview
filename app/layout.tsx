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
    default: "ALZAVA Battle Point — Competitive Brain Game Indonesia",
    template: "%s | ALZAVA Battle Point",
  },
  description:
    "Competitive brain game Indonesia: 3 Ranked Battle per season, Battle Point, ranking kecamatan hingga nasional, PVP 1v1, Quick Battle, serta latihan TIU sebagai arena latihan non-ranked.",
  keywords: [
    "battle point Indonesia",
    "competitive brain game Indonesia",
    "game logika Indonesia",
    "ranked battle Indonesia",
    "peringkat kecamatan",
    "kompetisi nalar Indonesia",
    "latihan TIU CPNS gratis",
    "soal TIU CPNS",
    "simulasi TIU 35 soal",
    "persiapan SKD TIU",
    "tryout TIU gratis",
    "battle pvp",
  ],
  applicationName: "ALZAVA Battle Point",
  generator: "ALZAVA Battle Point",
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "https://alzava-battle-iq.pages.dev",
    siteName: "ALZAVA Battle Point",
    title: "ALZAVA Battle Point — Competitive Brain Game Indonesia",
    description:
      "Adu nalar di Ranked Battle dan PVP 1v1, raih Battle Point, dan kejar ranking dari kecamatan hingga nasional. Latihan TIU tersedia sebagai mode non-ranked.",
    images: [{ url: "/images/hero-bg.png", width: 1200, height: 630, alt: "ALZAVA Battle Point" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ALZAVA Battle Point",
    description: "Adu Nalar. Raih Poin. Naik Peringkat. Ranked Battle, PVP, dan Quick Battle.",
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
