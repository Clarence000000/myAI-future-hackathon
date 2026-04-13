const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, '..', 'chrome-extension', 'icons');
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

function createSvg(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 128 128">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#3b82f6"/>
      <stop offset="100%" stop-color="#8b5cf6"/>
    </linearGradient>
  </defs>
  <rect width="128" height="128" rx="24" fill="#0f172a"/>
  <path d="M64 20 L100 40 L100 72 Q100 100 64 112 Q28 100 28 72 L28 40 Z" fill="url(#g)" opacity="0.9"/>
  <path d="M56 68 L62 74 L76 56" stroke="white" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
}

[16, 48, 128].forEach((size) => {
  const filePath = path.join(iconsDir, `icon${size}.png`);
  // Chrome accepts SVG-as-PNG for dev mode, but for production you'd convert properly.
  // For now, save as SVG with .png extension — works in dev mode manifest.
  // Better: save as .svg and update manifest.
  fs.writeFileSync(filePath.replace('.png', '.svg'), createSvg(size));
  console.log(`Created icon${size}.svg`);
});
