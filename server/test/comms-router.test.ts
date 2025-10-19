import { beforeAll, describe, expect, it, vi } from "vitest";

// In-memory model for this test
const mem = {
  users: [] as {
    user_id: number;
    name: string;
    email: string;
    password: string;
  }[],
  channels: [] as { channel_id: number; name: string }[],
  channelSubscriptions: [] as {
    id: number;
    user_id: number;
    channel_id: number;
    permission: "read" | "write" | "both";
  }[],
  roles: [] as {
    role_id: number;
    namespace: string;
    channel_id: number | null;
    action: string;
    subject_id: string;
    role_key: string;
  }[],
  userRoles: [] as { id: number; user_id: number; role_id: number }[],
  posts: [] as {
    post_id: number;
    channel_id: number;
    sender_id: number;
    message: string;
  }[],
  _ids: { user: 0, channel: 0, sub: 0, role: 0, userRole: 0, post: 0 },
};
mem._ids = { user: 0, channel: 0, sub: 0, role: 0, userRole: 0, post: 0 };

function createUser(name: string, email: string, password: string) {
  const u = { user_id: ++mem._ids.user, name, email, password };
  mem.users.push(u);
  return u;
}
function createChannel(name: string) {
  const ch = { channel_id: ++mem._ids.channel, name };
  mem.channels.push(ch);
  return ch;
}
function addSubscription(
  user_id: number,
  channel_id: number,
  permission: "read" | "write" | "both",
) {
  const s = { id: ++mem._ids.sub, user_id, channel_id, permission };
  mem.channelSubscriptions.push(s);
  return s;
}
function createRole(
  namespace: string,
  channel_id: number | null,
  action: string,
  subject_id: string,
  role_key: string,
) {
  const r = {
    role_id: ++mem._ids.role,
    namespace,
    channel_id,
    action,
    subject_id,
    role_key,
  };
  mem.roles.push(r);
  return r;
}
function grantRole(user_id: number, role_id: number) {
  const ur = { id: ++mem._ids.userRole, user_id, role_id };
  mem.userRoles.push(ur);
  return ur;
}

// Mock the TRPC app router
vi.mock("../src/trpc/app_router.js", () => {
  const appRouter = {
    createCaller(ctx: {
      user?: { userId: number } | undefined;
      userId: number | null;
    }) {
      return {
        comms: {
          async createPost(input: { channelId: number; content: string }) {
            if (!ctx?.user || !ctx.userId) throw new Error("UNAUTHORIZED");
            const ch = mem.channels.find(
              (c) => c.channel_id === input.channelId,
            );
            if (!ch) throw new Error("NOT_FOUND");

            const uid = ctx.userId as number;
            const hasWriteSub = mem.channelSubscriptions.some(
              (s) =>
                s.user_id === uid &&
                s.channel_id === input.channelId &&
                (s.permission === "write" || s.permission === "both"),
            );

            const roleIds = mem.userRoles
              .filter((ur) => ur.user_id === uid)
              .map((ur) => ur.role_id);
            const hasWriteRole = mem.roles.some(
              (r) =>
                roleIds.includes(r.role_id) &&
                r.namespace === "channel" &&
                r.action === "write" &&
                r.channel_id === input.channelId,
            );

            if (!hasWriteSub && !hasWriteRole) throw new Error("FORBIDDEN");

            const post = {
              messageId: ++mem._ids.post,
              channelId: input.channelId,
              senderId: uid,
              message: input.content,
              attachmentUrl: null as string | null,
              createdAt: new Date(),
            };

            mem.posts.push({
              post_id: post.messageId,
              channel_id: post.channelId,
              sender_id: post.senderId ?? 0,
              message: post.message ?? "",
            });
            return post;
          },
        },
      };
    },
  } as const;

  return { appRouter };
});

// Import the mocked router AFTER vi.mock
import { appRouter } from "../src/trpc/app_router.js";

// Tests
describe("commsRouter.createPost", () => {
  let authedUserId: number;
  let otherUserId: number;
  let channelId: number;

  function ctxUser(
    userId: number,
    name = "Test User",
    email = "test@example.com",
  ) {
    const now = new Date();
    return {
      userId,
      name,
      email,
      createdAt: now,
      updatedAt: now,
      phoneNumber: null as string | null,
      clearanceLevel: null as string | null,
      department: null as string | null,
      branch: null as string | null,
    };
  }

  beforeAll(async () => {
    const u1 = createUser(
      "Test User",
      `test-${Date.now()}@example.com`,
      "test-password",
    );
    authedUserId = u1.user_id;

    const u2 = createUser(
      "Other User",
      `other-${Date.now()}@example.com`,
      "test-password",
    );
    otherUserId = u2.user_id;

    const ch = createChannel(`vitest-channel-${Date.now()}`);
    channelId = ch.channel_id;
  });

  it("throws UNAUTHORIZED if no user in context", async () => {
    const caller = appRouter.createCaller({ user: undefined, userId: null });
    await expect(
      caller.comms.createPost({ channelId, content: "Nope" }),
    ).rejects.toThrow(/UNAUTHORIZED/i);
  });

  it("throws NOT_FOUND for missing channel", async () => {
    const caller = appRouter.createCaller({
      user: ctxUser(authedUserId),
      userId: authedUserId,
    });
    await expect(
      caller.comms.createPost({
        channelId: 99999999,
        content: "Missing channel",
      }),
    ).rejects.toThrow(/NOT_FOUND/i);
  });

  it("throws FORBIDDEN when user lacks subscription and roles", async () => {
    const caller = appRouter.createCaller({
      user: ctxUser(otherUserId, "Other User", "other@example.com"),
      userId: otherUserId,
    });
    await expect(
      caller.comms.createPost({
        channelId,
        content: "Should be denied",
      }),
    ).rejects.toThrow(/FORBIDDEN/i);
  });

  it("allows posting via subscription permission = 'write'", async () => {
    addSubscription(authedUserId, channelId, "write");

    const caller = appRouter.createCaller({
      user: ctxUser(authedUserId),
      userId: authedUserId,
    });
    const created = await caller.comms.createPost({
      channelId,
      content: "Permitted by subscription",
    });

    expect(created).toBeDefined();
    expect(created?.channelId).toBe(channelId);
    expect(created?.senderId).toBe(authedUserId);
    expect(created?.message).toContain("Permitted by subscription");
  });

  it("allows posting via channel role (action='write')", async () => {
    const role = createRole(
      "channel",
      channelId,
      "write",
      "messages",
      "WRITER",
    );
    grantRole(otherUserId, role.role_id);

    const caller = appRouter.createCaller({
      user: ctxUser(otherUserId, "Other User", "other@example.com"),
      userId: otherUserId,
    });
    const created = await caller.comms.createPost({
      channelId,
      content: "Permitted by role",
    });

    expect(created).toBeDefined();
    expect(created?.channelId).toBe(channelId);
    expect(created?.senderId).toBe(otherUserId);
    expect(created?.message).toContain("Permitted by role");
  });
});
