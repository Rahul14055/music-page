-- ============================================
-- TYZEN01 — demo_tracks table setup & update
-- Run this in your Supabase SQL Editor
-- ============================================

-- 1. Create table if it doesn't already exist
create table if not exists demo_tracks (
  id uuid primary key default gen_random_uuid(),
  album text not null,          -- 'Cloud 9' | 'Lost in Abyss' | 'Sinner' | 'Singles'
  track_number int,             -- order within album, null for singles
  title text not null,
  demo_file text not null,      -- exact filename in the bucket
  art_file text,                -- exact filename in the bucket
  youtube_url text,             -- optional: link to full track/playlist
  created_at timestamptz default now()
);

-- 2. Public read access policy
alter table demo_tracks enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where tablename = 'demo_tracks' and policyname = 'Public read access'
  ) then
    create policy "Public read access" on demo_tracks for select using (true);
  end if;
end $$;

-- 3. Clear existing rows and seed with exact bucket filenames
truncate table demo_tracks;

insert into demo_tracks (album, track_number, title, demo_file, art_file, youtube_url) values
-- Sinner
('Sinner', 1, 'Stay Humble',                  'stay humble (cut).mp3',                    'stay humble.jpeg',                  'https://www.youtube.com/playlist?list=PLR1DMr_gwB-s'),
('Sinner', 2, 'That''s the Name',             'that''s the name (cut).mp3',               'that''s the name.jpeg',             'https://www.youtube.com/playlist?list=PLR1DMr_gwB-s'),
('Sinner', 3, 'Not the Space',                'Not the space (cut).mp3',                  'not the space.jpeg',                'https://www.youtube.com/playlist?list=PLR1DMr_gwB-s'),
('Sinner', 4, 'Not the Space (Her Version)',  'not the space (her version) (cut).mp3',    'not the space (her version).jpeg',  'https://www.youtube.com/playlist?list=PLR1DMr_gwB-s'),

-- Cloud 9
('Cloud 9', 1, 'After Midnight',              'AFTER MIDNIGHT (cut).mp3',                 'after midnight.jpeg',               'https://www.youtube.com/playlist?list=PLUPUNgimvEYQ'),
('Cloud 9', 2, 'Livin'' Good',                 'livin good (cut).mp3',                     'livin'' good.jpeg',                 'https://www.youtube.com/playlist?list=PLUPUNgimvEYQ'),
('Cloud 9', 3, 'Stay in My Lane',             'stay in my lane (cut).mp3',                'stay in my lane.jpeg',              'https://www.youtube.com/playlist?list=PLUPUNgimvEYQ'),
('Cloud 9', 4, 'Take Me to Cloud-9',          'take me to cloud 9 (cut).mp3',             'take me to cloud-9.jpeg',           'https://www.youtube.com/playlist?list=PLUPUNgimvEYQ'),

-- Lost in Abyss
('Lost in Abyss', 1, 'Enough',                'Enough (cut).mp3',                         'enough.jpeg',                       'https://www.youtube.com/playlist?list=PLaFBsqLva-qc'),
('Lost in Abyss', 2, 'Still I Shine',         'Still i shine (cut).mp3',                  'still i shine.jpeg',                'https://www.youtube.com/playlist?list=PLaFBsqLva-qc'),
('Lost in Abyss', 3, 'Unrequited',            'Unrequited (cut).mp3',                     'unrequited.jpeg',                   'https://www.youtube.com/playlist?list=PLaFBsqLva-qc'),
('Lost in Abyss', 4, 'Unrequited (Reprise)',  'Unrequited reprise (cut).mp3',             'unrequited reprise.jpeg',           'https://www.youtube.com/playlist?list=PLaFBsqLva-qc'),

-- Singles
('Singles', null, 'Keep It Movin''',          'keep it movin (cut).mp3',                  'keep it movin''.jpeg',              'https://www.youtube.com/playlist?list=PLIE0IpB4idiI'),
('Singles', null, 'You''re the Reason',       'you''re the reason (cut).mp3',             'you''re the reason.jpeg',           'https://www.youtube.com/playlist?list=PLIE0IpB4idiI'),
('Singles', null, 'Interlude',                'take me to cloud-9 (interlude) (cut).mp3', 'take me to cloud-9 (interlude).jpeg','https://www.youtube.com/playlist?list=PLIE0IpB4idiI'),
('Singles', null, 'We Rise',                  'we rise (cut).mp3',                        'we rise.jpeg',                      'https://www.youtube.com/playlist?list=PLIE0IpB4idiI');
