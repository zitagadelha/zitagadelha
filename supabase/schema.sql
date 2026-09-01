-- Tabela de inscritos na newsletter
create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  source_page text,
  consent_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint newsletter_subscribers_email_unique unique (email),
  constraint newsletter_subscribers_email_format check (
    email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  )
);

create index newsletter_subscribers_created_at_idx
  on public.newsletter_subscribers (created_at desc);

alter table public.newsletter_subscribers enable row level security;

-- Visitantes podem APENAS inserir (não ler, não atualizar, não apagar)
create policy "public_can_insert_subscribers"
  on public.newsletter_subscribers
  for insert
  to anon, authenticated
  with check (true);

-- Somente usuário autenticado (Zita) pode ler
create policy "admin_can_read_subscribers"
  on public.newsletter_subscribers
  for select
  to authenticated
  using (true);
