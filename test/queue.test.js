const test = require('node:test');
const assert = require('node:assert/strict');
const { TrackQueue, MAX_QUEUE_LENGTH } = require('../lib/queue');

test('tracks play in the order they were added', () => {
    const q = new TrackQueue();
    assert.equal(q.add({ title: 'a' }), 1);
    assert.equal(q.add({ title: 'b' }), 2);
    assert.equal(q.next().title, 'a');
    assert.equal(q.current.title, 'a');
    assert.equal(q.next().title, 'b');
    assert.equal(q.next(), null);
    assert.equal(q.current, null);
});

test('queue refuses tracks past the limit', () => {
    const q = new TrackQueue();
    for (let i = 0; i < MAX_QUEUE_LENGTH; i++) assert.notEqual(q.add({ title: String(i) }), -1);
    assert.equal(q.add({ title: 'extra' }), -1);
    assert.equal(q.size, MAX_QUEUE_LENGTH);
});

test('clear empties the waiting list and the current track', () => {
    const q = new TrackQueue();
    q.add({ title: 'a' });
    q.add({ title: 'b' });
    q.next();
    q.clear();
    assert.equal(q.size, 0);
    assert.equal(q.current, null);
});

test('list returns a copy, not the internal array', () => {
    const q = new TrackQueue();
    q.add({ title: 'a' });
    q.list().pop();
    assert.equal(q.size, 1);
});
