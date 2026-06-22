const express = require('express');
const path = require('path');

const { WhiteboardAgent } = require('./src/aiAgent');
const { logError, logFeedback } = require('./src/errorLogger');

const app = express();
const agent = new WhiteboardAgent();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/analyze', (req, res, next) => {
  try {
    const { ideas } = req.body || {};

    if (!Array.isArray(ideas) || ideas.length === 0) {
      return res.status(400).json({ error: 'Provide a non-empty ideas array.' });
    }

    const result = agent.analyze(ideas);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

app.post('/api/feedback', (req, res, next) => {
  try {
    const { summary = '', rating = 'neutral', notes = '' } = req.body || {};
    logFeedback({ summary, rating, notes, at: new Date().toISOString() });
    return res.status(201).json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.use((err, _req, res, _next) => {
  logError(err);
  res.status(500).json({ error: 'Unexpected error, logged for inspection.' });
});

app.listen(PORT, () => {
  console.log(`Whiteboard server running at http://localhost:${PORT}`);
});
