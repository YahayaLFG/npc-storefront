import { NextResponse } from 'next/server';
import { requireAdmin, extractFromImage } from '@/lib/admin/extract';
import { getRecentProductsForStyle } from '@/lib/admin/products';

async function buildPrompt() {
  const recent = await getRecentProductsForStyle(6);
  const styleNotes = recent.length
    ? `For reference, here is the brand's naming/description style from recent products:\n${recent
        .map((p) => `- ${p.name}: ${p.description}`)
        .join('\n')}`
    : '';

  return `This is a screenshot of a product listing (likely Womata, a 1688/Taobao sourcing agent site), possibly in Chinese. Extract what you can and return ONLY a JSON object, no other text, no markdown fences:

{
  "supplierTitle": "the original listing title, verbatim",
  "supplierUrl": "the URL shown in the listing, if visible, else empty string",
  "suggestedName": "a short premium product name in NPC's minimal brand voice",
  "shortDescription": "one clean sentence describing the piece",
  "longDescription": "2-3 sentences of premium product copy",
  "suggestedCollection": "Men, Women, or Accessories - your best guess",
  "suggestedCategory": "your best guess at category (Shirts, Jackets, Denim, Pants, Shorts, Hoodies, Outerwear, Jerseys, Shoes, Bags, Jewelry)",
  "priceCny": <number, if the listing shows a CNY/RMB price, else null>,
  "priceNgn": <number, if the listing already shows a Naira price instead, else null>,
  "sizes": [array of size labels shown],
  "colors": [array of color names shown, translated to English],
  "estimatedWeightKg": <your best estimate based on the item type, or null>
}

${styleNotes}

Never invent a price — only fill in priceCny or priceNgn if a number is actually visible in the screenshot.`;
}

export async function POST(request) {
  const isAdmin = await requireAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { base64, mediaType } = await request.json();
  if (!base64 || !mediaType) {
    return NextResponse.json({ error: 'Missing image data' }, { status: 400 });
  }

  try {
    const prompt = await buildPrompt();
    const extracted = await extractFromImage({ base64, mediaType, prompt });
    return NextResponse.json(extracted);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
