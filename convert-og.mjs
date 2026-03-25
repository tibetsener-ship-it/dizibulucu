import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const svgPath = path.join(__dirname, 'public', 'og-image.svg');
const pngPath = path.join(__dirname, 'public', 'og-image.png');

if (!fs.existsSync(svgPath)) {
  console.error('HATA: public/og-image.svg bulunamadi!');
  process.exit(1);
}

console.log('SVG -> PNG donusturuluyor...');

await sharp(svgPath)
  .resize(1200, 630)
  .png()
  .toFile(pngPath);

console.log('Tamamlandi: public/og-image.png');
