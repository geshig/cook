-- Admin → Имейли: кои имейли е пратил сайтът
create table if not exists email_log (id bigint generated always as identity primary key, to_email text not null, subject text, kind text, ok boolean default true, created_at timestamptz default now()); alter table email_log enable row level security; create index if not exists email_log_created on email_log (created_at desc);
