import fs from 'fs';
import path from 'path';

// Using a dot file in root directory avoiding hot-reload triggers in src/
const analyticsPath = path.resolve(process.cwd(), '.analytics.json');

export function trackSearch(genre?: string, mood?: string) {
  try {
    let data = { totalSearches: 0, topMoods: {} as Record<string, number>, topGenres: {} as Record<string, number> };
    if (fs.existsSync(analyticsPath)) {
      data = JSON.parse(fs.readFileSync(analyticsPath, 'utf8'));
    }

    data.totalSearches = (data.totalSearches || 0) + 1;

    if (genre) {
      data.topGenres[genre] = (data.topGenres[genre] || 0) + 1;
    }
    
    if (mood) {
      data.topMoods[mood] = (data.topMoods[mood] || 0) + 1;
    }

    fs.writeFileSync(analyticsPath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Analytics tracking failed silently', err);
  }
}
