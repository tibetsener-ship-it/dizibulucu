import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const analyticsPath = path.resolve(process.cwd(), '.analytics.json');
    if (!fs.existsSync(analyticsPath)) {
      return NextResponse.json({ trendingMoods: ["karanlık", "bilim kurgu"], trendingGenres: ["drama"], totalSearches: 0 });
    }
    
    const data = JSON.parse(fs.readFileSync(analyticsPath, 'utf8'));
    
    const topMoods = Object.entries(data.topMoods || {})
      .sort((a: any, b: any) => b[1] - a[1])
      .slice(0, 3)
      .map(([name]) => name);

    const topGenres = Object.entries(data.topGenres || {})
      .sort((a: any, b: any) => b[1] - a[1])
      .slice(0, 3)
      .map(([name]) => name);

    return NextResponse.json({
      trendingMoods: topMoods.length > 0 ? topMoods : ["karanlık", "çerezlik"],
      trendingGenres: topGenres.length > 0 ? topGenres : ["drama"],
      totalSearches: data.totalSearches || 0
    });
  } catch (error) {
    return NextResponse.json({ trendingMoods: [], trendingGenres: [], totalSearches: 0 });
  }
}
