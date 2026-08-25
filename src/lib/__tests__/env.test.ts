import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";

const REQUIRED_KEYS = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"] as const;

const ORIGINAL_ENV = { ...process.env };

describe("getServerEnv", () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.resetModules();
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("throws a readable error when required variables are missing", async () => {
    for (const key of REQUIRED_KEYS) {
      delete process.env[key];
    }
    const { getServerEnv } = await import("../env");
    expect(() => getServerEnv()).toThrowError(/Invalid environment configuration/);
  });

  it("returns parsed env when required variables are present", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
    const { getServerEnv } = await import("../env");
    const env = getServerEnv();
    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe("https://example.supabase.co");
    expect(env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBe("anon-key");
  });

  it("rejects a malformed URL", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "not-a-url";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
    const { getServerEnv } = await import("../env");
    expect(() => getServerEnv()).toThrowError();
  });
});

describe("getPublicEnv", () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.resetModules();
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("never requires SUPABASE_SERVICE_ROLE_KEY", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    const { getPublicEnv } = await import("../env");
    expect(() => getPublicEnv()).not.toThrow();
  });
});
