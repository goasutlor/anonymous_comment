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
      const data = JSON.parse(raw);
      return { posts: data.posts || [] };
    }
  } catch (e) {
    console.warn('readData error', e.message);
  }
  return { posts: [] };
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

// GET /api/posts?token=xxx  — ส่ง token เพื่อได้ liked/loved ของแต่ละโพสต์
app.get('/api/posts', (req, res) => {
  const data = readData();
  const token = req.query.token || '';
  const posts = (data.posts || []).map(p => {
    const likeTokens = Array.isArray(p.likeTokens) ? p.likeTokens : [];
    const loveTokens = Array.isArray(p.loveTokens) ? p.loveTokens : [];
    return {
      id: p.id,
      content: p.content,
      at: p.at,
      editedAt: p.editedAt,
      authorToken: p.authorToken,
      likes: Math.max(0, Number(p.likes) || 0),
      loves: Math.max(0, Number(p.loves) || 0),
      liked: likeTokens.includes(token),
      loved: loveTokens.includes(token)
    };
  });
  res.json({ posts });
});

// POST /api/posts  body: { content, authorToken }
app.post('/api/posts', (req, res) => {
  const { content, authorToken } = req.body || {};
  if (!content || typeof content !== 'string') {
    return res.status(400).json({ error: 'content required' });
  }
  const textOnly = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (!textOnly) {
    return res.status(400).json({ error: 'content required' });
  }
  const data = readData();
  const id = 'p_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
  const post = {
    id,
    content: content.trim(),
    at: Date.now(),
    authorToken: authorToken || null,
    likes: 0,
    loves: 0,
    likeTokens: [],
    loveTokens: []
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

function ensureReactions(post) {
  if (!Array.isArray(post.likeTokens)) post.likeTokens = [];
  if (!Array.isArray(post.loveTokens)) post.loveTokens = [];
  post.likes = Math.max(0, post.likeTokens.length);
  post.loves = Math.max(0, post.loveTokens.length);
}

// POST /api/posts/:id/like  body: { authorToken }  — สลับ like (กดอีกครั้ง = เอา like ออก)
app.post('/api/posts/:id/like', (req, res) => {
  const { id } = req.params;
  const { authorToken } = req.body || {};
  if (!authorToken) return res.status(400).json({ error: 'authorToken required' });
  const data = readData();
  const post = (data.posts || []).find(p => p.id === id);
  if (!post) return res.status(404).json({ error: 'not found' });
  ensureReactions(post);
  const idx = post.likeTokens.indexOf(authorToken);
  if (idx >= 0) {
    post.likeTokens.splice(idx, 1);
  } else {
    post.likeTokens.push(authorToken);
  }
  post.likes = post.likeTokens.length;
  writeData(data);
  res.json({ likes: post.likes, liked: post.likeTokens.includes(authorToken) });
});

// POST /api/posts/:id/love  body: { authorToken }  — สลับ love (กดอีกครั้ง = เอา love ออก)
app.post('/api/posts/:id/love', (req, res) => {
  const { id } = req.params;
  const { authorToken } = req.body || {};
  if (!authorToken) return res.status(400).json({ error: 'authorToken required' });
  const data = readData();
  const post = (data.posts || []).find(p => p.id === id);
  if (!post) return res.status(404).json({ error: 'not found' });
  ensureReactions(post);
  const idx = post.loveTokens.indexOf(authorToken);
  if (idx >= 0) {
    post.loveTokens.splice(idx, 1);
  } else {
    post.loveTokens.push(authorToken);
  }
  post.loves = post.loveTokens.length;
  writeData(data);
  res.json({ loves: post.loves, loved: post.loveTokens.includes(authorToken) });
});

// POST /api/clear  body: { secret }  — ล้างความเห็นทั้งหมด (ต้องตั้ง CLEAR_SECRET ใน env)
app.post('/api/clear', (req, res) => {
  const expected = process.env.CLEAR_SECRET;
  if (!expected) {
    return res.status(501).json({ error: 'clear not configured (set CLEAR_SECRET)' });
  }
  const { secret } = req.body || {};
  if (secret !== expected) {
    return res.status(403).json({ error: 'invalid secret' });
  }
  writeData({ posts: [] });
  res.json({ ok: true, message: 'cleared' });
});

app.listen(PORT, () => {
  console.log('Anonymous board server on port', PORT);
});
