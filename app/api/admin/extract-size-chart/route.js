import { NextResponse } from 'next/server';
import { requireAdmin, extractFromImage } from '@/lib/admin/extract';
import { STANDARD_SIZE_FIELDS, getSizeGuideTemplate } from '@/lib/taxonomy';

function buildPrompt(allowedFields) {
  return `This is a size chart from a product listing, possibly in Chinese or another language. Read the measurements and convert them into JSON — return ONLY the JSON object, no other text, no markdown fences:

{
  "unit": "cm" or "in" — whichever unit the chart actually uses,
  "fields": [array of measurement column names — see constraint below],
  "rows": [
    { "size": "S", "values": [<numbers in the same order as fields>] },
    { "size": "M", "values": [...] }
  ]
}

IMPORTANT constraint on "fields": every entry MUST be exactly one of this fixed list —
${allowedFields.join(', ')}
— nothing else. Map whatever the chart actually measures onto the closest one of these
standard names (e.g. 腰围→Waist, 臀围→Hip, 裤长→Length, 衣长→Length, 胸围→Chest, 肩宽→Shoulder,
袖长→Sleeve, 大腿围→Thigh, 脚长→Foot Length). Only include a field in "fields" if the chart
actually has a column that maps to it — never invent one, and never use a name outside the
list above even if the chart has an extra column that doesn't fit; just leave that column out.
Read every size row present, in the order shown. If a cell is genuinely unreadable, use null
for that value rather than guessing.`;
}

export async function POST(request) {
  const isAdmin = await requireAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { base64, mediaType, category } = await request.json();
  if (!base64 || !mediaType) {
    return NextResponse.json({ error: 'Missing image data' }, { status: 400 });
  }

  const template = getSizeGuideTemplate(category);
  const allowedFields = template.length ? template : STANDARD_SIZE_FIELDS;
  const prompt = buildPrompt(allowedFields);

  try {
    const extracted = await extractFromImage({ base64, mediaType, prompt });
    return NextResponse.json(extracted);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
