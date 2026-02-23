const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'data.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function readData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('readData error', e.message);
  }
  return { posts: [], vote: { agree: 0, disagree: 0, byToken: {} } };
}

function writeData(data) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('writeData error', e.message);
    throw e;
  }
}

// GET /api/posts
app.get('/api/posts', (req, res) => {
  const data = readData();
  res.json({ posts: data.posts || [] });
});

// POST /api/posts  body: { content, authorToken }
app.post('/api/posts', (req, res) => {
  const { content, authorToken } = req.body || {};
  if (!content || typeof content !== 'string' || !content.trim()) {
    return res.status(400).json({ error: 'content required' });
  }
  const data = readData();
  const id = 'p_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
  const post = {
    id,
    content: content.trim(),
    at: Date.now(),
    authorToken: authorToken || null
  };
  (data.posts = data.posts || []).unshift(post);
  writeData(data);
  res.status(201).json(post);
});

// PUT /api/posts/:id  body: { content, authorToken }
app.put('/api/posts/:id', (req, res) => {
  const { id } = req.params;
  const { content, authorToken } = req.body || {};
  if (!content || typeof content !== 'string' || !content.trim()) {
    return res.status(400).json({ error: 'content required' });
  }
  const data = readData();
  const post = (data.posts || []).find(p => p.id === id);
  if (!post) return res.status(404).json({ error: 'not found' });
  if (post.authorToken !== authorToken) return res.status(403).json({ error: 'forbidden' });
  post.content = content.trim();
  post.editedAt = Date.now();
  writeData(data);
  res.json(post);
});

// DELETE /api/posts/:id  body or query: authorToken
app.delete('/api/posts/:id', (req, res) => {
  const { id } = req.params;
  const authorToken = req.body?.authorToken || req.query?.authorToken;
  const data = readData();
  const post = (data.posts || []).find(p => p.id === id);
  if (!post) return res.status(404).json({ error: 'not found' });
  if (post.authorToken !== authorToken) return res.status(403).json({ error: 'forbidden' });
  data.posts = data.posts.filter(p => p.id !== id);
  writeData(data);
  res.json({ ok: true });
});

// GET /api/vote?token=xxx  -> { agree, disagree, myVote }
app.get('/api/vote', (req, res) => {
  const data = readData();
  const vote = data.vote || { agree: 0, disagree: 0, byToken: {} };
  const token = req.query.token || '';
  const myVote = (vote.byToken || {})[token] || null;
  res.json({
    agree: vote.agree || 0,
    disagree: vote.disagree || 0,
    myVote
  });
});

// POST /api/vote  body: { authorToken, choice: 'agree'|'disagree' }
app.post('/api/vote', (req, res) => {
  const { authorToken, choice } = req.body || {};
  if (!authorToken || !['agree', 'disagree'].includes(choice)) {
    return res.status(400).json({ error: 'authorToken and choice (agree|disagree) required' });
  }
  const data = readData();
  const vote = data.vote || { agree: 0, disagree: 0, byToken: {} };
  vote.byToken = vote.byToken || {};
  const prev = vote.byToken[authorToken];
  if (prev) {
    vote[prev] = Math.max(0, (vote[prev] || 0) - 1);
  }
  vote[choice] = (vote[choice] || 0) + 1;
  vote.byToken[authorToken] = choice;
  data.vote = vote;
  writeData(data);
  res.json({ agree: vote.agree, disagree: vote.disagree, myVote: choice });
});

app.listen(PORT, () => {
  console.log('Anonymous board server on port', PORT);
});
