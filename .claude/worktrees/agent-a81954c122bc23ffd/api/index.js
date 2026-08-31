const { app } = require('@azure/functions');
const crypto = require('crypto');

const connStr = process.env.COSMOS_CONNECTION_STRING || '';
const ENDPOINT = (connStr.match(/AccountEndpoint=([^;]+)/)?.[1] || '').replace(/\/$/, '');
const ACCOUNT_KEY = connStr.match(/AccountKey=([^;]+)/)?.[1] || '';
const DB = 'lumpcore-db';
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
  const text = `${verb}\n${resourceType}\n${resourceId}\n${date.toLowerCase()}\n\n`;
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

async function saveDoc(container, doc) {
  const docResourceId = `dbs/${DB}/colls/${container}/docs/${DOC_ID}`;
  const collResourceId = `dbs/${DB}/colls/${container}`;
  const commonHeaders = {
    'x-ms-version': '2018-12-31',
    'x-ms-documentdb-partitionkey': JSON.stringify([DOC_ID]),
    'Content-Type': 'application/json',
  };

  // まずPUTで上書きを試みる
  const date1 = new Date().toUTCString();
  const putRes = await fetch(`${ENDPOINT}/${docResourceId}`, {
    method: 'PUT',
    headers: {
      ...commonHeaders,
      'Authorization': authHeader('put', 'docs', docResourceId, date1),
      'x-ms-date': date1,
    },
    body: JSON.stringify(doc),
  });
  if (putRes.ok) return;

  // ドキュメントが存在しない場合はPOSTで新規作成
  if (putRes.status === 404) {
    const date2 = new Date().toUTCString();
    const postRes = await fetch(`${ENDPOINT}/${collResourceId}/docs`, {
      method: 'POST',
      headers: {
        ...commonHeaders,
        'Authorization': authHeader('post', 'docs', collResourceId, date2),
        'x-ms-date': date2,
      },
      body: JSON.stringify(doc),
    });
    if (!postRes.ok) throw new Error(await postRes.text());
    return;
  }

  throw new Error(await putRes.text());
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

app.http('store', {
  methods: ['GET', 'POST', 'DELETE'],
  authLevel: 'anonymous',
  route: 'store',
  handler: async (request, context) => {
    const storeKey = request.query.get('key');
    const config = CONTAINERS[storeKey];
    if (!config) {
      return { status: 400, jsonBody: { error: 'Unknown key: ' + storeKey } };
    }
    try {
      if (request.method === 'GET') {
        const doc = await getDoc(config.name);
        return { status: 200, jsonBody: doc?.data ?? null };
      } else if (request.method === 'POST') {
        const body = await request.json();
        const docBody = { id: DOC_ID, [config.pk]: DOC_ID, data: body };
        await saveDoc(config.name, docBody);
        return { status: 200, jsonBody: { ok: true } };
      } else if (request.method === 'DELETE') {
        await deleteDoc(config.name);
        return { status: 200, jsonBody: { ok: true } };
      }
    } catch (e) {
      return { status: 500, jsonBody: { error: e.message } };
    }
  }
});

app.http('ping', {
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    return { body: 'pong' };
  }
});
