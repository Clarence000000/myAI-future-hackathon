// ============================================================
// ScamShield AI — Extension Build Script (esbuild)
//
// Usage:
//   node chrome-extension/build.mjs          # one-shot build
//   node chrome-extension/build.mjs --watch  # watch mode
//
// Output: chrome-extension/dist/
// ============================================================

import * as esbuild from 'esbuild';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(__dirname, 'dist');
const SRC = path.join(__dirname, 'src');
const isWatch = process.argv.includes('--watch');

// --- Helpers ---

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function copyFile(src, dest) {
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

function copyDir(src, dest) {
  ensureDir(dest);
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      copyFile(srcPath, destPath);
    }
  }
}

// --- Static file copying ---

function copyStaticFiles() {
  // manifest.json
  copyFile(
    path.join(__dirname, 'manifest.json'),
    path.join(DIST, 'manifest.json'),
  );

  // popup.html
  copyFile(
    path.join(SRC, 'popup', 'popup.html'),
    path.join(DIST, 'popup', 'popup.html'),
  );

  // icons (if they exist)
  const iconsDir = path.join(__dirname, 'icons');
  if (fs.existsSync(iconsDir)) {
    copyDir(iconsDir, path.join(DIST, 'icons'));
  } else {
    // Create placeholder icons dir
    ensureDir(path.join(DIST, 'icons'));
    console.log('⚠ No icons/ directory found — add icon16.png, icon48.png, icon128.png');
  }

  console.log('✓ Static files copied');
}

// --- Tailwind CSS compilation ---

function buildTailwindCSS() {
  try {
    // Use the project's Tailwind to compile extension-specific CSS
    const inputCss = path.join(SRC, 'popup', 'popup.css');

    // Create a minimal input CSS if it doesn't exist
    if (!fs.existsSync(inputCss)) {
      fs.writeFileSync(inputCss, '@import "tailwindcss";\n');
    }

    const outputCss = path.join(DIST, 'popup', 'popup.css');
    ensureDir(path.dirname(outputCss));

    execSync(
      `npx @tailwindcss/cli -i "${inputCss}" -o "${outputCss}" --minify`,
      { cwd: path.join(__dirname, '..'), stdio: 'pipe' },
    );
    console.log('✓ Tailwind CSS compiled');
  } catch (err) {
    console.error('⚠ Tailwind CSS compilation failed, using empty CSS:', err.message);
    fs.writeFileSync(path.join(DIST, 'popup', 'popup.css'), '/* tailwind build failed */\n');
  }
}

// --- esbuild ---

/** Shared esbuild options */
const sharedOptions = {
  bundle: true,
  format: 'esm',
  target: 'chrome120',
  minify: !isWatch,
  sourcemap: isWatch ? 'inline' : false,
  logLevel: 'info',
  define: {
    '__API_BASE_URL__': '"http://localhost:3000"',
  },
};

async function build() {
  ensureDir(DIST);
  copyStaticFiles();
  buildTailwindCSS();

  // 1. Background service worker
  await esbuild.build({
    ...sharedOptions,
    entryPoints: [path.join(SRC, 'background.ts')],
    outfile: path.join(DIST, 'background.js'),
  });

  // 2. Content script — IIFE for injection (not ESM)
  await esbuild.build({
    ...sharedOptions,
    format: 'iife',
    entryPoints: [path.join(SRC, 'content.ts')],
    outfile: path.join(DIST, 'content.js'),
  });

  // 3. Popup
  await esbuild.build({
    ...sharedOptions,
    entryPoints: [path.join(SRC, 'popup', 'popup.tsx')],
    outfile: path.join(DIST, 'popup', 'popup.js'),
    jsx: 'automatic',
    loader: { '.tsx': 'tsx', '.ts': 'ts' },
  });

  console.log('✓ Extension build complete → chrome-extension/dist/');
}

async function watch() {
  // Initial build
  await build();

  // Watch source files
  const contexts = await Promise.all([
    esbuild.context({
      ...sharedOptions,
      entryPoints: [path.join(SRC, 'background.ts')],
      outfile: path.join(DIST, 'background.js'),
    }),
    esbuild.context({
      ...sharedOptions,
      format: 'iife',
      entryPoints: [path.join(SRC, 'content.ts')],
      outfile: path.join(DIST, 'content.js'),
    }),
    esbuild.context({
      ...sharedOptions,
      entryPoints: [path.join(SRC, 'popup', 'popup.tsx')],
      outfile: path.join(DIST, 'popup', 'popup.js'),
      jsx: 'automatic',
      loader: { '.tsx': 'tsx', '.ts': 'ts' },
    }),
  ]);

  for (const ctx of contexts) {
    await ctx.watch();
  }

  console.log('👀 Watching for changes...');
}

if (isWatch) {
  watch().catch(console.error);
} else {
  build().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
