export const BATTLE_API_URL = "https://efndozplpwyemzgqfnep.supabase.co/functions/v1/battle-public"
export const PARTICIPANT_TOKEN_KEY = "indonesia-battle-iq.participant-token.v1"

export type Scope = "country" | "province" | "regency" | "district"

export type BattleSeason = {
  label?: string
  ends_at?: string
  starts_at?: string
}

export type BattleEntry = {
  participant_public_id?: string
  nickname?: string
  avatar_url?: string | null
  province_name?: string
  regency_name?: string
  district_name?: string
  battle_score?: number | null
  correct_count?: number | null
  question_count?: number | null
  duration_ms?: number | null
  national_rank?: number | null
  scope_rank?: number | null
}

export type BattleParticipant = {
  public_id?: string
  nickname?: string
  avatar_url?: string | null
  province_code?: string
  province_name?: string
  regency_name?: string
  district_name?: string
  is_qa?: boolean
  attempts_used?: number
  free_attempts_remaining?: number
  paid_credits?: number
  attempts_remaining?: number
  active_attempt_id?: string | null
}

export type BattleOverview = {
  season: BattleSeason | null
  entries: BattleEntry[]
  participant: BattleParticipant | null
  generated_at?: string
}

export function getParticipantToken() {
  if (typeof window === "undefined") return ""
  try {
    return window.localStorage.getItem(PARTICIPANT_TOKEN_KEY) || ""
  } catch {
    return ""
  }
}

export function removeParticipantToken() {
  if (typeof window === "undefined") return
  try {
    window.localStorage.removeItem(PARTICIPANT_TOKEN_KEY)
  } catch {
    // ignore blocked storage
  }
}

export function buildScopeQuery(scope: Scope, participant: BattleParticipant | null) {
  if (scope === "country" || !participant) return ""
  const query = new URLSearchParams()
  if (participant.province_code) query.set("province_code", participant.province_code)
  if ((scope === "regency" || scope === "district") && participant.regency_name) query.set("regency_name", participant.regency_name)
  if (scope === "district" && participant.district_name) query.set("district_name", participant.district_name)
  const serialized = query.toString()
  return serialized ? `?${serialized}` : ""
}

export async function fetchOverview(scope: Scope, participant: BattleParticipant | null, signal?: AbortSignal): Promise<BattleOverview> {
  const token = getParticipantToken()
  const headers: Record<string, string> = {}
  if (token) headers["X-Battle-Token"] = token
  const response = await fetch(`${BATTLE_API_URL}${buildScopeQuery(scope, participant)}`, {
    method: "GET",
    headers,
    cache: "no-store",
    signal,
  })
  if (!response.ok) throw new Error(`Battle API ${response.status}`)
  const data = (await response.json()) as Partial<BattleOverview>
  return {
    season: data.season ?? null,
    entries: Array.isArray(data.entries) ? data.entries : [],
    participant: data.participant ?? null,
    generated_at: data.generated_at,
  }
}

export function formatScore(value?: number | null) {
  return new Intl.NumberFormat("id-ID").format(Number(value) || 0)
}

export function formatDuration(milliseconds?: number | null) {
  const totalSeconds = Math.max(0, Math.round((Number(milliseconds) || 0) / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, "0")}`
}

export function scopeLabel(scope: Scope, participant: BattleParticipant | null) {
  if (scope === "province" && participant?.province_name) return participant.province_name
  if (scope === "regency" && participant?.regency_name) return participant.regency_name
  if (scope === "district" && participant?.district_name) return `Kecamatan ${participant.district_name}`
  return "Indonesia"
}

export function entryRank(entry: BattleEntry, scope: Scope) {
  return Number(scope === "country" ? entry.national_rank : entry.scope_rank) || 0
}
