// Browser-only AI Coach history. Account-scoped, text-only, and bounded.
// No participant token, gateway secret, or metadata is persisted.
export type AiChatMessage = { role: "user" | "assistant"; text: string }

const KEY_PREFIX = "alzava.ai-coach.history.v1."
const MAX_MESSAGES = 200
const MAX_TOTAL_CHARACTERS = 140_000
const MAX_TEXT_CHARACTERS = 6_000
const MAX_SERIALIZED_CHARACTERS = 180_000

function historyKey(participantId: string): string | null {
  if (!/^[a-zA-Z0-9_-]{8,128}$/.test(participantId)) return null
  return KEY_PREFIX + participantId
}

export function trimAiChatMessages(input: unknown): AiChatMessage[] {
  if (!Array.isArray(input)) return []
  const cleaned: AiChatMessage[] = []
  let characters = 0
  // Traverse from newest to oldest so recent messages survive capacity limits.
  for (let index = input.length - 1; index >= 0 && cleaned.length < MAX_MESSAGES; index--) {
    const candidate = input[index]
    if (!candidate || typeof candidate !== "object") continue
    if (candidate.role !== "user" && candidate.role !== "assistant") continue
    if (typeof candidate.text !== "string" || !candidate.text.trim()) continue
    const allowed = Math.min(MAX_TEXT_CHARACTERS, MAX_TOTAL_CHARACTERS - characters)
    if (allowed <= 0) break
    const text = candidate.text.slice(0, allowed)
    cleaned.push({ role: candidate.role, text })
    characters += text.length
  }
  return cleaned.reverse()
}

export function readAiChatHistory(participantId: string): AiChatMessage[] {
  const key = historyKey(participantId)
  if (!key || typeof window === "undefined") return []
  try {
    const stored = window.localStorage.getItem(key)
    if (!stored) return []
    if (stored.length > MAX_SERIALIZED_CHARACTERS) return []
    const parsed: unknown = JSON.parse(stored)
    if (!parsed || typeof parsed !== "object" || !("v" in parsed) || parsed.v !== 1 || !("messages" in parsed)) return []
    return trimAiChatMessages(parsed.messages)
  } catch {
    // Private browsing, disabled storage, or corrupted JSON must not break chat.
    return []
  }
}

export function saveAiChatHistory(participantId: string, messages: AiChatMessage[]): boolean {
  const key = historyKey(participantId)
  if (!key || typeof window === "undefined") return false
  try {
    const trimmed = trimAiChatMessages(messages)
    if (trimmed.length === 0) window.localStorage.removeItem(key)
    else window.localStorage.setItem(key, JSON.stringify({ v: 1, messages: trimmed }))
    return true
  } catch {
    // If the storage quota is full, online AI still works for this session.
    return false
  }
}

export function clearAiChatHistory(participantId: string): void {
  const key = historyKey(participantId)
  if (!key || typeof window === "undefined") return
  try { window.localStorage.removeItem(key) }
  catch { /* Private/disabled browser storage. */ }
}
