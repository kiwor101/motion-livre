const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const ids = [...html.matchAll(/id="([^"]+)"/g)].map(match => match[1]);
const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
const scripts = ['app.js', 'advanced.js', 'desktop-integration.js', 'pro-editor.js', 'alight-compat.js']
  .map(file => fs.readFileSync(path.join(root, file), 'utf8'))
  .join('\n');
const references = [...scripts.matchAll(/\$\('#([^']+)'\)/g)].map(match => match[1]);
const runtimeIds = new Set(['motionColorFilters']);
const missingIds = [...new Set(references.filter(id => /^[A-Za-z][\w:-]*$/.test(id) && !ids.includes(id) && !runtimeIds.has(id)))];

console.log(JSON.stringify({ ids: ids.length, duplicateIds, missingIds }, null, 2));
if (duplicateIds.length || missingIds.length) process.exit(2);
