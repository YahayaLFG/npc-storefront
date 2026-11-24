-- Lock SECURITY DEFINER functions to trusted, schema-qualified objects.
-- This migration is safe to run on databases that already applied
-- migration_003_platform.sql.

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$;

create or replace function public.extend_warehouse_storage(item_id uuid, extra_days int)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if extra_days <= 0 or extra_days > 90 then
    raise exception 'Invalid extension length.';
  end if;

  update public.warehouse_items
  set extended_days = extended_days + extra_days
  where id = item_id and customer_id = auth.uid();

  if not found then
    raise exception 'Item not found or not yours.';
  end if;
end;
$$;

create or replace function public.assign_items_to_shipment(item_ids uuid[], target_shipment_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  shipment_owner uuid;
  assigned_count integer;
begin
  select customer_id into shipment_owner
  from public.shipments
  where id = target_shipment_id;

  if shipment_owner is null or shipment_owner != auth.uid() then
    raise exception 'Shipment not found or not yours.';
  end if;

  update public.warehouse_items
  set shipment_id = target_shipment_id
  where id = any(item_ids)
    and customer_id = auth.uid()
    and shipment_id is null;

  get diagnostics assigned_count = row_count;
  if assigned_count <> coalesce(array_length(item_ids, 1), 0) then
    raise exception 'One or more items are no longer available to ship.';
  end if;
end;
$$;

grant execute on function public.extend_warehouse_storage(uuid, int) to authenticated;
grant execute on function public.assign_items_to_shipment(uuid[], uuid) to authenticated;
