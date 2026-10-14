import type { AiChatMessage } from "./ai-chat-history"

// Only recent messages are forwarded for inference; the full 300-message
// browser history is never uploaded automatically to either provider.
export const AI_CONTEXT_MAX_MESSAGES = 8
export const AI_CONTEXT_MAX_CHARACTERS = 2_200
export const AI_CONTEXT_MAX_PER_MESSAGE = 500

export function selectAiCoachContext(messages: AiChatMessage[]): AiChatMessage[] {
  const selected: AiChatMessage[] = []
  let characters = 0
  for (let index = messages.length - 1; index >= 0 && selected.length < AI_CONTEXT_MAX_MESSAGES; index--) {
    const entry = messages[index]
    if (!entry || (entry.role !== "user" && entry.role !== "assistant") || typeof entry.text !== "string") continue
    const normalized = entry.text.replace(/\s+/g, " ").trim()
    if (!normalized) continue
    const remaining = AI_CONTEXT_MAX_CHARACTERS - characters
    if (remaining <= 0) break
    const cap = Math.min(AI_CONTEXT_MAX_PER_MESSAGE, remaining)
    const text = normalized.length <= cap ? normalized
      : cap >= 12 ? normalized.slice(0, Math.ceil((cap - 3) / 2)) + " … " + normalized.slice(-(Math.floor((cap - 3) / 2)))
      : normalized.slice(0, cap)
    selected.push({ role: entry.role, text })
    characters += text.length
  }
  return selected.reverse()
}
