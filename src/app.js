// src/app.js
'use strict';

const express = require('express');
const { MongoClient } = require('mongodb');
const { trace, SpanStatusCode } = require('@opentelemetry/api');

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/otel_demo';

const app = express();
app.use(express.json());

let db;
let items;

async function connectMongo() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  db = client.db(); // db name comes from URI
  items = db.collection('items');
  console.log(`[mongo] connected: ${MONGODB_URI}`);
}

app.get('/ping', (req, res) => {
  res.json({ ok: true, message: 'pong' });
});

app.get('/slow', async (req, res) => {
  const ms = Number(req.query.ms || 250);

  const tracer = trace.getTracer('app');
  await tracer.startActiveSpan('business_logic.simulated_work', async (span) => {
    try {
      span.setAttribute('work.ms', ms);
      await new Promise((r) => setTimeout(r, ms));
      res.json({ ok: true, sleptMs: ms });
      span.setStatus({ code: SpanStatusCode.OK });
    } catch (e) {
      span.recordException(e);
      span.setStatus({ code: SpanStatusCode.ERROR, message: e.message });
      res.status(500).json({ ok: false, error: e.message });
    } finally {
      span.end();
    }
  });
});

app.post('/items', async (req, res) => {
  const { name } = req.body || {};
  if (!name) return res.status(400).json({ ok: false, error: 'name is required' });

  const doc = { name, createdAt: new Date() };
  const result = await items.insertOne(doc);

  res.status(201).json({ ok: true, id: result.insertedId.toString(), doc });
});

app.get('/items', async (req, res) => {
  const limit = Math.min(Number(req.query.limit || 10), 50);
  const docs = await items.find({}).sort({ createdAt: -1 }).limit(limit).toArray();
  res.json({ ok: true, count: docs.length, docs });
});

app.get('/error', (req, res) => {

  throw new Error('Intentional error endpoint');
});

async function main() {
  await connectMongo();


  app.use((err, req, res, next) => {
    console.error('[app] error:', err);
    res.status(500).json({ ok: false, error: err.message });
  });

  app.listen(PORT, () => console.log(`[app] listening on http://localhost:${PORT}`));
}

main().catch((e) => {
  console.error('[app] failed to start', e);
  process.exit(1);
});

