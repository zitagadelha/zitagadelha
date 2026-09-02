-- Diagnóstico do usuário admin (rode no SQL Editor do Supabase)

-- 1) Dados do usuário
select
  id,
  email,
  email_confirmed_at,
  last_sign_in_at,
  created_at,
  banned_until,
  deleted_at
from auth.users
where email = 'zitagadelha@gmail.com';

-- 2) Identidade (obrigatória para login por e-mail/senha)
select
  id,
  user_id,
  provider,
  provider_id,
  identity_data
from auth.identities
where user_id in (
  select id from auth.users where email = 'zitagadelha@gmail.com'
);

-- Resultado esperado:
-- - 1 linha em auth.users com email_confirmed_at preenchido
-- - 1 linha em auth.identities com provider = 'email'
