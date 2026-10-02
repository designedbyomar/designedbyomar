import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import {
  CASE_CARD_IMAGE_WIDTHS,
  getCaseStudyCoverImage,
  getResponsiveCaseStudyImage,
} from '../src/case-study-media.mjs';

const QUALITY = 82;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const caseStudies = JSON.parse(
  await fs.readFile(path.join(ROOT, 'src/content/case-studies.json'), 'utf8'),
);

const toPublicFile = (urlPath) => {
  if (typeof urlPath !== 'string' || !urlPath.startsWith('/')) {
    throw new Error(`Expected a root-relative public asset path, received: ${urlPath}`);
  }

  const file = path.resolve(PUBLIC_DIR, urlPath.slice(1));
  if (!file.startsWith(`${PUBLIC_DIR}${path.sep}`)) {
    throw new Error(`Responsive image path escapes public/: ${urlPath}`);
  }
  return file;
};

for (const caseStudy of caseStudies) {
  const sourceUrl = getCaseStudyCoverImage(caseStudy);
  if (!sourceUrl) throw new Error(`${caseStudy.id}: no case-card cover image could be resolved`);

  const source = toPublicFile(sourceUrl);
  let sourceMetadata;
  try {
    sourceMetadata = await sharp(source).metadata();
  } catch {
    throw new Error(`${caseStudy.id}: case-card image source does not exist or is invalid: ${sourceUrl}`);
  }

  const largestWidth = Math.max(...CASE_CARD_IMAGE_WIDTHS);
  if (!sourceMetadata.width || sourceMetadata.width < largestWidth) {
    throw new Error(`${caseStudy.id}: ${sourceUrl} must be at least ${largestWidth}px wide`);
  }

  for (const width of CASE_CARD_IMAGE_WIDTHS) {
    const outputUrl = getResponsiveCaseStudyImage(sourceUrl, width);
    const output = toPublicFile(outputUrl);
    await fs.mkdir(path.dirname(output), { recursive: true });
    await sharp(source)
      .rotate()
      .resize({ width })
      .webp({ quality: QUALITY, effort: 4 })
      .toFile(output);

    const metadata = await sharp(output).metadata();
    if (metadata.format !== 'webp' || metadata.width !== width) {
      throw new Error(`${caseStudy.id}: generated image is not a ${width}px WebP: ${outputUrl}`);
    }

    const { size } = await fs.stat(output);
    console.log(`✓ ${caseStudy.id}: ${outputUrl} (${size} bytes)`);
  }
}
