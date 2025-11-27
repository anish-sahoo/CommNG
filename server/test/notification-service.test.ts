import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock `web-push` at the module level so no real network I/O occurs during tests.
vi.mock("web-push", () => {
  class MockWebPushError extends Error {
    statusCode: number;
    headers: Record<string, string>;
    body: string;
    endpoint: string;
    constructor(message: string, statusCode: number, headers: Record<string, string>, body: string, endpoint: string) {
      super(message);
      this.name = "WebPushError";
      this.statusCode = statusCode;
      this.headers = headers;
      this.body = body;
      this.endpoint = endpoint;
    }
  }

  // We export a default object with stubbed functions, plus the error class.
  return {
    __esModule: true,
    default: {
      sendNotification: vi.fn(),
      setVapidDetails: vi.fn(),
      generateVAPIDKeys: vi.fn(),
    },
    WebPushError: MockWebPushError,
  };
});

import webpush, { WebPushError } from "web-push";
import type {
  ActivePushSubscription,
  NotificationRepository,
} from "../src/data/repository/notification-repo.js";
import { NotificationService } from "../src/service/notification-service.js";
import type { TargetAudience } from "../src/types/message-blast-types.js";
import type {
  NotificationPayload,
  SubscribeInput,
} from "../src/types/notification-types.js";

describe("NotificationService", () => {
  type MockNotificationRepo = NotificationRepository & {
    getAllActiveWebPushSubscriptions: ReturnType<typeof vi.fn>;
    getSubscriptionsByTargetAudience: ReturnType<typeof vi.fn>;
    removeSubscriptionByEndpoint: ReturnType<typeof vi.fn>;
    saveWebPushSubscription: ReturnType<typeof vi.fn>;
  };

  let repo: MockNotificationRepo;
  let service: NotificationService;

  beforeEach(() => {
    // Provide VAPID keys so NotificationService doesn't warn during tests.
    process.env.VAPID_PUBLIC_KEY = "test-pub";
    process.env.VAPID_PRIVATE_KEY = "test-priv";
    repo = {
      getAllActiveWebPushSubscriptions: vi.fn() as unknown as (
        topic?: string,
      ) => Promise<ActivePushSubscription[]>,
      getSubscriptionsByTargetAudience: vi.fn() as unknown as (
        targetAudience?: TargetAudience | null,
      ) => Promise<ActivePushSubscription[]>,
      removeSubscriptionByEndpoint: vi.fn() as unknown as (
        endpoint: string,
      ) => Promise<void>,
      saveWebPushSubscription: vi.fn() as unknown as (
        userId: string,
        subscription: SubscribeInput,
      ) => Promise<void>,
    } as unknown as MockNotificationRepo;
    // create fresh NotificationService instance per test
    service = new NotificationService(repo as NotificationRepository);
    // default sendNotification to a resolved promise to emulate web-push behavior
    // Resolve to an empty object because SendResult type is not relevant for tests
    vi.mocked(webpush, true).sendNotification.mockResolvedValue({} as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // Clean up process.env modifications
    delete process.env.VAPID_PUBLIC_KEY;
    delete process.env.VAPID_PRIVATE_KEY;
  });

  it("removes subscription when push service returns 410 (expired)", async () => {
    const row: ActivePushSubscription = {
      endpoint: "https://example.test/abc",
      p256dh: "p",
      auth: "a",
      topics: null,
      userId: "u1",
    };
    repo.getAllActiveWebPushSubscriptions.mockResolvedValue([row]);

    // simulate an async rejection from the push service (expired subscription)
    vi.mocked(webpush, true).sendNotification.mockRejectedValueOnce(
      new WebPushError("Expired", 410, {}, "", row.endpoint),
    );

    await service.sendNotifications("general", {
      title: "t",
      body: "b",
    } as NotificationPayload);

    expect(repo.removeSubscriptionByEndpoint).toHaveBeenCalledWith(
      row.endpoint,
    );
  });

  it("does not remove subscription on 500 server error", async () => {
    const row: ActivePushSubscription = {
      endpoint: "https://example.test/def",
      p256dh: "p",
      auth: "a",
      topics: null,
      userId: "u2",
    };
    repo.getAllActiveWebPushSubscriptions.mockResolvedValue([row]);

    // simulate an async rejection from the push service (server error)
    vi.mocked(webpush, true).sendNotification.mockRejectedValueOnce(
      new WebPushError("Server error", 500, {}, "", row.endpoint),
    );

    await service.sendNotifications("general", {
      title: "t",
      body: "b",
    } as NotificationPayload);

    expect(repo.removeSubscriptionByEndpoint).not.toHaveBeenCalled();
  });

  it("removes expired subscription when sending targeted notifications", async () => {
    const row: ActivePushSubscription = {
      endpoint: "https://example.test/ghi",
      p256dh: "p",
      auth: "a",
      topics: null,
      userId: "u3",
    };
    repo.getSubscriptionsByTargetAudience.mockResolvedValue([row]);

    // simulate an async rejection from the push service (unsubscribed / 404)
    vi.mocked(webpush, true).sendNotification.mockRejectedValueOnce(
      new WebPushError("Unsubscribed", 404, {}, "", row.endpoint),
    );

    await service.sendTargetedNotifications(null, {
      title: "t",
      body: "b",
    } as NotificationPayload);

    expect(repo.removeSubscriptionByEndpoint).toHaveBeenCalledWith(
      row.endpoint,
    );
  });
});
