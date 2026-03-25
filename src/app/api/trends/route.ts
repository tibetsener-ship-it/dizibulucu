import { NextResponse } from 'next/server';
import { getAnalytics } from '@/lib/tracker';

export const dynamic = 'force-dynamic';

const DEFAULT_MOODS   = ['karanlık', 'çerezlik', 'bilim kurgu'];
const DEFAULT_GENRES  = ['drama', 'aksiyon', 'komedi'];

export async function GET() {
  try {
    const data = getAnalytics();

    const topMoods = Object.entries(data.topMoods)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name]) => name);

    const topGenres = Object.entries(data.topGenres)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name]) => name);

    return NextResponse.json({
      trendingMoods:  topMoods.length  > 0 ? topMoods  : DEFAULT_MOODS,
      trendingGenres: topGenres.length > 0 ? topGenres : DEFAULT_GENRES,
      totalSearches:  data.totalSearches,
    });
  } catch {
    return NextResponse.json({
      trendingMoods:  DEFAULT_MOODS,
      trendingGenres: DEFAULT_GENRES,
      totalSearches:  0,
    });
  }
}
