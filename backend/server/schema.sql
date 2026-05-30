create table users (
  id uuid primary key,
  handle text not null unique,
  display_name text not null,
  age_verified boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

create table sessions (
  token text primary key,
  user_id uuid not null references users(id),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table follows (
  follower_id uuid not null references users(id),
  following_id uuid not null references users(id),
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id)
);

create table pins (
  id uuid primary key,
  creator_id uuid not null references users(id),
  title text not null,
  area text not null,
  category text not null,
  starts_at timestamptz not null,
  expires_at timestamptz not null,
  interested integer not null default 0,
  color text not null,
  unsafe boolean not null default false,
  latitude double precision not null,
  longitude double precision not null,
  created_at timestamptz not null default now()
);

create table memories (
  id uuid primary key,
  owner_id uuid not null references users(id),
  pin_id uuid not null references pins(id),
  audience text not null check (audience in ('feed', 'following')),
  media_url text,
  created_at timestamptz not null default now()
);

create table reactions (
  id uuid primary key,
  user_id uuid not null references users(id),
  memory_id uuid not null references memories(id),
  emoji text not null,
  created_at timestamptz not null default now(),
  unique (user_id, memory_id)
);

create table pull_ups (
  id uuid primary key,
  user_id uuid not null references users(id),
  pin_id uuid not null references pins(id),
  created_at timestamptz not null default now(),
  unique (user_id, pin_id)
);

create table reports (
  id uuid primary key,
  reporter_id uuid not null references users(id),
  target_type text not null check (target_type in ('pin', 'memory', 'user')),
  target_id uuid not null,
  reason text not null,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

create table blocks (
  id uuid primary key,
  blocker_id uuid not null references users(id),
  blocked_user_id uuid not null references users(id),
  created_at timestamptz not null default now(),
  unique (blocker_id, blocked_user_id)
);

create table notifications (
  id uuid primary key,
  user_id uuid not null references users(id),
  type text not null,
  title text not null,
  body text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table dms (
  id uuid primary key,
  from_user_id uuid not null references users(id),
  to_user_id uuid not null references users(id),
  body text not null,
  created_at timestamptz not null default now()
);

create table streaks (
  id uuid primary key,
  user_a_id uuid not null references users(id),
  user_b_id uuid not null references users(id),
  days integer not null default 0,
  last_mutual_reaction_at timestamptz,
  expires_at timestamptz,
  unique (user_a_id, user_b_id)
);
