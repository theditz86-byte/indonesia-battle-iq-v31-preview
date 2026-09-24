from pathlib import Path

path = Path("app/result/page.tsx")
text = path.read_text(encoding="utf-8")

import_line = 'import { BATTLE_API_URL, getParticipantToken } from "@/lib/battle"\n'
component_import = 'import ResultShareCard from "@/components/result-share-card"\n'
if component_import not in text:
    if import_line not in text:
        raise SystemExit("Could not find battle import")
    text = text.replace(import_line, import_line + component_import, 1)

old_button = '<button onClick={share} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-black backdrop-blur-lg hover:bg-white/10"><Share2 className="h-4 w-4"/>{copied?"Tautan disalin":"Tantang Teman"}</button>'
new_button = '''<ResultShareCard
              nickname={data.nickname || "Pemain ALZAVA"}
              participantPublicId={data.participant_public_id}
              battlePoint={Number(result.battle_score || 0)}
              correctCount={Number(result.correct_count || 0)}
              questionCount={Number(result.question_count || 0)}
              durationMs={Number(result.duration_ms || 0)}
              nationalRank={result.national_rank}
              leaderboardTotal={data.leaderboard_total}
              provinceName={data.province_name}
              regencyName={data.regency_name}
              districtName={data.district_name}
              submittedAt={result.submitted_at}
            />'''

if old_button in text:
    text = text.replace(old_button, new_button, 1)
elif "<ResultShareCard" not in text:
    raise SystemExit("Could not find old share button")

path.write_text(text, encoding="utf-8")
print("Result share card integrated")
