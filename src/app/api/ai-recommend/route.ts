import { NextResponse } from 'next/server';
import { mockSeries, Series } from '@/lib/data';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

const VALID_TAGS = ['dark', 'light', 'emotional', 'mind-blowing', 'easy-watch', 'thriller', 'mystery', 'action', 'sci-fi'];
const VALID_GENRES = ['action', 'comedy', 'drama', 'crime', 'mystery', 'sci-fi', 'thriller', 'family', 'animation', 'romance', 'horror', 'documentary', 'war'];
const VALID_PLATFORMS = ['netflix', 'amazon', 'disney', 'hbo', 'apple-tv', 'mubi', 'paramount'];

async function analyzePromptWithGroq(prompt: string): Promise<{
  tags: string[];
  genres: string[];
  platforms: string[];
  excludeTags: string[];
  excludeGenres: string[];
  similarTitle: string | null;
}> {
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY bulunamadi');
  }

  const systemPrompt = `Sen bir dizi öneri asistanısın. Kullanıcının isteğini analiz edip JSON formatında döndür.

Geçerli tag değerleri: ${VALID_TAGS.join(', ')}
Geçerli genre değerleri: ${VALID_GENRES.join(', ')}
Geçerli platform değerleri: ${VALID_PLATFORMS.join(', ')}

Kullanıcının isteğini analiz et ve şu JSON formatında döndür (başka hiçbir şey yazma):
{
  "tags": ["istenen ruh hali etiketleri"],
  "genres": ["istenen türler"],
  "platforms": ["istenen platformlar"],
  "excludeTags": ["istenmeyen etiketler"],
  "excludeGenres": ["istenmeyen türler"],
  "similarTitle": "benzer olması istenen dizi adı veya null"
}

Örnekler:
- "Dark gibi ama daha az karışık" -> tags: ["dark", "mystery"], excludeTags: ["mind-blowing"], similarTitle: "Dark"
- "Güldüren ama beyin yormayan" -> tags: ["light", "easy-watch"], genres: ["comedy"]
- "Netflix'te karanlık bir gerilim" -> tags: ["dark", "thriller"], platforms: ["netflix"]
- "Duygusal ağlatan dizi" -> tags: ["emotional"], genres: ["drama"]
- "Çerezlik komedi" -> tags: ["easy-watch", "light"], genres: ["comedy"]`;

  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama3-8b-8192',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 300,
    }),
  });

  if (!response.ok) {
    throw new Error('Groq API hatasi: ' + response.status);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content || '{}';

  try {
    const clean = content.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch {
    return { tags: [], genres: [], platforms: [], excludeTags: [], excludeGenres: [], similarTitle: null };
  }
}

function scoreSeriesForAI(
  series: Series,
  tags: string[],
  genres: string[],
  platforms: string[],
  excludeTags: string[],
  excludeGenres: string[],
  similarSeries: Series | null
): number {
  let score = 0;

  const seriesTags = series.tags || [];
  const seriesGenres = series.genres || [];
  const seriesPlatforms = series.platforms || [];

  // Hariç tutma — ağır ceza
  for (const et of excludeTags) {
    if (seriesTags.some(t => t.toLowerCase().includes(et))) score -= 25;
  }
  for (const eg of excludeGenres) {
    if (seriesGenres.some(g => g.toLowerCase().includes(eg))) score -= 20;
  }

  // Tag eşleşmesi — en yüksek ağırlık
  for (const tag of tags) {
    if (seriesTags.some(t => t.toLowerCase().includes(tag) || tag.includes(t.toLowerCase()))) {
      score += 15;
    }
  }

  // Genre eşleşmesi
  for (const genre of genres) {
    if (seriesGenres.some(g => g.toLowerCase().includes(genre) || genre.includes(g.toLowerCase()))) {
      score += 10;
    }
  }

  // Platform eşleşmesi
  for (const platform of platforms) {
    if (seriesPlatforms.some(p => p.toLowerCase().includes(platform) || platform.includes(p.toLowerCase()))) {
      score += 8;
    }
  }

  // Benzer dizi boost
  if (similarSeries) {
    const simTags = similarSeries.tags || [];
    const simGenres = similarSeries.genres || [];
    for (const t of simTags) {
      if (seriesTags.includes(t)) score += 5;
    }
    for (const g of simGenres) {
      if (seriesGenres.includes(g)) score += 4;
    }
    // Aynı dizi olmasın
    if (series.id === similarSeries.id) score -= 50;
  }

  // Rating boost (6.5-10 arası normalize)
  score += Math.max(0, ((series.rating - 6.5) / 3.5) * 8);

  // Küçük rastgelelik (çeşitlilik için)
  score += Math.random() * 3;

  return score;
}

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    if (!prompt || !prompt.trim()) {
      return NextResponse.json({ error: 'Prompt gerekli' }, { status: 400 });
    }

    // Analytics
    try {
      const { trackSearch } = await import('@/lib/tracker');
      trackSearch('ai-search', 'custom');
    } catch {}

    // Groq ile prompt'u analiz et
    let analysis = { tags: [], genres: [], platforms: [], excludeTags: [], excludeGenres: [], similarTitle: null } as {
      tags: string[];
      genres: string[];
      platforms: string[];
      excludeTags: string[];
      excludeGenres: string[];
      similarTitle: string | null;
    };

    if (GROQ_API_KEY) {
      try {
        analysis = await analyzePromptWithGroq(prompt);
      } catch (err) {
        console.error('Groq hatasi, fallback kullaniliyor:', err);
        // Fallback: basit keyword matching
        const lower = prompt.toLowerCase();
        if (lower.includes('karanlık') || lower.includes('dark')) analysis.tags.push('dark');
        if (lower.includes('komedi') || lower.includes('güldür')) analysis.tags.push('light');
        if (lower.includes('duygusal') || lower.includes('ağlat')) analysis.tags.push('emotional');
        if (lower.includes('gerilim') || lower.includes('thriller')) analysis.tags.push('thriller');
        if (lower.includes('netflix')) analysis.platforms.push('netflix');
      }
    }

    // Benzer dizi varsa bul
    let similarSeries: Series | null = null;
    if (analysis.similarTitle) {
      const title = analysis.similarTitle.toLowerCase();
      similarSeries = mockSeries.find(s => s.title.toLowerCase().includes(title)) || null;
      if (similarSeries && analysis.tags.length === 0) {
        analysis.tags = [...(similarSeries.tags || [])];
        analysis.genres = [...(similarSeries.genres || [])];
      }
    }

    // Skorla ve sırala
    const scored = mockSeries
      .map(series => ({
        ...series,
        score: scoreSeriesForAI(series, analysis.tags, analysis.genres, analysis.platforms, analysis.excludeTags, analysis.excludeGenres, similarSeries)
      }))
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score);

    const results = scored.slice(0, 5);

    return NextResponse.json({
      results,
      parsedTags: analysis.tags,
      parsedGenres: analysis.genres,
      debug: { analysis }
    });

  } catch (error) {
    console.error('AI Recommend Error:', error);
    return NextResponse.json({ error: 'AI servisi hatasi' }, { status: 500 });
  }
}
