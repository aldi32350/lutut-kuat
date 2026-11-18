-- FotoAjaib: skema awal
-- Jalankan di Supabase Dashboard → SQL Editor (atau `supabase db push`).

-- ───────────── Tabel ─────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  name text not null default '',
  role text not null default 'user' check (role in ('user', 'admin')),
  plan text not null default 'free' check (plan in ('free', 'pro')),
  plan_expires_at timestamptz,
  credits integer not null default 0 check (credits >= 0),
  created_at timestamptz not null default now()
);

-- Ledger kredit (setiap tambah/kurang tercatat)
create table if not exists public.credits (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  amount integer not null,
  reason text not null,          -- free_trial | generate | refund | purchase | admin
  ref text,                      -- id generation / order
  created_at timestamptz not null default now()
);
create index if not exists credits_user_idx on public.credits (user_id, created_at desc);

create table if not exists public.generations (
  id uuid primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  preset_id text not null,
  input_url text not null,
  output_url text,
  status text not null default 'pending' check (status in ('pending', 'success', 'failed')),
  saved boolean not null default false,
  error text,
  created_at timestamptz not null default now()
);
create index if not exists generations_user_idx on public.generations (user_id, created_at desc);

create table if not exists public.payments (
  id text primary key,           -- order id
  user_id uuid not null references public.profiles (id) on delete cascade,
  package_id text not null,
  amount integer not null,
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed')),
  provider text not null,
  provider_ref text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
create index if not exists payments_user_idx on public.payments (user_id, created_at desc);

create table if not exists public.preset_overrides (
  id text primary key,
  aktif boolean,
  nama text,
  deskripsi text,
  prompt_template text,
  updated_at timestamptz not null default now()
);

-- ───────────── Row Level Security ─────────────
-- Server memakai service role (melewati RLS). Kebijakan di bawah hanya
-- mengizinkan user membaca datanya sendiri bila suatu saat diakses dari browser.
alter table public.profiles enable row level security;
alter table public.credits enable row level security;
alter table public.generations enable row level security;
alter table public.payments enable row level security;
alter table public.preset_overrides enable row level security;

drop policy if exists "profil sendiri" on public.profiles;
create policy "profil sendiri" on public.profiles for select using (auth.uid() = id);
drop policy if exists "kredit sendiri" on public.credits;
create policy "kredit sendiri" on public.credits for select using (auth.uid() = user_id);
drop policy if exists "generasi sendiri" on public.generations;
create policy "generasi sendiri" on public.generations for select using (auth.uid() = user_id);
drop policy if exists "pembayaran sendiri" on public.payments;
create policy "pembayaran sendiri" on public.payments for select using (auth.uid() = user_id);

-- ───────────── Fungsi atomik ─────────────
create or replace function public.add_credits(p_user uuid, p_amount int, p_reason text, p_ref text default null)
returns int language plpgsql security definer set search_path = public as $$
declare bal int;
begin
  update profiles set credits = credits + p_amount where id = p_user returning credits into bal;
  if bal is null then raise exception 'profil % tidak ditemukan', p_user; end if;
  insert into credits (user_id, amount, reason, ref) values (p_user, p_amount, p_reason, p_ref);
  return bal;
end $$;

create or replace function public.consume_credit(p_user uuid, p_ref text)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  update profiles set credits = credits - 1 where id = p_user and credits > 0;
  if not found then return false; end if;
  insert into credits (user_id, amount, reason, ref) values (p_user, -1, 'generate', p_ref);
  return true;
end $$;

create or replace function public.ensure_profile(p_id uuid, p_email text, p_name text, p_free int)
returns setof profiles language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, email, name) values (p_id, lower(p_email), coalesce(p_name, ''))
  on conflict (id) do nothing;
  if found and p_free > 0 then
    perform add_credits(p_id, p_free, 'free_trial', null);
  end if;
  return query select * from profiles where id = p_id;
end $$;

create or replace function public.mark_payment_paid(p_id text, p_ref text)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  update payments set status = 'paid', paid_at = now(), provider_ref = p_ref where id = p_id and status <> 'paid';
  return found;
end $$;

-- Fungsi hanya boleh dipanggil server (service role)
revoke execute on function public.add_credits(uuid, int, text, text) from public, anon, authenticated;
revoke execute on function public.consume_credit(uuid, text) from public, anon, authenticated;
revoke execute on function public.ensure_profile(uuid, text, text, int) from public, anon, authenticated;
revoke execute on function public.mark_payment_paid(text, text) from public, anon, authenticated;

-- ───────────── Storage ─────────────
insert into storage.buckets (id, name, public) values ('photos', 'photos', false)
on conflict (id) do nothing;
