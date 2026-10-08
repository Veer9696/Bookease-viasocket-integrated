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
  const missing = parsed.error.flatten().fieldErrors;
  const missingKeys = Object.keys(missing);
  console.error("==================================================");
  console.error("CRITICAL: Invalid or missing environment configuration:");
  console.error(JSON.stringify(missing, null, 2));
  console.error("Please add the missing environment variables in your environment or Vercel dashboard.");
  console.error("==================================================");

  if (process.env.VERCEL) {
    throw new Error(
      `BookEase deployment error: Missing required environment variables on Vercel: [${missingKeys.join(", ")}]. ` +
      `Please configure these in Vercel Dashboard -> Settings -> Environment Variables.`
    );
  } else {
    process.exit(1);
  }
}

module.exports = { env: parsed.data };
