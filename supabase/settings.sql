-- Настройки на сайта (видео на началната) и звезди за отзивите.
create table if not exists site_settings (
  key text primary key,
  value text,
  updated_at timestamptz default now()
);
alter table site_settings enable row level security;
alter table testimonials add column if not exists rating int;
