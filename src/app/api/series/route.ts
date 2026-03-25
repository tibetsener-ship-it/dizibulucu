import { NextResponse } from 'next/server';
import { mockSeries } from '@/lib/data';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const idsParam = searchParams.get('ids');

  if (!idsParam) {
    return NextResponse.json({ results: [] });
  }

  const ids = idsParam.split(',').filter(Boolean);

  // Önce mockSeries'den bak
  const localResults = ids
    .map(id => mockSeries.find(s => s.id === id))
    .filter(Boolean);

  if (localResults.length > 0) {
    return NextResponse.json({ results: localResults });
  }

  // mockSeries'de bulunamazsa TMDB'den dene
  const { getMultipleSeries } = await import('@/lib/tmdb');
  const tmdbResults = await getMultipleSeries(ids);
  tmdbResults.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));

  return NextResponse.json({ results: tmdbResults });
}
