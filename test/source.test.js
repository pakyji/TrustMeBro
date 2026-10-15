const test = require('node:test');
const assert = require('node:assert/strict');
const { isPrivateAddress, validateAudioUrl, titleFromUrl } = require('../lib/source');

test('private, loopback and metadata addresses are blocked', () => {
    for (const ip of ['127.0.0.1', '10.1.2.3', '192.168.0.10', '172.16.5.5', '172.31.255.1', '169.254.169.254', '100.64.0.1', '0.0.0.0', '::1', 'fd00::1', 'fe80::1', '::ffff:10.0.0.1']) {
        assert.equal(isPrivateAddress(ip), true, ip);
    }
});

test('public addresses are allowed', () => {
    for (const ip of ['8.8.8.8', '1.1.1.1', '172.32.0.1', '2606:4700:4700::1111']) {
        assert.equal(isPrivateAddress(ip), false, ip);
    }
});

test('validateAudioUrl accepts a public direct audio link', async () => {
    const url = await validateAudioUrl('https://8.8.8.8/music/song.mp3');
    assert.equal(url.protocol, 'https:');
});

test('validateAudioUrl rejects non-audio, YouTube and unsafe links', async () => {
    await assert.rejects(validateAudioUrl('https://www.youtube.com/watch?v=abc'), /Only direct audio/);
    await assert.rejects(validateAudioUrl('https://example.com/page.html'), /Only direct audio/);
    await assert.rejects(validateAudioUrl('ftp://8.8.8.8/a.mp3'), /http/);
    await assert.rejects(validateAudioUrl('https://user:pw@8.8.8.8/a.mp3'), /usernames/);
    await assert.rejects(validateAudioUrl('http://127.0.0.1/a.mp3'), /not allowed/);
    await assert.rejects(validateAudioUrl('http://localhost:8080/a.mp3'), /not allowed/);
    await assert.rejects(validateAudioUrl('http://169.254.169.254/latest/meta-data.mp3'), /not allowed/);
    await assert.rejects(validateAudioUrl('not a url'), /not a valid link/);
});

test('titleFromUrl makes a readable title', () => {
    assert.equal(titleFromUrl('https://8.8.8.8/files/My_Song%20Name.mp3'), 'My Song Name');
});
