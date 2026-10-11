-- Minimaalne seeme RLS-testideks ja lokaalseks arenduseks (fiktiivsed andmed).
insert into public.regions(id, name, kind, parent_id) values
  ('harju','Harjumaa','county',null), ('valga','Valgamaa','county',null),
  ('tallinn','Tallinn','municipality','harju'), ('viimsi','Viimsi vald','municipality','harju'),
  ('valga-vald','Valga vald','municipality','valga'), ('otepaa','Otepää vald','municipality','valga');

insert into public.app_config(key, value) values
  ('priority', '{"urgencyBase":{"critical":1000,"urgent":100,"normal":10},"crisisRegionBonus":50,
    "specialNeedWeights":{"children":15,"elderly":15,"mobility_impairment":20,"medication_dependency":25,"pregnancy":20},
    "householdSizeWeightPerPerson":3,"householdSizeMaxPersons":8}'),
  ('crisis', '{"requiredApprovals":2,"perHouseholdCents":5000,"perPersonCents":3000,"allowedCategories":["food","shelter","medical"]}'),
  ('needsMap', '{"minCellSize":3}');

insert into public.partners(id, name, kind, region_ids, contact_email) values
  ('20000000-0000-0000-0000-000000000001','Harju Toiduabi MTÜ','food','{harju}','toiduabi@example.ee'),
  ('20000000-0000-0000-0000-000000000002','Otepää Metsamaja','accommodation','{valga}','metsamaja@example.ee');

insert into public.households(id, name, region_id, size, special_needs) values
  ('10000000-0000-0000-0000-000000000001','Tamme pere','tallinn',4,'{children}'),
  ('10000000-0000-0000-0000-000000000002','Kase talu','valga-vald',3,'{}');

insert into auth.users(id) values
  ('00000000-0000-0000-0000-0000000000a1'),('00000000-0000-0000-0000-0000000000a2'),
  ('00000000-0000-0000-0000-0000000000b1'),('00000000-0000-0000-0000-0000000000b2'),
  ('00000000-0000-0000-0000-0000000000c1'),('00000000-0000-0000-0000-0000000000d1'),
  ('00000000-0000-0000-0000-0000000000e1'),('00000000-0000-0000-0000-0000000000e2');

insert into public.profiles(id, display_name, role, region_id, household_id, partner_id) values
  ('00000000-0000-0000-0000-0000000000a1','Mari','user','tallinn','10000000-0000-0000-0000-000000000001',null),
  ('00000000-0000-0000-0000-0000000000a2','Taavi','user','valga-vald','10000000-0000-0000-0000-000000000002',null),
  ('00000000-0000-0000-0000-0000000000b1','Harju KOV','kov','harju',null,null),
  ('00000000-0000-0000-0000-0000000000b2','Valga KOV','kov','valga',null,null),
  ('00000000-0000-0000-0000-0000000000c1','PR operaator','redcross','harju',null,null),
  ('00000000-0000-0000-0000-0000000000d1','Toiduabi','partner','harju',null,'20000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-0000000000e1','Admin Anu','admin','harju',null,null),
  ('00000000-0000-0000-0000-0000000000e2','Admin Peeter','admin','harju',null,null);

insert into public.personal_reserves(household_id, balance_cents) values
  ('10000000-0000-0000-0000-000000000001', 2000), ('10000000-0000-0000-0000-000000000002', 5000);

insert into public.fund_ledger(type, amount_cents, note) values ('state', 2000000, 'Riiklik eraldis (näidis)');

insert into public.shelters(id, name, kind, region_id, address, lat, lng, capacity, heating, water, comms, accessible, contact, valid_until) values
  ('30000000-0000-0000-0000-000000000001','Väike varjend','public','tallinn','Näidise 1',59.43,24.75,5,true,true,true,true,'+372 600 0000','2027-12-31');
