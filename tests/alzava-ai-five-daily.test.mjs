import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const sql = readFileSync("supabase/migrations/20261014_alzava_ai_coach_five_daily_questions.sql", "utf8");
const ui = readFileSync("components/alzava-ai-coach.tsx", "utf8");
const edge = readFileSync("supabase/functions/alzava-ai-coach/index.ts", "utf8");

test("Per-account quota increases to 5 and preserves WIB reset, existing usage and global 120 guard", () => {
  assert.match(sql, /v_daily_limit constant integer := 5;/g);
  assert.match(sql, /request_count < v_daily_limit/);
  assert.match(sql, /v_daily_limit - v_user_count/);
  assert.match(sql, /v_daily_limit - coalesce\(v_count,0\)/);
  assert.match(sql, /time zone 'Asia\/Jakarta'/);
  assert.match(sql, /ai_coach_global_usage\.request_count < 120/);
  assert.doesNotMatch(sql, /truncate|delete from battle_private\.ai_coach|drop table/i);
  assert.doesNotMatch(sql, /create or replace function public\.alzava_ai_refund/i);
});

test("Quota API remains service-role restricted", () => {
  assert.match(sql, /revoke all on function public\.alzava_ai_claim\(text\) from public, anon, authenticated/);
  assert.match(sql, /revoke all on function public\.alzava_ai_status\(text\) from public, anon, authenticated/);
  assert.match(sql, /grant execute on function public\.alzava_ai_claim\(text\) to service_role/);
  assert.match(sql, /grant execute on function public\.alzava_ai_status\(text\) to service_role/);
});

test("Frontend and Edge Function expose the same quota of 5 without changing user authentication", () => {
  assert.match(ui, /const AI_DAILY_LIMIT = 5/);
  assert.match(ui, /dailyLimit/);
  assert.match(ui, /getParticipantToken/);
  assert.match(ui, /X-Battle-Token/);
  assert.match(edge, /Jatah 5 pertanyaan AI hari ini/);
  assert.match(edge, /daily_limit:quota\.daily_limit \|\| 5/);
  assert.match(edge, /alzava_ai_claim/);
  assert.match(edge, /alzava_ai_refund/);
});
