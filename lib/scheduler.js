// Persistent job scheduler. Jobs are saved in data/store.json, so reminders and
// temporary bans still run after a restart. A job runs at or after its runAt time.
const store = require('./store');

const KEY = 'jobs';
const TICK_MS = 15000;
const MAX_RETRIES = 3;

const handlers = new Map();
let timer = null;
let clientRef = null;

function allJobs() {
    return store.get(KEY, []);
}

/** Registers the function that runs jobs of this type. handler(client, job) */
function register(type, handler) {
    handlers.set(type, handler);
}

/** Saves a job. Returns the saved job with its id. */
function schedule({ type, runAt, data }) {
    const job = {
        id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`,
        type,
        runAt,
        data,
    };
    store.set(KEY, [...allJobs(), job]);
    return job;
}

/** Lists jobs of one type that match the predicate. */
function listJobs(type, predicate = () => true) {
    return allJobs().filter(j => j.type === type && predicate(j));
}

/** Removes a job if the predicate allows it. Returns true when a job was removed. */
function cancelJob(id, predicate = () => true) {
    const jobs = allJobs();
    const job = jobs.find(j => j.id === id && predicate(j));
    if (!job) return false;
    store.set(KEY, jobs.filter(j => j !== job));
    return true;
}

/** Runs every job that is due. Each job is removed before it runs, so it cannot run twice. */
async function runDue() {
    const now = Date.now();
    const jobs = allJobs();
    const due = jobs.filter(j => j.runAt <= now);
    if (due.length === 0) return;

    store.set(KEY, jobs.filter(j => j.runAt > now));
    for (const job of due) {
        const handler = handlers.get(job.type);
        if (!handler) continue;
        try {
            await handler(clientRef, job);
        } catch (error) {
            console.error(`Scheduled job ${job.type} (${job.id}) failed:`, error.message);
            // Retry a few times, one minute apart, so a short outage does not lose the job.
            const retries = (job.retries || 0) + 1;
            if (retries <= MAX_RETRIES) {
                schedule({ type: job.type, runAt: Date.now() + 60000, data: job.data });
                const saved = allJobs();
                const last = saved[saved.length - 1];
                last.retries = retries;
                store.set(KEY, saved);
            }
        }
    }
}

function start(client) {
    clientRef = client;
    if (!timer) {
        timer = setInterval(() => runDue().catch(e => console.error('Scheduler error:', e.message)), TICK_MS);
        if (timer.unref) timer.unref();
    }
    runDue().catch(e => console.error('Scheduler error:', e.message));
}

module.exports = { register, schedule, listJobs, cancelJob, runDue, start };
