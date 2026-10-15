"use client"

import { Fragment, useMemo } from "react"
import { formatAiAnswerText, parseAiInlineFormatting } from "@/lib/ai-answer-format"

export function AlzavaAiFormattedMessage({ text }: { text: string }) {
  const formatted = useMemo(() => formatAiAnswerText(text), [text])
  return (
    <span className="whitespace-pre-wrap break-words">
      {formatted.split("\n").map((line, lineIndex) => (
        <Fragment key={lineIndex}>
          {lineIndex > 0 ? "\n" : null}
          {parseAiInlineFormatting(line).map((part, index) => {
            if (part.kind === "bold") return <strong key={index} className="font-bold text-white">{part.text}</strong>
            if (part.kind === "italic") return <em key={index}>{part.text}</em>
            if (part.kind === "code") return <code key={index} className="rounded bg-slate-800 px-1 font-mono text-cyan-100">{part.text}</code>
            return <Fragment key={index}>{part.text}</Fragment>
          })}
        </Fragment>
      ))}
    </span>
  )
}
