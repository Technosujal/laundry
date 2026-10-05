import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65_535).default(4000),
  WEB_ORIGIN: z.string().url(),
  DATABASE_URL: z.string().min(1),
  CLERK_PUBLISHABLE_KEY: z.string().min(1),
  CLERK_SECRET_KEY: z.string().min(1),
  ANALYTICS_ARTIFACT_PATH: z
    .string()
    .min(1)
    .default("../../data/analytics/analytics-artifact.json"),
});

export type ApiConfig = z.infer<typeof schema>;

export function readConfig(environment: NodeJS.ProcessEnv): ApiConfig {
  return schema.parse(environment);
}
