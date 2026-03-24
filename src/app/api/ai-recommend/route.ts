import { NextResponse } from 'next/server';
import { mockSeries, Series } from '@/lib/data';

// Simple heuristic NLP keyword maps
const keywordMap: Record<string, string[]> = {
  'komik': ['comedy', 'light', 'easy-watch'],
  'gülmek': ['comedy', 'light'],
  'aksiyon': ['action', 'fast-paced'],
  'heyecan': ['action', 'fast-paced', 'thriller'],
  'korku': ['thriller', 'dark', 'mystery'],
  'gerilim': ['thriller', 'mystery'],
  'duygusal': ['emotional', 'drama', 'romance'],
  'aşk': ['romance', 'emotional'],
  'ağlamak': ['emotional', 'drama'],
  'karışık': ['mind-blowing', 'mystery', 'sci-fi'],
  'beyin yakan': ['mind-blowing', 'sci-fi'],
  'çerezlik': ['easy-watch', 'light', 'comedy'],
  'ciddi': ['dark', 'drama', 'politics'],
  'dark': ['dark', 'mystery', 'sci-fi', 'mind-blowing'], // Overlaps with the series 'Dark'
  'bilim kurgu': ['sci-fi', 'tech', 'space'],
};

const negations = ['az', 'olmasın', 'değil', 'olmasin', 'degil', 'istemiyorum', 'haric', 'hariç'];

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Track AI searches using the prompt as a generalized intent 
    const { trackSearch } = await import('@/lib/tracker');
    trackSearch("yapay-zeka", "özel");

    const lowerPrompt = prompt.toLowerCase();
    
    let requestedTags = new Set<string>();
    let excludedTags = new Set<string>();

    // 1. Basic Tokenization & Keyword Extraction
    Object.entries(keywordMap).forEach(([keyword, tags]) => {
      // Check if keyword exists in prompt
      if (lowerPrompt.includes(keyword)) {
        // Is it negated? Check preceding words
        const words = lowerPrompt.split(' ');
        const index = words.findIndex((w: string) => w.includes(keyword) || keyword.includes(w));
        
        let isNegated = false;
        if (index > 0) {
          const prevWord = words[index - 1];
          if (negations.some(n => prevWord === n || words.slice(Math.max(0, index-2), index+1).join(' ').includes(n))) {
            isNegated = true;
          }
        }

        tags.forEach(t => {
          if (isNegated) excludedTags.add(t);
          else requestedTags.add(t);
        });
      }
    });

    // Extract exact series name mentions (e.g. "Dark gibi")
    let targetSeries: Series | null = null;
    for (const s of mockSeries) {
      if (lowerPrompt.includes(s.title.toLowerCase())) {
        targetSeries = s;
        // Add its tags to our requested tags
        s.tags.forEach(t => requestedTags.add(t));
        s.genres.forEach(g => requestedTags.add(g));
        break;
      }
    }

    // 2. Score Series
    interface ScoredSeries extends Series { score: number; }
    
    let scoredResults: ScoredSeries[] = mockSeries.map(series => {
      let score = 0;
      // Skip exact target if they said "like Dark", don't recommend Dark itself as #1 ideally, or give it lower score.
      // Actually, if they asked for 'Dark', it should probably appear. We will let it appear.

      const allSeriesAttributes = [
        ...series.tags,
        ...series.genres,
        ...series.platforms,
        series.title.toLowerCase()
      ];

      // requested logic
      requestedTags.forEach(tag => {
        if (allSeriesAttributes.includes(tag)) {
          score += 10;
        }
      });

      // excluded logic
      excludedTags.forEach(tag => {
        if (allSeriesAttributes.includes(tag)) {
          score -= 20; // Heavy penalty
        }
      });

      // Rating boost
      score += Math.max(0, ((series.rating - 7) / 3) * 2);

      // Inject random noise to shuffle identical or close queries
      score += Math.random() * 3;

      return { ...series, score };
    });

    // Filter out items with very negative scores if they match exclusions heavily
    scoredResults = scoredResults.filter(s => s.score > 0 || (requestedTags.size === 0 && s.score >= 0));
    scoredResults.sort((a, b) => b.score - a.score);

    // Provide the top 5
    const topResults = scoredResults.slice(0, 5);

    return NextResponse.json({ results: topResults, parsedTags: Array.from(requestedTags) });

  } catch (error) {
    console.error('AI Recommend Error:', error);
    return NextResponse.json({ error: 'Failed to process prompt' }, { status: 500 });
  }
}
