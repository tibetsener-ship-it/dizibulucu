import rawData from './seriesData.json';

export interface Series {
  id: string;
  title: string;
  description: string;
  posterUrl: string;
  backdropUrl: string;
  rating: number;
  popularity: number;
  genres: string[];
  platforms: string[];
  tags: string[];
  duration: 'short' | 'medium' | 'long';
  year: number;
}

// Convert from statically imported offline JSON bypassing live dependencies
export const mockSeries: Series[] = rawData as Series[];
