import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import caseStudies from '../src/content/case-studies.json' with { type: 'json' };

const WIDTH = 1200;
const HEIGHT = 627;
const QUALITY = 85;
const MAX_BYTES = 1_000_000;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC_DIR = path.join(ROOT, 'public');

const toPublicFile = (urlPath) => {
  if (typeof urlPath !== 'string' || !urlPath.startsWith('/')) {
    throw new Error(`Expected a root-relative public asset path, received: ${urlPath}`);
  }

  const file = path.resolve(PUBLIC_DIR, urlPath.slice(1));
  if (!file.startsWith(`${PUBLIC_DIR}${path.sep}`)) {
    throw new Error(`Social image path escapes public/: ${urlPath}`);
  }
  return file;
};

for (const caseStudy of caseStudies) {
  if (!caseStudy.ogImage?.endsWith('/cover-og.jpg')) {
    throw new Error(`${caseStudy.id}: ogImage must point to cover-og.jpg`);
  }

  const sourceUrl = caseStudy.coverImage
    ?? `${path.posix.dirname(caseStudy.ogImage)}/cover.webp`;
  const source = toPublicFile(sourceUrl);
  const output = toPublicFile(caseStudy.ogImage);

  try {
    await fs.access(source);
  } catch {
    throw new Error(`${caseStudy.id}: social-image source does not exist: ${sourceUrl}`);
  }

  await fs.mkdir(path.dirname(output), { recursive: true });
  await sharp(source)
    .rotate()
    .resize(WIDTH, HEIGHT, { fit: 'cover', position: 'centre' })
    .flatten({ background: '#ffffff' })
    .toColourspace('srgb')
    .jpeg({ quality: QUALITY, mozjpeg: true, chromaSubsampling: '4:2:0' })
    .toFile(output);

  const metadata = await sharp(output).metadata();
  const { size } = await fs.stat(output);
  if (metadata.format !== 'jpeg' || metadata.width !== WIDTH || metadata.height !== HEIGHT) {
    throw new Error(`${caseStudy.id}: generated social image is not ${WIDTH}x${HEIGHT} JPEG`);
  }
  if (size >= MAX_BYTES) {
    throw new Error(`${caseStudy.id}: generated social image is ${size} bytes; it must stay under ${MAX_BYTES}`);
  }

  console.log(`✓ ${caseStudy.id}: ${caseStudy.ogImage} (${size} bytes)`);
}
