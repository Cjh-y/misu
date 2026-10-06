import { readFile, writeFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const publicDir = path.join(root, 'public');
const index = await readFile(path.join(dist, 'index.html'), 'utf8');

const scriptMatch = index.match(/<script\b[^>]*\bsrc="([^"]+)"[^>]*><\/script>/i);
if (!scriptMatch) throw new Error('Could not find the bundled JavaScript in dist/index.html');
const styleMatch = index.match(/<link\b[^>]*\bhref="([^"]+\.css)"[^>]*>/i);
if (!styleMatch) throw new Error('Could not find the bundled stylesheet in dist/index.html');

let javascript = await readFile(path.join(dist, scriptMatch[1].replace(/^\//, '')), 'utf8');
let css = await readFile(path.join(dist, styleMatch[1].replace(/^\//, '')), 'utf8');
const referencedAssets = new Set();

function inlinePublicAssets(source) {
  return source.replace(/\/assets\/art\/[A-Za-z0-9_./%-]+\.png/g, (url) => {
    if (!referencedAssets.has(url)) {
      const assetPath = path.resolve(publicDir, `.${url}`);
      if (!assetPath.startsWith(`${publicDir}${path.sep}`)) throw new Error(`Asset path escaped public/: ${url}`);
      referencedAssets.add(url);
    }
    return url;
  });
}

// Resolve paths once, then inline their bytes as data URLs so the file has no
// HTTP requests and works when opened directly using file://.
inlinePublicAssets(javascript);
inlinePublicAssets(css);
const embedded = new Map();
for (const url of referencedAssets) {
  const filePath = path.resolve(publicDir, `.${url}`);
  const bytes = await readFile(filePath);
  embedded.set(url, `data:image/png;base64,${bytes.toString('base64')}`);
}
const replaceAssetUrls = (source) => source.replace(/\/assets\/art\/[A-Za-z0-9_./%-]+\.png/g, (url) => {
  const dataUrl = embedded.get(url);
  if (!dataUrl) throw new Error(`Could not embed referenced image: ${url}`);
  return dataUrl;
});
javascript = replaceAssetUrls(javascript);
css = replaceAssetUrls(css);

// Strip the build's external script and stylesheet tags and place their content
// inline. Keep the module script type for compatibility with Vite's output.
const standalone = index
  .replace(styleMatch[0], () => `<style>${css}</style>`)
  .replace(scriptMatch[0], () => `<script type="module">${javascript.replace(/<\/script/gi, '<\\/script')}</script>`);
const output = path.join(dist, 'misu-standalone.html');
await writeFile(output, standalone, 'utf8');
const outputBytes = (await stat(output)).size;
console.log(`Created dist/misu-standalone.html (${(outputBytes / 1024 / 1024).toFixed(1)} MiB; ${embedded.size} images embedded).`);
