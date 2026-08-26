import { createClient } from '../supabase/client';
import { generateId } from '../generateId';

export async function uploadProductImage(file, folder = 'misc') {
  const supabase = createClient();
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${folder}/${generateId()}.${ext}`;

  const { error } = await supabase.storage
    .from('product-images')
    .upload(path, file, { cacheControl: '3600', upsert: false });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from('product-images').getPublicUrl(path);
  return data.publicUrl;
}
