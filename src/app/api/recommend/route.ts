import { NextResponse } from 'next/server';
import { mockSeries, Series } from '@/lib/data';
import { SCORING_CONFIG } from '@/config/scoring';

function calculateScore(
  series: Series, 
  genre: string | undefined, 
  mood: string | undefined, 
  platform: string | undefined
): number {
  let score = 0;

  const platforms = series.platforms || [];
  const genres = series.genres || [];
  const tags = series.tags || [];

  if (platform && platforms.some(p => p.toLowerCase().includes(platform) || platform.includes(p.toLowerCase()))) {
    score += SCORING_CONFIG.platformWeight;
  }
  if (genre && genres.some(g => g.toLowerCase().includes(genre) || genre.includes(g.toLowerCase()))) {
    score += SCORING_CONFIG.genreWeight;
  }
  if (mood && tags.some(t => t.toLowerCase().includes(mood) || mood.includes(t.toLowerCase()))) {
    score += SCORING_CONFIG.tagWeight;
  }

  score += ((series.rating || 0) * SCORING_CONFIG.ratingWeight);
  score += ((series.popularity || 0) * SCORING_CONFIG.popularityWeight);
  score += Math.random() * SCORING_CONFIG.randomnessWeight;
  return score;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const genre = searchParams.get('genre')?.toLowerCase() || undefined;
    const mood = searchParams.get('mood')?.toLowerCase() || undefined;
    const platform = searchParams.get('platform')?.toLowerCase() || undefined;

    if (genre || mood) {
      const { trackSearch } = await import('@/lib/tracker');
      trackSearch(genre, mood);
    }

    const baseSeries = [...mockSeries];

    if (!baseSeries.length) return NextResponse.json({ results: [] });

    const scoredResults = baseSeries.map(series => ({
      ...series,
      score: calculateScore(series, genre, mood, platform),
    }));

    scoredResults.sort((a, b) => b.score - a.score);
    const topResults = scoredResults.slice(0, 5);

    return NextResponse.json({ results: topResults });
  } catch (error) {
    console.error('Recommendation Engine Error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
