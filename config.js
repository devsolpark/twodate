/* 접속 정보
   Supabase 프로젝트 주소와 공개(anon) 키. anon 키는 브라우저에 공개되는 용도의 키라 여기 두어도 되지만,
   누가 무엇을 읽고 쓸 수 있는지는 Supabase의 RLS(행 수준 보안) 정책으로 반드시 막아 두어야 함.
   service_role 키는 절대 이 파일에 넣지 말 것. */
const SUPABASE_URL  = 'https://ijlpvldeobvknbdauwfm.supabase.co';
const SUPABASE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqbHB2bGRlb2J2a25iZGF1d2ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMyMzkxMzEsImV4cCI6MjEwODgxNTEzMX0.g9uwRPvX-5CzQmthoXyeKvRYA-Y2wuOGwPpxKd725xs';

/* 방 이름. supabase/schema.sql 에서 만든 방(rooms.id)과 같아야 함 */
const ROOM_ID       = 'twodate';
