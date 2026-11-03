-- The whole story read in one take. Stories voiced by Pindo, which charges a minute for every
-- request, have only this; sentences replay from their part of it.
alter table public.stories add column audio_path text;

-- Stories voiced before this column existed keep their take at stories/<id>/story.<ext>.
update public.stories
  set audio_path = regexp_replace(sentences -> 0 ->> 'audio_path', '/0\.(\w+)$', '/story.\1')
  where audio_path is null and sentences -> 0 ->> 'audio_path' is not null;
