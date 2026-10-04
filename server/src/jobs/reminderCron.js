const cron = require("node-cron");
const { sendDueReminders } = require("../services/reminder.service");
const { logger } = require("../utils/logger");

function startReminderCron() {
  // Every 15 minutes: fine-grained enough to catch both the 24h and 1h
  // windows without missing them, cheap enough for a single-instance process.
  cron.schedule("*/15 * * * *", async () => {
    try {
      await sendDueReminders();
    } catch (err) {
      logger.error("Reminder cron failed:", err);
    }
  });
  logger.info("Reminder cron scheduled (every 15 minutes).");
}

module.exports = { startReminderCron };
