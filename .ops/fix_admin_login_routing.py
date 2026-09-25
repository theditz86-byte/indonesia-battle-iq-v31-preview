from pathlib import Path

p=Path('app/account/page.tsx')
s=p.read_text()
old='''  async function handleLogin(event: FormEvent) {\n    event.preventDefault()\n    clearMessages()\n    setBusy(true)\n'''
new='''  async function handleLogin(event: FormEvent) {\n    event.preventDefault()\n    clearMessages()\n    if (loginUsername.trim().toLowerCase() === "admin") {\n      window.location.href = "/admin"\n      return\n    }\n    setBusy(true)\n'''
if old not in s:
    raise SystemExit('handleLogin anchor not found')
s=s.replace(old,new,1)
old2='''                <button disabled={busy} className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 font-black disabled:opacity-60">{busy ? "Memproses…" : "Masuk"}</button>\n'''
new2='''                <button disabled={busy} className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 font-black disabled:opacity-60">{busy ? "Memproses…" : "Masuk"}</button>\n                <div className="text-center text-xs text-slate-500">Pengelola ALZAVA? <a href="/admin" className="font-bold text-cyan-300 hover:text-cyan-200">Masuk sebagai Admin</a></div>\n'''
if old2 not in s:
    raise SystemExit('login button anchor not found')
s=s.replace(old2,new2,1)
p.write_text(s)
# trigger workflow after workflow file exists
