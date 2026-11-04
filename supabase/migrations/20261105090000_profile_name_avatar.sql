-- The learner's name and picture, edited on Profile and shown on Home (decision 179).
-- The picture is a small JPEG made on the phone (160 px, about 10 KB), kept as a data URL so
-- it syncs with the rest of the profile; the check keeps a bad client from storing a big one.
alter table public.profiles
  add column display_name text check (char_length(display_name) <= 40),
  add column avatar text check (char_length(avatar) <= 60000 and avatar like 'data:image/%');
