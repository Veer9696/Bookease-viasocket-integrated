const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { prisma } = require("../config/prismaClient");
const { env } = require("../config/env");
const { logger } = require("../utils/logger");
const { BadRequestError, ForbiddenError } = require("../utils/apiError");

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

// The client opens the embed with meta = JSON.stringify({ event, app }), and
// viaSocket echoes it back as flow.metadata. Older flows sent a bare event
// name, so accept that too.
function parseMeta(metadata) {
  if (!metadata) return {};
  if (typeof metadata === "object") return metadata;
  try {
    const parsed = JSON.parse(metadata);
    return typeof parsed === "object" && parsed ? parsed : { event: String(parsed) };
  } catch {
    return { event: metadata };
  }
}

function isFlowUrl(url) {
  return typeof url === "string" && url.startsWith("https://flow.sokt.io/");
}

// Mirrors the embed's flow events into our own table so the product can
// show the user's automations and run them on BookEase events.
async function upsertFlowFromEvent(user, flow) {
  const { action, id } = flow;
  if (!id) throw new BadRequestError("Missing flow id");

  const existing = await prisma.viaSocketFlow.findUnique({ where: { id } });
  // Clinic-wide (ownerless) flows are admin-managed; personal flows are
  // owner-only.
  if (existing && existing.ownerUserId !== user.id && user.role !== "ADMIN") {
    throw new ForbiddenError("This automation belongs to another user");
  }

  if (action === "deleted") {
    if (existing) await prisma.viaSocketFlow.delete({ where: { id } });
    return null;
  }

  if (action === "paused") {
    if (!existing) return null;
    return prisma.viaSocketFlow.update({ where: { id }, data: { status: "PAUSED" } });
  }

  const meta = parseMeta(flow.metadata);
  const fields = {
    ...(flow.title ? { title: flow.title } : {}),
    ...(flow.description ? { description: flow.description } : {}),
    ...(meta.event ? { eventName: meta.event } : {}),
    ...(meta.app ? { appKey: meta.app } : {}),
    ...(Array.isArray(flow.serviceIcons) ? { serviceIcons: flow.serviceIcons.filter((s) => typeof s === "string") } : {}),
    ...(flow.payload !== undefined ? { payload: flow.payload } : {}),
  };

  if (action === "initiated") {
    // A draft never downgrades a flow that is already live.
    if (existing) return prisma.viaSocketFlow.update({ where: { id }, data: fields });
    return prisma.viaSocketFlow.create({ data: { id, ownerUserId: user.id, status: "DRAFT", ...fields } });
  }

  if (action === "published" || action === "updated") {
    // The webhook URL runs the user's connected apps, so only accept a real
    // viaSocket flow URL — never an arbitrary URL from the browser.
    if (!isFlowUrl(flow.webhookurl)) throw new BadRequestError("Invalid flow URL");
    const data = { ...fields, webhookUrl: flow.webhookurl, status: "ACTIVE" };
    if (existing) return prisma.viaSocketFlow.update({ where: { id }, data });
    return prisma.viaSocketFlow.create({ data: { id, ownerUserId: user.id, ...data } });
  }

  return existing;
}

async function fetchWithRetry(url, options, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);
      if (res.ok) {
        try {
          const text = await res.text();
          if (text) {
            const data = JSON.parse(text);
            if (data.success === false || data.error || (Array.isArray(data.errors) && data.errors.length > 0)) {
              logger.warn(`viaSocket flow response warning for ${url}:`, JSON.stringify(data));
            }
          }
        } catch {
          // not JSON or body already consumed
        }
        return res;
      }
      logger.warn(`Webhook ${url} attempt ${i + 1} failed: ${res.status}`);
    } catch (err) {
      logger.warn(`Error triggering webhook ${url} attempt ${i + 1}:`, err.message);
    }
    await new Promise((resolve) => setTimeout(resolve, 2 ** i * 100));
  }
  throw new Error(`Webhook ${url} failed after ${retries} attempts.`);
}

// Dispatches `payload` to every active flow listening for `eventName` that
// belongs to one of `ownerUserIds`, to an admin, or to the clinic as a whole
// (no owner). A doctor's automations therefore only see their own bookings.
// `payload` must already be whitelisted by the caller — this function never
// widens it.
async function sendEvent(eventName, payload, { ownerUserIds = [] } = {}) {
  const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
  const allowedOwners = [...new Set([...ownerUserIds, ...admins.map((a) => a.id)])];

  const flows = await prisma.viaSocketFlow.findMany({
    where: {
      eventName,
      status: "ACTIVE",
      webhookUrl: { not: null },
      // In MongoDB a missing field is not the same as null: flows migrated
      // from flows.json predate ownerUserId, so match both.
      OR: [{ ownerUserId: null }, { ownerUserId: { isSet: false } }, { ownerUserId: { in: allowedOwners } }],
    },
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

  results
    .filter((r) => r.status === "rejected")
    .forEach((f) => logger.error(`Flow dispatch failed for ${eventName}:`, f.reason?.message));

  return { attempted: flows.length, failed: results.filter((r) => r.status === "rejected").length };
}

// Never returns webhookUrl: a flow URL runs the user's apps, so it stays
// server-side like a credential (viaSocket prebuilt-ui rule 5).
async function listFlowsForUser(userId) {
  return prisma.viaSocketFlow.findMany({
    where: { ownerUserId: userId },
    select: {
      id: true,
      title: true,
      description: true,
      eventName: true,
      appKey: true,
      serviceIcons: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
  });
}

module.exports = { createEmbedToken, upsertFlowFromEvent, sendEvent, listFlowsForUser };
