-- ============================================================
-- NPC — patch: fix customer_id foreign keys
-- Only needed if you already ran an earlier version of migration_003
-- before customer_id was targeted at profiles(id). If running
-- migration_003 for the first time, skip this file.
-- ============================================================

alter table orders drop constraint if exists orders_customer_id_fkey;
alter table orders add constraint orders_customer_id_fkey
  foreign key (customer_id) references profiles(id) on delete cascade;

alter table warehouse_items drop constraint if exists warehouse_items_customer_id_fkey;
alter table warehouse_items add constraint warehouse_items_customer_id_fkey
  foreign key (customer_id) references profiles(id) on delete cascade;

alter table shipments drop constraint if exists shipments_customer_id_fkey;
alter table shipments add constraint shipments_customer_id_fkey
  foreign key (customer_id) references profiles(id) on delete cascade;

alter table notifications drop constraint if exists notifications_customer_id_fkey;
alter table notifications add constraint notifications_customer_id_fkey
  foreign key (customer_id) references profiles(id) on delete cascade;
