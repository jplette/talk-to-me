// scripts/generate-brand-assets.ts
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const ICON_SVG = path.join(ROOT, 'app/icon.svg');
const APPLE_OUT = path.join(ROOT, 'app/apple-icon.png');
const OG_OUT = path.join(ROOT, 'app/opengraph-image.png');

const OG_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#F0F0F3"/>
  <rect width="1200" height="4" y="626" fill="#EF8354"/>
  <g transform="translate(80, 80)">
    <rect width="56" height="56" rx="11" fill="#EF8354"/>
    <text x="28" y="33" font-family="Inter,sans-serif" font-weight="800" font-size="24" fill="#FFF" text-anchor="middle" dominant-baseline="middle">JP</text>
  </g>
  <text x="80" y="280" font-family="Inter,sans-serif" font-weight="800" font-size="80" letter-spacing="-3" fill="#2D3142">Sprich mit</text>
  <text x="80" y="370" font-family="Inter,sans-serif" font-weight="800" font-size="80" letter-spacing="-3" fill="#2D3142">meinem digitalen</text>
  <text x="80" y="460" font-family="Inter,sans-serif" font-weight="800" font-size="80" letter-spacing="-3" fill="#2D3142">Zwilling.</text>
  <text x="80" y="550" font-family="Inter,sans-serif" font-weight="500" font-size="22" fill="#60646C">Jonathan Plettenberg · 4 Min Voice</text>
</svg>
`;

async function main() {
  const iconSvg = await readFile(ICON_SVG);

  // 180×180 apple-icon
  await sharp(iconSvg).resize(180, 180).png().toFile(APPLE_OUT);

  // 1200×630 OG image
  await sharp(Buffer.from(OG_SVG)).png().toFile(OG_OUT);

  console.log('Generated:', APPLE_OUT, OG_OUT);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
