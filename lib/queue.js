// Pure queue logic, kept free of Discord code so it can be unit tested.
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

    /** Moves the next waiting track to "current". Returns it, or null when nothing is waiting. */
    next() {
        this.current = this.items.shift() || null;
        return this.current;
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
