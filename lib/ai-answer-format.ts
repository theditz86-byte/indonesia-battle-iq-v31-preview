// Present model-generated mathematical notation without exposing raw LaTeX
// delimiters. Output remains plain text and React elements, never HTML.
// A lightweight renderer for common TIU formulas; advanced LaTeX stays literal.
const MATH_SYMBOLS: Record<string, string> = {
  cup: "∪", cap: "∩", subset: "⊂", subseteq: "⊆",
  supset: "⊃", supseteq: "⊇", in: "∈", notin: "∉",
  emptyset: "∅", varnothing: "∅", forall: "∀", exists: "∃",
  times: "×", cdot: "·", div: "÷", pm: "±", mp: "∓",
  le: "≤", leq: "≤", ge: "≥", geq: "≥", ne: "≠", neq: "≠",
  approx: "≈", equiv: "≡", to: "→", rightarrow: "→",
  leftarrow: "←", implies: "⇒", iff: "⇔",
  pi: "π", theta: "θ", alpha: "α", beta: "β", gamma: "γ",
  delta: "δ", lambda: "λ", mu: "μ", sigma: "σ", omega: "ω",
  sum: "∑", prod: "∏", int: "∫", infty: "∞",
  ldots: "…", cdots: "⋯", dots: "…", therefore: "∴",
  angle: "∠", degree: "°", circ: "°"
}
const SUPERSCRIPT: Record<string, string> = {
  "0":"⁰","1":"¹","2":"²","3":"³","4":"⁴","5":"⁵",
  "6":"⁶","7":"⁷","8":"⁸","9":"⁹","+":"⁺","-":"⁻",
  "=":"⁼","n":"ⁿ","i":"ⁱ","(":"⁽",")":"⁾"
}
const SUBSCRIPT: Record<string, string> = {
  "0":"₀","1":"₁","2":"₂","3":"₃","4":"₄","5":"₅",
  "6":"₆","7":"₇","8":"₈","9":"₉","+":"₊","-":"₋",
  "=":"₌","n":"ₙ","i":"ᵢ","j":"ⱼ","k":"ₖ","(":"₍",")":"₎"
}
function convertScript(input: string, table: Record<string, string>, fallback: string): string {
  const mapped = Array.from(input).map(char => table[char])
  return mapped.every(Boolean) ? mapped.join("") : fallback
}
function normalizeMathBody(input: string): string {
  let result = input
  for (let i = 0; i < 3; i++) {
    result = result.replace(/\\(?:dfrac|tfrac|frac)\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g,
      (_match, numerator: string, denominator: string) => "(" + numerator + ")/(" + denominator + ")")
  }
  result = result.replace(/\\sqrt\s*\{([^{}]+)\}/g, (_match, value: string) => "√(" + value + ")")
  result = result.replace(/\\(?:text|mathrm|mathbf|operatorname)\s*\{([^{}]+)\}/g, "$1")
  result = result.replace(/\\(?:left|right|displaystyle|textstyle)\b/g, "")
  result = result.replace(/\\([a-zA-Z]+)\b/g, (match, command: string) => MATH_SYMBOLS[command] || match)
  result = result.replace(/\\([{}%_$#&])/g, "$1")
  result = result.replace(/([\^_])(?:\{([^{}]+)\}|([0-9]+|[nijk]))/g,
    (match, operator: string, braced: string | undefined, naked: string | undefined) => {
      const content = braced ?? naked ?? ""
      return convertScript(content, operator === "^" ? SUPERSCRIPT : SUBSCRIPT, match)
    })
  return result.replace(/\\[,;!:]/g, " ").replace(/~/g, " ")
}
export function formatAiAnswerText(raw: string): string {
  if (typeof raw !== "string" || !raw) return ""
  let content = raw.replace(/\r\n?/g, "\n")
  // Remove paired TeX math delimiters, but preserve unmatched dollar signs.
  content = content.replace(/\$\$([\s\S]+?)\$\$/g, (_match, formula: string) => normalizeMathBody(formula))
  content = content.replace(/\\\[([\s\S]+?)\\\]/g, (_match, formula: string) => normalizeMathBody(formula))
  content = content.replace(/\\\(([\s\S]+?)\\\)/g, (_match, formula: string) => normalizeMathBody(formula))
  content = content.replace(/(?<!\\)\$([^$\n]{1,800})\$/g, (_match, formula: string) => normalizeMathBody(formula))
  // Some models output bare LaTeX commands without math delimiters.
  return normalizeMathBody(content)
}
export type AiInlinePart = { kind: "text" | "bold" | "italic" | "code"; text: string }
export function parseAiInlineFormatting(line: string): AiInlinePart[] {
  const parts: AiInlinePart[] = []
  const matcher = /(\*\*([^*\n]+)\*\*|(?<!\*)\*([^*\n]+)\*(?!\*)|\x60([^\x60\n]+)\x60)/g
  let cursor = 0
  for (const match of line.matchAll(matcher)) {
    const position = match.index ?? 0
    if (position > cursor) parts.push({ kind: "text", text: line.slice(cursor, position) })
    if (match[2] !== undefined) parts.push({ kind: "bold", text: match[2] })
    else if (match[3] !== undefined) parts.push({ kind: "italic", text: match[3] })
    else parts.push({ kind: "code", text: match[4] })
    cursor = position + match[0].length
  }
  if (cursor < line.length) parts.push({ kind: "text", text: line.slice(cursor) })
  return parts
}
