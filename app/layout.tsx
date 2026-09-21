import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Indonesia Battle IQ — Uji Nalar. Taklukkan Peringkat.',
  description:
    'Preview dashboard Indonesia Battle IQ yang terhubung ke papan peringkat publik Battle IQ.',
  generator: 'Indonesia Battle IQ v31 Preview',
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#020617',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id">
      <body className="antialiased">{children}</body>
    </html>
  )
}
