// Runs `node --check` on every .js file in the project (skips node_modules and data).
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const skip = new Set(['node_modules', 'data', '.git']);
let failed = 0;
let checked = 0;

function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (skip.has(entry.name)) continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (entry.name.endsWith('.js')) {
            checked++;
            try {
                execFileSync(process.execPath, ['--check', full], { stdio: 'pipe' });
            } catch (error) {
                failed++;
                console.error(`Syntax error in ${path.relative(root, full)}:\n${error.stderr}`);
            }
        }
    }
}

walk(root);
console.log(`Checked ${checked} files, ${failed} with errors.`);
process.exit(failed ? 1 : 0);
