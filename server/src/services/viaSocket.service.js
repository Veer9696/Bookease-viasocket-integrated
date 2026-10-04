const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { prisma } = require("../config/prismaClient");
const { env } = require("../config/env");
const { logger } = require("../utils/logger");

function createEmbedToken(uniqueIdentifier) {
  // No `exp` claim by design: the viaSocket prebuilt-ui skill specifies
  // exactly these three claims for the embed token.
  return jwt.sign(
    {
      org_id: env.VIASOCKET_ORG_ID,
      project_id: env.VIASOCKET_PROJECT_ID,
      unique_identifier: uniqueIdentifier,
    },
    env.VIASOCKET_EMBED_SECRET
  );
}

// Called from the "flow" embed listener on the client when a user
// publishes/updates/pauses/deletes an automation. Replaces the old
// flows.json file store with the ViaSocketFlow table.
async function upsertFlowFromEvent({ action, id, title, webhookurl, payload, eventName }) {
  if (!id) throw new Error("Missing flow id");

  if (action === "published" || action === "updated") {
    return prisma.viaSocketFlow.upsert({
      where: { id },
      create: { id, title, webhookUrl: webhookurl, payload, eventName, status: "ACTIVE" },
      update: { title, webhookUrl: webhookurl, payload, eventName, status: "ACTIVE" },
    });
  }

  if (action === "paused") {
    return prisma.viaSocketFlow.updateMany({ where: { id }, data: { status: "PAUSED" } });
  }

  if (action === "deleted") {
    return prisma.viaSocketFlow.deleteMany({ where: { id } });
  }

  return null;
}

async function fetchWithRetry(url, options, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);
      if (res.ok) return res;
      logger.warn(`Webhook ${url} attempt ${i + 1} failed: ${res.status}`);
    } catch (err) {
      logger.warn(`Error triggering webhook ${url} attempt ${i + 1}:`, err.message);
    }
    await new Promise((resolve) => setTimeout(resolve, 2 ** i * 100));
  }
  throw new Error(`Webhook ${url} failed after ${retries} attempts.`);
}

// Dispatches `payload` to every active registered flow listening for
// `eventName`. `payload` must already be whitelisted by the caller — this
// function never widens it, so it can't accidentally leak a full
// patient/appointment record to a third-party automation.
async function sendEvent(eventName, payload) {
  const flows = await prisma.viaSocketFlow.findMany({
    where: { eventName, status: "ACTIVE" },
  });

  const eventId = payload.event_id || `${eventName}:${crypto.randomUUID()}`;
  const body = JSON.stringify({ ...payload, event_id: eventId });

  const results = await Promise.allSettled(
    flows.map((flow) =>
      fetchWithRetry(flow.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": eventId },
        body,
      })
    )
  );

  const failures = results.filter((r) => r.status === "rejected");
  if (failures.length) {
    failures.forEach((f) => logger.error(`Flow dispatch failed for ${eventName}:`, f.reason?.message));
  }

  return { attempted: flows.length, failed: failures.length };
}

async function listFlows() {
  return prisma.viaSocketFlow.findMany({ orderBy: { createdAt: "desc" } });
}

module.exports = { createEmbedToken, upsertFlowFromEvent, sendEvent, listFlows };
