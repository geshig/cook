-- Онлайн коучинг: кандидатурите от /treniray. Пусни веднъж в Supabase → SQL Editor.
create table if not exists coaching_applications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  email text not null,
  phone text,
  contact_app text,
  goal text,
  sex text,
  age int,
  height_cm int,
  weight_kg numeric,
  activity text,
  train_where text,
  train_days int,
  dislikes text,
  tried text,
  health text[],
  health_note text,
  plan text,
  -- new → approved (пратен линк за плащане) → paid → ended; или rejected
  status text not null default 'new',
  pay_token text unique,
  approved_at timestamptz,
  paid_plan text,
  paid_at timestamptz,
  stripe_session_id text,
  stripe_subscription_id text
);
create index if not exists coaching_applications_status on coaching_applications (status);
-- Само сървърът (service role) чете и пише: без публични правила.
alter table coaching_applications enable row level security;
