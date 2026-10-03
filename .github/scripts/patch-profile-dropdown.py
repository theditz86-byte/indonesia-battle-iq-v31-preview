from pathlib import Path

path = Path("components/site-navbar.tsx")
text = path.read_text(encoding="utf-8")

text = text.replace(
    'import { useEffect, useState } from "react"',
    'import { useEffect, useRef, useState } from "react"',
    1,
)

state_marker = '  const [mobileOpen, setMobileOpen] = useState(false)\n'
if 'const [profileOpen, setProfileOpen]' not in text:
    if state_marker not in text:
        raise SystemExit("mobile state marker not found")
    text = text.replace(
        state_marker,
        state_marker
        + '  const [profileOpen, setProfileOpen] = useState(false)\n'
        + '  const profileMenuRef = useRef<HTMLDivElement | null>(null)\n',
        1,
    )

if 'function handlePointerDown(event: PointerEvent)' not in text:
    marker = '  async function logout() {'
    if marker not in text:
        raise SystemExit("logout marker not found")
    effect = '''  useEffect(() => {
    if (!profileOpen) return

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node | null
      if (target && profileMenuRef.current && !profileMenuRef.current.contains(target)) {
        setProfileOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setProfileOpen(false)
    }

    document.addEventListener("pointerdown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [profileOpen])

'''
    text = text.replace(marker, effect + marker, 1)

start = text.find('              <details data-alzava-profile-menu="native"')
end_marker = '              </details>'
if start < 0:
    if 'data-alzava-profile-menu="controlled"' not in text:
        raise SystemExit("profile menu start not found")
else:
    end = text.find(end_marker, start)
    if end < 0:
        raise SystemExit("profile menu end not found")
    end += len(end_marker)

    block = '''              <div ref={profileMenuRef} data-alzava-profile-menu="controlled" className="relative z-[120]">
                <button
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={profileOpen}
                  onClick={() => {
                    setProfileOpen((value) => !value)
                    setMobileOpen(false)
                  }}
                  className="relative flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1.5 pl-1.5 pr-2 sm:pr-3 backdrop-blur-lg transition-colors hover:bg-white/10"
                >
                  {participant.avatar_url ? <img src={participant.avatar_url} alt={name} className="h-8 w-8 rounded-full object-cover ring-2 ring-cyan-400/60" /> : <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-indigo-600 text-[10px] font-black text-white ring-2 ring-cyan-400/50">BP</span>}
                  <span className="hidden text-left leading-tight md:block"><span className="block max-w-28 truncate text-sm font-semibold text-white">{name}</span></span>
                  <ChevronDown className={`hidden h-4 w-4 text-slate-400 transition-transform sm:block ${profileOpen ? "rotate-180" : ""}`} />
                  {socialBadge > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-black text-white ring-2 ring-slate-950 shadow-[0_0_14px_rgba(244,63,94,.65)]">{socialBadge > 99 ? "99+" : socialBadge}</span>}
                </button>

                {profileOpen && (
                  <div role="menu" className="absolute right-0 top-full z-[140] mt-2 w-[220px] overflow-hidden rounded-xl border border-white/10 bg-[#061329]/[.985] p-1 shadow-[0_24px_70px_rgba(0,0,0,.58)] backdrop-blur-xl">
                    <div className="grid gap-0.5 py-1.5">
                      <a href="/share-challenge" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-400/10 to-indigo-500/10 px-2.5 py-1.5 text-[12px] font-black text-cyan-100 hover:from-cyan-400/15 hover:to-indigo-500/15"><Share2 className="h-3.5 w-3.5 text-cyan-300"/>Bagikan & Tantang</a>
                      <a href="/daily-training" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] font-bold text-slate-200 hover:bg-white/5"><BrainCircuit className="h-3.5 w-3.5 text-orange-300"/>TIU Harian</a>
                      {participant.public_id && <a href={`/player?id=${encodeURIComponent(participant.public_id)}`} onClick={() => setProfileOpen(false)} className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] font-bold text-slate-200 hover:bg-white/5"><Trophy className="h-3.5 w-3.5 text-amber-300"/>Profil Battle & Prestasi</a>}
                      <a href="/account/results#riwayat-hasil" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] font-bold text-slate-200 hover:bg-white/5"><History className="h-3.5 w-3.5 text-violet-300"/>Riwayat Tes</a>
                      <a href="/friends" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] font-bold text-slate-200 hover:bg-white/5"><Users className="h-3.5 w-3.5 text-cyan-300"/><span className="flex-1">Cari & Tambah Teman</span>{friendBadge > 0 && <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[9px] font-black text-white">{friendBadge > 99 ? "99+" : friendBadge}</span>}</a>
                      <a href="/messages" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] font-bold text-slate-200 hover:bg-white/5"><Mail className="h-3.5 w-3.5 text-indigo-300"/><span className="flex-1">Pesan Pribadi</span>{socialBadge > friendBadge && <span className="rounded-full bg-indigo-500 px-1.5 py-0.5 text-[9px] font-black text-white">{socialBadge-friendBadge > 99 ? "99+" : socialBadge-friendBadge}</span>}</a>
                      <a href="/account" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] font-bold text-slate-200 hover:bg-white/5"><Settings className="h-3.5 w-3.5 text-slate-400"/>Pengaturan Profil</a>
                      <div className="my-0.5 border-t border-white/10" />
                      <button type="button" onClick={()=>void logout()} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[12px] font-bold text-rose-200 transition-colors hover:bg-rose-500/10"><LogOut className="h-3.5 w-3.5 text-rose-300"/>Keluar</button>
                    </div>
                  </div>
                )}
              </div>'''
    text = text[:start] + block + text[end:]

text = text.replace(
    '<header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/75 backdrop-blur-xl">',
    '<header className="sticky top-0 z-[100] overflow-visible border-b border-white/10 bg-slate-950/75 backdrop-blur-xl">',
    1,
)

path.write_text(text, encoding="utf-8")
