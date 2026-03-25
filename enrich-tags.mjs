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
    const key = trimmed.substring(0, eqIndex).trim();
    const val = trimmed.substring(eqIndex + 1).trim();
    process.env[key] = val;
  }
}

loadEnv();

const TMDB_API_KEY = process.env.TMDB_API_KEY;
if (!TMDB_API_KEY) {
  console.error('HATA: TMDB_API_KEY bulunamadi!');
  process.exit(1);
}

const keywordToTag = {
  'dark': 'dark',
  'dystopia': 'dark',
  'post-apocalyptic': 'dark',
  'psychological': 'mind-blowing',
  'mind-bending': 'mind-blowing',
  'twist ending': 'mind-blowing',
  'nonlinear': 'mind-blowing',
  'suspense': 'thriller',
  'thriller': 'thriller',
  'mystery': 'mystery',
  'conspiracy': 'thriller',
  'crime': 'dark',
  'emotional': 'emotional',
  'heartwarming': 'emotional',
  'tear-jerker': 'emotional',
  'romance': 'emotional',
  'coming-of-age': 'emotional',
  'feel-good': 'easy-watch',
  'lighthearted': 'easy-watch',
  'comedy': 'light',
  'humor': 'light',
  'satire': 'light',
  'space': 'sci-fi',
  'time travel': 'mind-blowing',
  'parallel universe': 'mind-blowing',
  'artificial intelligence': 'sci-fi',
  'superhero': 'action',
  'action': 'action',
  'war': 'dark',
  'survival': 'dark',
  'horror': 'dark',
  'supernatural': 'dark',
  'politics': 'dark',
  'workplace': 'easy-watch',
  'friendship': 'light',
  'heist': 'action',
  'spy': 'action',
};

function inferTagsFromGenres(genres) {
  const map = {
    'action': 'action',
    'comedy': 'light',
    'drama': 'emotional',
    'crime': 'dark',
    'mystery': 'mystery',
    'sci-fi': 'sci-fi',
    'thriller': 'thriller',
    'family': 'easy-watch',
    'animation': 'easy-watch',
    'kids': 'easy-watch',
    'romance': 'emotional',
    'horror': 'dark',
    'documentary': 'easy-watch',
  };
  return [...new Set((genres || []).map(function(g) { return map[g]; }).filter(Boolean))];
}

function findFile(dir, filename, depth) {
  if (depth > 4) return null;
  var entries = fs.readdirSync(dir, { withFileTypes: true });
  for (var i = 0; i < entries.length; i++) {
    var entry = entries[i];
    if (entry.name === filename) return path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.next' && entry.name !== '.git') {
      var found = findFile(path.join(dir, entry.name), filename, depth + 1);
      if (found) return found;
    }
  }
  return null;
}

async function fetchKeywords(id) {
  var url = 'https://api.themoviedb.org/3/tv/' + id + '/keywords?api_key=' + TMDB_API_KEY;
  try {
    var res = await fetch(url, { headers: { accept: 'application/json' } });
    if (res.status === 429) {
      console.log('  Rate limit, 10 saniye bekleniyor...');
      await new Promise(function(r) { setTimeout(r, 10000); });
      return fetchKeywords(id);
    }
    if (!res.ok) return [];
    var data = await res.json();
    return (data.results || []).map(function(k) { return k.name.toLowerCase(); });
  } catch (err) {
    return [];
  }
}

async function main() {
  var resolvedPath = findFile(__dirname, 'seriesData.json', 0);
  if (!resolvedPath) {
    console.error('HATA: seriesData.json bulunamadi!');
    process.exit(1);
  }

  console.log('Dosya bulundu: ' + resolvedPath);
  var series = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
  console.log(series.length + ' dizi isleniyor...\n');

  var enriched = [];
  var successCount = 0;
  var failCount = 0;

  for (var i = 0; i < series.length; i++) {
    var s = series[i];
    process.stdout.write('[' + (i + 1) + '/' + series.length + '] ' + s.title + ' ... ');

    var keywords = await fetchKeywords(s.id);
    var tags = new Set();

    for (var ki = 0; ki < keywords.length; ki++) {
      var kw = keywords[ki];
      var patterns = Object.keys(keywordToTag);
      for (var pi = 0; pi < patterns.length; pi++) {
        if (kw.includes(patterns[pi])) {
          tags.add(keywordToTag[patterns[pi]]);
        }
      }
    }

    var tagArray = [...tags];

    if (tagArray.length > 0) {
      var merged = Object.assign({}, s, { tags: tagArray });
      enriched.push(merged);
      console.log('OK: ' + tagArray.join(', '));
      successCount++;
    } else {
      var fallback = inferTagsFromGenres(s.genres);
      var finalTags = fallback.length > 0 ? fallback : ['easy-watch'];
      var mergedFallback = Object.assign({}, s, { tags: finalTags });
      enriched.push(mergedFallback);
      console.log('Fallback: ' + finalTags.join(', '));
      failCount++;
    }

    if ((i + 1) % 10 === 0) {
      await new Promise(function(r) { setTimeout(r, 1000); });
    }
  }

  var backupPath = resolvedPath.replace('.json', '.backup.json');
  fs.copyFileSync(resolvedPath, backupPath);
  console.log('\nYedek olusturuldu: ' + backupPath);

  fs.writeFileSync(resolvedPath, JSON.stringify(enriched, null, 2), 'utf8');

  console.log('\n=============================');
  console.log('Tamamlandi!');
  console.log('Basarili: ' + successCount + ' dizi');
  console.log('Fallback: ' + failCount + ' dizi');
  console.log('Dosya guncellendi: ' + resolvedPath);
  console.log('=============================\n');
}

main().catch(function(err) {
  console.error('Hata:', err);
  process.exit(1);
});
