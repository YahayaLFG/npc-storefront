'use server';

import { createClient } from '../supabase/server';
import { revalidatePath } from 'next/cache';

export async function getMyAddresses() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('shipping_addresses')
    .select('*')
    .eq('user_id', user.id)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('getMyAddresses error:', error.message);
    return [];
  }
  return data;
}

/** Creates a new address, or updates one the caller already owns (id present). */
export async function saveAddress(formValues) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'not_authenticated' };

  const row = {
    user_id: user.id,
    full_name: formValues.fullName?.trim(),
    phone: formValues.phone?.trim(),
    address_line_1: formValues.addressLine1?.trim(),
    address_line_2: formValues.addressLine2?.trim() || '',
    state: formValues.state?.trim(),
    city: formValues.city?.trim(),
    area: formValues.area?.trim() || '',
    postal_code: formValues.postalCode?.trim() || '',
    country: formValues.country?.trim() || 'Nigeria',
    is_default: !!formValues.isDefault,
  };

  if (!row.full_name || !row.phone || !row.address_line_1 || !row.state || !row.city) {
    return { error: 'Full name, phone, address, city, and state are all required.' };
  }

  // If this one is being set as default, clear the flag on the customer's
  // other addresses first — only one default at a time.
  if (row.is_default) {
    await supabase.from('shipping_addresses').update({ is_default: false }).eq('user_id', user.id);
  }

  const query = formValues.id
    ? supabase.from('shipping_addresses').update(row).eq('id', formValues.id).eq('user_id', user.id).select().maybeSingle()
    : supabase.from('shipping_addresses').insert(row).select().maybeSingle();

  const { data, error } = await query;
  if (error) return { error: error.message };

  revalidatePath('/account/addresses');
  revalidatePath('/checkout');
  return { address: data };
}

export async function deleteAddress(id) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'not_authenticated' };

  const { error } = await supabase.from('shipping_addresses').delete().eq('id', id).eq('user_id', user.id);
  if (error) return { error: error.message };

  revalidatePath('/account/addresses');
  revalidatePath('/checkout');
  return { success: true };
}

export async function setDefaultAddress(id) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'not_authenticated' };

  await supabase.from('shipping_addresses').update({ is_default: false }).eq('user_id', user.id);
  const { error } = await supabase
    .from('shipping_addresses')
    .update({ is_default: true })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return { error: error.message };

  revalidatePath('/account/addresses');
  revalidatePath('/checkout');
  return { success: true };
}
