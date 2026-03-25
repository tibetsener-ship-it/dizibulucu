import { NextResponse } from 'next/server';
import { mockSeries, Series } from '@/lib/data';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Fast keyword fallback for when OpenAI is unavailable
const keywordMap: Record<string, string[]> = {
  'komik': ['comedy', 'easy-watch'],
  'gülmek': ['comedy', 'light'],
  'aksiyon': ['action', 'fast-paced'],
  'heyecan': ['action', 'thriller'],
  'korku': ['thriller', 'dark'],
  'gerilim': ['thriller', 'mystery'],
  'duygusal': ['emotional', 'drama'],
  'aşk': ['romance', 'emotional'],
  'ağlamak': ['emotional', 'drama'],
  'karışık': ['mind-blowing', 'mystery', 'sci-fi'],
  'beyin yakan': ['mind-blowing', 'sci-fi'],
  'çerezlik': ['easy-watch', 'comedy'],
  'ciddi': ['dark', 'drama'],
  'dark': ['dark', 'mystery', 'sci-fi'],
  'bilim kurgu': ['sci-fi'],
  'macera': ['action', 'epic'],
  'suç': ['crime', 'thriller'],
  'fantastik': ['fantasy', 'epic'],
  'tarihi': ['historical'],
  'doğaüstü': ['supernatural', 'mystery'],
};

function keywordFallback(prompt: string, allSeries: Series[]): Series[] {
  const lower = prompt.toLowerCase();
  const requestedTags = new Set<string>();

  for (const [keyword, tags] of Object.entries(keywordMap)) {
    if (lower.includes(keyword)) tags.forEach(t => requestedTags.add(t));
  }

  // Reference series title (e.g. "Dark gibi")
  for (const s of allSeries) {
    if (lower.includes(s.title.toLowerCase())) {
      s.tags.forEach(t => requestedTags.add(t));
      s.genres.forEach(g => requestedTags.add(g));
    }
  }

  interface Scored extends Series { score: number }
  const scored: Scored[] = allSeries.map(s => {
    let score = (s.rating - 7) * 0.5 + Math.random() * 2;
    const attrs = [...s.tags, ...s.genres];
    requestedTags.forEach(tag => { if (attrs.includes(tag)) score += 10; });
    return { ...s, score };
  });

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    if (!prompt?.trim()) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Track search
    try {
      const { trackSearch } = await import('@/lib/tracker');
      trackSearch('yapay-zeka', 'özel');
    } catch { /* analytics non-critical */ }

    // ─── Real AI path ────────────────────────────────────────────────────────
    if (OPENAI_API_KEY) {
      // Build a compact catalogue for OpenAI (title + genres + tags only)
      const catalogue = mockSeries.map(s => ({
        id: s.id,
        title: s.title,
        genres: s.genres,
        tags: s.tags,
        rating: s.rating,
      }));

      const systemPrompt = `
You are a smart TV series recommendation engine. 
Given a user's request in Turkish or English, pick the best 5 series IDs from the provided catalogue.

Rules:
- Return ONLY a valid JSON array of exactly 5 series IDs (strings), e.g. ["123","456","789","101","202"]
- Do NOT include any explanation or markdown
- Prioritize relevance, rating quality, and variety
- Understand mood, genre, and references (e.g. "Dark gibi" means similar to the show Dark)

Catalogue (id, title, genres, tags, rating):
${JSON.stringify(catalogue)}
      `.trim();

      const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt },
          ],
          temperature: 0.4,
          max_tokens: 100,
        }),
      });

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        let content = aiData.choices?.[0]?.message?.content?.trim() ?? '';

        // Strip any markdown fences if present
        content = content.replace(/```json|```/g, '').trim();

        try {
          const ids: string[] = JSON.parse(content);
          const seriesMap = new Map(mockSeries.map(s => [s.id, s]));
          const results = ids
            .map(id => seriesMap.get(String(id)))
            .filter(Boolean) as Series[];

          if (results.length > 0) {
            return NextResponse.json({ 
              results, 
              source: 'openai',
              parsedIds: ids 
            });
          }
        } catch {
          // JSON parse failed — fall through to keyword fallback
          console.warn('[ai-recommend] OpenAI response not parseable, falling back');
        }
      } else {
        console.warn('[ai-recommend] OpenAI API error:', aiResponse.status, await aiResponse.text());
      }
    }

    // ─── Keyword fallback (no API key or OpenAI failed) ──────────────────────
    const results = keywordFallback(prompt, mockSeries);
    return NextResponse.json({ results, source: 'keyword-fallback' });

  } catch (error) {
    console.error('[ai-recommend] Unexpected error:', error);
    return NextResponse.json({ error: 'Failed to process prompt' }, { status: 500 });
  }
}
