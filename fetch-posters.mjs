import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const envPath = path.join(__dirname, '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('HATA: .env.local dosyasi bulunamadi!');
    process.exit(1);
  }
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
if (!TMDB_API_KEY) {
  console.error('HATA: TMDB_API_KEY bulunamadi!');
  process.exit(1);
}

const POSTER_BASE = 'https://image.tmdb.org/t/p/w500';
const BACKDROP_BASE = 'https://image.tmdb.org/t/p/original';
const FALLBACK_POSTER = 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=500&q=80';
const FALLBACK_BACKDROP = 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1920&q=80';

async function searchTmdb(title) {
  const url = 'https://api.themoviedb.org/3/search/tv?api_key=' + TMDB_API_KEY + '&query=' + encodeURIComponent(title) + '&language=tr-TR';
  try {
    const res = await fetch(url, { headers: { accept: 'application/json' } });
    if (res.status === 429) {
      console.log('  Rate limit, 10 saniye bekleniyor...');
      await new Promise(function(r) { setTimeout(r, 10000); });
      return searchTmdb(title);
    }
    if (!res.ok) return null;
    const data = await res.json();
    const results = data.results || [];
    if (results.length === 0) return null;
    return results[0];
  } catch (err) {
    return null;
  }
}

async function main() {
  const dataPath = path.join(__dirname, 'src', 'lib', 'seriesData.json');
  if (!fs.existsSync(dataPath)) {
    console.error('HATA: src/lib/seriesData.json bulunamadi!');
    process.exit(1);
  }

  const series = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  console.log(series.length + ' dizi isleniyor...\n');

  const updated = [];
  let found = 0;
  let notFound = 0;

  for (var i = 0; i < series.length; i++) {
    const s = series[i];
    process.stdout.write('[' + (i + 1) + '/' + series.length + '] ' + s.title + ' ... ');

    // Zaten gerçek TMDB posteri varsa atla
    if (s.posterUrl && s.posterUrl.includes('image.tmdb.org')) {
      updated.push(s);
      console.log('zaten var, atlandi');
      continue;
    }

    const result = await searchTmdb(s.title);

    if (result && result.poster_path) {
      updated.push(Object.assign({}, s, {
        posterUrl: POSTER_BASE + result.poster_path,
        backdropUrl: result.backdrop_path ? BACKDROP_BASE + result.backdrop_path : FALLBACK_BACKDROP,
        description: result.overview || s.description || s.title + ' dizisi.',
        year: result.first_air_date ? parseInt(result.first_air_date.substring(0, 4)) : (s.year || 2020),
      }));
      console.log('OK: poster bulundu');
      found++;
    } else {
      updated.push(s);
      console.log('bulunamadi, fallback');
      notFound++;
    }

    // Rate limit için bekle
    if ((i + 1) % 10 === 0) {
      await new Promise(function(r) { setTimeout(r, 1000); });
    }
  }

  // Yedek al
  const backupPath = dataPath.replace('.json', '.poster-backup.json');
  fs.copyFileSync(dataPath, backupPath);
  console.log('\nYedek: ' + backupPath);

  fs.writeFileSync(dataPath, JSON.stringify(updated, null, 2), 'utf8');

  console.log('\n=============================');
  console.log('Tamamlandi!');
  console.log('Poster bulundu: ' + found);
  console.log('Bulunamadi: ' + notFound);
  console.log('=============================\n');
}

main().catch(function(err) {
  console.error('Hata:', err);
  process.exit(1);
});
