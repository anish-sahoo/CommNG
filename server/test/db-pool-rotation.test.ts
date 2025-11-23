import { beforeEach, describe, expect, it, vi } from "vitest";

type RotationCredentials = {
  username: string;
  password: string;
};

type FakePoolInstance = {
  config: Record<string, unknown>;
  ended: boolean;
};

const fakePoolState = vi.hoisted(() => ({
  instances: [] as FakePoolInstance[],
}));

vi.mock("pg", () => {
  class FakePool {
    config: Record<string, unknown>;
    ended = false;

    constructor(config: Record<string, unknown>) {
      this.config = config;
      fakePoolState.instances.push(this);
    }

    on() {
      // noop; tests don't rely on event listeners
    }

    async connect() {
      return { release: vi.fn() };
    }

    async end() {
      this.ended = true;
    }
  }

  return { Pool: FakePool };
});

const drizzleSpy = vi.hoisted(() => vi.fn(() => ({})));
vi.mock("drizzle-orm/node-postgres", () => ({
  drizzle: drizzleSpy,
}));

const secretsManagerMock = vi.hoisted(() => {
  const rotationState = {
    handler: undefined as
      | ((credentials: RotationCredentials) => Promise<void>)
      | undefined,
  };

  return {
    rotationState,
    isEnabled: vi.fn(() => true),
    getCredentials: vi.fn(),
    startAutoRefresh: vi.fn(
      async (
        _interval: number,
        handler: (credentials: RotationCredentials) => Promise<void>,
      ) => {
        rotationState.handler = handler;
      },
    ),
    stopAutoRefresh: vi.fn(),
  };
});

vi.mock("@/utils/secrets-manager.js", () => ({
  secretsManager: secretsManagerMock,
}));

vi.mock("@/utils/logger.js", () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

describe("database pool rotation", () => {
  beforeEach(() => {
    vi.resetModules();
    fakePoolState.instances.length = 0;
    secretsManagerMock.rotationState.handler = undefined;
    secretsManagerMock.getCredentials.mockReset();
    secretsManagerMock.startAutoRefresh.mockClear();
    secretsManagerMock.stopAutoRefresh.mockClear();
    drizzleSpy.mockClear();

    process.env.POSTGRES_USER = "postgres";
    process.env.POSTGRES_PASSWORD = "";
    process.env.POSTGRES_HOST = "localhost";
    process.env.POSTGRES_DB = "comm_ng";
    process.env.POSTGRES_PORT = "5432";
    delete process.env.DB_SECRET_REFRESH_INTERVAL_MS;
  });

  it("does not rebuild the pool when Secrets Manager returns the same credentials", async () => {
    secretsManagerMock.getCredentials.mockResolvedValue({
      username: "postgres",
      password: "",
    });

    const { connectPostgres } = await import("@/data/db/sql.js");
    await connectPostgres();

    expect(fakePoolState.instances).toHaveLength(1);
    expect(fakePoolState.instances[0]?.ended).toBe(false);
  });

  it("rebuilds the pool immediately when the password changes", async () => {
    secretsManagerMock.getCredentials.mockResolvedValue({
      username: "postgres",
      password: "rotated",
    });

    const { connectPostgres } = await import("@/data/db/sql.js");
    await connectPostgres();

    // New pool should be created with rotated password. We no longer close
    // the old pool immediately (we allow a grace period) so assert the
    // new instance exists and has the rotated password.
    expect(fakePoolState.instances).toHaveLength(2);
    expect(fakePoolState.instances[1]?.config.password).toBe("rotated");
  });

  it("only swaps during auto-refresh when the credential payload changes", async () => {
    secretsManagerMock.getCredentials.mockResolvedValue({
      username: "postgres",
      password: "",
    });

    const { connectPostgres } = await import("@/data/db/sql.js");
    await connectPostgres();

    const rotationHandler = secretsManagerMock.rotationState.handler;
    expect(rotationHandler).toBeDefined();

    // Same credentials => skip swap
    await rotationHandler?.({ username: "postgres", password: "" });
    expect(fakePoolState.instances).toHaveLength(1);

    // Changed credentials => new pool allocated
    await rotationHandler?.({ username: "postgres", password: "next-pass" });
    expect(fakePoolState.instances).toHaveLength(2);
    // The old instance may still be open for a grace period; ensure the
    // new instance uses the rotated password.
    expect(fakePoolState.instances[1]?.config.password).toBe("next-pass");
  });
});
