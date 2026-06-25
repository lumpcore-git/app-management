const crypto = require('crypto');

const connStr = process.env.COSMOS_CONNECTION_STRING || '';
const ENDPOINT = (connStr.match(/AccountEndpoint=([^;]+)/)?.[1] || '').replace(/\/$/, '');
const ACCOUNT_KEY = connStr.match(/AccountKey=([^;]+)/)?.[1] || '';
const DB = 'lampcore-db';
const DOC_ID = 'data';

const CONTAINERS = {
  lc_users:           { name: 'users',         pk: 'id' },
  lc_reports:         { name: 'reports',        pk: 'userId' },
  lc_targets:         { name: 'targets',        pk: 'userId' },
  lc_shift_schedules: { name: 'shifts',         pk: 'userId' },
  lc_shift_sites:     { name: 'sites',          pk: 'id' },
  lc_talent:          { name: 'talent',         pk: 'userId' },
  lc_photos:          { name: 'photos',         pk: 'userId' },
  lc_skill_template:  { name: 'skill_template', pk: 'id' },
  lc_skill_eval:      { name: 'skill_eval',     pk: 'userId' },
  lc_venue_plans:     { name: 'venue_plans',    pk: 'month' },
};

function authHeader(verb, resourceType, resourceId, date) {
  const text = `${verb}\n${resourceType}\n${resourceId}\n${date}\n\n`;
  const sig = crypto.createHmac('sha256', Buffer.from(ACCOUNT_KEY, 'base64'))
    .update(text).digest('base64');
  return encodeURIComponent(`type=master&ver=1.0&sig=${sig}`);
}

async function getDoc(container) {
  const resourceId = `dbs/${DB}/colls/${container}/docs/${DOC_ID}`;
  const date = new Date().toUTCString();
  const res = await fetch(`${ENDPOINT}/${resourceId}`, {
    headers: {
      'Authorization': authHeader('get', 'docs', resourceId, date),
      'x-ms-date': date,
      'x-ms-version': '2018-12-31',
      'x-ms-documentdb-partitionkey': JSON.stringify([DOC_ID]),
    }
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function upsertDoc(container, pkField, doc) {
  const resourceId = `dbs/${DB}/colls/${container}`;
  const date = new Date().toUTCString();
  const res = await fetch(`${ENDPOINT}/${resourceId}/docs`, {
    method: 'POST',
    headers: {
      'Authorization': authHeader('post', 'docs', resourceId, date),
      'x-ms-date': date,
      'x-ms-version': '2018-12-31',
      'x-ms-documentdb-partitionkey': JSON.stringify([DOC_ID]),
      'x-ms-documentdb-is-upsert': 'true',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(doc)
  });
  if (!res.ok) throw new Error(await res.text());
}

async function deleteDoc(container) {
  const resourceId = `dbs/${DB}/colls/${container}/docs/${DOC_ID}`;
  const date = new Date().toUTCString();
  const res = await fetch(`${ENDPOINT}/${resourceId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': authHeader('delete', 'docs', resourceId, date),
      'x-ms-date': date,
      'x-ms-version': '2018-12-31',
      'x-ms-documentdb-partitionkey': JSON.stringify([DOC_ID]),
    }
  });
  if (res.status !== 204 && res.status !== 404 && !res.ok) throw new Error(await res.text());
}

module.exports = async function(context, req) {
  const storeKey = req.params.key;
  const config = CONTAINERS[storeKey];
  if (!config) {
    context.res = { status: 400, body: { error: 'Unknown key: ' + storeKey } };
    return;
  }

  try {
    if (req.method === 'GET') {
      const doc = await getDoc(config.name);
      context.res = { status: 200, body: doc?.data ?? null };

    } else if (req.method === 'POST') {
      const docBody = { id: DOC_ID, [config.pk]: DOC_ID, data: req.body };
      await upsertDoc(config.name, config.pk, docBody);
      context.res = { status: 200, body: { ok: true } };

    } else if (req.method === 'DELETE') {
      await deleteDoc(config.name);
      context.res = { status: 200, body: { ok: true } };
    }
  } catch (e) {
    context.res = { status: 500, body: { error: e.message } };
  }
};
