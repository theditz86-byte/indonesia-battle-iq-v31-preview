import type { Metadata, Viewport } from "next"
import "./globals.css"
import "./attempt-history.css"
import "./pvp-result-trophy.css"
import "./quick-battle-modal-size.css"
import { AccountLoginRedirect } from "@/components/account-login-redirect"
import { GrowthTracker } from "@/components/growth-tracker"
import { ReferralConversionTracker } from "@/components/referral-conversion-tracker"
import { ResultErrorAnalysis } from "@/components/result-error-analysis"
import { RankedIntegrityMonitor } from "@/components/ranked-integrity-monitor"
import { GlobalProfileCorner } from "@/components/global-profile-corner"
import { MaintenanceBanner } from "@/components/maintenance-banner"
import { RankingEligibilityNotice } from "@/components/ranking-eligibility-notice"
import { PvpHistoryShareBridge } from "@/components/pvp-history-share-bridge"
import { PvpGlobalPresence } from "@/components/pvp-global-presence"
import { TrafficTracker } from "@/components/traffic-tracker"
import { AdminControlCenterV2 } from "@/components/admin-control-center-v2"
import { PretestLifecycleBridge } from "@/components/pretest-lifecycle-bridge"
import { PretestHistoryCard } from "@/components/pretest-history-card"
import { PlayerUiHardening } from "@/components/player-ui-hardening"
import { PremiumUxPass } from "@/components/premium-ux-pass"

const BRAND_ICON = "/brand/alvaza-logo-new.svg?v=20260925-2"

export const metadata: Metadata = {
  metadataBase: new URL("https://alzava-battle-iq.pages.dev"),
  title: {
    default: "ALZAVA Battle Point — Latihan SKD CASN & BUMN",
    template: "%s | ALZAVA Battle Point",
  },
  description:
    "Latihan SKD CASN, CPNS dan BUMN yang lebih seru: TIU, TWK, TKP, latihan harian, Ranked Battle, Battle Point, analisis hasil, dan leaderboard nasional.",
  keywords: [
    "latihan SKD CASN",
    "latihan SKD CPNS",
    "latihan BUMN",
    "soal TIU CPNS",
    "soal TWK",
    "soal TKP",
    "tryout CASN gratis",
    "latihan TIU gratis",
    "persiapan CPNS",
    "persiapan BUMN",
    "battle point Indonesia",
    "ranked battle Indonesia",
  ],
  applicationName: "ALZAVA Battle Point",
  generator: "ALZAVA Battle Point",
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "https://alzava-battle-iq.pages.dev",
    siteName: "ALZAVA Battle Point",
    title: "ALZAVA Battle Point — Latihan SKD CASN & BUMN",
    description:
      "Latihan TIU, TWK, TKP, SKD CASN dan BUMN sambil mengumpulkan Battle Point dan bersaing di leaderboard nasional.",
    images: [{ url: "/images/hero-bg.png", width: 1200, height: 630, alt: "ALZAVA Battle Point — Latihan SKD CASN & BUMN" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ALZAVA Battle Point — Latihan SKD CASN & BUMN",
    description: "Belajar. Latihan. Bersaing. Siapkan diri menghadapi CASN dan BUMN.",
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
        <MaintenanceBanner />
        <TrafficTracker />
        <PvpGlobalPresence />
        <AccountLoginRedirect />
        <GrowthTracker />
        <ReferralConversionTracker />
        <RankedIntegrityMonitor />
        <GlobalProfileCorner />
        <AdminControlCenterV2 />
        <PretestLifecycleBridge />
        <PlayerUiHardening />
        <PremiumUxPass />
        {children}
        <PretestHistoryCard />
        <PvpHistoryShareBridge />
        <RankingEligibilityNotice />
        <ResultErrorAnalysis />
      </body>
    </html>
  )
}
