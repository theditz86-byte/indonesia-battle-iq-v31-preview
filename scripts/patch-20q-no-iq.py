from pathlib import Path

p = Path('app/battle-test/page.tsx')
s = p.read_text()

old = '<p className="text-sm font-bold text-white">Percobaan #{attempt.attempt_number}{attempt.high_range_unlocked ? " · Tahap 2/2" : " · Tahap 1/2"}</p>'
new = '<p className="text-sm font-bold text-white">Percobaan #{attempt.attempt_number}{attempt.questions.length===20 ? " · 20 soal · 20 menit" : attempt.high_range_unlocked ? " · Tahap 2/2" : " · Tahap 1/2"}</p>'
if old not in s:
    raise SystemExit('test header marker not found')
s = s.replace(old, new, 1)

old = '{attempt.high_range_unlocked ? "High Range: 10 soal tambahan · 8 menit · skor rentang atas sedang diverifikasi." : "Fair Play: 30 soal · 15 menit · kerjakan tanpa AI generatif, mesin pencari, kalkulator, atau bantuan orang lain."}'
new = '{attempt.high_range_unlocked ? "High Range: 10 soal tambahan · 8 menit · skor rentang atas sedang diverifikasi." : attempt.questions.length===20 ? "Fair Play: 20 soal · 20 menit · kerjakan tanpa AI generatif, mesin pencari, kalkulator, atau bantuan orang lain." : "Fair Play: 30 soal · 15 menit · kerjakan tanpa AI generatif, mesin pencari, kalkulator, atau bantuan orang lain."}'
if old not in s:
    raise SystemExit('fair play marker not found')
s = s.replace(old, new, 1)

old = '{attempt.questions.length===30 ? "Selesai Inti" : "Selesai High Range"}'
new = '{attempt.questions.length===20 ? "Kirim Hasil" : attempt.questions.length===30 ? "Selesai Inti" : "Selesai High Range"}'
if old not in s:
    raise SystemExit('finish button marker not found')
s = s.replace(old, new, 1)

p.write_text(s)
print('remaining 20q test copy patched')
