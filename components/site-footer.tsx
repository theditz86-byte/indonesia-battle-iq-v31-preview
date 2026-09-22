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
            <img src="/alzava-emblem-v3.svg" alt="ALZAVA Battle IQ" className="h-11 w-11 object-contain drop-shadow-[0_0_14px_rgba(212,175,55,.32)]" />
            <div className="leading-tight">
              <p className="text-sm font-extrabold text-white">ALZAVA <span className="text-[#D4AF37]">Battle IQ</span></p>
              <p className="text-[10px] font-medium uppercase tracking-[.13em] text-slate-400">Asah Pikiran. Raih Puncak.</p>
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
          <p>&copy; 2026 ALZAVA Battle IQ. Semua hak dilindungi.</p>
          <p className="italic text-slate-400">Asah Pikiran. Raih Puncak.</p>
        </div>
      </div>
    </footer>
  )
}
