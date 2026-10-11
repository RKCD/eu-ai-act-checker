-- Taip! – algskeem Supabase Postgresile.
-- Põhimõtted:
--  * Row-level security kõikidel tabelitel. Vaikimisi keelatud; lubatud ainult poliitikatega.
--  * Kriitilised tehingud (kriisi aktiveerimine/lõpp, broneering) on SECURITY DEFINER funktsioonid,
--    mis kontrollivad rolli ise ja töötavad ühes tehingus (reaalukud, ülebroneerimise kaitse).
--  * KOV ei loe `needs` tabelit otse – ainult agregeeritud funktsiooni kaudu (k-anonüümsus).
--  * Terviseandmed eraldi tabelis, krüptotekstina (rakendus krüpteerib AES-256-GCM-iga).
--  * Rakenduse poliitika peegel: src/domain/access.ts.

create extension if not exists pgcrypto;

-- ───────── viited ─────────

create table public.regions (
  id text primary key,
  name text not null,
  kind text not null check (kind in ('county', 'municipality')),
  parent_id text references public.regions(id)
);

create table public.partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null check (kind in ('food','shelter','accommodation','therapy','contractor','other')),
  region_ids text[] not null default '{}',
  contact_email text not null
);

create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null default 'household' check (kind in ('household','business')),
  region_id text not null references public.regions(id),
  size int not null check (size between 1 and 500),
  special_needs text[] not null default '{}',   -- ainult mitte-terviseandmed (lapsed, eakad)
  shelter_plan_id uuid
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  role text not null default 'user' check (role in ('user','partner','kov','redcross','admin')),
  region_id text not null references public.regions(id),
  household_id uuid references public.households(id),
  partner_id uuid references public.partners(id),
  locale text not null default 'et' check (locale in ('et','ru','en','uk'))
);

-- ───────── abifunktsioonid (RLS) ─────────

create or replace function public.current_profile() returns public.profiles
  language sql stable security definer set search_path = public as
$$ select * from public.profiles where id = auth.uid() $$;

create or replace function public.my_role() returns text
  language sql stable security definer set search_path = public as
$$ select role from public.profiles where id = auth.uid() $$;

create or replace function public.region_within(region text, scope text) returns boolean
  language sql stable set search_path = public as
$$ select region = scope or exists (select 1 from public.regions r where r.id = region and r.parent_id = scope) $$;

-- ───────── abivajadused ─────────

create table public.needs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  household_id uuid not null references public.households(id),
  region_id text not null references public.regions(id),
  categories text[] not null check (cardinality(categories) > 0),
  urgency text not null check (urgency in ('critical','urgent','normal')),
  household_size int not null check (household_size >= 1),
  special_needs text[] not null default '{}',
  summary text not null check (length(summary) <= 600),
  priority int not null default 0,
  status text not null default 'confirmed' check (status in ('confirmed','routed','in_progress','resolved','emergency')),
  routed_kind text check (routed_kind in ('partner','redcross')),
  routed_partner_id uuid references public.partners(id),
  assigned_operator_id uuid references public.profiles(id),
  has_health_details boolean not null default false,
  accessible_needed boolean not null default false,
  created_at timestamptz not null default now()
);
create index needs_region_idx on public.needs(region_id, created_at);

-- GDPR art 9: eraldi tabel, krüptotekst, nõusoleku aeg kohustuslik.
create table public.health_details (
  need_id uuid primary key references public.needs(id) on delete cascade,
  consent_at timestamptz not null,
  ciphertext text not null
);

-- ───────── kriis ja fond ─────────

create table public.crises (
  id uuid primary key default gen_random_uuid(),
  region_id text not null references public.regions(id),
  title text not null,
  official_source text not null check (length(official_source) >= 5),
  status text not null default 'pending' check (status in ('pending','active','ended')),
  requested_by uuid not null references public.profiles(id),
  approvals uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  activated_at timestamptz,
  ended_at timestamptz
);
create unique index one_open_crisis_per_region on public.crises(region_id) where status <> 'ended';

create table public.fund_ledger (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('donation','kov','state','allocation','return')),
  amount_cents bigint not null,
  crisis_id uuid references public.crises(id),
  note text not null default '',
  actor_id uuid references public.profiles(id),
  at timestamptz not null default now(),
  check ((type in ('donation','kov','state','return') and amount_cents > 0) or (type = 'allocation' and amount_cents <= 0))
);

create table public.crisis_allowances (
  id uuid primary key default gen_random_uuid(),
  crisis_id uuid not null references public.crises(id),
  household_id uuid not null references public.households(id),
  granted_cents bigint not null check (granted_cents >= 0),
  remaining_cents bigint not null check (remaining_cents >= 0 and remaining_cents <= granted_cents),
  allowed_categories text[] not null,
  status text not null default 'active' check (status in ('active','expired')),
  unique (crisis_id, household_id)
);

create table public.personal_reserves (
  household_id uuid primary key references public.households(id),
  balance_cents bigint not null default 0 check (balance_cents >= 0)
);

create table public.app_config (
  key text primary key,
  value jsonb not null
);

-- Prioriteet arvutatakse serveris konfist (app_config.priority) – klient ei saa seda ise määrata.
create or replace function public.compute_priority(p_urgency text, p_region text, p_special text[], p_size int)
returns int language sql stable security definer set search_path = public as $$
  with cfg as (select coalesce((select value from public.app_config where key = 'priority'), '{}'::jsonb) v)
  select (coalesce((v->'urgencyBase'->>p_urgency)::int, 0)
        + case when exists (select 1 from public.crises c where c.status = 'active' and public.region_within(p_region, c.region_id))
               then coalesce((v->>'crisisRegionBonus')::int, 0) else 0 end
        + coalesce((select sum(coalesce((v->'specialNeedWeights'->>sn)::int, 0)) from (select distinct unnest(p_special) sn) x), 0)
        + least(greatest(p_size, 1), coalesce((v->>'householdSizeMaxPersons')::int, 8)) * coalesce((v->>'householdSizeWeightPerPerson')::int, 0)
        )::int
  from cfg
$$;

create or replace function public.needs_before_insert() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.priority := public.compute_priority(new.urgency, new.region_id, new.special_needs, new.household_size);
  new.status := case when new.urgency = 'critical' then 'emergency' else 'confirmed' end;
  new.routed_kind := null; new.routed_partner_id := null; new.assigned_operator_id := null;
  new.created_at := now();
  return new;
end $$;
create trigger needs_before_insert before insert on public.needs
  for each row execute function public.needs_before_insert();

-- ───────── tellimused, varjumine, varud, upgrade ─────────

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id),
  need_id uuid references public.needs(id),
  category text not null,
  description text not null,
  total_cents bigint not null check (total_cents >= 0),
  parts jsonb not null,
  status text not null default 'placed' check (status in ('placed','cancelled')),
  external_ref text,
  created_at timestamptz not null default now()
);

create table public.shelters (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null check (kind in ('public','private','cottage')),
  region_id text not null references public.regions(id),
  address text not null,
  lat double precision not null,
  lng double precision not null,
  capacity int not null check (capacity >= 0),
  heating boolean not null default false,
  water boolean not null default false,
  comms boolean not null default false,
  accessible boolean not null default false,
  contact text not null,
  valid_until date not null,
  partner_id uuid references public.partners(id),
  two_nights_price_cents_per_person int
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  shelter_id uuid not null references public.shelters(id),
  household_id uuid not null references public.households(id),
  people int not null check (people >= 1),
  kind text not null check (kind in ('crisis','two_nights')),
  date_from date not null,
  date_to date,                         -- null = lahtine (kriisibroneering)
  status text not null default 'confirmed' check (status in ('pending_partner','confirmed','cancelled')),
  order_id uuid references public.orders(id),
  created_at timestamptz not null default now(),
  check (date_to is null or date_to > date_from)
);

create table public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id),
  name text not null,
  template_key text,
  quantity numeric not null check (quantity > 0),
  unit text not null,
  expires_at date
);

create table public.upgrade_requests (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id),
  region_id text not null references public.regions(id),
  space_type text not null,
  description text not null,
  dimensions text,
  needs jsonb not null,
  partner_id uuid not null references public.partners(id),
  status text not null default 'sent',
  created_at timestamptz not null default now()
);

create table public.audit_log (
  id bigserial primary key,
  at timestamptz not null default now(),
  actor_id uuid,
  action text not null,
  details jsonb not null default '{}'   -- ainult ID-d, mitte isikuandmeid
);

-- ───────── RLS ─────────

alter table public.regions enable row level security;
alter table public.partners enable row level security;
alter table public.households enable row level security;
alter table public.profiles enable row level security;
alter table public.needs enable row level security;
alter table public.health_details enable row level security;
alter table public.crises enable row level security;
alter table public.fund_ledger enable row level security;
alter table public.crisis_allowances enable row level security;
alter table public.personal_reserves enable row level security;
alter table public.app_config enable row level security;
alter table public.orders enable row level security;
alter table public.shelters enable row level security;
alter table public.bookings enable row level security;
alter table public.inventory_items enable row level security;
alter table public.upgrade_requests enable row level security;
alter table public.audit_log enable row level security;

-- avalikud viited
create policy regions_read on public.regions for select using (true);
create policy partners_read on public.partners for select to authenticated using (true);
create policy shelters_read on public.shelters for select using (true);
create policy crises_read on public.crises for select to authenticated using (true);
create policy config_read on public.app_config for select to authenticated using (true);

-- profiil: enda oma; admin kõik
create policy profiles_self on public.profiles for select to authenticated
  using (id = auth.uid() or public.my_role() = 'admin');

-- leibkond: liikmed
create policy households_member_read on public.households for select to authenticated
  using (id = (public.current_profile()).household_id);
create policy households_member_update on public.households for update to authenticated
  using (id = (public.current_profile()).household_id)
  with check (id = (public.current_profile()).household_id);

-- vajadused: omanik; Punane Rist ainult talle suunatud; partner ainult talle suunatud. KOV-il otsepääs puudub.
create policy needs_owner_read on public.needs for select to authenticated
  using (user_id = auth.uid());
create policy needs_owner_insert on public.needs for insert to authenticated
  with check (user_id = auth.uid() and household_id = (public.current_profile()).household_id);
create policy needs_redcross_read on public.needs for select to authenticated
  using (routed_kind = 'redcross' and public.my_role() = 'redcross');
create policy needs_redcross_update on public.needs for update to authenticated
  using (routed_kind = 'redcross' and public.my_role() = 'redcross')
  with check (routed_kind = 'redcross');
create policy needs_partner_read on public.needs for select to authenticated
  using (routed_kind = 'partner' and public.my_role() = 'partner'
         and routed_partner_id = (public.current_profile()).partner_id);

-- terviseandmed: ainult omanik (sisestus ja lugemine). Partner/PR/KOV ei näe kunagi.
create policy health_owner on public.health_details for all to authenticated
  using (exists (select 1 from public.needs n where n.id = need_id and n.user_id = auth.uid()))
  with check (exists (select 1 from public.needs n where n.id = need_id and n.user_id = auth.uid()));

-- fond ja audit: ainult admin loeb; kirjutamine ainult funktsioonide kaudu
create policy fund_admin_read on public.fund_ledger for select to authenticated using (public.my_role() = 'admin');
create policy audit_admin_read on public.audit_log for select to authenticated using (public.my_role() = 'admin');

-- saldod, reservid, tellimused, varud, upgrade: oma leibkond
create policy allowances_own on public.crisis_allowances for select to authenticated
  using (household_id = (public.current_profile()).household_id or public.my_role() = 'admin');
create policy reserves_own on public.personal_reserves for select to authenticated
  using (household_id = (public.current_profile()).household_id);
create policy orders_own on public.orders for select to authenticated
  using (household_id = (public.current_profile()).household_id);
create policy inventory_own on public.inventory_items for all to authenticated
  using (household_id = (public.current_profile()).household_id)
  with check (household_id = (public.current_profile()).household_id);
create policy upgrade_own on public.upgrade_requests for select to authenticated
  using (household_id = (public.current_profile()).household_id);

-- broneeringud: oma leibkond; partner oma kohtade broneeringuid
create policy bookings_own on public.bookings for select to authenticated
  using (household_id = (public.current_profile()).household_id);
create policy bookings_partner on public.bookings for select to authenticated
  using (public.my_role() = 'partner' and exists (
    select 1 from public.shelters s where s.id = shelter_id and s.partner_id = (public.current_profile()).partner_id));

-- ───────── funktsioonid ─────────

-- KOV / PR / admin: agregeeritud vajadused. KOV-i ulatus sunnitakse tema piirkonnale.
create or replace function public.needs_aggregate(scope text default null)
returns table (region_id text, category text, urgency text, cnt int)
language plpgsql stable security definer set search_path = public as $$
declare
  p public.profiles := public.current_profile();
  min_cell int := coalesce((select (value->>'minCellSize')::int from public.app_config where key = 'needsMap'), 3);
  eff_scope text;
begin
  if p.id is null or p.role not in ('kov','redcross','admin') then
    raise exception 'access denied' using errcode = '42501';
  end if;
  if p.role = 'kov' then
    eff_scope := case when scope is not null and public.region_within(scope, p.region_id) then scope else p.region_id end;
  else
    eff_scope := scope;
  end if;
  return query
    select n.region_id, c.category, n.urgency,
           case when count(*) < min_cell then null else count(*)::int end
    from public.needs n, unnest(n.categories) as c(category)
    where eff_scope is null or public.region_within(n.region_id, eff_scope)
    group by n.region_id, c.category, n.urgency;
end $$;

create or replace function public.audit(action text, details jsonb) returns void
language sql security definer set search_path = public as
$$ insert into public.audit_log(actor_id, action, details) values (auth.uid(), action, details) $$;

create or replace function public.request_crisis(p_region text, p_title text, p_source text)
returns uuid language plpgsql security definer set search_path = public as $$
declare cid uuid;
begin
  if public.my_role() is distinct from 'admin' then raise exception 'access denied' using errcode = '42501'; end if;
  insert into public.crises(region_id, title, official_source, requested_by, approvals)
    values (p_region, p_title, p_source, auth.uid(), array[auth.uid()]) returning id into cid;
  perform public.audit('crisis.requested', jsonb_build_object('crisisId', cid, 'regionId', p_region));
  return cid;
end $$;

-- Teine (erinev) admin kinnitab → aktiveerimine + kriisisaldod reservfondist (proportsionaalne skaleerimine).
create or replace function public.approve_crisis(p_crisis uuid)
returns text language plpgsql security definer set search_path = public as $$
declare
  c public.crises;
  required int := coalesce((select (value->>'requiredApprovals')::int from public.app_config where key = 'crisis'), 2);
  per_h bigint := coalesce((select (value->>'perHouseholdCents')::bigint from public.app_config where key = 'crisis'), 5000);
  per_p bigint := coalesce((select (value->>'perPersonCents')::bigint from public.app_config where key = 'crisis'), 3000);
  cats text[] := coalesce((select array(select jsonb_array_elements_text(value->'allowedCategories')) from public.app_config where key = 'crisis'), array['food','shelter','medical']);
  balance bigint; wanted bigint; scale numeric; total bigint;
begin
  if public.my_role() is distinct from 'admin' then raise exception 'access denied' using errcode = '42501'; end if;
  select * into c from public.crises where id = p_crisis for update;
  if c.id is null or c.status <> 'pending' then raise exception 'crisis not pending'; end if;
  if auth.uid() = any(c.approvals) then raise exception 'same admin cannot approve twice'; end if;
  c.approvals := c.approvals || auth.uid();
  update public.crises set approvals = c.approvals where id = c.id;
  perform public.audit('crisis.approved', jsonb_build_object('crisisId', c.id));
  if cardinality(c.approvals) < required then return 'pending'; end if;

  update public.crises set status = 'active', activated_at = now() where id = c.id;
  perform pg_advisory_xact_lock(hashtext('fund_ledger'));
  select coalesce(sum(amount_cents), 0) into balance from public.fund_ledger;
  select coalesce(sum(per_h + per_p * greatest(size, 1)), 0) into wanted
    from public.households where public.region_within(region_id, c.region_id);
  scale := case when wanted = 0 then 1 else least(1, greatest(balance, 0)::numeric / wanted) end;

  insert into public.crisis_allowances(crisis_id, household_id, granted_cents, remaining_cents, allowed_categories)
    select c.id, h.id, floor((per_h + per_p * greatest(h.size, 1)) * scale), floor((per_h + per_p * greatest(h.size, 1)) * scale), cats
    from public.households h where public.region_within(h.region_id, c.region_id);
  select coalesce(sum(granted_cents), 0) into total from public.crisis_allowances where crisis_id = c.id;
  if total > 0 then
    insert into public.fund_ledger(type, amount_cents, crisis_id, note, actor_id)
      values ('allocation', -total, c.id, 'Kriisisaldod', auth.uid());
  end if;
  perform public.audit('crisis.activated', jsonb_build_object('crisisId', c.id, 'amountCents', total));
  return 'active';
end $$;

-- Kriisi lõpp: saldod aeguvad, jääk naaseb fondi.
create or replace function public.end_crisis(p_crisis uuid)
returns bigint language plpgsql security definer set search_path = public as $$
declare returned bigint;
begin
  if public.my_role() is distinct from 'admin' then raise exception 'access denied' using errcode = '42501'; end if;
  update public.crises set status = 'ended', ended_at = now() where id = p_crisis and status = 'active';
  if not found then raise exception 'crisis not active'; end if;
  select coalesce(sum(remaining_cents), 0) into returned from public.crisis_allowances where crisis_id = p_crisis and status = 'active';
  update public.crisis_allowances set remaining_cents = 0, status = 'expired' where crisis_id = p_crisis and status = 'active';
  if returned > 0 then
    insert into public.fund_ledger(type, amount_cents, crisis_id, note, actor_id)
      values ('return', returned, p_crisis, 'Kasutamata kriisisaldo jääk', auth.uid());
  end if;
  perform public.audit('crisis.ended', jsonb_build_object('crisisId', p_crisis, 'amountCents', returned));
  return returned;
end $$;

-- Makse: kriisisaldo (lubatud kategooria) → isiklik reserv → otsemakse. Tagastab osad JSON-ina.
create or replace function public.pay(p_category text, p_total bigint, p_description text, p_need uuid default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  hh uuid := (public.current_profile()).household_id;
  left_c bigint := p_total; take bigint; parts jsonb := '[]'; a record; r bigint; oid uuid;
begin
  if hh is null then raise exception 'no household'; end if;
  if p_total < 0 then raise exception 'invalid amount'; end if;
  for a in select ca.* from public.crisis_allowances ca join public.crises c on c.id = ca.crisis_id
           where ca.household_id = hh and ca.status = 'active' and c.status = 'active'
             and p_category = any(ca.allowed_categories) and ca.remaining_cents > 0
           order by c.activated_at for update of ca loop
    exit when left_c = 0;
    take := least(left_c, a.remaining_cents);
    update public.crisis_allowances set remaining_cents = remaining_cents - take where id = a.id;
    parts := parts || jsonb_build_object('source', 'crisis_allowance', 'amountCents', take, 'allowanceId', a.id);
    left_c := left_c - take;
  end loop;
  select balance_cents into r from public.personal_reserves where household_id = hh for update;
  if left_c > 0 and coalesce(r, 0) > 0 then
    take := least(left_c, r);
    update public.personal_reserves set balance_cents = balance_cents - take where household_id = hh;
    parts := parts || jsonb_build_object('source', 'personal_reserve', 'amountCents', take);
    left_c := left_c - take;
  end if;
  if left_c > 0 then parts := parts || jsonb_build_object('source', 'direct', 'amountCents', left_c); end if;
  insert into public.orders(household_id, need_id, category, description, total_cents, parts)
    values (hh, p_need, p_category, p_description, p_total, parts) returning id into oid;
  return oid;
end $$;

-- Broneering: lukustab varjumiskoha rea → samaaegsed broneeringud ei saa üle broneerida.
create or replace function public.book_shelter(p_shelter uuid, p_people int, p_kind text, p_from date, p_to date default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  s public.shelters; hh uuid := (public.current_profile()).household_id; peak int; bid uuid;
begin
  if hh is null then raise exception 'no household'; end if;
  if p_people < 1 then raise exception 'invalid people'; end if;
  select * into s from public.shelters where id = p_shelter for update;
  if s.id is null then raise exception 'shelter not found'; end if;
  if s.valid_until < p_from then raise exception 'shelter data expired'; end if;
  if p_kind = 'crisis' and not exists (select 1 from public.crises c where c.status = 'active' and public.region_within(s.region_id, c.region_id)) then
    raise exception 'crisis booking only during active crisis';
  end if;
  select coalesce(max(load), 0) into peak from (
    select d, (select coalesce(sum(b.people), 0) from public.bookings b
               where b.shelter_id = s.id and b.status <> 'cancelled'
                 and b.date_from <= d and d < coalesce(b.date_to, 'infinity'::date)) as load
    from (select p_from as d union
          select b.date_from from public.bookings b
          where b.shelter_id = s.id and b.status <> 'cancelled'
            and b.date_from >= p_from and b.date_from < coalesce(p_to, 'infinity'::date)) pts
  ) x;
  if peak + p_people > s.capacity then
    raise exception 'not enough free places (free: %)', s.capacity - peak using errcode = 'P0001';
  end if;
  insert into public.bookings(shelter_id, household_id, people, kind, date_from, date_to, status)
    values (s.id, hh, p_people, p_kind, p_from, p_to, case when p_kind = 'two_nights' then 'pending_partner' else 'confirmed' end)
    returning id into bid;
  perform public.audit('shelter.booked', jsonb_build_object('bookingId', bid, 'shelterId', s.id, 'count', p_people));
  return bid;
end $$;

-- Rakenduse rollid tohivad funktsioone kutsuda; tabelitesse otse kirjutada ei saa (v.a poliitikad).
revoke all on all tables in schema public from anon;
grant select on public.regions, public.shelters to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage on all sequences in schema public to authenticated;
grant execute on all functions in schema public to authenticated;
