-- Recria o usuário admin para login em zitapsi.com.br/email
-- Rode no SQL Editor do Supabase (Authentication → Users deve ficar com 1 usuário)
--
-- ANTES: Authentication → Sign In / Providers → Email → "Enable email provider" LIGADO → Save
--
-- Troque e-mail/senha abaixo se quiser usar outros valores.

create extension if not exists pgcrypto with schema extensions;

do $$
declare
  admin_email text := 'zitagadelha@gmail.com';
  admin_password text := 'PsiZita@2026!';
  new_user_id uuid := gen_random_uuid();
begin
  -- Remove usuário antigo (se existir) para recriar corretamente
  delete from auth.identities
  where user_id in (select id from auth.users where email = admin_email);

  delete from auth.users
  where email = admin_email;

  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  )
  values (
    '00000000-0000-0000-0000-000000000000',
    new_user_id,
    'authenticated',
    'authenticated',
    admin_email,
    extensions.crypt(admin_password, extensions.gen_salt('bf')),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  );

  insert into auth.identities (
    id,
    user_id,
    provider_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  )
  values (
    new_user_id,
    new_user_id,
    new_user_id::text,
    jsonb_build_object(
      'sub', new_user_id::text,
      'email', admin_email,
      'email_verified', true,
      'phone_verified', false
    ),
    'email',
    now(),
    now(),
    now()
  );
end $$;

-- Deve retornar 1 linha com email_confirmed_at preenchido
select id, email, email_confirmed_at, created_at
from auth.users
where email = 'zitagadelha@gmail.com';
