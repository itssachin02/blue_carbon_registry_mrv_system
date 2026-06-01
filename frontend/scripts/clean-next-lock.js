const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectRoot = path.join(__dirname, '..');
const lockPath = path.join(projectRoot, '.next', 'dev', 'lock');
const nextDir = path.join(projectRoot, '.next');

function removeLock(msg) {
  try {
    if (fs.existsSync(lockPath)) fs.unlinkSync(lockPath);
    console.log(msg);
  } catch (e) {
    console.error('Failed to remove lock file:', e.message || e);
    process.exit(1);
  }
}

function removeNextDir() {
  if (!fs.existsSync(nextDir)) return;

  try {
    fs.rmSync(nextDir, { recursive: true, force: true });
    console.log('Removed stale .next directory.');
  } catch (e) {
    if (e.code === 'EPERM' || e.code === 'EBUSY') {
      console.error('Could not remove the .next directory because a file is locked by another process.');
      console.error('Close any running Next.js dev servers, VS Code file watchers, or OneDrive sync for this project and retry.');
      process.exit(1);
    }
    console.error('Failed to remove .next directory:', e.message || e);
    process.exit(1);
  }
}

try {
  if (fs.existsSync(lockPath)) {
    const content = fs.readFileSync(lockPath, 'utf8').trim();
    if (content) {
      const pid = parseInt(content, 10);
      if (!Number.isNaN(pid)) {
        try {
          process.kill(pid, 0);
          console.error(`Another process (PID ${pid}) appears to be running. Aborting start.`);
          process.exit(1);
        } catch (e) {
          // process not running, safe to remove
          removeLock('Removed stale Next dev lock (stale PID).');
        }
      } else {
        removeLock('Removed malformed Next dev lock.');
      }
    } else {
      removeLock('Removed empty Next dev lock.');
    }
  }

  removeNextDir();

  // Check if port 3000 is in use (Windows netstat)
  let netstatOutput = '';
  try {
    netstatOutput = execSync('netstat -aon | findstr ":3000"', { encoding: 'utf8' });
  } catch (e) {
    netstatOutput = e.stdout || '';
  }

  if (netstatOutput && netstatOutput.trim()) {
    console.error('Port 3000 appears to be in use. Please stop the process using it or set the PORT environment variable to a different port.');
    console.error(netstatOutput.trim().split(/\r?\n/).slice(0,10).join('\n'));
    process.exit(1);
  }

  // All good
  process.exit(0);
} catch (err) {
  console.error('Error while cleaning Next dev lock:', err && err.message ? err.message : err);
  process.exit(1);
}
