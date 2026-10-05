import { describe, expect, it } from "vitest";

import { readConfig } from "./config.js";

const completeEnvironment = {
  NODE_ENV: "test",
  PORT: "4000",
  WEB_ORIGIN: "http://localhost:5173",
  DATABASE_URL: "postgresql://example.invalid/wavemax",
  CLERK_PUBLISHABLE_KEY: "pk_test_example",
  CLERK_SECRET_KEY: "sk_test_example",
};

describe("API configuration", () => {
  it("accepts a complete external-service configuration", () => {
    expect(readConfig(completeEnvironment)).toMatchObject({
      NODE_ENV: "test",
      PORT: 4000,
      WEB_ORIGIN: "http://localhost:5173",
    });
  });

  it("refuses to start without Clerk and database configuration", () => {
    expect(() => readConfig({ WEB_ORIGIN: "http://localhost:5173" })).toThrow();
  });
});
