// Pure helper functions for the tool and fun commands. No Discord or network code here,
// so these are easy to unit test.
const crypto = require('crypto');

const MAX_INPUT = 500;

/** Parses "2d6", "d20" or "3d10" and rolls. Returns { rolls, total, expr }. */
function rollDice(expr) {
    const match = /^(\d{1,2})?d(\d{1,3})$/i.exec(String(expr).trim());
    if (!match) throw new Error('Use a format like `2d6` or `d20`.');
    const count = match[1] ? Number(match[1]) : 1;
    const sides = Number(match[2]);
    if (count < 1 || count > 20) throw new Error('You can roll between 1 and 20 dice.');
    if (sides < 2 || sides > 100) throw new Error('Dice need between 2 and 100 sides.');
    const rolls = Array.from({ length: count }, () => crypto.randomInt(1, sides + 1));
    return { rolls, total: rolls.reduce((a, b) => a + b, 0), expr: `${count}d${sides}` };
}

/**
 * Evaluates arithmetic like "2 + 3 * (4 - 1) ^ 2". Supports + - * / % ^ and parentheses.
 * It does not run JavaScript, so it is safe to use on user input.
 */
function safeCalc(input) {
    const src = String(input || '');
    if (src.length > MAX_INPUT) throw new Error('That expression is too long.');
    const tokens = src.match(/\d+(\.\d+)?|[-+*/%^()]|\S/g);
    if (!tokens) throw new Error('Type an expression, for example `2 + 2 * 5`.');

    let pos = 0;
    const peek = () => tokens[pos];
    const take = () => tokens[pos++];

    function primary() {
        const t = take();
        if (t === undefined) throw new Error('The expression ends too early.');
        if (t === '(') {
            const v = expr();
            if (take() !== ')') throw new Error('Missing closing parenthesis.');
            return v;
        }
        if (t === '-') return -unary();
        if (t === '+') return unary();
        if (/^\d/.test(t)) return Number(t);
        throw new Error(`Unexpected "${t}".`);
    }
    function unary() {
        return primary();
    }
    function power() {
        const base = primary();
        if (peek() === '^') {
            take();
            return base ** power(); // right-associative
        }
        return base;
    }
    function term() {
        let v = power();
        while (peek() === '*' || peek() === '/' || peek() === '%') {
            const op = take();
            const r = power();
            if ((op === '/' || op === '%') && r === 0) throw new Error('Division by zero.');
            v = op === '*' ? v * r : op === '/' ? v / r : v % r;
        }
        return v;
    }
    function expr() {
        let v = term();
        while (peek() === '+' || peek() === '-') {
            const op = take();
            const r = term();
            v = op === '+' ? v + r : v - r;
        }
        return v;
    }

    const result = expr();
    if (pos !== tokens.length) throw new Error(`Unexpected "${tokens[pos]}".`);
    if (!Number.isFinite(result)) throw new Error('The result is not a finite number.');
    return result;
}

/** Alternating case, like "sPoNgEbOb". */
function mockText(text) {
    let upper = false;
    return String(text).replace(/[a-z]/gi, ch => {
        upper = !upper;
        return upper ? ch.toUpperCase() : ch.toLowerCase();
    });
}

/** Letters become regional-indicator emoji. Spaces stay as spaces. */
function emojifyText(text) {
    return String(text).split('').map(ch => {
        if (/[a-z]/i.test(ch)) return `:regional_indicator_${ch.toLowerCase()}:`;
        if (ch === ' ') return '   ';
        return ch;
    }).join('');
}

function base64Encode(text) {
    return Buffer.from(String(text), 'utf8').toString('base64');
}

function base64Decode(text) {
    const clean = String(text).trim();
    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(clean) || clean.length % 4 === 1) {
        throw new Error('That does not look like Base64.');
    }
    return Buffer.from(clean, 'base64').toString('utf8');
}

const HASH_ALGORITHMS = ['md5', 'sha1', 'sha256', 'sha512'];

function hashText(algorithm, text) {
    const algo = String(algorithm).toLowerCase();
    if (!HASH_ALGORITHMS.includes(algo)) throw new Error(`Use one of: ${HASH_ALGORITHMS.join(', ')}.`);
    return crypto.createHash(algo).update(String(text), 'utf8').digest('hex');
}

function newUuid() {
    return crypto.randomUUID();
}

/** Today's date (YYYY-MM-DD) in Europe/Rome. */
function romeToday(now = new Date()) {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit' })
        .formatToParts(now);
    const get = type => parts.find(p => p.type === type).value;
    return `${get('year')}-${get('month')}-${get('day')}`;
}

/** Whole days from today (Europe/Rome) until the target date. Negative means the date has passed. */
function daysUntil(dateText, now = new Date()) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateText));
    if (!match) throw new Error('Use the date format YYYY-MM-DD.');
    const target = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    if (Number.isNaN(target)) throw new Error('That is not a valid date.');
    const [y, m, d] = romeToday(now).split('-').map(Number);
    return Math.round((target - Date.UTC(y, m - 1, d)) / 86400000);
}

const PASSWORD_SETS = {
    lower: 'abcdefghijkmnopqrstuvwxyz',
    upper: 'ABCDEFGHJKLMNPQRSTUVWXYZ',
    digit: '23456789',
    symbol: '!@#$%^&*-_=+?',
};

/** Random password with at least one character from each set. */
function makePassword(length = 16) {
    const len = Math.min(Math.max(Number(length) || 16, 8), 64);
    const all = Object.values(PASSWORD_SETS).join('');
    const chars = Object.values(PASSWORD_SETS).map(set => set[crypto.randomInt(set.length)]);
    while (chars.length < len) chars.push(all[crypto.randomInt(all.length)]);
    // Shuffle so the guaranteed characters are not always first.
    for (let i = chars.length - 1; i > 0; i--) {
        const j = crypto.randomInt(i + 1);
        [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    return chars.join('');
}

/** Checks a timezone name such as "Europe/Rome". Returns it, or throws. */
function validTimeZone(name) {
    try {
        new Intl.DateTimeFormat('en', { timeZone: name });
        return name;
    } catch {
        throw new Error(`Unknown timezone "${name}". Example: Europe/Rome, Asia/Karachi, America/New_York.`);
    }
}

function timeInZone(zone, now = new Date()) {
    return new Intl.DateTimeFormat('en-GB', {
        timeZone: validTimeZone(zone),
        dateStyle: 'full',
        timeStyle: 'short',
    }).format(now);
}

/** Splits a bill. Returns { tip, total, perPerson }. */
function splitBill(amount, percent, people) {
    if (!(amount > 0) || amount > 1e7) throw new Error('Enter a bill amount above 0.');
    if (!(percent >= 0) || percent > 100) throw new Error('Tip must be between 0 and 100 percent.');
    if (!(people >= 1) || people > 50) throw new Error('People must be between 1 and 50.');
    const tip = amount * (percent / 100);
    const total = amount + tip;
    return { tip, total, perPerson: total / people };
}

/** "#ff8800" or "ff8800" → hex, decimal, rgb. */
function colorInfo(input) {
    const m = /^#?([0-9a-f]{6})$/i.exec(String(input).trim());
    if (!m) throw new Error('Use a 6-digit hex colour, for example `#ff8800`.');
    const hex = m[1].toLowerCase();
    const n = parseInt(hex, 16);
    return { hex: `#${hex}`, decimal: n, rgb: [(n >> 16) & 255, (n >> 8) & 255, n & 255] };
}

const TIMESTAMP_STYLES = { short: 't', long: 'T', date: 'd', 'date-long': 'D', relative: 'R' };

/** Offset of Europe/Rome from UTC in minutes at a given instant (handles DST). */
function romeOffsetMinutes(utcMs) {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Europe/Rome', hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric',
        hour: 'numeric', minute: 'numeric', second: 'numeric',
    }).formatToParts(new Date(utcMs));
    const get = t => Number(parts.find(p => p.type === t).value);
    const wallAsUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
    return Math.round((wallAsUtc - utcMs) / 60000);
}

/** Discord timestamp code for a date and time (interpreted in Europe/Rome). */
function discordTimestamp(dateText, timeText, style = 'long') {
    const dm = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateText));
    const tm = /^(\d{2}):(\d{2})$/.exec(String(timeText || '00:00'));
    if (!dm || !tm) throw new Error('Use date YYYY-MM-DD and time HH:MM.');
    const code = TIMESTAMP_STYLES[style];
    if (!code) throw new Error(`Style must be one of: ${Object.keys(TIMESTAMP_STYLES).join(', ')}.`);
    const wall = Date.UTC(Number(dm[1]), Number(dm[2]) - 1, Number(dm[3]), Number(tm[1]), Number(tm[2]));
    if (Number.isNaN(wall)) throw new Error('That date or time is not valid.');
    // First guess the offset at the wall-clock time, then correct it if the offset changes (DST edge).
    let offset = romeOffsetMinutes(wall);
    let utc = wall - offset * 60000;
    const check = romeOffsetMinutes(utc);
    if (check !== offset) {
        offset = check;
        utc = wall - offset * 60000;
    }
    return `<t:${Math.floor(utc / 1000)}:${code}>`;
}

module.exports = {
    rollDice,
    safeCalc,
    mockText,
    emojifyText,
    base64Encode,
    base64Decode,
    hashText,
    HASH_ALGORITHMS,
    newUuid,
    romeToday,
    daysUntil,
    makePassword,
    validTimeZone,
    timeInZone,
    splitBill,
    colorInfo,
    discordTimestamp,
};
