const fs = require('fs');
const path = require('path');

const manifestPath = path.resolve(__dirname, '..', 'extension', 'manifest.json');
const outputPath = path.resolve(__dirname, '..', 'client', 'src', 'lib', 'extension-version.ts');

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const content = `export const EXTENSION_VERSION = "${manifest.version}";\n`;

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, content);
console.log(`Synced extension version: ${manifest.version}`);
