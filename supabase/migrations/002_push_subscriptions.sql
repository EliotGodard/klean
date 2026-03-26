-- Push notification subscriptions
create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null unique,
  keys_p256dh text not null,
  keys_auth text not null,
  created_at timestamptz not null default now()
);
