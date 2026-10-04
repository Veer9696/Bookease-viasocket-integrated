const { app } = require("./app");
const { env } = require("./config/env");
const { startReminderCron } = require("./jobs/reminderCron");
const { logger } = require("./utils/logger");

app.listen(env.PORT, () => {
  logger.info(`BookEase API listening on port ${env.PORT}`);
  startReminderCron();
});
