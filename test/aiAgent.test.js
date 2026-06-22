const test = require('node:test');
const assert = require('node:assert/strict');

const { WhiteboardAgent } = require('../src/aiAgent');

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
