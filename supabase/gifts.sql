-- Подаръци: втори достъп за приятел (27 €). Пусни веднъж в Supabase → SQL Editor.
create table if not exists gift_codes (
  code text primary key,
  buyer_email text not null,
  session_id text not null,
  idx int not null,
  redeemed_by text,
  redeemed_at timestamptz,
  created_at timestamptz default now(),
  unique (session_id, idx)
);
alter table gift_codes enable row level security;
