-- Community Calls table
create table if not exists community_calls (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  date timestamptz not null,
  duration_minutes int default 60,
  timezone text default 'UTC',
  meeting_link text,
  meeting_link_label text default 'Join on Zoom',
  category text check (category in ('dev_call', 'office_hours', 'workshop', 'announcement')) default 'dev_call',
  max_attendees int,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index for efficient date queries
create index if not exists community_calls_date_idx on community_calls (date);

-- Seed placeholder events (every 4 weeks starting May 16, 2026)
insert into community_calls (title, description, date, duration_minutes, category, meeting_link, meeting_link_label) values
  ('MOI Community Call', 'Monthly sync — protocol updates, ecosystem demos, and open Q&A.', '2026-05-16T18:00:00Z', 60, 'dev_call', '#', 'Join on Zoom'),
  ('MOI Office Hours', 'Drop in with questions about building on MOI. Core team available.', '2026-06-13T18:00:00Z', 60, 'office_hours', '#', 'Join on Zoom'),
  ('MOI Community Call', 'Monthly sync — protocol updates, ecosystem demos, and open Q&A.', '2026-07-11T18:00:00Z', 60, 'dev_call', '#', 'Join on Zoom'),
  ('MOI Office Hours', 'Drop in with questions about building on MOI. Core team available.', '2026-08-08T18:00:00Z', 60, 'office_hours', '#', 'Join on Zoom'),
  ('MOI Community Call', 'Monthly sync — protocol updates, ecosystem demos, and open Q&A.', '2026-09-05T18:00:00Z', 60, 'dev_call', '#', 'Join on Zoom'),
  ('MOI Office Hours', 'Drop in with questions about building on MOI. Core team available.', '2026-10-03T18:00:00Z', 60, 'office_hours', '#', 'Join on Zoom'),
  ('MOI Community Call', 'Monthly sync — protocol updates, ecosystem demos, and open Q&A.', '2026-10-31T18:00:00Z', 60, 'dev_call', '#', 'Join on Zoom');
