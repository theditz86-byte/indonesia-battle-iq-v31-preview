import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const moduleSource = readFileSync("lib/ai-answer-format.ts", "utf8");
const compiled = ts.transpileModule(moduleSource, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
}).outputText;
const exports = {};
vm.runInNewContext(compiled, { exports }, { filename: "ai-answer-format.js" });
const { formatAiAnswerText, parseAiInlineFormatting } = exports;

test("Example Venn diagram formula is legible without raw dollar signs", () => {
  const raw = String.raw`Gunakan rumus: $n(A \cup B) = n(A) + n(B) - n(A \cap B)$
$n(A \cup B) = 21 + 19 - 6$
$n(A \cup B) = 40 - 6 = 34$ orang.
Tidak suka keduanya = $38 - 34 = 4$ orang.

**Jawaban:**
Ada **4 orang** yang tidak menyukai keduanya.`;
  const result = formatAiAnswerText(raw);
  assert.match(result, /n\(A ∪ B\) = n\(A\) \+ n\(B\) - n\(A ∩ B\)/);
  assert.match(result, /38 - 34 = 4/);
  assert.doesNotMatch(result, /\$|\\cup|\\cap/);
  assert.match(result, /\*\*Jawaban:\*\*/);
});

test("LaTeX fraction, roots, exponents, set ops and alternate delimiters", () => {
  const raw = String.raw`\[x^2 + y_1 = \frac{12}{3} \times \sqrt{16}\]
\(A \subseteq B\) dan $\theta \geq 5$`;
  const result = formatAiAnswerText(raw);
  assert.match(result, /x² \+ y₁ = \(12\)\/\(3\) × √\(16\)/);
  assert.match(result, /A ⊆ B/);
  assert.match(result, /θ ≥ 5/);
  assert.doesNotMatch(result, /\$|\\frac|\\sqrt/);
});

test("Plain currency or a missing matching dollar delimiter is preserved", () => {
  assert.equal(formatAiAnswerText("Harga $5"), "Harga $5");
  assert.equal(formatAiAnswerText("Saldo Rp5.000"), "Saldo Rp5.000");
  assert.equal(formatAiAnswerText("x^2 + y"), "x² + y");
});

test("Markdown bold, italic and inline code retain text semantics", () => {
  const parts = JSON.parse(JSON.stringify(parseAiInlineFormatting("**Jawaban:** Ada **4 orang**, *tepat*, " + String.fromCharCode(96) + "n(A ∩ B)" + String.fromCharCode(96))));
  assert.deepEqual(parts.map(part => part.kind), ["bold", "text", "bold", "text", "italic", "text", "code"]);
  assert.equal(parts[0].text,"Jawaban:");
  assert.equal(parts[2].text,"4 orang");
  assert.equal(parts[4].text,"tepat");
});

test("Only assistant bubbles are formatted; user messages and persisted chat are unchanged", () => {
  const component = readFileSync("components/alzava-ai-coach.tsx","utf8");
  const formatter = readFileSync("components/alzava-ai-formatted-message.tsx","utf8");
  assert.match(component, /message\.role === "assistant" \? <AlzavaAiFormattedMessage/);
  assert.match(component, /saveAiChatHistory/);
  assert.match(component, /AI_DAILY_LIMIT = 5/);
  assert.match(component, /history: recentContext/);
  assert.match(formatter, /formatAiAnswerText\(text\)/);
  assert.doesNotMatch(formatter, /dangerouslySetInnerHTML/);
});
