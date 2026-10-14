-- ALZAVA AI Coach: read-only remaining quota for authenticated participants.
-- Uses the same session validation and WIB date as alzava_ai_claim.
create or replace function public.alzava_ai_status(p_token_hash text)
returns jsonb language plpgsql security definer
set search_path = pg_catalog, battle_private, public
as $$
declare
  v_id uuid;
  v_day date := (now() at time zone 'Asia/Jakarta')::date;
  v_count integer := 0;
  v_global_count integer := 0;
begin
  if p_token_hash is null or length(p_token_hash) <> 64 then
    return jsonb_build_object('ok',false,'reason','unauthorized');
  end if;

  select ps.participant_id into v_id
    from battle_private.participant_sessions ps
    join battle_private.participants p on p.id = ps.participant_id
    where ps.token_hash = p_token_hash and ps.expires_at > now()
      and coalesce(p.status,'active') not in ('blocked','banned','suspended')
    limit 1;
  if v_id is null then
    return jsonb_build_object('ok',false,'reason','unauthorized');
  end if;

  select request_count into v_count
    from battle_private.ai_coach_daily_usage
    where participant_id = v_id and usage_day = v_day;
  select request_count into v_global_count
    from battle_private.ai_coach_global_usage
    where usage_day = v_day;

  return jsonb_build_object(
    'ok', true,
    'remaining', greatest(0, 3 - coalesce(v_count,0)),
    'daily_limit', 3,
    'global_available', coalesce(v_global_count,0) < 120,
    'reset_timezone', 'Asia/Jakarta'
  );
end $$;

revoke all on function public.alzava_ai_status(text) from public, anon, authenticated;
grant execute on function public.alzava_ai_status(text) to service_role;
