-- Rode no SQL Editor do Supabase se o cadastro da newsletter falhar
-- (erro: "Não foi possível concluir o cadastro")

grant usage on schema public to anon, authenticated;

grant insert on table public.newsletter_subscribers to anon;
grant select on table public.newsletter_subscribers to authenticated;

-- Recria a política de insert (caso tenha sido alterada)
drop policy if exists "public_can_insert_subscribers" on public.newsletter_subscribers;

create policy "public_can_insert_subscribers"
  on public.newsletter_subscribers
  for insert
  to anon, authenticated
  with check (true);
