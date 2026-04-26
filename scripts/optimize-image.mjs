import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const args = process.argv.slice(2);

const getArg = (name, fallback = undefined) => {
  const index = args.indexOf(`--${name}`);
  if (index === -1) return fallback;
  return args[index + 1] ?? fallback;
};

const input = getArg('input');
const output = getArg('output');
const width = Number.parseInt(getArg('width', '1600'), 10);
const quality = Number.parseInt(getArg('quality', '84'), 10);

if (!input || !output) {
  console.error('Usage: npm run optimize:image -- --input <source> --output <dest> [--width 1600] [--quality 84]');
  process.exit(1);
}

const outputDir = path.dirname(output);
await fs.mkdir(outputDir, { recursive: true });

const ext = path.extname(output).toLowerCase();
let pipeline = sharp(input)
  .rotate()
  .resize({ width, withoutEnlargement: true });

if (ext === '.webp') {
  pipeline = pipeline.webp({ quality });
} else if (ext === '.png') {
  pipeline = pipeline.png({ compressionLevel: 9, palette: true, quality });
} else if (ext === '.jpg' || ext === '.jpeg') {
  pipeline = pipeline.jpeg({ quality, mozjpeg: true });
} else {
  console.error(`Unsupported output format: ${ext}`);
  process.exit(1);
}

await pipeline.toFile(output);

const metadata = await sharp(output).metadata();
const stats = await fs.stat(output);

console.log(JSON.stringify({
  input,
  output,
  width: metadata.width,
  height: metadata.height,
  bytes: stats.size,
  format: metadata.format,
}, null, 2));
