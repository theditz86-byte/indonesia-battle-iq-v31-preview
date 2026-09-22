import type { Metadata, Viewport } from "next"
import "./globals.css"

export const metadata: Metadata = {
  metadataBase: new URL("https://alzava-battle-iq.pages.dev"),
  title: {
    default: "ALZAVA Battle IQ — Asah Pikiran. Raih Puncak.",
    template: "%s | ALZAVA Battle IQ",
  },
  description:
    "Tes kemampuan online Indonesia dengan leaderboard nasional, provinsi, kabupaten/kota, dan kecamatan. Dapatkan 2 Ranked Attempt gratis setiap season, lalu analisis hasil Battle IQ.",
  keywords: [
    "tes IQ online",
    "tes kemampuan",
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
    title: "ALZAVA Battle IQ — Asah Pikiran. Raih Puncak.",
    description:
      "Ikuti tes kemampuan nasional, bandingkan skor, tantang teman, dan lihat posisi Anda di leaderboard Indonesia.",
    images: [{ url: "/images/hero-bg.png", width: 1200, height: 630, alt: "ALZAVA Battle IQ" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ALZAVA Battle IQ",
    description: "Asah Pikiran. Raih Puncak. — uji nalar, lihat peringkat, dan tantang teman.",
    images: ["/images/hero-bg.png"],
  },
  icons: {
    icon: [{ url: "/alzava-emblem-v2.png", type: "image/png" }],
    shortcut: "/alzava-emblem-v2.png",
    apple: "/alzava-emblem-v2.png",
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
