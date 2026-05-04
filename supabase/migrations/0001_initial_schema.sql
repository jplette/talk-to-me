-- supabase/migrations/0001_initial_schema.sql

create table sessions (
  id                  uuid primary key default gen_random_uuid(),
  conversation_id     text unique not null,
  started_at          timestamptz not null,
  ended_at            timestamptz,
  duration_seconds    int,
  end_reason          text check (end_reason in
                          ('timeout','goodbye','manual','inactivity','error','unknown')),

  visitor_name        text,
  visitor_company     text,
  language            text,
  summary             text,
  topic_tags          text[],
  sentiment           text,
  questions           jsonb,

  quality_flags       jsonb,

  transcript          jsonb not null,
  raw_webhook         jsonb,

  channel             text not null default 'web' check (channel in ('web','phone')),

  created_at          timestamptz not null default now()
);

create index sessions_started_at_idx on sessions (started_at desc);
create index sessions_topic_tags_idx on sessions using gin (topic_tags);

alter table sessions enable row level security;
-- keine RLS policies → default deny für anon/authenticated;
-- service-role bypassed RLS.

create table pending_end_reasons (
  conversation_id text primary key,
  reason          text not null check (reason in
                       ('timeout','goodbye','manual','inactivity','error')),
  created_at      timestamptz not null default now()
);

alter table pending_end_reasons enable row level security;
