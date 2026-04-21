// server.js — Render сервер для Web Push уведомлений
const express = require('express');
const webpush = require('web-push');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(express.json());

app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-secret');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// VAPID ключи
webpush.setVapidDetails(
  'mailto:sunkarfinance@yandex.kz',
  'BH9w5ALmXR1imuJGy9lYdZzLEYBtuOlVYr4E7no23SZ3vAXb4ybuJxacB-YYz1yGaiVQEUHgcSyfSxN14JgQKMA',
  'b3OijHYfcqOgTzoJlii3v2xiTS3avGzn6oskatWUcLU'
);

// Supabase
const supabase = createClient(
  'https://yfkifwujrjugtooodnbp.supabase.co',
  'sb_publishable_v7s8h7vwh0-b_Qq8IFnXOQ_Sa1fa3zd'
);

const ADMIN_SECRET = 'sunkar-admin-2026';

function checkAuth(req, res) {
  if (req.headers['x-admin-secret'] !== ADMIN_SECRET) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}

// Отправить всем
app.post('/send-all', async (req, res) => {
  if (!checkAuth(req, res)) return;
  const { title, body } = req.body;
  if (!title || !body) return res.status(400).json({ error: 'Missing title or body' });

  try {
    const { data: tokens } = await supabase.from('push_tokens').select('token');
    if (!tokens || !tokens.length) return res.json({ success: true, sent: 0, total: 0 });

    const payload = JSON.stringify({
      title,
      body,
      url: 'https://sunkar-finance-astana.github.io/KZ/index.html'
    });

    let sent = 0;
    for (const row of tokens) {
      try {
        const subscription = JSON.parse(row.token);
        await webpush.sendNotification(subscription, payload);
        sent++;
      } catch(e) {
        if (e.statusCode === 410 || e.statusCode === 404) {
          await supabase.from('push_tokens').delete().eq('token', row.token);
        }
      }
    }

    res.json({ success: true, sent, total: tokens.length });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/', (req, res) => res.json({ status: 'Sunkar Finance Push Server running' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server running on port', PORT));
