import 'dotenv/config';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { MongoClient } from 'mongodb';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;
const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const databaseName = process.env.MONGODB_DB || 'notice_board';
const adminPassword = process.env.ADMIN_PASSWORD || '';

const client = new MongoClient(mongoUri);
let noticesCollection;

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

function readText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function passwordsMatch(suppliedPassword) {
  if (!adminPassword) {
    return false;
  }

  const supplied = Buffer.from(suppliedPassword);
  const expected = Buffer.from(adminPassword);

  if (supplied.length !== expected.length) {
    return false;
  }

  return crypto.timingSafeEqual(supplied, expected);
}

function requireAdmin(req, res, next) {
  if (!adminPassword) {
    return res.status(500).json({
      message: 'ADMIN_PASSWORD is not configured on the server.'
    });
  }

  const suppliedPassword = req.get('x-admin-password') || '';

  if (!passwordsMatch(suppliedPassword)) {
    return res.status(401).json({
      message: 'Admin password is incorrect.'
    });
  }

  return next();
}

function validateNoticePayload(body) {
  const title = readText(body.title);
  const message = readText(body.message);
  const rawImageUrl = readText(body.imageUrl);
  let imageUrl = '';

  if (!title) {
    return { error: 'Notice title is required.' };
  }

  if (title.length > 120) {
    return { error: 'Notice title must be 120 characters or less.' };
  }

  if (!message) {
    return { error: 'Notice text is required.' };
  }

  if (message.length > 2000) {
    return { error: 'Notice text must be 2000 characters or less.' };
  }

  if (rawImageUrl) {
    try {
      const parsedUrl = new URL(rawImageUrl);

      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return { error: 'Image link must start with http:// or https://.' };
      }

      imageUrl = parsedUrl.toString();
    } catch {
      return { error: 'Image link is not a valid URL.' };
    }
  }

  return {
    notice: {
      title,
      message,
      imageUrl
    }
  };
}

function serializeNotice(notice) {
  return {
    id: notice._id.toString(),
    title: notice.title,
    message: notice.message,
    imageUrl: notice.imageUrl || '',
    createdAt: notice.createdAt
  };
}

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    database: Boolean(noticesCollection)
  });
});

app.get('/api/notices', async (_req, res, next) => {
  try {
    const notices = await noticesCollection
      .find({})
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();

    res.json({
      notices: notices.map(serializeNotice)
    });
  } catch (error) {
    next(error);
  }
});

app.post('/api/notices', requireAdmin, async (req, res, next) => {
  try {
    const validation = validateNoticePayload(req.body);

    if (validation.error) {
      return res.status(400).json({
        message: validation.error
      });
    }

    const notice = {
      ...validation.notice,
      createdAt: new Date()
    };

    const result = await noticesCollection.insertOne(notice);

    return res.status(201).json({
      notice: serializeNotice({
        _id: result.insertedId,
        ...notice
      })
    });
  } catch (error) {
    return next(error);
  }
});

app.get(['/publish', '/admin'], (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'publish.html'));
});

app.get(['/viewer', '/notices'], (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      message: 'API route not found.'
    });
  }

  return res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({
    message: 'Something went wrong on the server.'
  });
});

async function startServer() {
  if (!process.env.MONGODB_URI && process.env.NODE_ENV === 'production') {
    throw new Error('MONGODB_URI is required in production.');
  }

  await client.connect();

  const database = client.db(databaseName);
  noticesCollection = database.collection('notices');
  await noticesCollection.createIndex({ createdAt: -1 });

  app.listen(port, () => {
    console.log(`Notice board running on http://localhost:${port}`);
  });
}

startServer().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
