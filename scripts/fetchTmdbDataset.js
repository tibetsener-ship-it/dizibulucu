const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const API_KEY = process.env.TMDB_API_KEY;

console.log("🛠️ DEBUG: TMDB_API_KEY yüklendi mi?", !!process.env.TMDB_API_KEY);
if (process.env.TMDB_API_KEY) {
  console.log("🛠️ DEBUG: Key formatı ->", process.env.TMDB_API_KEY.substring(0, 5) + "...");
}

const BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';
const TMDB_BACKDROP_BASE = 'https://image.tmdb.org/t/p/original';

if (!process.env.TMDB_API_KEY) {
  throw new Error("TMDB_API_KEY is missing");
}

async function fetchPopular(page = 1) {
  const res = await fetch(`${BASE_URL}/tv/popular?api_key=${API_KEY}&language=tr-TR&page=${page}`);
  return res.json();
}

function mapGenres(genreIds) {
  const map = {
    10759: 'action', 16: 'animation', 35: 'comedy', 80: 'crime', 
    99: 'documentary', 18: 'drama', 10751: 'family', 10762: 'kids', 
    9648: 'mystery', 10763: 'news', 10764: 'reality', 10765: 'sci-fi', 
    10766: 'soap', 10767: 'talk', 10768: 'war & राजनीति', 37: 'western'
  };
  return genreIds.map((id) => map[id]).filter(Boolean);
}

function generateTags(genres, rating) {
  const tags = [];
  if (rating > 8) tags.push("mind-blowing");
  if (genres.includes("drama")) tags.push("emotional");
  if (genres.includes("crime") || genres.includes("thriller") || genres.includes("mystery")) tags.push("dark");
  if (genres.includes("comedy")) tags.push("easy-watch");
  if (genres.includes("action")) tags.push("fast-paced");
  if (genres.includes("mystery")) tags.push("mystery");
  return [...new Set(tags)];
}

async function buildDataset() {
  console.log("🚀 TMDb üzerinden offline veriseti çekiliyor (10 Sayfa)...");
  let all = [];

  for (let i = 1; i <= 10; i++) {
    const data = await fetchPopular(i);
    
    if (!data.results) {
      console.error(`Sayfa ${i} çekilemedi!`);
      continue;
    }

    const mapped = data.results.map((item) => {
      const genres = mapGenres(item.genre_ids || []);
      
      // Rastgele platform ataması (Dizibulucu filtrelemesi için)
      const platformPool = ["netflix", "amazon", "blutv", "disney"];
      const randomPlatforms = platformPool.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 2) + 1);

      return {
        id: item.id.toString(),
        title: item.name || item.original_name,
        description: item.overview || "Bu dizi için henüz Türkçe özet bulunmuyor.",
        posterUrl: item.poster_path ? `${TMDB_IMAGE_BASE}${item.poster_path}` : 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=500&q=80',
        backdropUrl: item.backdrop_path ? `${TMDB_BACKDROP_BASE}${item.backdrop_path}` : 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1920&q=80',
        genres,
        tags: generateTags(genres, item.vote_average),
        platforms: randomPlatforms,
        rating: item.vote_average,
        popularity: Math.round(item.popularity),
        duration: 'long',
        year: item.first_air_date ? parseInt(item.first_air_date.substr(0,4)) : 2023,
      };
    });

    all = [...all, ...mapped];
    console.log(`✅ Sayfa ${i} tamamlandı.`);
  }

  const uniqueMap = new Map();
  all.forEach(s => uniqueMap.set(s.id, s));
  const uniqueSeries = Array.from(uniqueMap.values());

  const outputPath = path.resolve(__dirname, '../src/lib/seriesData.json');
  fs.writeFileSync(outputPath, JSON.stringify(uniqueSeries, null, 2), 'utf-8');
  console.log(`\n🎉 Offline Dataset başarıyla oluşturuldu!`);
  console.log(`📁 Toplam ${uniqueSeries.length} dizi kaydedildi: ${outputPath}`);
}

buildDataset();
