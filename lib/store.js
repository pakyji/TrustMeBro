const fs = require('fs');
const path = require('path');

// Small JSON store so warnings and anti-link settings survive a restart.
// Set STORE_PATH to change where it is kept. The default is data/store.json (git-ignored).
const FILE = process.env.STORE_PATH || path.join(__dirname, '..', 'data', 'store.json');

let cache = null;

function load() {
    if (cache) return cache;
    try {
        cache = JSON.parse(fs.readFileSync(FILE, 'utf8'));
    } catch (error) {
        if (error.code !== 'ENOENT') {
            // Unreadable file: keep a copy so no data is lost, then start empty.
            try {
                fs.renameSync(FILE, `${FILE}.corrupt-${Date.now()}`);
            } catch (_) { /* nothing to keep */ }
            console.error('Store file could not be read, starting empty:', error.message);
        }
        cache = {};
    }
    return cache;
}

function save() {
    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    const tmp = `${FILE}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(load(), null, 2));
    fs.renameSync(tmp, FILE);
}

/** Returns the value stored under key, or the fallback when nothing is stored. */
function get(key, fallback) {
    const data = load();
    return key in data ? data[key] : fallback;
}

/** Stores a JSON-serialisable value under key and writes it to disk. */
function set(key, value) {
    load()[key] = value;
    save();
}

module.exports = { get, set };
