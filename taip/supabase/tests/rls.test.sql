-- RLS ja tehinguliste funktsioonide testid. Käivita: npm run test:rls
\set ON_ERROR_STOP 1
\set QUIET 1

create schema tests;
grant usage on schema tests to authenticated;
create function tests.ok(cond boolean, msg text) returns void language plpgsql as $$
begin
  if cond is distinct from true then raise exception 'FAIL: %', msg; end if;
  raise notice 'ok - %', msg;
end $$;
grant execute on function tests.ok(boolean, text) to authenticated;

-- Kasutaja vahetamine: määrab JWT sub-i ja rolli authenticated.
create function tests.login(uid uuid) returns void language sql as
$$ select set_config('request.jwt.claim.sub', uid::text, false) $$;
grant execute on function tests.login(uuid) to authenticated;

\set mari '''00000000-0000-0000-0000-0000000000a1'''
\set taavi '''00000000-0000-0000-0000-0000000000a2'''
\set kov_harju '''00000000-0000-0000-0000-0000000000b1'''
\set kov_valga '''00000000-0000-0000-0000-0000000000b2'''
\set pr '''00000000-0000-0000-0000-0000000000c1'''
\set partner '''00000000-0000-0000-0000-0000000000d1'''
\set admin1 '''00000000-0000-0000-0000-0000000000e1'''
\set admin2 '''00000000-0000-0000-0000-0000000000e2'''

-- Andmed kaardi jaoks (superkasutajana, trigger arvutab prioriteedi)
insert into public.needs(user_id, household_id, region_id, categories, urgency, household_size, summary)
select '00000000-0000-0000-0000-0000000000a2', '10000000-0000-0000-0000-000000000002', 'valga-vald', '{heating}', 'urgent', 3, 'x'
from generate_series(1, 3);

---------------------------------------------------------------- 1. vajadus ja prioriteet
set role authenticated;
select tests.login(:mari);
insert into public.needs(user_id, household_id, region_id, categories, urgency, household_size, special_needs, summary, priority, routed_kind, status)
values (:mari, '10000000-0000-0000-0000-000000000001', 'tallinn', '{food}', 'urgent', 4, '{children}', 'Toit otsas', 99999, 'redcross', 'resolved');
select tests.ok((select priority from public.needs where user_id = :mari) = 100 + 15 + 4*3, 'prioriteet arvutatakse serveris konfist (klient ei saa seda võltsida)');
select tests.ok((select routed_kind is null and status = 'confirmed' from public.needs where user_id = :mari), 'klient ei saa ise suunamist/staatust määrata');
select tests.ok((select count(*) from public.needs) = 1, 'kasutaja näeb ainult oma päringuid');

do $$ begin
  insert into public.needs(user_id, household_id, region_id, categories, urgency, household_size, summary)
  values ('00000000-0000-0000-0000-0000000000a2', '10000000-0000-0000-0000-000000000002', 'tallinn', '{food}', 'normal', 1, 'võltsing');
  raise exception 'FAIL: teise kasutaja nimel sisestamine õnnestus';
exception when insufficient_privilege then raise notice 'ok - teise kasutaja nimel päringut luua ei saa';
end $$;

insert into public.health_details(need_id, consent_at, ciphertext)
  select id, now(), 'krüptotekst' from public.needs where user_id = :mari;

select tests.login(:taavi);
select tests.ok((select count(*) from public.needs where user_id = :mari) = 0, 'teine kasutaja ei näe Mari päringut');

---------------------------------------------------------------- 2. KOV: ainult agregaadid, ainult oma piirkond
select tests.login(:kov_harju);
select tests.ok((select count(*) from public.needs) = 0, 'KOV ei loe needs tabelit otse');
select tests.ok((select count(*) from public.health_details) = 0, 'KOV ei näe terviseandmeid');
select tests.ok((select bool_and(public.region_within(region_id, 'harju')) from public.needs_aggregate()), 'Harju KOV agregaadis ainult Harjumaa');
select tests.ok((select count(*) from public.needs_aggregate() where cnt is not null) = 0, 'alla k-läve lahtrid on peidetud (1 päring Tallinnas)');

select tests.login(:kov_valga);
select tests.ok((select count(*) from public.needs_aggregate('harju')) > 0 and (select bool_and(public.region_within(region_id, 'valga')) from public.needs_aggregate('harju')), 'Valga KOV ei saa Harjumaa ulatust küsida (sunnitakse Valgamaale)');
select tests.ok((select cnt from public.needs_aggregate() where category = 'heating') = 3, 'Valga KOV näeb oma piirkonna agregaati');

select tests.login(:mari);
do $$ begin
  perform public.needs_aggregate();
  raise exception 'FAIL: tavakasutaja sai agregaadi';
exception when insufficient_privilege then raise notice 'ok - tavakasutaja ei saa agregaati';
end $$;

---------------------------------------------------------------- 3. partner ja Punane Rist
reset role;
update public.needs set routed_kind = 'partner', routed_partner_id = '20000000-0000-0000-0000-000000000001', status = 'routed' where user_id = :mari;
set role authenticated;
select tests.login(:partner);
select tests.ok((select count(*) from public.needs) = 1, 'partner näeb talle suunatud päringut');
select tests.ok((select count(*) from public.health_details) = 0, 'partner ei näe terviseandmeid');
select tests.login(:pr);
select tests.ok((select count(*) from public.needs) = 0, 'Punane Rist ei näe partnerile suunatud päringut');
reset role;
update public.needs set routed_kind = 'redcross', routed_partner_id = null where user_id = :mari;
set role authenticated;
select tests.login(:pr);
select tests.ok((select count(*) from public.needs) = 1, 'Punane Rist näeb talle suunatud päringut');
update public.needs set status = 'in_progress', assigned_operator_id = :pr where user_id = :mari;
select tests.ok((select status from public.needs where user_id = :mari) = 'in_progress', 'operaator saab päringu töösse võtta');
select tests.login(:partner);
select tests.ok((select count(*) from public.needs) = 0, 'partner ei näe enam Punasele Ristile suunatud päringut');

---------------------------------------------------------------- 4. fond ja kriis
select tests.login(:mari);
select tests.ok((select count(*) from public.fund_ledger) = 0, 'tavakasutaja ei näe fondi pearaamatut');
do $$ begin
  insert into public.fund_ledger(type, amount_cents) values ('donation', 1);
  raise exception 'FAIL: kasutaja kirjutas fondi';
exception when insufficient_privilege then raise notice 'ok - fondi otse kirjutada ei saa';
end $$;
do $$ begin
  perform public.request_crisis('harju', 'Torm', 'VV korraldus nr 1');
  raise exception 'FAIL: tavakasutaja algatas kriisi';
exception when insufficient_privilege then raise notice 'ok - tavakasutaja ei saa kriisi algatada';
end $$;
do $$ begin
  insert into public.crises(region_id, title, official_source, requested_by) values ('harju','x','xxxxxx','00000000-0000-0000-0000-0000000000a1');
  raise exception 'FAIL: crises otse sisestatud';
exception when insufficient_privilege then raise notice 'ok - kriise otse sisestada ei saa';
end $$;

select tests.login(:admin1);
create temp table t_crisis as select public.request_crisis('harju', 'Torm', 'Vabariigi Valitsuse korraldus nr 1 (test)') as id;
do $$ begin
  perform public.approve_crisis((select id from t_crisis));
  raise exception 'FAIL: sama admin kinnitas kaks korda';
exception when raise_exception then
  if sqlerrm like 'FAIL%' then raise; end if;
  raise notice 'ok - sama admin ei saa kaks korda kinnitada';
end $$;
select tests.ok((select status from public.crises) = 'pending', 'kriis ootab teist kinnitust');
select tests.login(:admin2);
select tests.ok(public.approve_crisis((select id from t_crisis)) = 'active', 'teine admin aktiveerib kriisi');
select tests.ok((select sum(amount_cents) from public.fund_ledger) = 2000000 - (5000 + 4*3000), 'eraldis kajastub fondi pearaamatus');

select tests.login(:mari);
select tests.ok((select remaining_cents from public.crisis_allowances) = 5000 + 4*3000, 'Harjumaa leibkond sai kriisisaldo');
select tests.login(:taavi);
select tests.ok((select count(*) from public.crisis_allowances) = 0, 'Valgamaa leibkond kriisisaldot ei saanud');

---------------------------------------------------------------- 5. maksete järjekord
select tests.login(:mari);
create temp table t_o1 as select public.pay('accommodation', 3000, 'majutus') as id;
select tests.ok((select parts = '[{"source":"personal_reserve","amountCents":2000},{"source":"direct","amountCents":1000}]'::jsonb from public.orders where id = (select id from t_o1)),
  'kriisisaldoga ei saa maksta väljaspool lubatud kategooriaid (reserv → otsemakse)');
create temp table t_o2 as select public.pay('food', 20000, 'toit') as id;
select tests.ok((select parts = ('[{"source":"crisis_allowance","amountCents":17000,"allowanceId":"' || (select id from public.crisis_allowances) || '"},{"source":"direct","amountCents":3000}]')::jsonb from public.orders where id = (select id from t_o2)),
  'järjekord: kriisisaldo → (reserv tühi) → otsemakse');
create temp table t_o3 as select public.pay('food', 100, 'toit') as id;

---------------------------------------------------------------- 6. broneering, ülebroneerimine
select tests.login(:mari);
select public.book_shelter('30000000-0000-0000-0000-000000000001', 4, 'crisis', current_date);
select tests.login(:taavi);
do $$ begin
  perform public.book_shelter('30000000-0000-0000-0000-000000000001', 2, 'crisis', current_date);
  raise exception 'FAIL: ülebroneerimine õnnestus';
exception when raise_exception then
  if sqlerrm like 'FAIL%' then raise; end if;
  raise notice 'ok - ülebroneerida ei saa (%)', sqlerrm;
end $$;
select public.book_shelter('30000000-0000-0000-0000-000000000001', 1, 'crisis', current_date);
select tests.ok((select count(*) from public.bookings) = 1, 'kasutaja näeb ainult oma broneeringuid');

---------------------------------------------------------------- 7. kriisi lõpp
select tests.login(:admin1);
select tests.ok(public.end_crisis((select id from t_crisis)) = 0, 'kogu saldo oli kulutatud → jääk 0');
reset role;
-- Kontrollime ka jäägi tagastust: uus kriis Valgamaal, ilma kulutamiseta
set role authenticated;
select tests.login(:admin1);
create temp table t_c2 as select public.request_crisis('valga', 'Üleujutus', 'Valga Vallavalitsuse korraldus (test)') as id;
select tests.login(:admin2);
select public.approve_crisis((select id from t_c2));
create temp table t_bal as select sum(amount_cents) as b from public.fund_ledger;
select tests.login(:taavi);
select public.pay('food', 1000, 'toit');
select tests.login(:admin1);
select tests.ok(public.end_crisis((select id from t_c2)) = 5000 + 3*3000 - 1000, 'kriisi lõpus naaseb kasutamata jääk fondi');
select tests.ok((select sum(amount_cents) from public.fund_ledger) = (select b from t_bal) + 5000 + 3*3000 - 1000, 'fondi saldo sisaldab tagastust');
select tests.ok((select bool_and(status = 'expired' and remaining_cents = 0) from public.crisis_allowances), 'saldod aegusid');
select tests.login(:taavi);
create temp table t_o4 as select public.pay('food', 500, 'toit pärast kriisi') as id;
select tests.ok((select not (parts @> '[{"source":"crisis_allowance"}]') from public.orders where id = (select id from t_o4)), 'aegunud saldoga maksta ei saa');

---------------------------------------------------------------- 8. varud
select tests.login(:mari);
insert into public.inventory_items(household_id, name, quantity, unit) values ('10000000-0000-0000-0000-000000000001', 'Vesi', 10, 'l');
do $$ begin
  insert into public.inventory_items(household_id, name, quantity, unit) values ('10000000-0000-0000-0000-000000000002', 'Võõras', 1, 'tk');
  raise exception 'FAIL: võõrale leibkonnale varude lisamine õnnestus';
exception when insufficient_privilege then raise notice 'ok - võõrale leibkonnale varusid lisada ei saa';
end $$;
select tests.login(:taavi);
select tests.ok((select count(*) from public.inventory_items) = 0, 'teise leibkonna varusid ei näe');

reset role;
\echo 'KÕIK RLS-TESTID LÄBITUD'
