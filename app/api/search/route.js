import { NextResponse } from 'next/server';
import { searchProducts } from '@/lib/products';

export async function GET(request) {
  const query = request.nextUrl.searchParams.get('q') || '';
  const results = await searchProducts(query);
  return NextResponse.json({ results });
}
