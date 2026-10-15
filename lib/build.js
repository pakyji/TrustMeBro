const { execFileSync } = require('child_process');
const path = require('path');
const pkg = require('../package.json');

const ROOT = path.join(__dirname, '..');

function git(args) {
    try {
        return execFileSync('git', args, {
            cwd: ROOT,
            stdio: ['ignore', 'pipe', 'ignore'],
            timeout: 3000,
        }).toString().trim() || null;
    } catch {
        return null; // Not a git checkout, or git is not installed
    }
}

/**
 * Describes the code that is running now.
 * The build id changes when the git commit changes, or when the version in package.json changes
 * (used when the bot is updated without git).
 */
function getBuildInfo() {
    const commit = git(['rev-parse', '--short', 'HEAD']);
    const subject = commit ? git(['log', '-1', '--pretty=%s']) : null;
    return {
        version: pkg.version,
        commit,
        subject,
        id: commit ? `${pkg.version}+${commit}` : pkg.version,
    };
}

module.exports = { getBuildInfo };
