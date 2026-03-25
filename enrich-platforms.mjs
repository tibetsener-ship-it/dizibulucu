import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const envPath = path.join(__dirname, '.env.local');
  if (!fs.existsSync(envPath)) { console.error('HATA: .env.local bulunamadi!'); process.exit(1); }
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    process.env[trimmed.substring(0, eqIndex).trim()] = trimmed.substring(eqIndex + 1).trim();
  }
}

loadEnv();

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const OMDB_API_KEY = process.env.OMDB_API_KEY;

if (!TMDB_API_KEY) { console.error('HATA: TMDB_API_KEY yok!'); process.exit(1); }
if (!OMDB_API_KEY) { console.error('HATA: OMDB_API_KEY yok!'); process.exit(1); }

// Türkiye'deki gerçek platform ID -> isim eşleştirmesi
const TR_PROVIDER_MAP = {
  8: 'netflix',
  9: 'amazon',
  337: 'disney',
  384: 'hbo',
  350: 'apple-tv',
  531: 'paramount',
  619: 'mubi',
  // Türkiye yerel platformları
  341: 'blutv', // artık hbo ama bazı içerikler hala burada
};

async function sleep(ms) {
  return new Promise(function(r) { setTimeout(r, ms); });
}

async function fetchJson(url) {
  try {
    const res = await fetch(url, { headers: { accept: 'application/json' } });
    if (res.status === 429) {
      console.log('  Rate limit, 10sn bekleniyor...');
      await sleep(10000);
      return fetchJson(url);
    }
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}

// TMDB'de dizi ara, gerçek TMDB ID'sini bul
async function findTmdbId(title) {
  const url = 'https://api.themoviedb.org/3/search/tv?api_key=' + TMDB_API_KEY + '&query=' + encodeURIComponent(title) + '&language=tr-TR';
  const data = await fetchJson(url);
  if (!data || !data.results || data.results.length === 0) return null;
  return data.results[0].id;
}

// TMDB TR watch providers çek
async function getTRPlatforms(tmdbId) {
  const url = 'https://api.themoviedb.org/3/tv/' + tmdbId + '/watch/providers?api_key=' + TMDB_API_KEY;
  const data = await fetchJson(url);
  if (!data || !data.results || !data.results.TR) return [];

  const tr = data.results.TR;
  const providers = [
    ...(tr.flatrate || []),
    ...(tr.free || []),
  ];

  const platforms = new Set();
  for (const p of providers) {
    const name = TR_PROVIDER_MAP[p.provider_id];
    if (name) platforms.add(name);
  }

  return [...platforms];
}

// OMDB'den IMDb puanı çek
async function getImdbRating(title, year) {
  const url = 'https://www.omdbapi.com/?apikey=' + OMDB_API_KEY + '&t=' + encodeURIComponent(title) + '&type=series' + (year ? '&y=' + year : '');
  const data = await fetchJson(url);
  if (!data || data.Response === 'False') return null;
  if (data.imdbRating && data.imdbRating !== 'N/A') {
    return parseFloat(data.imdbRating);
  }
  return null;
}

async function main() {
  const dataPath = path.join(__dirname, 'src', 'lib', 'seriesData.json');
  const series = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  console.log(series.length + ' dizi isleniyor...\n');

  // Platform listesini güncelle - page.tsx için de not düşelim
  console.log('Platform guncellemesi:');
  console.log('  BluTV -> HBO Max');
  console.log('  Apple TV+ eklendi\n');

  const updated = [];
  let platformFound = 0;
  let imdbFound = 0;

  for (let i = 0; i < series.length; i++) {
    const s = series[i];
    process.stdout.write('[' + (i + 1) + '/' + series.length + '] ' + s.title + ' ... ');

    let platforms = s.platforms || [];
    let rating = s.rating;
    const updates = [];

    // 1. TMDB TR platform verisi
    const tmdbId = await findTmdbId(s.title);
    if (tmdbId) {
      const trPlatforms = await getTRPlatforms(tmdbId);
      if (trPlatforms.length > 0) {
        // BluTV -> HBO düzeltmesi
        const fixed = trPlatforms.map(p => p === 'blutv' ? 'hbo' : p);
        platforms = fixed;
        platformFound++;
        updates.push('platform:' + fixed.join(','));
      }
    }

    // Mevcut platformlarda BluTV varsa HBO yap
    platforms = platforms.map(p => p === 'blutv' ? 'hbo' : p);

    // 2. OMDB IMDb puanı
    const imdbRating = await getImdbRating(s.title, s.year);
    if (imdbRating) {
      rating = imdbRating;
      imdbFound++;
      updates.push('imdb:' + imdbRating);
    }

    updated.push(Object.assign({}, s, {
      platforms: platforms.length > 0 ? platforms : s.platforms || ['netflix'],
      rating: rating,
    }));

    console.log(updates.length > 0 ? updates.join(' | ') : 'degisiklik yok');

    // Her 5 istekte bekle (OMDB rate limit)
    if ((i + 1) % 5 === 0) await sleep(1000);
  }

  // Yedek al
  const backupPath = dataPath.replace('.json', '.enrich2-backup.json');
  fs.copyFileSync(dataPath, backupPath);

  fs.writeFileSync(dataPath, JSON.stringify(updated, null, 2), 'utf8');

  console.log('\n=============================');
  console.log('Tamamlandi!');
  console.log('Platform guncellenen: ' + platformFound + ' dizi');
  console.log('IMDb puani eklenen:   ' + imdbFound + ' dizi');
  console.log('=============================\n');
  console.log('NOT: page.tsx icindeki platform listesini de guncellemeyi unutma!');
  console.log('BluTV -> HBO Max, Apple TV+ ekle');
}

main().catch(function(err) {
  console.error('Hata:', err);
  process.exit(1);
});
