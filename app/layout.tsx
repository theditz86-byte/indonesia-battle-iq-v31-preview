import type { Metadata, Viewport } from "next"
import "./globals.css"
import "./attempt-history.css"

export const metadata: Metadata = {
  metadataBase: new URL("https://alzava-battle-point.pages.dev"),
  title: {
    default: "ALZAVA Battle Point — Raih Poin. Taklukkan Peringkat.",
    template: "%s | ALZAVA Battle Point",
  },
  description:
    "Tes kemampuan online Indonesia dengan leaderboard nasional, provinsi, kabupaten/kota, dan kecamatan. Kumpulkan Battle Point, raih peringkat, dan dapatkan 1 Ranked Attempt gratis setiap season.",
  keywords: [
    "tes kemampuan online",
    "tes logika",
    "latihan TIU",
    "Battle Point Indonesia",
    "peringkat poin Indonesia",
    "kompetisi kemampuan nasional",
  ],
  applicationName: "ALZAVA Battle Point",
  generator: "ALZAVA Battle Point",
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "https://alzava-battle-point.pages.dev",
    siteName: "ALZAVA Battle Point",
    title: "ALZAVA Battle Point — Raih Poin. Taklukkan Peringkat.",
    description:
      "Ikuti tes kemampuan nasional, kumpulkan poin, tantang teman, dan lihat posisi Anda di leaderboard Indonesia.",
    images: [{ url: "/images/hero-bg.png", width: 1200, height: 630, alt: "ALZAVA Battle Point" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ALZAVA Battle Point",
    description: "Raih Poin. Taklukkan Peringkat. — uji kemampuan, kumpulkan poin, dan tantang teman.",
    images: ["/images/hero-bg.png"],
  },
  icons: {
    icon: [{ url: "/alzava-emblem-v3.svg", type: "image/png" }],
    shortcut: "/alzava-emblem-v3.svg",
    apple: "/alzava-emblem-v3.svg",
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
