-- 투데이트: 둘이 함께 쓰는 일정 저장소
-- Supabase 대시보드 → SQL Editor 에 통째로 붙여넣고 Run. 여러 번 실행해도 안전함.
--
-- 구조
--   twodate_rooms  : 방 하나와 방 비밀번호(bcrypt 해시)
--   twodate_events : 방에 속한 일정. 일정 한 건을 앱에서 쓰는 모양 그대로 jsonb 로 저장
-- 보안
--   두 테이블 모두 RLS 를 켜고 정책을 하나도 만들지 않음 → 공개(anon) 키로는 테이블을 직접 읽거나 쓸 수 없음
--   대신 아래 함수들만 공개하고, 함수마다 방 비밀번호를 서버에서 확인한 뒤에만 일정을 돌려주거나 바꿈

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.twodate_rooms (
  id       text primary key,
  key_hash text not null
);

create table if not exists public.twodate_events (
  room       text        not null references public.twodate_rooms(id) on delete cascade,
  id         text        not null,
  data       jsonb       not null,
  updated_at timestamptz not null default now(),
  primary key (room, id)
);

alter table public.twodate_rooms  enable row level security;
alter table public.twodate_events enable row level security;
revoke all on public.twodate_rooms, public.twodate_events from anon, authenticated;

-- 방 비밀번호 확인 (내부용)
create or replace function public.twodate_room_ok(p_room text, p_key text)
returns boolean
language sql stable security definer
set search_path = public, extensions
as $$
  select exists (select 1 from twodate_rooms where id = p_room and key_hash = crypt(p_key, key_hash));
$$;

create or replace function public.twodate_require_room(p_room text, p_key text)
returns void
language plpgsql stable security definer
set search_path = public, extensions
as $$
begin
  if not twodate_room_ok(p_room, p_key) then
    raise exception '방 비밀번호가 맞지 않아요' using errcode = '28000';
  end if;
end;
$$;

-- 잠금 화면에서 비밀번호 확인
create or replace function public.twodate_check_room(p_room text, p_key text)
returns boolean
language sql stable security definer
set search_path = public, extensions
as $$
  select twodate_room_ok(p_room, p_key);
$$;

-- 방의 일정 전체
create or replace function public.twodate_list_events(p_room text, p_key text)
returns setof jsonb
language plpgsql stable security definer
set search_path = public, extensions
as $$
begin
  perform twodate_require_room(p_room, p_key);
  return query select data from twodate_events where room = p_room order by updated_at;
end;
$$;

-- 일정 저장 (새로 만들거나 덮어쓰기)
create or replace function public.twodate_save_event(p_room text, p_key text, p_event jsonb)
returns void
language plpgsql security definer
set search_path = public, extensions
as $$
begin
  perform twodate_require_room(p_room, p_key);
  if coalesce(p_event->>'id', '') = '' then
    raise exception '일정 id가 없어요' using errcode = '22023';
  end if;
  insert into twodate_events (room, id, data) values (p_room, p_event->>'id', p_event)
  on conflict (room, id) do update set data = excluded.data, updated_at = now();
end;
$$;

-- 일정 삭제
create or replace function public.twodate_delete_event(p_room text, p_key text, p_id text)
returns void
language plpgsql security definer
set search_path = public, extensions
as $$
begin
  perform twodate_require_room(p_room, p_key);
  delete from twodate_events where room = p_room and id = p_id;
end;
$$;

-- 함수는 기본으로 누구나 실행할 수 있으므로 먼저 모두 막고, 앱이 쓰는 네 개만 공개
revoke all on function public.twodate_room_ok(text, text)                  from public, anon, authenticated;
revoke all on function public.twodate_require_room(text, text)             from public, anon, authenticated;
revoke all on function public.twodate_check_room(text, text)               from public;
revoke all on function public.twodate_list_events(text, text)              from public;
revoke all on function public.twodate_save_event(text, text, jsonb)        from public;
revoke all on function public.twodate_delete_event(text, text, text)       from public;
grant execute on function public.twodate_check_room(text, text)            to anon, authenticated;
grant execute on function public.twodate_list_events(text, text)           to anon, authenticated;
grant execute on function public.twodate_save_event(text, text, jsonb)     to anon, authenticated;
grant execute on function public.twodate_delete_event(text, text, text)    to anon, authenticated;

-- 방 만들기 / 비밀번호 바꾸기
-- 아래 줄의 '여기에-방-비밀번호' 를 실제 비밀번호로 바꿔서 이 한 줄만 따로 실행. (비밀번호는 이 파일에 저장하지 말 것)
-- 방 이름 'twodate' 는 config.js 의 ROOM_ID 와 같아야 함.
-- 다른 앱의 테이블·함수와 겹치지 않도록 이름은 모두 twodate_ 로 시작함.
-- set search_path = public, extensions;
-- insert into public.twodate_rooms (id, key_hash) values ('twodate', crypt('여기에-방-비밀번호', gen_salt('bf')))
--   on conflict (id) do update set key_hash = excluded.key_hash;
