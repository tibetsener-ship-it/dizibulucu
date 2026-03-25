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

const TMDB_KEY = process.env.TMDB_API_KEY;
if (!TMDB_KEY) { console.error('HATA: TMDB_API_KEY yok!'); process.exit(1); }

const POSTER_BASE = 'https://image.tmdb.org/t/p/w500';
const BACKDROP_BASE = 'https://image.tmdb.org/t/p/original';
const MIN_RATING = 6.5;
const MIN_VOTES = 100;

const TR_PROVIDER_MAP = {
  8: 'netflix',
  9: 'amazon',
  337: 'disney',
  384: 'hbo',
  350: 'apple-tv',
  531: 'paramount',
  619: 'mubi',
};

const GENRE_MAP = {
  10759: 'action',
  16: 'animation',
  35: 'comedy',
  80: 'crime',
  99: 'documentary',
  18: 'drama',
  10751: 'family',
  10762: 'kids',
  9648: 'mystery',
  10765: 'sci-fi',
  10766: 'soap',
  10767: 'talk',
  10768: 'war',
  37: 'western',
};

const KEYWORD_TAG_MAP = {
  'dark': 'dark', 'dystopia': 'dark', 'post-apocalyptic': 'dark',
  'psychological': 'mind-blowing', 'mind-bending': 'mind-blowing', 'twist': 'mind-blowing',
  'nonlinear': 'mind-blowing', 'time travel': 'mind-blowing', 'parallel universe': 'mind-blowing',
  'suspense': 'thriller', 'thriller': 'thriller', 'conspiracy': 'thriller',
  'mystery': 'mystery', 'detective': 'mystery', 'murder': 'mystery',
  'crime': 'dark', 'serial killer': 'dark', 'war': 'dark', 'survival': 'dark',
  'horror': 'dark', 'supernatural': 'dark', 'haunting': 'dark',
  'emotional': 'emotional', 'heartwarming': 'emotional', 'romance': 'emotional',
  'coming-of-age': 'emotional', 'family drama': 'emotional', 'grief': 'emotional',
  'feel-good': 'easy-watch', 'lighthearted': 'easy-watch', 'workplace': 'easy-watch',
  'comedy': 'light', 'humor': 'light', 'satire': 'light', 'sitcom': 'light',
  'space': 'sci-fi', 'artificial intelligence': 'sci-fi', 'cyberpunk': 'sci-fi',
  'superhero': 'action', 'action': 'action', 'heist': 'action', 'spy': 'action',
  'politics': 'dark', 'slow burn': 'dark',
};

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function fetchJson(url) {
  try {
    const res = await fetch(url, { headers: { accept: 'application/json' } });
    if (res.status === 429) {
      console.log('  Rate limit, 12sn bekleniyor...');
      await sleep(12000);
      return fetchJson(url);
    }
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}

async function getTRPlatforms(id) {
  const data = await fetchJson('https://api.themoviedb.org/3/tv/' + id + '/watch/providers?api_key=' + TMDB_KEY);
  if (!data || !data.results || !data.results.TR) return [];
  const tr = data.results.TR;
  const providers = [...(tr.flatrate || []), ...(tr.free || [])];
  const platforms = new Set();
  for (const p of providers) {
    const name = TR_PROVIDER_MAP[p.provider_id];
    if (name) platforms.add(name);
  }
  return [...platforms];
}

async function getKeywordTags(id) {
  const data = await fetchJson('https://api.themoviedb.org/3/tv/' + id + '/keywords?api_key=' + TMDB_KEY);
  if (!data || !data.results) return [];
  const keywords = data.results.map(k => k.name.toLowerCase());
  const tags = new Set();
  for (const kw of keywords) {
    for (const [pattern, tag] of Object.entries(KEYWORD_TAG_MAP)) {
      if (kw.includes(pattern)) tags.add(tag);
    }
  }
  return [...tags];
}

function inferTagsFromGenres(genres) {
  const map = {
    'action': 'action', 'comedy': 'light', 'drama': 'emotional',
    'crime': 'dark', 'mystery': 'mystery', 'sci-fi': 'sci-fi',
    'thriller': 'thriller', 'family': 'easy-watch', 'animation': 'easy-watch',
    'kids': 'easy-watch', 'romance': 'emotional', 'horror': 'dark',
    'documentary': 'easy-watch', 'war': 'dark',
  };
  return [...new Set(genres.map(g => map[g]).filter(Boolean))];
}

async function fetchPage(endpoint, page) {
  return fetchJson('https://api.themoviedb.org/3/' + endpoint + '?api_key=' + TMDB_KEY + '&language=tr-TR&page=' + page);
}

async function collectIds(endpoint, maxPages) {
  const ids = new Set();
  for (let p = 1; p <= maxPages; p++) {
    const data = await fetchPage(endpoint, p);
    if (!data || !data.results) break;
    for (const item of data.results) {
      if (item.vote_average >= MIN_RATING && item.vote_count >= MIN_VOTES && item.poster_path) {
        ids.add(item.id);
      }
    }
    if (p % 10 === 0) {
      process.stdout.write('  Sayfa ' + p + '/' + maxPages + ' (' + ids.size + ' dizi)...\r');
      await sleep(500);
    }
  }
  console.log('');
  return ids;
}

async function main() {
  console.log('TMDB\'den 2000+ dizi cekiliyor...\n');

  // 1. Popüler diziler
  console.log('1. Populer diziler cekiliyor...');
  const popularIds = await collectIds('tv/popular', 50);
  console.log('   ' + popularIds.size + ' dizi bulundu');

  // 2. Top rated diziler
  console.log('2. Top rated diziler cekiliyor...');
  const topRatedIds = await collectIds('tv/top_rated', 50);
  console.log('   ' + topRatedIds.size + ' dizi bulundu');

  // 3. Yeni diziler (2023-2025)
  console.log('3. Yeni diziler cekiliyor (2023-2025)...');
  const newIds = new Set();
  for (let year = 2023; year <= 2025; year++) {
    for (let p = 1; p <= 15; p++) {
      const data = await fetchJson('https://api.themoviedb.org/3/discover/tv?api_key=' + TMDB_KEY + '&language=tr-TR&page=' + p + '&first_air_date_year=' + year + '&sort_by=popularity.desc&vote_count.gte=' + MIN_VOTES + '&vote_average.gte=' + MIN_RATING);
      if (!data || !data.results) break;
      for (const item of data.results) {
        if (item.poster_path) newIds.add(item.id);
      }
      await sleep(200);
    }
  }
  console.log('   ' + newIds.size + ' dizi bulundu');

  // 4. Türk yapımı diziler
  console.log('4. Turk yapimi diziler cekiliyor...');
  const turkishIds = new Set();
  for (let p = 1; p <= 20; p++) {
    const data = await fetchJson('https://api.themoviedb.org/3/discover/tv?api_key=' + TMDB_KEY + '&language=tr-TR&page=' + p + '&with_origin_country=TR&sort_by=popularity.desc');
    if (!data || !data.results) break;
    for (const item of data.results) {
      if (item.poster_path) turkishIds.add(item.id);
    }
    await sleep(200);
  }
  console.log('   ' + turkishIds.size + ' dizi bulundu');

  // Tüm ID'leri birleştir
  const allIds = new Set([...popularIds, ...topRatedIds, ...newIds, ...turkishIds]);
  console.log('\nToplam benzersiz dizi: ' + allIds.size);
  console.log('Detaylar cekiliyor...\n');

  // Mevcut verileri yükle
  const dataPath = path.join(__dirname, 'src', 'lib', 'seriesData.json');
  const existingData = fs.existsSync(dataPath) ? JSON.parse(fs.readFileSync(dataPath, 'utf8')) : [];
  const existingIds = new Set(existingData.map(s => s.id));

  const results = [...existingData];
  let added = 0;
  let skipped = 0;
  const idArray = [...allIds];

  for (let i = 0; i < idArray.length; i++) {
    const id = idArray[i];
    const idStr = id.toString();

    // Zaten varsa atla
    if (existingIds.has(idStr)) {
      skipped++;
      continue;
    }

    process.stdout.write('[' + (i + 1) + '/' + idArray.length + '] ID:' + id + ' ... ');

    // Dizi detayları
    const detail = await fetchJson('https://api.themoviedb.org/3/tv/' + id + '?api_key=' + TMDB_KEY + '&language=tr-TR');
    if (!detail || !detail.name) {
      console.log('atildi (detay yok)');
      continue;
    }

    // Puan kontrolü
    if (detail.vote_average < MIN_RATING || detail.vote_count < MIN_VOTES) {
      console.log('atildi (puan dusuk: ' + detail.vote_average + ')');
      continue;
    }

    // Poster kontrolü
    if (!detail.poster_path) {
      console.log('atildi (poster yok)');
      continue;
    }

    // TR platform verisi
    const platforms = await getTRPlatforms(id);

    // Keyword tag'leri
    const kwTags = await getKeywordTags(id);

    // Genre'dan tag çıkar
    const genres = (detail.genres || []).map(g => GENRE_MAP[g.id] || '').filter(Boolean);
    const fallbackTags = inferTagsFromGenres(genres);
    const tags = kwTags.length > 0 ? kwTags : fallbackTags;

    const series = {
      id: idStr,
      title: detail.name || detail.original_name,
      description: detail.overview || detail.name + ' dizisi.',
      posterUrl: POSTER_BASE + detail.poster_path,
      backdropUrl: detail.backdrop_path ? BACKDROP_BASE + detail.backdrop_path : '',
      rating: detail.vote_average || 0,
      popularity: Math.round(detail.popularity || 0),
      genres: genres,
      platforms: platforms.length > 0 ? platforms : ['netflix'],
      tags: tags.length > 0 ? tags : ['easy-watch'],
      duration: detail.episode_run_time && detail.episode_run_time[0] > 45 ? 'long' : 'medium',
      year: detail.first_air_date ? parseInt(detail.first_air_date.substring(0, 4)) : 2020,
    };

    results.push(series);
    existingIds.add(idStr);
    added++;
    console.log('OK: ' + detail.name + ' (' + detail.vote_average + ') [' + (platforms.join(',') || 'bilinmiyor') + ']');

    // Her 5 istekte bekle
    if (added % 5 === 0) await sleep(1000);

    // Ara kaydet (her 100 dizide)
    if (added % 100 === 0) {
      fs.writeFileSync(dataPath, JSON.stringify(results, null, 2), 'utf8');
      console.log('\n  ARA KAYIT: ' + results.length + ' dizi kaydedildi\n');
    }
  }

  // Final kaydet
  const backupPath = dataPath.replace('.json', '.before-2000.json');
  if (fs.existsSync(dataPath)) fs.copyFileSync(dataPath, backupPath);

  // 6.5 altını filtrele
  const filtered = results.filter(s => s.rating >= MIN_RATING);

  fs.writeFileSync(dataPath, JSON.stringify(filtered, null, 2), 'utf8');

  console.log('\n=============================');
  console.log('Tamamlandi!');
  console.log('Yeni eklenen:  ' + added + ' dizi');
  console.log('Zaten vardi:   ' + skipped + ' dizi');
  console.log('Toplam (6.5+): ' + filtered.length + ' dizi');
  console.log('=============================\n');
}

main().catch(function(err) {
  console.error('Hata:', err);
  process.exit(1);
});
