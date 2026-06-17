import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

const svg = readFileSync(join(publicDir, 'logo.svg'));

// apple-touch-icon: 180x180 PNG
await sharp(svg).resize(180, 180).png().toFile(join(publicDir, 'apple-touch-icon.png'));
console.log('✅ apple-touch-icon.png נוצר');

// favicon: 32x32 PNG
await sharp(svg).resize(32, 32).png().toFile(join(publicDir, 'favicon.png'));
console.log('✅ favicon.png נוצר');

// og-image / large icon: 512x512
await sharp(svg).resize(512, 512).png().toFile(join(publicDir, 'icon-512.png'));
console.log('✅ icon-512.png נוצר');
