-- Кухнята — схема за Supabase (Postgres)
-- Пусни директно в Supabase → SQL Editor → Run
-- Стъпка 1 от 2 — след това пусни seed.sql от същата папка.

create table recipes (
  id bigint generated always as identity primary key,
  title text not null,
  time_minutes int,
  servings int,
  kcal int,
  protein_g numeric,
  carbs_g numeric,
  fat_g numeric,
  ingredients text,
  steps text,
  video_url text,
  photo_url text,
  is_locked boolean default false,       -- true = само за абонати
  batch_number int,                      -- към кой месечен/тримесечен drop принадлежи
  created_at timestamptz default now()
);

-- Нормализирани тагове: изтриваш ред тук -> изчезва навсякъде, рецептите не се пипат
create table tags (
  id bigint generated always as identity primary key,
  name text unique not null,
  category text not null   -- 'съставка' | 'хранене' | 'десерт' | 'профил' | 'ограничение' | 'повод' | 'скорост' | 'метод'
);

create table recipe_tags (
  recipe_id bigint references recipes(id) on delete cascade,
  tag_id bigint references tags(id) on delete cascade,
  primary key (recipe_id, tag_id)
);

-- Кой е платил и за какво (пълни се от Stripe webhook, не от клиента)
create table subscribers (
  id bigint generated always as identity primary key,
  email text unique not null,
  stripe_customer_id text,
  purchased_book boolean default false,     -- еднократна книга
  subscription_status text default 'inactive', -- 'active' | 'canceled' | 'inactive'
  current_period_end timestamptz,
  created_at timestamptz default now()
);

create index on recipe_tags (tag_id);
create index on recipes (is_locked);
