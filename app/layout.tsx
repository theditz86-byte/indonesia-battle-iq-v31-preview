import type { Metadata, Viewport } from "next"
import "./globals.css"

export const metadata: Metadata = {
  metadataBase: new URL("https://alzava-battle-iq.pages.dev"),
  title: {
    default: "ALZAVA Battle IQ — Higher Thinking Wins",
    template: "%s | ALZAVA Battle IQ",
  },
  description:
    "Tes nalar online Indonesia dengan leaderboard nasional, provinsi, kabupaten/kota, dan kecamatan. Dapatkan 2 Ranked Attempt gratis setiap season, lalu analisis hasil Battle IQ.",
  keywords: [
    "tes IQ online",
    "tes nalar",
    "tes logika",
    "latihan TIU",
    "Battle IQ Indonesia",
    "peringkat IQ Indonesia",
  ],
  applicationName: "ALZAVA Battle IQ",
  generator: "ALZAVA Battle IQ",
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "https://alzava-battle-iq.pages.dev",
    siteName: "ALZAVA Battle IQ",
    title: "ALZAVA Battle IQ — Higher Thinking Wins",
    description:
      "Ikuti tes nalar nasional, bandingkan skor, tantang teman, dan lihat posisi Anda di leaderboard Indonesia.",
    images: [{ url: "/images/hero-bg.png", width: 1200, height: 630, alt: "ALZAVA Battle IQ" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ALZAVA Battle IQ",
    description: "Higher Thinking Wins — uji nalar, lihat peringkat, dan tantang teman.",
    images: ["/images/hero-bg.png"],
  },
  icons: {
    icon: [{ url: "/alzava-icon.png", type: "image/png" }],
    shortcut: "/alzava-icon.png",
    apple: "/alzava-icon.png",
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
      <body className="antialiased">{children}</body>
    </html>
  )
}
