const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, '..', 'logs');
const errorFile = path.join(logDir, 'errors.log');
const feedbackFile = path.join(logDir, 'feedback.log');

function ensureLogDir() {
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
}

function writeLine(filePath, line) {
  ensureLogDir();
  fs.appendFileSync(filePath, `${line}\n`, 'utf8');
}

function logError(error) {
  const serialized = {
    at: new Date().toISOString(),
    message: error?.message || 'Unknown error',
    stack: error?.stack || null,
  };

  writeLine(errorFile, JSON.stringify(serialized));
}

function logFeedback(feedback) {
  writeLine(feedbackFile, JSON.stringify(feedback));
}

module.exports = {
  logError,
  logFeedback,
};
