const express = require('express');
const admin = require('firebase-admin');
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

// Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: "sunkar-finance",
    privateKeyId: "cd443d299efba267d6d63a74bf6e0428cc55f2c4",
    privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC6kQJnRhqTtZvG\nUw6AY6ncnU62phZqrl1Cf2Y7NYjTUDKcpuL0ObY/2OylzJDOkl1Ar782sccpzelY\nFyCenutLjTxU3At+pGM1nEbzYdoKmEQm9o0MoeyFATIhgao/d7q8I4w+iGH0lhPA\nnbP2SCbLIihUjUVVDdxLCemvIHZ2q+8M9FI7F3HxsTnaBuB7Ab2ogNNrA5W2C/iF\n2k0uqM8V6pRIwyq2DCEJ9k18jvTDtaBW81EkvMhFiPwCK4/5RHpIqnPlTDf4yT6A\ncTWBeZVLZwiL9cUuwT+WT1bRdrUvsnKU5ycWMRmOyM8lv4EnsWckDDXz0eWztmUz\ngigb+clXAgMBAAECggEACqarsfStIMCt/4EPY2INOQScEU5jGj0RIvI+BmRUhufd\ns9bNPy8qSfPa8s4+eCSgAUjnTDqTCb5xM2/Ck3u0KDCMgLW9TEIbTdy5qjxsY810\nmprZy55U7/T1BTevXgc6WHJZF9rWaM3Gm+kE9KsC1/b/wW/9RNFRQdFzj2V1jenC\n3KpRdzAkA0TooXwxynV2FJHZ5QDrXMSQyk7lW3zSU5+KzgWvICBon+s1315nu7Vs\nuhDBZvNmAM8JBLNF8sZEl9d5R4l0o1ns5nTAjn+8BPGD9krSKrQRdXSR6tu4aixN\nLcBultrNCHaRb0SmgjmDvUz/TQUai7HeW6V2r+1n1QKBgQDxcTD3HNy0x2gdrqoe\nLRx0xtB5Prae48EmJ49PL3f8nZi+B6j1UG63IHzLEPu1R18/GgfkaSXGtm0usQVV\njaocmjH49i+yvbIai6dOkYgrhBwN+VZ+BEX6a8qOZ7WamCqNdSproxscaiUYoRmg\nJg1O3b9nxmC95XEgWifX/8/7/QKBgQDF0McTciQ25MZCoTJRkaZvxvmQ4tzUfsEV\ntDfJ3g/1TOpAVnwk65UVUgAKeLFy/94QiQF+M06v/HGmISGrAUuE2HFbJsGk9R/z\nHHZ+v3sCErm50x/hJb6NR/AlMqpVv/QLtdASfyK5FGHl8hUuo7JCtW9Z9kQyqhTS\nni4ftYY44wKBgHgzJPBxYwNxHslgMnsxdDBC5njmGt7BfmAzY6pFdJPEFc3NXHU8\npNHwj5A9FULrlGSC3hj9q/vgyDxtjr1H+L+imGxci+SNggSrMBDybPtVGu5uCnxU\nPk5sqXv577RWOyEPip3pps6fnXZEhdBwAUIZLXhJj9IaTxaPK7TiOzY1AoGBAKwI\nVIlJ08rVjMJ3c85Sb793+KSTV1+J2JvqfjYV5CT9vh8z14U4SBAhnx18Nz5+3P3e\nWKkLL9yHG8NRvvj8CFRA89xEyVWPRDjmQPsbxXtZE6JSxL/GVoCB1oxTEqW+aRwi\nAxGC9Yyl+DnFHbzQ6f9v0KYZMNgq6C7/F7fF4zPnAoGAJkgoBbaTsOV43trkq39T\nrWapQ5icbgit5T+dIBxi0N9wS8UEd7YbbRJrLX5u2ANIOytLdFVCtCuwZ8y3q57a\n+FWbr5LcFzGVxgCFfD1iuRy5anSNvAWVOoM3y9P1mg+ogSvKVj0dCjcVwLXuIK5q\nNHfmTiaMPEpJEiZ6dklc73k=\n-----END PRIVATE KEY-----\n",
    clientEmail: "firebase-adminsdk-fbsvc@sunkar-finance.iam.gserviceaccount.com"
  })
});

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

app.post('/send-all', async (req, res) => {
  if (!checkAuth(req, res)) return;
  const { title, body } = req.body;
  if (!title || !body) return res.status(400).json({ error: 'Missing fields' });

  try {
    const { data: tokens } = await supabase.from('push_tokens').select('token');
    if (!tokens || !tokens.length) return res.json({ success: true, sent: 0, total: 0 });

    let sent = 0;
    const messaging = admin.messaging();

    for (const row of tokens) {
      try {
        // Token from Firebase SDK is a plain string
        const token = row.token;
        await messaging.send({
          token: token,
          notification: { title, body },
          webpush: {
            notification: {
              title, body,
              icon: 'https://sunkar-finance-astana.github.io/KZ/img/icon-192.png'
            },
            fcmOptions: {
              link: 'https://sunkar-finance-astana.github.io/KZ/index.html'
            }
          }
        });
        sent++;
        console.log('Sent to token:', token.substring(0, 20));
      } catch(e) {
        console.error('Token error:', e.message);
        if (e.code === 'messaging/registration-token-not-registered') {
          await supabase.from('push_tokens').delete().eq('token', row.token);
        }
      }
    }

    res.json({ success: true, sent, total: tokens.length });
  } catch(e) {
    console.error('Error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.get('/', (req, res) => res.json({ status: 'Sunkar Finance Push Server running' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server running on port', PORT));
