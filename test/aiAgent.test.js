const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { WhiteboardAgent } = require('../src/aiAgent');
const { logError, logFeedback } = require('../src/errorLogger');

test('analyze returns pair intersections and prompts', () => {
  const agent = new WhiteboardAgent();
  const result = agent.analyze(['AI for education', 'Education analytics', 'Music']);

  assert.equal(result.ideas.length, 3);
  assert.equal(result.intersections.length, 3);
  assert.ok(result.prompts.length > 0);
  assert.ok(result.summary.includes('Analyzed 3 ideas'));

  const educationPair = result.intersections.find((entry) =>
    entry.pair.includes('AI for education') && entry.pair.includes('Education analytics')
  );

  assert.ok(educationPair.overlap.includes('education'));
});

test('analyze rejects empty-token ideas by filtering', () => {
  const agent = new WhiteboardAgent();
  const result = agent.analyze(['', '   ', 'Single valid idea']);

  assert.equal(result.ideas.length, 1);
  assert.equal(result.intersections.length, 0);
});

test('logError and logFeedback append structured entries', () => {
  const logsDir = path.join(__dirname, '..', 'logs');
  const errorPath = path.join(logsDir, 'errors.log');
  const feedbackPath = path.join(logsDir, 'feedback.log');

  if (fs.existsSync(errorPath)) fs.unlinkSync(errorPath);
  if (fs.existsSync(feedbackPath)) fs.unlinkSync(feedbackPath);

  logError(new Error('test failure'));
  logFeedback({ rating: 'helpful', summary: 'ok' });

  const errorLines = fs.readFileSync(errorPath, 'utf8').trim().split('\n');
  const feedbackLines = fs.readFileSync(feedbackPath, 'utf8').trim().split('\n');
  assert.ok(errorLines.length > 0 && errorLines.at(-1), 'Error log must contain an entry');
  assert.ok(feedbackLines.length > 0 && feedbackLines.at(-1), 'Feedback log must contain an entry');

  const errorEntry = JSON.parse(errorLines.at(-1));
  const feedbackEntry = JSON.parse(feedbackLines.at(-1));

  assert.equal(errorEntry.message, 'test failure');
  assert.equal(feedbackEntry.rating, 'helpful');
  assert.equal(feedbackEntry.summary, 'ok');
});
