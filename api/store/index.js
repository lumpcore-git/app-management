const { CosmosClient } = require("@azure/cosmos");

const client = new CosmosClient(process.env.COSMOS_CONNECTION_STRING);
const database = client.database("lampcore-db");

// localStorage キー → Cosmos DB コンテナ・パーティションキー のマッピング
const CONTAINERS = {
  lc_users:           { name: "users",          pk: "id" },
  lc_reports:         { name: "reports",         pk: "userId" },
  lc_targets:         { name: "targets",         pk: "userId" },
  lc_shift_schedules: { name: "shifts",          pk: "userId" },
  lc_shift_sites:     { name: "sites",           pk: "id" },
  lc_talent:          { name: "talent",          pk: "userId" },
  lc_photos:          { name: "photos",          pk: "userId" },
  lc_skill_template:  { name: "skill_template",  pk: "id" },
  lc_skill_eval:      { name: "skill_eval",      pk: "userId" },
  lc_venue_plans:     { name: "venue_plans",     pk: "month" },
};

const DOC_ID = "data"; // 各コンテナはデータを1ドキュメントで管理

module.exports = async function (context, req) {
  const key = req.params.key;
  const config = CONTAINERS[key];

  if (!config) {
    context.res = { status: 400, body: { error: "Unknown key: " + key } };
    return;
  }

  const container = database.container(config.name);

  try {
    if (req.method === "GET") {
      try {
        const { resource } = await container.item(DOC_ID, DOC_ID).read();
        context.res = { status: 200, body: resource?.data ?? null };
      } catch (e) {
        if (e.code === 404) {
          context.res = { status: 200, body: null };
        } else {
          throw e;
        }
      }

    } else if (req.method === "POST") {
      const doc = { id: DOC_ID, [config.pk]: DOC_ID, data: req.body };
      await container.items.upsert(doc);
      context.res = { status: 200, body: { ok: true } };

    } else if (req.method === "DELETE") {
      try {
        await container.item(DOC_ID, DOC_ID).delete();
      } catch (e) {
        if (e.code !== 404) throw e;
      }
      context.res = { status: 200, body: { ok: true } };
    }

  } catch (e) {
    context.res = { status: 500, body: { error: e.message } };
  }
};
