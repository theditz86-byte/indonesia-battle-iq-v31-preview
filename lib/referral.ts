import { getParticipantToken } from "@/lib/battle"

export const REFERRAL_API_URL = "https://efndozplpwyemzgqfnep.supabase.co/functions/v1/battle-referral"
export const REFERRAL_REFERRER_KEY = "alzava.referral.referrer"
export const REFERRAL_VISITOR_KEY = "alzava.referral.visitor"
export const REFERRAL_SOURCE_KEY = "alzava.referral.source"
export const REFERRAL_CONVERTED_KEY = "alzava.referral.converted"
export const SITE_URL = "https://alzava-battle-iq.pages.dev"

export type ReferralStats = {
  public_id?: string
  nickname?: string
  opens?: number
  accepts?: number
  conversions?: number
  shares?: number
  conversion_rate?: number
  top_source?: string
}

export function getReferralVisitorKey() {
  if (typeof window === "undefined") return ""
  try {
    let value = window.localStorage.getItem(REFERRAL_VISITOR_KEY) || ""
    if (!/^[A-Za-z0-9_-]{8,80}$/.test(value)) {
      value = crypto.randomUUID().replaceAll("-", "")
      window.localStorage.setItem(REFERRAL_VISITOR_KEY, value)
    }
    return value
  } catch {
    return "visitor" + Math.random().toString(36).slice(2, 18)
  }
}

export function saveReferral(referrerPublicId: string, source = "direct") {
  if (typeof window === "undefined") return
  if (!/^[0-9a-f-]{36}$/i.test(referrerPublicId)) return
  try {
    window.localStorage.setItem(REFERRAL_REFERRER_KEY, referrerPublicId)
    window.localStorage.setItem(REFERRAL_SOURCE_KEY, source.slice(0, 40) || "direct")
  } catch {}
}

export function buildChallengeUrl(publicId: string, source = "copy") {
  const q = new URLSearchParams({ id: publicId, ref: publicId, src: source })
  return `${SITE_URL}/challenge?${q.toString()}`
}

export async function referralCall<T = any>(body: Record<string, unknown>, requireAuth = false): Promise<T> {
  const token = getParticipantToken()
  if (requireAuth && !token) throw new Error("Silakan masuk sebagai peserta.")
  const response = await fetch(REFERRAL_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? { "X-Battle-Token": token } : {}) },
    body: JSON.stringify(body),
    cache: "no-store",
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data?.error || "Referral belum dapat diproses.")
  return data as T
}

export async function trackReferralShare(channel: "whatsapp" | "native" | "copy") {
  try { await referralCall({ action: "share", channel }, true) } catch {}
}
