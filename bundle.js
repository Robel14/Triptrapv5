const fs = require('fs');
const path = require('path');

const dir = 'C:/Users/robia/.gemini/antigravity-ide/scratch/triptap';

// Read index.html
let html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');

// Backup modular html
fs.writeFileSync(path.join(dir, 'index.modular.html'), html);

// CSS files to inline
const cssFiles = [
  'css/main.css',
  'css/components.css',
  'css/map.css',
  'css/chat.css',
  'css/admin.css'
];

let inlinedCss = '';
for (const f of cssFiles) {
  const content = fs.readFileSync(path.join(dir, f), 'utf8');
  inlinedCss += `\n/* === INLINED ${f} === */\n` + content + '\n';
}

// Replace CSS links with <style>
const cssLinkRegex = /<link rel="stylesheet" href="css\/[^"]+" \/>/g;
html = html.replace(cssLinkRegex, '');
html = html.replace('</head>', `<style>\n${inlinedCss}\n</style>\n</head>`);

// JS files to inline
const jsFiles = [
  'js/translations.js',
  'js/data.js',
  'js/app.js',
  'js/search.js',
  'js/map.js',
  'js/booking.js',
  'js/host.js',
  'js/admin.js',
  'js/chat.js'
];

let inlinedJs = '';
for (const f of jsFiles) {
  const content = fs.readFileSync(path.join(dir, f), 'utf8');
  inlinedJs += `\n/* === INLINED ${f} === */\n` + content + '\n';
}

// Replace script tags with <script>
const scriptRegex = /<script src="js\/[^"]+"><\/script>/g;
html = html.replace(scriptRegex, '');
html = html.replace('</body>', `<script>\n${inlinedJs}\n</script>\n</body>`);

// Write self-contained index.html
fs.writeFileSync(path.join(dir, 'index.html'), html);
console.log('Successfully bundled index.html! New size:', html.length, 'bytes');
