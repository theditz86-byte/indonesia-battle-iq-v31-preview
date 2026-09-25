from pathlib import Path

# Admin: add manual season controls.
p=Path('app/admin/page.tsx')
s=p.read_text()
needle='import { ArrowLeft, Check, Eye, FileText, Loader2, LogOut, RefreshCw, ShieldCheck, Trophy, WalletCards, X } from "lucide-react"\n'
if 'AdminSeasonControls' not in s:
    s=s.replace(needle, needle+'import { AdminSeasonControls } from "@/components/admin-season-controls"\n')
marker='''        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">\n          {metricCards.map(([label,value,Icon])=><div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-4"><Icon className="h-5 w-5 text-cyan-300"/><p className="mt-3 text-xs text-slate-400">{label}</p><p className="mt-1 text-xl font-black">{value}</p></div>)}\n        </div>\n'''
if '<AdminSeasonControls token={token} />' not in s:
    s=s.replace(marker, marker+'\n        <AdminSeasonControls token={token} />\n')
p.write_text(s)

# Navbar: public history menu.
p=Path('components/site-navbar.tsx')
s=p.read_text()
if '{ label: "History Ranking", href: "/history-ranking" },' not in s:
    s=s.replace('  { label: "Peringkat", href: "#peringkat" },\n', '  { label: "Peringkat", href: "#peringkat" },\n  { label: "History Ranking", href: "/history-ranking" },\n')
s=s.replace('rounded-full px-4 py-2 text-sm font-medium', 'rounded-full px-3 py-2 text-sm font-medium')
p.write_text(s)

# Podium: remove the tiny laurel glyphs around champion number that rendered awkwardly.
p=Path('components/podium.tsx')
s=p.read_text()
old='''              <div className="flex items-center gap-1.5"><LaurelBranch className="h-6 w-4 text-amber-900/70" /><span className={`text-3xl font-black ${s.numberColor}`}>1</span><LaurelBranch className="h-6 w-4 -scale-x-100 text-amber-900/70" /></div>'''
new='''              <div className="flex items-center justify-center"><span className={`text-3xl font-black ${s.numberColor}`}>1</span></div>'''
s=s.replace(old,new)
p.write_text(s)
