import { Brain } from "lucide-react"

const footerLinks = [
  {label:"Syarat & Ketentuan",href:"/terms"},
  {label:"Kebijakan Privasi",href:"/privacy"},
  {label:"Pengembalian Dana",href:"/refund"},
  {label:"Bantuan",href:"/help"},
]

export function SiteFooter() {
  return (
    <footer id="tentang" className="border-t border-white/10 bg-slate-950/60 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-indigo-600 shadow-[0_0_20px_rgba(0,150,255,0.4)]">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-extrabold text-white">Indonesia Battle IQ</p>
              <p className="text-[11px] text-slate-400">Uji Nalar. Taklukkan Peringkat.</p>
            </div>
          </div>

          <nav className="flex flex-wrap gap-x-6 gap-y-2">
            {footerLinks.map((link) => (
              <a key={link.href} href={link.href} className="text-sm text-slate-400 transition-colors hover:text-white">
                {link.label}
              </a>
            ))}
          </nav>

          <div className="max-w-sm text-sm leading-6 text-slate-400">
            2 Ranked Attempt gratis per season. Practice berbayar tidak mengubah leaderboard resmi.
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; 2026 Indonesia Battle IQ. Semua hak dilindungi.</p>
          <p className="italic text-slate-400">Lebih Banyak Berpikir. Lebih Jauh Melangkah.</p>
        </div>
      </div>
    </footer>
  )
}
