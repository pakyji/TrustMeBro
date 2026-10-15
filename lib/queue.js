// Pure queue logic, kept free of Discord code so it can be unit tested.
const crypto = require('crypto');

const MAX_QUEUE_LENGTH = 50;

class TrackQueue {
    constructor() {
        this.items = [];
        this.current = null;
    }

    /** Adds a track. Returns its position in the waiting list (1 = next), or -1 when full. */
    add(track) {
        if (this.items.length >= MAX_QUEUE_LENGTH) return -1;
        this.items.push(track);
        return this.items.length;
    }

    /** Puts a track at the front of the waiting list (used by "loop track"). */
    addFirst(track) {
        this.items.unshift(track);
    }

    /** Moves the next waiting track to "current". Returns it, or null when nothing is waiting. */
    next() {
        this.current = this.items.shift() || null;
        return this.current;
    }

    /** Removes the waiting track at a 1-based position. Returns the removed track or null. */
    removeAt(position) {
        const index = position - 1;
        if (!Number.isInteger(position) || index < 0 || index >= this.items.length) return null;
        return this.items.splice(index, 1)[0];
    }

    /** Shuffles the waiting tracks in place (Fisher-Yates with a secure random source). */
    shuffle() {
        for (let i = this.items.length - 1; i > 0; i--) {
            const j = crypto.randomInt(i + 1);
            [this.items[i], this.items[j]] = [this.items[j], this.items[i]];
        }
    }

    clear() {
        this.items = [];
        this.current = null;
    }

    get size() {
        return this.items.length;
    }

    list() {
        return this.items.slice();
    }
}

module.exports = { TrackQueue, MAX_QUEUE_LENGTH };
