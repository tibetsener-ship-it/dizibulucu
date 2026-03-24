import { NextResponse } from 'next/server';
import { mockSeries, Series } from '@/lib/data';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'Missing id param' }, { status: 400 });

    const allSeries = [...mockSeries];
    const targetSeries = allSeries.find(s => s.id === id);
    if (!targetSeries) return NextResponse.json({ results: [] });

    // Jaccard similarity logic
    const targetAttributes = new Set([...targetSeries.tags, ...targetSeries.genres].map(a => a.toLowerCase()));

    const scoredResults = allSeries
      .filter(s => s.id !== id)
      .map(series => {
        const compareAttributes = new Set([...series.tags, ...series.genres].map(a => a.toLowerCase()));
        
        let overlapCount = 0;
        compareAttributes.forEach(attr => { if (targetAttributes.has(attr)) overlapCount++; });

        const score = overlapCount + (series.rating * 0.1);
        return { ...series, score };
      });

    scoredResults.sort((a, b) => b.score - a.score);

    return NextResponse.json({ results: scoredResults.slice(0, 5) });
  } catch (error) {
    console.error('Similarity Engine Error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
