import type { Metadata, Viewport } from "next"
import "./globals.css"
import "./attempt-history.css"
import { AccountLoginRedirect } from "@/components/account-login-redirect"
import { ReferralConversionTracker } from "@/components/referral-conversion-tracker"

const BRAND_ICON = "/brand/alvaza-logo-new.svg?v=20260925-2"

export const metadata: Metadata = {
  metadataBase: new URL("https://alzava-battle-iq.pages.dev"),
  title: {
    default: "ALZAVA Battle Point — Competitive Brain Game Indonesia",
    template: "%s | ALZAVA Battle Point",
  },
  description:
    "Competitive brain game Indonesia: mulai Quick Battle 5 soal tanpa login, raih Battle Point, tantang teman, dan kejar peringkat kecamatan hingga nasional.",
  keywords: [
    "battle point",
    "game logika Indonesia",
    "quick battle",
    "tes logika",
    "latihan TIU",
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
    title: "ALZAVA Battle Point — Competitive Brain Game Indonesia",
    description:
      "Coba Quick Battle gratis, raih Battle Point resmi, bagikan kartu hasilmu, dan tantang teman untuk melewati skor.",
    images: [{ url: "/images/hero-bg.png", width: 1200, height: 630, alt: "ALZAVA Battle Point" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ALZAVA Battle Point",
    description: "Competitive Brain Game Indonesia — Raih Poin. Naik Peringkat. Tantang temanmu.",
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
        <ReferralConversionTracker />
        {children}
      </body>
    </html>
  )
}
