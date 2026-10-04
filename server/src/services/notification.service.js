const { prisma } = require("../config/prismaClient");

// Every call site passes an explicit category so "doctors never get lab
// notifications unless required" is enforced by who calls this with which
// category, not by parsing a free-text type/eventName string.
async function createNotification({ userId, category, type, title, body, relatedEntityType, relatedEntityId }) {
  return prisma.notification.create({
    data: { userId, category, type, title, body, relatedEntityType, relatedEntityId },
  });
}

async function listForUser(userId, { unreadOnly = false } = {}) {
  return prisma.notification.findMany({
    where: { userId, ...(unreadOnly ? { readAt: null } : {}) },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

async function markRead(userId, notificationId) {
  return prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { readAt: new Date() },
  });
}

async function markAllRead(userId) {
  return prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
}

module.exports = { createNotification, listForUser, markRead, markAllRead };
