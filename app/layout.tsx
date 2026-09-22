import type { Metadata, Viewport } from "next"
import "./globals.css"

export const metadata: Metadata = {
  metadataBase: new URL("https://alzava-battle-iq.pages.dev"),
  title: {
    default: "Indonesia Battle IQ — Tes Nalar & Peringkat Nasional",
    template: "%s | Indonesia Battle IQ",
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
  applicationName: "Indonesia Battle IQ",
  generator: "Indonesia Battle IQ",
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "https://alzava-battle-iq.pages.dev",
    siteName: "Indonesia Battle IQ",
    title: "Indonesia Battle IQ — Uji Nalar. Taklukkan Peringkat.",
    description:
      "Ikuti tes nalar nasional, bandingkan skor, tantang teman, dan lihat posisi Anda di leaderboard Indonesia.",
    images: [{ url: "/images/hero-bg.png", width: 1200, height: 630, alt: "Indonesia Battle IQ" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Indonesia Battle IQ",
    description: "Uji nalar, lihat peringkat, dan tantang teman.",
    images: ["/images/hero-bg.png"],
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
