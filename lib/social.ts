import { getParticipantToken } from "@/lib/battle"

export const SOCIAL_API_URL = "https://efndozplpwyemzgqfnep.supabase.co/functions/v1/battle-social"
export const MODERATION_API_URL = "https://efndozplpwyemzgqfnep.supabase.co/functions/v1/battle-moderation"

export type SocialProfile = {
  public_id?: string
  nickname?: string
  avatar_url?: string | null
  province_name?: string
  regency_name?: string
  district_name?: string
}

export type FriendshipState = "self" | "none" | "incoming" | "outgoing" | "friends" | "blocked" | "blocked_by_you"

export type FriendItem = {
  relation_id?: string
  accepted_at?: string | null
  created_at?: string | null
  participant?: SocialProfile | null
}

export type ConversationItem = {
  id: string
  participant?: SocialProfile | null
  last_message?: { message?: string; created_at?: string; is_own?: boolean } | null
  unread_count?: number
  last_message_at?: string | null
}

export type PrivateMessage = {
  id: number
  conversation_id?: string
  sender_id?: string
  message?: string
  created_at?: string
  is_own?: boolean
}

export type SocialOverview = {
  viewer?: SocialProfile | null
  incoming_requests?: FriendItem[]
  outgoing_requests?: FriendItem[]
  friends?: FriendItem[]
  conversations?: ConversationItem[]
  unread_total?: number
  incoming_count?: number
}

export type ThreadResponse = {
  conversation?: { id?: string; other?: SocialProfile | null }
  messages?: PrivateMessage[]
}

async function authedPost<T>(url: string, body: Record<string, unknown>, signal?: AbortSignal): Promise<T> {
  const token = getParticipantToken()
  if (!token) throw new Error("Silakan masuk sebagai peserta.")
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Battle-Token": token },
    body: JSON.stringify(body),
    cache: "no-store",
    signal,
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data?.error || "Permintaan belum dapat diproses.")
  return data as T
}

export function socialCall<T = any>(action: string, payload: Record<string, unknown> = {}, signal?: AbortSignal): Promise<T> {
  return authedPost<T>(SOCIAL_API_URL, { action, ...payload }, signal)
}

export function moderationCall<T = any>(action: "block" | "unblock" | "report", payload: Record<string, unknown> = {}, signal?: AbortSignal): Promise<T> {
  return authedPost<T>(MODERATION_API_URL, { action, ...payload }, signal)
}

export function playerProfileHref(publicId?: string) {
  return publicId ? `/player/?id=${encodeURIComponent(publicId)}` : "/battle"
}
