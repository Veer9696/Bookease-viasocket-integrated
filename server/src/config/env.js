const path = require("path");
// Ensure .env is loaded regardless of current working directory
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
require("dotenv").config({ path: path.resolve(__dirname, "../../../.env") });
require("dotenv").config();
const { z } = require("zod");

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters"),
  VIASOCKET_ORG_ID: z.string().min(1),
  VIASOCKET_PROJECT_ID: z.string().min(1),
  VIASOCKET_EMBED_SECRET: z.string().min(1),
  CLIENT_ORIGIN: z.string().optional(),
  // Google sign-in is disabled (button shows an error) until all three are set.
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().url().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

module.exports = { env: parsed.data };
