-- ALZAVA AI Coach: increase the existing per-participant allowance 3 -> 5
-- Preserves usage history, auth checks, global safety cap of 120, and refund behavior.
-- Reset remains based on midnight in Asia/Jakarta (WIB).
create or replace function public.alzava_ai_claim(p_token_hash text)
returns jsonb language plpgsql security definer
set search_path = pg_catalog, battle_private, public
as $$
declare
  v_id uuid;
  v_day date := (now() at time zone 'Asia/Jakarta')::date;
  v_daily_limit constant integer := 5;
  v_user_count integer;
  v_global_count integer;
begin
  if p_token_hash is null or length(p_token_hash) <> 64 then
    return jsonb_build_object('ok',false,'reason','unauthorized');
  end if;
  select ps.participant_id into v_id
    from battle_private.participant_sessions ps
    join battle_private.participants p on p.id=ps.participant_id
    where ps.token_hash=p_token_hash and ps.expires_at > now()
      and coalesce(p.status,'active') not in ('blocked','banned','suspended')
    limit 1;
  if v_id is null then
    return jsonb_build_object('ok',false,'reason','unauthorized');
  end if;

  insert into battle_private.ai_coach_global_usage(usage_day,request_count)
  values (v_day,1)
  on conflict (usage_day) do update
    set request_count=battle_private.ai_coach_global_usage.request_count+1,updated_at=now()
    where battle_private.ai_coach_global_usage.request_count < 120
  returning request_count into v_global_count;
  if v_global_count is null then
    return jsonb_build_object('ok',false,'reason','global_limit');
  end if;

  insert into battle_private.ai_coach_daily_usage(participant_id,usage_day,request_count)
  values(v_id,v_day,1)
  on conflict (participant_id,usage_day) do update
    set request_count=battle_private.ai_coach_daily_usage.request_count+1,updated_at=now()
    where battle_private.ai_coach_daily_usage.request_count < v_daily_limit
  returning request_count into v_user_count;
  if v_user_count is null then
    update battle_private.ai_coach_global_usage
      set request_count=greatest(0,request_count-1)
      where usage_day=v_day;
    return jsonb_build_object('ok',false,'reason','daily_limit');
  end if;
  return jsonb_build_object('ok',true,'remaining',v_daily_limit-v_user_count,'daily_limit',v_daily_limit);
end $$;

create or replace function public.alzava_ai_status(p_token_hash text)
returns jsonb language plpgsql security definer
set search_path = pg_catalog, battle_private, public
as $$
declare
  v_id uuid;
  v_day date := (now() at time zone 'Asia/Jakarta')::date;
  v_daily_limit constant integer := 5;
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
    'remaining', greatest(0, v_daily_limit - coalesce(v_count,0)),
    'daily_limit', v_daily_limit,
    'global_available', coalesce(v_global_count,0) < 120,
    'reset_timezone', 'Asia/Jakarta'
  );
end $$;

revoke all on function public.alzava_ai_claim(text) from public, anon, authenticated;
revoke all on function public.alzava_ai_status(text) from public, anon, authenticated;
grant execute on function public.alzava_ai_claim(text) to service_role;
grant execute on function public.alzava_ai_status(text) to service_role;
