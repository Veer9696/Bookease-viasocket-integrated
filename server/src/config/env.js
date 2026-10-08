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

let env = null;
let isEnvValid = false;
let envErrors = null;

if (parsed.success) {
  env = parsed.data;
  isEnvValid = true;
} else {
  envErrors = parsed.error.flatten().fieldErrors;
  console.error("==================================================");
  console.error("CRITICAL: Invalid or missing environment configuration:");
  console.error(JSON.stringify(envErrors, null, 2));
  console.error("Please add the missing environment variables in your environment or Vercel dashboard.");
  console.error("==================================================");

  if (!process.env.VERCEL) {
    process.exit(1);
  } else {
    // In Vercel serverless, provide safe fallback values so module initialization succeeds without crashing
    env = {
      NODE_ENV: process.env.NODE_ENV || "production",
      PORT: Number(process.env.PORT) || 3000,
      DATABASE_URL: process.env.DATABASE_URL || "",
      JWT_SECRET: process.env.JWT_SECRET || "fallback-secret-for-startup-only",
      VIASOCKET_ORG_ID: process.env.VIASOCKET_ORG_ID || "",
      VIASOCKET_PROJECT_ID: process.env.VIASOCKET_PROJECT_ID || "",
      VIASOCKET_EMBED_SECRET: process.env.VIASOCKET_EMBED_SECRET || "",
      CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || "",
    };
  }
}

module.exports = { env, isEnvValid, envErrors };
