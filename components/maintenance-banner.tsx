"use client"

const MAINTENANCE_MODE = true

export function MaintenanceBanner(){
  if(!MAINTENANCE_MODE) return null

  return (
    <div className="sticky top-0 z-[200] border-b border-amber-300/25 bg-amber-400/95 px-4 py-2 text-center text-xs font-black tracking-wide text-slate-950 shadow-lg sm:text-sm">
      Sistem sedang maintenance — beberapa fitur mungkin sementara terganggu. Data akun, hasil, dan skor tetap tersimpan.
    </div>
  )
}
