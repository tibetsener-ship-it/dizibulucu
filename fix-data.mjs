import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

var resolvedPath = findFile(__dirname, 'seriesData.json', 0);

// src/lib altındakini bul
var srcPath = path.join(__dirname, 'src', 'lib', 'seriesData.json');
if (fs.existsSync(srcPath)) {
  resolvedPath = srcPath;
}

console.log('Dosya: ' + resolvedPath);

var series = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
console.log(series.length + ' dizi isleniyor...');

var fixed = series.map(function(s) {
  var result = Object.assign({}, s);

  // platform (string) -> platforms (array)
  if (typeof result.platform === 'string' && !result.platforms) {
    result.platforms = [result.platform];
    delete result.platform;
  }

  // platforms yoksa varsayilan ekle
  if (!result.platforms || !Array.isArray(result.platforms)) {
    result.platforms = ['netflix'];
  }

  // tags yoksa veya unknown ise genres'dan cikar
  if (!result.tags || result.tags.length === 0 || result.tags[0] === 'unknown') {
    var genreMap = {
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
    var genres = result.genres || [];
    var tags = [...new Set(genres.map(function(g) { return genreMap[g]; }).filter(Boolean))];
    result.tags = tags.length > 0 ? tags : ['easy-watch'];
  }

  // description yoksa ekle
  if (!result.description) {
    result.description = result.title + ' dizisi.';
  }

  // posterUrl yoksa ekle
  if (!result.posterUrl) {
    result.posterUrl = 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=500&q=80';
  }

  // backdropUrl yoksa ekle
  if (!result.backdropUrl) {
    result.backdropUrl = 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1920&q=80';
  }

  // duration yoksa ekle
  if (!result.duration) {
    result.duration = 'long';
  }

  // year yoksa ekle
  if (!result.year) {
    result.year = 2020;
  }

  return result;
});

// Yedek al
var backupPath = resolvedPath.replace('.json', '.fix-backup.json');
fs.copyFileSync(resolvedPath, backupPath);
console.log('Yedek: ' + backupPath);

fs.writeFileSync(resolvedPath, JSON.stringify(fixed, null, 2), 'utf8');

console.log('\n=============================');
console.log('Tamamlandi! ' + fixed.length + ' dizi duzeltildi.');
console.log('=============================\n');

// Ilk diziyi goster
console.log('Ornek (ilk dizi):');
console.log(JSON.stringify(fixed[0], null, 2));
