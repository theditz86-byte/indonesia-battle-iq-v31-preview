from pathlib import Path
import re


def must_replace(text, old, new, label, count=None):
    found = text.count(old)
    if found == 0:
        raise SystemExit(f'marker not found: {label}')
    if count is not None and found < count:
        raise SystemExit(f'not enough markers for {label}: {found}')
    return text.replace(old, new, count if count is not None else -1)

# 1) Battle test: 20 soal / 20 menit + dedicated 20-answer submit endpoint.
p = Path('app/battle-test/page.tsx')
s = p.read_text()

marker = 'import { BATTLE_API_URL, getParticipantToken } from "@/lib/battle"\n'
if 'const SUBMIT20_API' not in s:
    s = must_replace(s, marker, marker + 'const SUBMIT20_API = "https://efndozplpwyemzgqfnep.supabase.co/functions/v1/battle-submit20"\n', 'submit20 const', 1)

call_marker = '''async function callBattle(body: Record<string, unknown>, token: string) {
  const response = await fetch(BATTLE_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Battle-Token": token },
    body: JSON.stringify(body),
  })
  const data = await response.json().catch(() => ({}))
  return { response, data }
}
'''
helper = call_marker + '''
async function callSubmit(body: Record<string, unknown>, token: string) {
  const answers = Array.isArray(body.answers) ? body.answers : []
  if (answers.length !== 20) return callBattle(body, token)
  const response = await fetch(SUBMIT20_API, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Battle-Token": token },
    body: JSON.stringify({ attempt_id: body.attempt_id, answers }),
  })
  const data = await response.json().catch(() => ({}))
  return { response, data }
}
'''
if 'async function callSubmit' not in s:
    s = must_replace(s, call_marker, helper, 'callSubmit helper', 1)

s = must_replace(s, 'useState(15 * 60 * 1000)', 'useState(20 * 60 * 1000)', '20 minute default', 1)
s = must_replace(s, 'const { response, data } = await callBattle({\n        action: "submit",', 'const { response, data } = await callSubmit({\n        action: "submit",', 'submit route', 1)
s = must_replace(s, '>30 soal.<br/><span className="text-indigo-300">15 menit.</span>', '>20 soal.<br/><span className="text-indigo-300">20 menit.</span>', 'lobby count/time', 1)
s = must_replace(
    s,
    '<div className="mt-5 max-w-2xl rounded-2xl border border-violet-300/20 bg-violet-400/10 p-4 text-sm leading-6 text-violet-100"><b>High Range adaptif:</b> bila Battle Point inti mencapai 850+, sistem membuka 10 soal yang lebih sulit dengan tambahan waktu 8 menit. Skor sangat tinggi harus dikonfirmasi pada tahap ini.</div>',
    '<div className="mt-5 max-w-2xl rounded-2xl border border-violet-300/20 bg-violet-400/10 p-4 text-sm leading-6 text-violet-100"><b>Format ringkas:</b> 20 soal dalam 20 menit. Tidak ada tahap tambahan; Battle Point dihitung dari performa pada 20 soal tersebut.</div>',
    'remove high range lobby copy', 1)
p.write_text(s)

# 2) Account result history: replace every user-facing IQ metric with accuracy/correct answers.
p = Path('app/account/results/page.tsx')
s = p.read_text()
s = must_replace(
    s,
    '<small className="text-slate-500">IQ {personalBest?.iq_estimate ?? "—"}</small>',
    '<small className="text-slate-500">{personalBest?.question_count ? Math.round((Number(personalBest.correct_count||0)/Number(personalBest.question_count))*100) : "—"}% akurasi</small>',
    'account personal best iq', 1)
s = must_replace(
    s,
    '<div><span className="text-xs text-slate-500">IQ Battle</span><strong className="block text-3xl font-black">{item.iq_estimate ?? "—"}</strong></div>',
    '<div><span className="text-xs text-slate-500">Jawaban benar</span><strong className="block text-3xl font-black">{item.correct_count ?? 0}/{item.question_count ?? 0}</strong></div>',
    'account history iq', 1)
p.write_text(s)

# 3) Main result page: history cards, hero, and printable report show Battle Point/performance, not IQ.
p = Path('app/result/page.tsx')
s = p.read_text()

s = must_replace(
    s,
    '<div><span className="block text-xs text-slate-500">IQ Battle</span><strong className="text-2xl font-black text-white">{item.iq_estimate ?? "—"}</strong></div>',
    '<div><span className="block text-xs text-slate-500">Jawaban benar</span><strong className="text-2xl font-black text-white">{item.correct_count ?? 0}/{item.question_count ?? 0}</strong></div>',
    'result history iq', 1)

# Keep the legacy value available internally for compatibility with old helper code, but do not render it.
s = re.sub(
    r'\n\s*const iq=Number\(result\.iq_estimate\|\|0\)\n\s*const iqProgress=clamp\(\(\(iq-55\)/100\)\*100\)',
    '\n  const iq=Number(result.iq_estimate||0)\n  const battlePoint=Number(result.battle_score||0)\n  const battleProgress=clamp(battlePoint/10)',
    s,
    count=1,
)
s = s.replace('iqProgress', 'battleProgress')

# Both the on-screen hero and PDF hero may contain the same raw IQ value, so replace every rendering occurrence.
s = must_replace(s, '>Estimasi IQ Battle</p>', '>Battle Point</p>', 'hero label', 1)
s = s.replace('ESTIMASI IQ BATTLE', 'BATTLE POINT')
s = must_replace(s, '>{iq || "—"}</strong>', '>{battlePoint.toLocaleString("id-ID")}</strong>', 'hero score')
s = re.sub(r'\{iqTier\(iq\)\}', 'Skor performa', s)
s = re.sub(
    r'Rentang \{result\.iq_low \?\? "—"\}–\{result\.iq_high \?\? "—"\}',
    '{result.correct_count ?? 0}/{result.question_count ?? 0} benar',
    s,
)

# Remove the explicit IQ reference table from the printable premium report.
s, n = re.subn(r'\n\s*<article className="pdf-iq-reference">.*?</article>', '', s, count=1, flags=re.S)
if n == 0:
    print('note: pdf-iq-reference block not found; continuing')

# Public/report copy cleanup.
s = s.replace('ALZAVA <span>BATTLE IQ</span>', 'ALZAVA <span>BATTLE POINT</span>')
s = s.replace('skor, estimasi IQ Battle, profil kemampuan, waktu, dan status hasil', 'skor, profil kemampuan, waktu, dan status hasil')
s = s.replace('skor, estimasi Battle Point, profil kemampuan, waktu, dan status hasil', 'skor, profil kemampuan, waktu, dan status hasil')
s = s.replace('Jangan sekadar mengejar angka IQ. Gunakan percobaan berikutnya untuk melihat apakah strategi Anda membaik:', 'Jangan sekadar mengejar satu skor. Gunakan percobaan berikutnya untuk melihat apakah strategi Anda membaik:')
s = s.replace('Catatan interpretasi: Estimasi IQ Battle dan analisis kognitif di atas menggambarkan performa Anda pada sistem ALZAVA Battle Point. Ini bukan diagnosis psikologis atau pengganti tes IQ klinis yang diawasi profesional.', 'Catatan interpretasi: Analisis kognitif di atas menggambarkan performa Anda pada sistem ALZAVA Battle Point. Hasil ini bukan diagnosis psikologis atau pengganti asesmen profesional.')
s = s.replace('bukan hanya satu angka IQ', 'bukan hanya satu skor')
s = s.replace('bukan hanya satu satu skor', 'bukan hanya satu skor')
s = s.replace('pengganti asesmen inteligensi yang diadministrasikan profesional', 'pengganti asesmen profesional')

for old, new in [
    ('Estimasi IQ Battle', 'Battle Point'),
    ('IQ Battle', 'Battle Point'),
    ('BATTLE IQ', 'BATTLE POINT'),
    ('angka IQ', 'satu skor'),
    ('tes IQ klinis', 'asesmen profesional'),
]:
    s = s.replace(old, new)

# Fail loudly if common public IQ labels survive the patch.
for forbidden in ['Estimasi IQ Battle', 'ESTIMASI IQ BATTLE', 'IQ Battle', 'BATTLE IQ']:
    if forbidden in s:
        raise SystemExit(f'visible IQ label still present in result page: {forbidden}')

p.write_text(s)

print('patched 20q/20m and removed visible IQ metrics')
