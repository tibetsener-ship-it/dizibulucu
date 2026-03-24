import { NextResponse } from 'next/server';
import { getMultipleSeries } from '@/lib/tmdb';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const idsParam = searchParams.get('ids');

  if (!idsParam) {
    return NextResponse.json({ results: [] });
  }

  const ids = idsParam.split(',').filter(Boolean);
  const results = await getMultipleSeries(ids);

  // Preserve the order of the original ids
  results.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));

  return NextResponse.json({ results });
}
