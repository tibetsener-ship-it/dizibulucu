import { mockSeries, Series } from './data';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';
const TMDB_BACKDROP_BASE = 'https://image.tmdb.org/t/p/original';

// Local cache for mapping TMDb genre IDs to string names
const genreMap: Record<number, string> = {
  10759: 'action', // Action & Adventure
  16: 'animation',
  35: 'comedy',
  80: 'crime',
  99: 'documentary',
  18: 'drama',
  10751: 'family',
  10762: 'kids',
  9648: 'mystery',
  10763: 'news',
  10764: 'reality',
  10765: 'sci-fi', // Sci-Fi & Fantasy
  10766: 'soap',
  10767: 'talk',
  10768: 'war & politics',
  37: 'western',
};

/**
 * Standardize fetch options for TMDb API with caching
 */
export const genreIdMap: Record<string, number> = {
  'action': 10759,
  'animation': 16,
  'comedy': 35,
  'crime': 80,
  'documentary': 99,
  'drama': 18,
  'family': 10751,
  'kids': 10762,
  'mystery': 9648,
  'news': 10763,
  'reality': 10764,
  'sci-fi': 10765,
  'soap': 10766,
  'talk': 10767,
  'war & politics': 10768,
  'western': 37,
};

const fetchOptions = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    ...(TMDB_API_KEY && { Authorization: `Bearer ${TMDB_API_KEY}` })
  },
  next: { revalidate: 3600 } // Cache for 1 hour
};

/**
 * Maps a raw TMDb TV object to our internal Series interface
 */
function mapTmdbToSeries(item: any): Series {
  return {
    id: item.id.toString(),
    title: item.name || item.original_name,
    description: item.overview || 'No description available.',
    posterUrl: item.poster_path ? `${TMDB_IMAGE_BASE}${item.poster_path}` : 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=500&q=80',
    backdropUrl: item.backdrop_path ? `${TMDB_BACKDROP_BASE}${item.backdrop_path}` : 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1920&q=80',
    rating: item.vote_average || 0,
    popularity: item.popularity || 0,
    genres: (item.genre_ids || []).map((id: number) => genreMap[id] || 'unknown').filter((g: string) => g !== 'unknown'),
    platforms: ['netflix', 'amazon'], // In a real app, we would query the `/tv/{id}/watch/providers` endpoint via a separate call or aggregation
    tags: [], // Tags/Moods require keyword parsing
    duration: 'long', 
    year: item.first_air_date ? parseInt(item.first_air_date.substring(0,4)) : new Date().getFullYear(),
  };
}

/**
 * Core fetch wrapper with error handling and fallback
 */
async function tmdbFetch(endpoint: string, queryParams: Record<string, string> = {}): Promise<Series[]> {
  if (!TMDB_API_KEY) {
    console.warn("TMDB_API_KEY not found. Using fallback mock data.");
    return [...mockSeries];
  }

  try {
    const params = new URLSearchParams(queryParams);
    const url = `${TMDB_BASE_URL}${endpoint}?${params.toString()}`;
    
    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
      throw new Error(`TMDb API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.results) return [];

    return data.results.map(mapTmdbToSeries);
  } catch (error) {
    console.error("TMDb Fetch failed:", error);
    // Graceful fallback
    return [...mockSeries];
  }
}

/**
 * 1. Get Popular Series
 */
export async function getPopularSeries(): Promise<Series[]> {
  return tmdbFetch('/tv/popular', { language: 'tr-TR', page: '1' });
}

/**
 * 2. Get Series by Genre
 * Uses TMDb discover endpoint
 */
export async function getSeriesByGenre(genreId: string): Promise<Series[]> {
  return tmdbFetch('/discover/tv', { 
    language: 'tr-TR', 
    sort_by: 'popularity.desc', 
    with_genres: genreId,
    page: '1'
  });
}

/**
 * 3. Search Series by text query
 */
export async function searchSeries(query: string): Promise<Series[]> {
  return tmdbFetch('/search/tv', { 
    language: 'tr-TR', 
    query: query,
    page: '1' 
  });
}

/**
 * 4. Get Similar Series (Bonus for integration)
 */
export async function getSimilarSeries(id: string): Promise<Series[]> {
  if (!TMDB_API_KEY) {
    return [...mockSeries].filter(s => s.id !== id).sort(() => 0.5 - Math.random()).slice(0, 5); 
  }
  return tmdbFetch(`/tv/${id}/similar`, { language: 'tr-TR', page: '1' });
}

/**
 * 5. Get Multiple Series by IDs (For Shared Links)
 */
export async function getMultipleSeries(ids: string[]): Promise<Series[]> {
  if (!TMDB_API_KEY) {
    return mockSeries.filter(s => ids.includes(s.id));
  }

  // Fetch all requested series individually in parallel
  const promises = ids.map(async (id) => {
    try {
      const url = `${TMDB_BASE_URL}/tv/${id}?language=tr-TR`;
      const response = await fetch(url, fetchOptions);
      if (!response.ok) return null;
      const data = await response.json();
      return mapTmdbToSeries(data);
    } catch {
      return null;
    }
  });

  const results = await Promise.all(promises);
  return results.filter(Boolean) as Series[];
}
