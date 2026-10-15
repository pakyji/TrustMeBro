const dns = require('dns').promises;
const net = require('net');
const { Readable } = require('stream');

// Music is played only from direct links to audio files.
// YouTube and other streaming sites are not supported (their terms of service restrict downloading/streaming by bots).
const AUDIO_EXTENSIONS = ['.mp3', '.ogg', '.oga', '.opus', '.wav', '.flac', '.m4a', '.aac'];
const MAX_REDIRECTS = 3;
const FETCH_TIMEOUT_MS = 15000;
const REDIRECT_CODES = new Set([301, 302, 303, 307, 308]);

function ipv4ToInt(ip) {
    return ip.split('.').reduce((acc, part) => acc * 256 + Number(part), 0);
}

// True for loopback, private, link-local, CGNAT, multicast and other non-public IPv4 ranges.
function isPrivateIPv4(ip) {
    const n = ipv4ToInt(ip);
    const inRange = (base, bits) => {
        const size = 2 ** (32 - bits);
        return n >= base && n < base + size;
    };
    const ranges = [
        [0x00000000, 8],   // 0.0.0.0/8
        [0x0A000000, 8],   // 10.0.0.0/8
        [0x64400000, 10],  // 100.64.0.0/10 (carrier-grade NAT)
        [0x7F000000, 8],   // 127.0.0.0/8 (loopback)
        [0xA9FE0000, 16],  // 169.254.0.0/16 (link-local, cloud metadata)
        [0xAC100000, 12],  // 172.16.0.0/12
        [0xC0000000, 24],  // 192.0.0.0/24
        [0xC0A80000, 16],  // 192.168.0.0/16
        [0xC6120000, 15],  // 198.18.0.0/15 (benchmarking)
        [0xE0000000, 4],   // 224.0.0.0/4 (multicast)
        [0xF0000000, 4],   // 240.0.0.0/4 (reserved)
    ];
    return ranges.some(([base, bits]) => inRange(base, bits));
}

// True for loopback, unique-local, link-local and mapped IPv4 addresses.
function isPrivateIPv6(ip) {
    const lower = ip.toLowerCase();
    if (lower === '::' || lower === '::1') return true;
    if (lower.startsWith('::ffff:')) {
        const v4 = lower.slice(7);
        return net.isIPv4(v4) ? isPrivateIPv4(v4) : true;
    }
    return /^f[cd]/.test(lower) || /^fe[89ab]/.test(lower);
}

function isPrivateAddress(ip) {
    const version = net.isIP(ip);
    if (version === 4) return isPrivateIPv4(ip);
    if (version === 6) return isPrivateIPv6(ip);
    return true; // Not an IP address: treat as unsafe.
}

// Throws if the host name points at any non-public address.
async function assertPublicHost(hostname) {
    const host = hostname.replace(/^\[|\]$/g, '').toLowerCase();
    if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal')) {
        throw new Error('That host is not allowed.');
    }
    if (net.isIP(host)) {
        if (isPrivateAddress(host)) throw new Error('That address is not allowed.');
        return;
    }
    const records = await dns.lookup(host, { all: true }).catch(() => []);
    if (records.length === 0) throw new Error('Could not resolve that host.');
    if (records.some(r => isPrivateAddress(r.address))) throw new Error('That host points to a private address, which is not allowed.');
}

/**
 * Checks a user-supplied link. Returns a URL object or throws an Error whose message can be shown to the user.
 */
async function validateAudioUrl(input) {
    const raw = String(input || '').trim();
    if (!raw || raw.length > 500) throw new Error('Please give a link of 500 characters or less.');

    let url;
    try {
        url = new URL(raw);
    } catch {
        throw new Error('That is not a valid link.');
    }

    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
        throw new Error('Only http:// and https:// links are allowed.');
    }
    if (url.username || url.password) {
        throw new Error('Links with usernames or passwords are not allowed.');
    }

    const lowerPath = decodeURIComponent(url.pathname).toLowerCase();
    if (!AUDIO_EXTENSIONS.some(ext => lowerPath.endsWith(ext))) {
        throw new Error(`Only direct audio file links are supported (${AUDIO_EXTENSIONS.join(', ')}). YouTube and streaming-site links are not supported.`);
    }

    await assertPublicHost(url.hostname);
    return url;
}

/**
 * Downloads an audio file, following redirects one hop at a time so each new host is checked.
 * Returns a Node stream of the file bytes.
 */
async function openAudioSource(startUrl) {
    let current = new URL(startUrl);

    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
        await assertPublicHost(current.hostname);

        const res = await fetch(current, {
            redirect: 'manual',
            signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
            headers: { 'user-agent': 'TrustMeBro-Music/1.0' },
        });

        if (REDIRECT_CODES.has(res.status)) {
            const location = res.headers.get('location');
            await res.body?.cancel().catch(() => {});
            if (!location) throw new Error('The link redirected without a destination.');
            current = new URL(location, current);
            continue;
        }

        if (!res.ok || !res.body) {
            await res.body?.cancel().catch(() => {});
            throw new Error(`The link returned HTTP ${res.status}.`);
        }

        const type = (res.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
        const looksAudio = type.startsWith('audio/') || type === 'application/ogg' || type === 'application/octet-stream';
        if (!looksAudio) {
            await res.body.cancel().catch(() => {});
            throw new Error(`That link is not an audio file (content-type: ${type || 'unknown'}).`);
        }

        return Readable.fromWeb(res.body);
    }

    throw new Error('The link redirected too many times.');
}

/** A short, readable title from the file name. */
function titleFromUrl(url) {
    const file = decodeURIComponent(new URL(url).pathname.split('/').pop() || 'Untitled');
    return file.replace(/\.[a-z0-9]+$/i, '').replace(/[_]+/g, ' ').slice(0, 80) || 'Untitled';
}

module.exports = {
    validateAudioUrl,
    openAudioSource,
    isPrivateAddress,
    titleFromUrl,
    AUDIO_EXTENSIONS,
};
