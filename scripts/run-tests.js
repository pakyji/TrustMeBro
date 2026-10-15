// Finds test/*.test.js and runs them with node:test. Works on Node 20 and 22 (no glob support needed).
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'test');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.test.js')).map(f => path.join(dir, f));
const result = spawnSync(process.execPath, ['--test', ...files], { stdio: 'inherit' });
process.exit(result.status ?? 1);
