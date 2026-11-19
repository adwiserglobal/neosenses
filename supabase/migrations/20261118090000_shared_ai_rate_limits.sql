create table if not exists public.ai_rate_limits (
  bucket_hash text primary key check (bucket_hash ~ '^[0-9a-f]{64}$'),
  window_started_at timestamptz not null,
  request_count integer not null check (request_count > 0),
  updated_at timestamptz not null default clock_timestamp()
);

create index if not exists ai_rate_limits_updated_at_idx
  on public.ai_rate_limits (updated_at);

alter table public.ai_rate_limits enable row level security;
revoke all on table public.ai_rate_limits from public, anon, authenticated, service_role;

create or replace function public.consume_ai_rate_limit(
  p_bucket_hash text,
  p_limit integer,
  p_window_seconds integer
)
returns table (
  allowed boolean,
  retry_after_seconds integer,
  request_count integer
)
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
declare
  v_now timestamptz := clock_timestamp();
  v_window_started_at timestamptz;
  v_count integer;
  v_retry integer := 0;
begin
  if p_bucket_hash is null or p_bucket_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid rate limit key';
  end if;
  if p_limit is null or p_limit < 1 or p_limit > 10000 then
    raise exception 'invalid rate limit';
  end if;
  if p_window_seconds is null or p_window_seconds < 1 or p_window_seconds > 604800 then
    raise exception 'invalid rate limit window';
  end if;

  v_window_started_at := to_timestamp(
    floor(extract(epoch from v_now) / p_window_seconds) * p_window_seconds
  );

  insert into public.ai_rate_limits as current_bucket (
    bucket_hash,
    window_started_at,
    request_count,
    updated_at
  )
  values (
    p_bucket_hash,
    v_window_started_at,
    1,
    v_now
  )
  on conflict (bucket_hash) do update
    set window_started_at = excluded.window_started_at,
        request_count = case
          when current_bucket.window_started_at = excluded.window_started_at
            then current_bucket.request_count + 1
          else 1
        end,
        updated_at = excluded.updated_at
  returning public.ai_rate_limits.request_count into v_count;

  if v_count > p_limit then
    v_retry := greatest(
      1,
      ceil(extract(epoch from (
        v_window_started_at + make_interval(secs => p_window_seconds) - v_now
      )))::integer
    );
  end if;

  -- Limpeza distribuída, em uma pequena fração das chamadas, sem apagar
  -- janelas ativas. As janelas máximas aceitas são de sete dias.
  if mod((hashtext(p_bucket_hash) & 2147483647), 100) = 0 then
    delete from public.ai_rate_limits
    where updated_at < v_now - interval '8 days';
  end if;

  return query
    select (v_count <= p_limit), v_retry, v_count;
end;
$function$;

revoke all on function public.consume_ai_rate_limit(text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.consume_ai_rate_limit(text, integer, integer)
  to service_role;