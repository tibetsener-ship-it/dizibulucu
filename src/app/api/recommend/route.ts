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
  if (platform && series.platforms.some(p => p.toLowerCase().includes(platform) || platform.includes(p.toLowerCase()))) {
    score += SCORING_CONFIG.platformWeight;
  }
  if (genre && series.genres.some(g => g.toLowerCase().includes(genre) || genre.includes(g.toLowerCase()))) {
    score += SCORING_CONFIG.genreWeight;
  }
  if (mood && series.tags.some(t => t.toLowerCase().includes(mood) || mood.includes(t.toLowerCase()))) {
    score += SCORING_CONFIG.tagWeight;
  }
  score += (series.rating * SCORING_CONFIG.ratingWeight);
  score += (series.popularity * SCORING_CONFIG.popularityWeight);
  score += Math.random() * SCORING_CONFIG.randomnessWeight;
  return score;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const genre = searchParams.get('genre')?.toLowerCase() || undefined;
    const mood = searchParams.get('mood')?.toLowerCase() || undefined;
    const platform = searchParams.get('platform')?.toLowerCase() || undefined;

    // Track standard searches for community trend analysis
    if (genre || mood) {
      const { trackSearch } = await import('@/lib/tracker');
      trackSearch(genre, mood);
    }

    // Sourced purely from the hyper-fast offline dataset
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
