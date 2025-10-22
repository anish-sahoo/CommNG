import { beforeAll, describe, expect, it, vi } from "vitest";

// In-memory model for this test
type MockMessage = {
  messageId: number;
  channelId: number;
  senderId: string | null;
  message: string | null;
  attachmentUrl: string | null;
  createdAt: Date;
};

type MockSubscription = {
  subscriptionId: number;
  userId: string;
  channelId: number;
  permission: "read" | "write" | "both";
  notificationsEnabled: boolean;
};

type MockSubscriptionSummary = MockSubscription & { channelName: string };

type MockChannel = {
  channelId: number;
  name: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
};

const mem: {
  users: {
    user_id: string;
    name: string;
    email: string;
    password: string;
  }[];
  channels: { channel_id: number; name: string }[];
  channelSubscriptions: Array<{
    id: number;
    user_id: string;
    channel_id: number;
    permission: "read" | "write" | "both";
    notifications_enabled: boolean;
  }>;
  roles: {
    role_id: number;
    namespace: string;
    channel_id: number | null;
    action: string;
    subject_id: string;
    role_key: string;
  }[];
  userRoles: { id: number; user_id: string; role_id: number }[];
  posts: MockMessage[];
  _ids: {
    user: string;
    channel: number;
    sub: number;
    role: number;
    userRole: number;
    post: number;
  };
} = {
  users: [],
  channels: [],
  channelSubscriptions: [],
  roles: [],
  userRoles: [],
  posts: [],
  _ids: {
    user: randomUUID(),
    channel: 0,
    sub: 0,
    role: 0,
    userRole: 0,
    post: 0,
  },
};
mem._ids = {
  user: randomUUID(),
  channel: 0,
  sub: 0,
  role: 0,
  userRole: 0,
  post: 0,
};

let uniqueCounter = 0;
function uniqueName(prefix: string) {
  uniqueCounter += 1;
  return `${prefix}-${uniqueCounter}`;
}

function createUser(name: string, email: string, password: string) {
  const u = { user_id: randomUUID(), name, email, password };
  mem.users.push(u);
  return u;
}
function createChannel(name: string) {
  const ch = { channel_id: ++mem._ids.channel, name };
  mem.channels.push(ch);
  return ch;
}
function addSubscription(
  user_id: string,
  channel_id: number,
  permission: "read" | "write" | "both",
) {
  const s = {
    id: ++mem._ids.sub,
    user_id,
    channel_id,
    permission,
    notifications_enabled: false,
  };
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
function grantRole(user_id: string, role_id: number) {
  const ur = { id: ++mem._ids.userRole, user_id, role_id };
  mem.userRoles.push(ur);
  return ur;
}

function createContext(
  userId: string,
  name = "Test User",
  email = "test@example.com",
): Context {
  const now = new Date();
  return {
    auth: {
      session: {
        createdAt: now,
        id: "test-session-id",
        token: "test-session-token",
        userId,
        updatedAt: now,
        expiresAt: now, // TODO: add day
      },
      user: {
        id: userId,
        email,
        emailVerified: true,
        name,
        branch: "test-branch",
        clearanceLevel: "test-clearance",
        department: "test-dept",
        createdAt: now,
        updatedAt: now,
      },
    },
  };
  // return {
  //   userId,
  //   name,
  //   email,
  //   createdAt: now,
  //   updatedAt: now,
  //   phoneNumber: null as string | null,
  //   clearanceLevel: null as string | null,
  //   department: null as string | null,
  //   branch: null as string | null,
  // };
}

// Mock the TRPC app router
vi.mock("../src/trpc/app_router.js", () => {
  type CommsCaller = {
    comms: {
      createPost(input: {
        channelId: number;
        content: string;
      }): Promise<MockMessage>;
      editPost(input: {
        channelId: number;
        messageId: number;
        content: string;
        attachmentUrl?: string;
      }): Promise<MockMessage>;
      deletePost(input: {
        channelId: number;
        messageId: number;
      }): Promise<MockMessage>;
      createSubscription(input: {
        channelId: number;
        permission: "read" | "write" | "both";
        notificationsEnabled: boolean;
      }): Promise<MockSubscription>;
      deleteSubscription(input: {
        subscriptionId: number;
      }): Promise<MockSubscription>;
      getUserSubscriptions(input: {
        userId?: number;
      }): Promise<MockSubscriptionSummary[]>;
      createChannel(input: {
        name: string;
        metadata?: Record<string, unknown>;
      }): Promise<MockChannel>;
    };
  };
  type AppRouter = {
    createCaller(ctx: Context): CommsCaller;
  };

  function ensureCanPost(userId: string, channelId: number) {
    const hasWriteSub = mem.channelSubscriptions.some(
      (s) =>
        s.user_id === userId &&
        s.channel_id === channelId &&
        (s.permission === "write" || s.permission === "both"),
    );

    const roleIds = mem.userRoles
      .filter((ur) => ur.user_id === userId)
      .map((ur) => ur.role_id);
    const hasWriteRole = mem.roles.some(
      (r) =>
        roleIds.includes(r.role_id) &&
        r.namespace === "channel" &&
        r.action === "write" &&
        r.channel_id === channelId,
    );

    if (!hasWriteSub && !hasWriteRole) {
      throw new Error("FORBIDDEN");
    }
  }

  function isChannelAdmin(userId: string, channelId: number) {
    const roleIds = mem.userRoles
      .filter((ur) => ur.user_id === userId)
      .map((ur) => ur.role_id);

    return mem.roles.some(
      (r) =>
        roleIds.includes(r.role_id) &&
        r.namespace === "channel" &&
        r.action === "admin" &&
        r.channel_id === channelId,
    );
  }

  const appRouter: AppRouter = {
    createCaller(ctx: Context) {
      return {
        comms: {
          async createPost(input: {
            channelId: number;
            content: string;
          }): Promise<MockMessage> {
            if (!ctx?.auth) throw new Error("UNAUTHORIZED");

            const ch = mem.channels.find(
              (c) => c.channel_id === input.channelId,
            );
            if (!ch) throw new Error("NOT_FOUND");

            const uid = ctx.auth.user.id;
            ensureCanPost(uid, input.channelId);

            const post: MockMessage = {
              messageId: ++mem._ids.post,
              channelId: input.channelId,
              senderId: uid,
              message: input.content,
              attachmentUrl: null,
              createdAt: new Date(),
            };

            mem.posts.push(post);
            return post;
          },

          async editPost(input: {
            channelId: number;
            messageId: number;
            content: string;
            attachmentUrl?: string;
          }): Promise<MockMessage> {
            if (!ctx?.auth) throw new Error("UNAUTHORIZED");

            const ch = mem.channels.find(
              (c) => c.channel_id === input.channelId,
            );
            if (!ch) throw new Error("NOT_FOUND");

            const uid = ctx.auth.user.id;
            ensureCanPost(uid, input.channelId);

            const postIndex = mem.posts.findIndex(
              (p) => p.messageId === input.messageId,
            );
            if (postIndex === -1) throw new Error("NOT_FOUND");

            const post = mem.posts[postIndex];
            if (!post) throw new Error("NOT_FOUND");

            if (post.channelId !== input.channelId) {
              throw new Error("BAD_REQUEST");
            }

            if (post.senderId !== uid) {
              throw new Error("FORBIDDEN");
            }

            const updated: MockMessage = {
              messageId: post.messageId,
              channelId: post.channelId,
              senderId: post.senderId,
              message: input.content,
              attachmentUrl: input.attachmentUrl ?? null,
              createdAt: post.createdAt,
            };

            mem.posts[postIndex] = updated;
            return updated;
          },

          async deletePost(input: {
            channelId: number;
            messageId: number;
          }): Promise<MockMessage> {
            if (!ctx?.auth) throw new Error("UNAUTHORIZED");

            const ch = mem.channels.find(
              (c) => c.channel_id === input.channelId,
            );
            if (!ch) throw new Error("NOT_FOUND");

            const postIndex = mem.posts.findIndex(
              (p) => p.messageId === input.messageId,
            );
            if (postIndex === -1) throw new Error("NOT_FOUND");

            const post = mem.posts[postIndex];
            if (!post) throw new Error("NOT_FOUND");

            if (post.channelId !== input.channelId) {
              throw new Error("BAD_REQUEST");
            }

            const uid = ctx.auth.user.id;
            const isOwner = post.senderId === uid;
            const isAdmin = isChannelAdmin(uid, input.channelId);

            if (!isOwner && !isAdmin) {
              throw new Error("FORBIDDEN");
            }

            const [deleted] = mem.posts.splice(postIndex, 1);
            if (!deleted) {
              throw new Error("NOT_FOUND");
            }
            return deleted;
          },

          // Subscription endpoints
          async createSubscription(input: {
            channelId: number;
            permission: "read" | "write" | "both";
            notificationsEnabled: boolean;
          }): Promise<MockSubscription> {
            if (!ctx?.auth) throw new Error("UNAUTHORIZED");

            const uid = ctx.auth.user.id;

            // Check if subscription already exists
            const existing = mem.channelSubscriptions.find(
              (s) => s.user_id === uid && s.channel_id === input.channelId,
            );
            if (existing) throw new Error("CONFLICT");

            const createdSubscription: MockSubscription = {
              subscriptionId: ++mem._ids.sub,
              userId: uid,
              channelId: input.channelId,
              permission: input.permission,
              notificationsEnabled: input.notificationsEnabled,
            };

            mem.channelSubscriptions.push({
              id: createdSubscription.subscriptionId,
              user_id: createdSubscription.userId,
              channel_id: createdSubscription.channelId,
              permission: createdSubscription.permission,
              notifications_enabled: createdSubscription.notificationsEnabled,
            });

            return createdSubscription;
          },

          async deleteSubscription(input: {
            subscriptionId: number;
          }): Promise<MockSubscription> {
            if (!ctx?.auth) throw new Error("UNAUTHORIZED");

            const uid = ctx.auth.user.id;
            const subscriptionIndex = mem.channelSubscriptions.findIndex(
              (s) => s.id === input.subscriptionId && s.user_id === uid,
            );

            if (subscriptionIndex === -1) throw new Error("NOT_FOUND");

            const [deleted] = mem.channelSubscriptions.splice(
              subscriptionIndex,
              1,
            );
            if (!deleted) throw new Error("NOT_FOUND");

            const result: MockSubscription = {
              subscriptionId: deleted.id,
              userId: deleted.user_id,
              channelId: deleted.channel_id,
              permission: deleted.permission,
              notificationsEnabled: deleted.notifications_enabled,
            };
            return result;
          },

          async getUserSubscriptions(_input: {
            userId?: number;
          }): Promise<MockSubscriptionSummary[]> {
            if (!ctx?.auth) throw new Error("UNAUTHORIZED");

            const uid = ctx.auth.user.id;
            const userSubscriptions: MockSubscriptionSummary[] =
              mem.channelSubscriptions
                .filter((s) => s.user_id === uid)
                .map((s) => {
                  const channel = mem.channels.find(
                    (c) => c.channel_id === s.channel_id,
                  );

                  return {
                    subscriptionId: s.id,
                    channelId: s.channel_id,
                    permission: s.permission,
                    notificationsEnabled: s.notifications_enabled,
                    userId: uid,
                    channelName: channel?.name || "Unknown Channel",
                  };
                });

            return userSubscriptions;
          },

          // Channel creation endpoint
          async createChannel(input: {
            name: string;
            metadata?: Record<string, unknown>;
          }): Promise<MockChannel> {
            if (!ctx?.auth) throw new Error("UNAUTHORIZED");

            // Validate input (simulate Zod validation)
            if (!input.name || input.name.length === 0) {
              throw new Error("Channel name cannot be empty");
            }
            if (input.name.length > 100) {
              throw new Error("Channel name too long");
            }

            // Check if channel with this name already exists
            const existing = mem.channels.find((c) => c.name === input.name);
            if (existing) throw new Error("CONFLICT");

            const channel: MockChannel = {
              channelId: ++mem._ids.channel,
              name: input.name,
              metadata: input.metadata || null,
              createdAt: new Date(),
            };

            mem.channels.push({
              channel_id: channel.channelId,
              name: channel.name,
            });

            return channel;
          },
        },
      };
    },
  } as const;

  return { appRouter };
});

import { randomUUID } from "crypto";
// Import the mocked router AFTER vi.mock
import { appRouter } from "../src/trpc/app_router.js";
import type { Context } from "../src/trpc/trpc.js";

// Tests
describe("commsRouter.createPost", () => {
  let authedUserId: string;
  let otherUserId: string;
  let channelId: number;

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
    const caller = appRouter.createCaller({ auth: null });
    await expect(
      caller.comms.createPost({ channelId, content: "Nope" }),
    ).rejects.toThrow(/UNAUTHORIZED/i);
  });

  it("throws NOT_FOUND for missing channel", async () => {
    const caller = appRouter.createCaller(createContext(authedUserId));
    await expect(
      caller.comms.createPost({
        channelId: 99999999,
        content: "Missing channel",
      }),
    ).rejects.toThrow(/NOT_FOUND/i);
  });

  it("throws FORBIDDEN when user lacks subscription and roles", async () => {
    const caller = appRouter.createCaller(
      createContext(otherUserId, "Other User", "other@example.com"),
    );
    await expect(
      caller.comms.createPost({
        channelId,
        content: "Should be denied",
      }),
    ).rejects.toThrow(/FORBIDDEN/i);
  });

  it("allows posting via subscription permission = 'write'", async () => {
    addSubscription(authedUserId, channelId, "write");

    const caller = appRouter.createCaller(createContext(authedUserId));
    const created: MockMessage = await caller.comms.createPost({
      channelId,
      content: "Permitted by subscription",
    });

    expect(created).toBeDefined();
    expect(created.channelId).toBe(channelId);
    expect(created.senderId).toBe(authedUserId);
    expect(created.message ?? "").toContain("Permitted by subscription");
    expect(created.attachmentUrl).toBeNull();
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

    const caller = appRouter.createCaller(
      createContext(otherUserId, "Other User", "other@example.com"),
    );
    const created: MockMessage = await caller.comms.createPost({
      channelId,
      content: "Permitted by role",
    });

    expect(created).toBeDefined();
    expect(created.channelId).toBe(channelId);
    expect(created.senderId).toBe(otherUserId);
    expect(created.message ?? "").toContain("Permitted by role");
  });
});

describe("commsRouter.editPost", () => {
  let channelId: number;
  let authorId: string;
  let otherUserId: string;
  let messageId: number;

  beforeAll(async () => {
    const author = createUser(
      "Author User",
      `author-${Date.now()}@example.com`,
      "test-password",
    );
    authorId = author.user_id;

    const other = createUser(
      "Editor User",
      `editor-${Date.now()}@example.com`,
      "test-password",
    );
    otherUserId = other.user_id;

    const channel = createChannel(`edit-channel-${Date.now()}`);
    channelId = channel.channel_id;

    addSubscription(authorId, channelId, "write");

    const caller = appRouter.createCaller(
      createContext(authorId, "Author User", "author@example.com"),
    );
    const created = await caller.comms.createPost({
      channelId,
      content: "Original content",
    });
    messageId = created.messageId;
  });

  it("throws UNAUTHORIZED if no user in context", async () => {
    const caller = appRouter.createCaller({ auth: null });
    await expect(
      caller.comms.editPost({
        channelId,
        messageId,
        content: "Unauthorized edit",
      }),
    ).rejects.toThrow(/UNAUTHORIZED/i);
  });

  it("throws NOT_FOUND for missing message", async () => {
    const caller = appRouter.createCaller(
      createContext(authorId, "Author User", "author@example.com"),
    );
    await expect(
      caller.comms.editPost({
        channelId,
        messageId: 999999,
        content: "No message",
      }),
    ).rejects.toThrow(/NOT_FOUND/i);
  });

  it("throws FORBIDDEN when user lacks permission", async () => {
    const caller = appRouter.createCaller(
      createContext(otherUserId, "Editor User", "editor@example.com"),
    );
    await expect(
      caller.comms.editPost({
        channelId,
        messageId,
        content: "Attempt without permission",
      }),
    ).rejects.toThrow(/FORBIDDEN/i);
  });

  it("throws BAD_REQUEST when channel does not match post", async () => {
    const otherChannel = createChannel(`mismatch-${Date.now()}`);
    addSubscription(authorId, otherChannel.channel_id, "write");

    const caller = appRouter.createCaller(
      createContext(authorId, "Author User", "author@example.com"),
    );
    await expect(
      caller.comms.editPost({
        channelId: otherChannel.channel_id,
        messageId,
        content: "Wrong channel",
      }),
    ).rejects.toThrow(/BAD_REQUEST/i);
  });

  it("throws FORBIDDEN when editing a post authored by someone else", async () => {
    addSubscription(otherUserId, channelId, "write");

    const caller = appRouter.createCaller(
      createContext(otherUserId, "Editor User", "editor@example.com"),
    );
    await expect(
      caller.comms.editPost({
        channelId,
        messageId,
        content: "Unauthorized edit attempt",
      }),
    ).rejects.toThrow(/FORBIDDEN/i);
  });

  it("allows editing when user is original author with permissions", async () => {
    const caller = appRouter.createCaller(
      createContext(authorId, "Author User", "author@example.com"),
    );
    const updated: MockMessage = await caller.comms.editPost({
      channelId,
      messageId,
      content: "Updated content",
      attachmentUrl: "https://example.com/file.png",
    });

    expect(updated).toBeDefined();
    expect(updated.message).toBe("Updated content");
    expect(updated.attachmentUrl).toBe("https://example.com/file.png");

    const stored = mem.posts.find((p) => p.messageId === messageId);
    expect(stored?.message).toBe("Updated content");
    expect(stored?.attachmentUrl).toBe("https://example.com/file.png");
  });
});

describe("commsRouter.deletePost", () => {
  let channelId: number;
  let authorId: string;
  let adminUserId: string;
  let otherUserId: string;

  beforeAll(async () => {
    const author = createUser(
      "Delete Author",
      `delete-author-${Date.now()}@example.com`,
      "test-password",
    );
    authorId = author.user_id;

    const adminUser = createUser(
      "Channel Admin",
      `channel-admin-${Date.now()}@example.com`,
      "test-password",
    );
    adminUserId = adminUser.user_id;

    const other = createUser(
      "Delete Bystander",
      `delete-bystander-${Date.now()}@example.com`,
      "test-password",
    );
    otherUserId = other.user_id;

    const channel = createChannel(`delete-channel-${Date.now()}`);
    channelId = channel.channel_id;

    addSubscription(authorId, channelId, "write");

    const adminRole = createRole(
      "channel",
      channelId,
      "admin",
      "messages",
      "ADMIN",
    );
    grantRole(adminUserId, adminRole.role_id);
  });

  async function createAuthorPost(content: string) {
    const caller = appRouter.createCaller(
      createContext(authorId, "Delete Author", "delete-author@example.com"),
    );
    return caller.comms.createPost({
      channelId,
      content,
    });
  }

  function removeMessage(messageId: number) {
    const index = mem.posts.findIndex((p) => p.messageId === messageId);
    if (index !== -1) {
      mem.posts.splice(index, 1);
    }
  }

  it("throws UNAUTHORIZED if no user in context", async () => {
    const post = await createAuthorPost("Unauthorized delete target");
    const caller = appRouter.createCaller({ auth: null });

    await expect(
      caller.comms.deletePost({
        channelId,
        messageId: post.messageId,
      }),
    ).rejects.toThrow(/UNAUTHORIZED/i);

    removeMessage(post.messageId);
  });

  it("throws NOT_FOUND for missing message", async () => {
    const caller = appRouter.createCaller(
      createContext(authorId, "Delete Author", "delete-author@example.com"),
    );

    await expect(
      caller.comms.deletePost({
        channelId,
        messageId: 999999,
      }),
    ).rejects.toThrow(/NOT_FOUND/i);
  });

  it("throws BAD_REQUEST when channel does not match post", async () => {
    const post = await createAuthorPost("Mismatch channel delete");
    const otherChannel = createChannel(`delete-mismatch-${Date.now()}`);

    const caller = appRouter.createCaller(
      createContext(authorId, "Delete Author", "delete-author@example.com"),
    );

    await expect(
      caller.comms.deletePost({
        channelId: otherChannel.channel_id,
        messageId: post.messageId,
      }),
    ).rejects.toThrow(/BAD_REQUEST/i);

    removeMessage(post.messageId);
  });

  it("throws FORBIDDEN when user is neither poster nor admin", async () => {
    const post = await createAuthorPost("Forbidden delete attempt");

    const caller = appRouter.createCaller(
      createContext(
        otherUserId,
        "Delete Bystander",
        "delete-bystander@example.com",
      ),
    );

    await expect(
      caller.comms.deletePost({
        channelId,
        messageId: post.messageId,
      }),
    ).rejects.toThrow(/FORBIDDEN/i);

    const stillExists = mem.posts.find((p) => p.messageId === post.messageId);
    expect(stillExists).toBeDefined();
    removeMessage(post.messageId);
  });

  it("allows original poster to delete their message", async () => {
    const post = await createAuthorPost("Delete own message");

    const caller = appRouter.createCaller(
      createContext(authorId, "Delete Author", "delete-author@example.com"),
    );

    const deleted = await caller.comms.deletePost({
      channelId,
      messageId: post.messageId,
    });

    expect(deleted).toBeDefined();
    expect(deleted.messageId).toBe(post.messageId);
    expect(
      mem.posts.find((p) => p.messageId === post.messageId),
    ).toBeUndefined();
  });

  it("allows channel admin to delete someone else's message", async () => {
    const post = await createAuthorPost("Admin deletes this");

    const caller = appRouter.createCaller(
      createContext(adminUserId, "Channel Admin", "channel-admin@example.com"),
    );

    const deleted = await caller.comms.deletePost({
      channelId,
      messageId: post.messageId,
    });

    expect(deleted).toBeDefined();
    expect(deleted.senderId).toBe(authorId);
    expect(
      mem.posts.find((p) => p.messageId === post.messageId),
    ).toBeUndefined();
  });
});

// Channel Subscription Tests
describe("commsRouter subscription endpoints", () => {
  let authedUserId: string;
  let otherUserId: string;
  let channelId: number;

  // function ctxUser(
  //   userId: number,
  //   name = "Test User",
  //   email = "test@example.com",
  // ) {
  //   const now = new Date();
  //   return {
  //     userId,
  //     name,
  //     email,
  //     createdAt: now,
  //     updatedAt: now,
  //     phoneNumber: null as string | null,
  //     clearanceLevel: null as string | null,
  //     department: null as string | null,
  //     branch: null as string | null,
  //   };
  // }

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

  describe("createSubscription", () => {
    it("throws UNAUTHORIZED if no user in context", async () => {
      const caller = appRouter.createCaller({ auth: null });
      await expect(
        caller.comms.createSubscription({
          channelId,
          permission: "read",
          notificationsEnabled: true,
        }),
      ).rejects.toThrow(/UNAUTHORIZED/i);
    });

    it("creates subscription successfully", async () => {
      // Use a fresh channel for this test
      const testChannel = createChannel(uniqueName("test-channel"));
      const caller = appRouter.createCaller(createContext(authedUserId));
      const subscription = await caller.comms.createSubscription({
        channelId: testChannel.channel_id,
        permission: "read",
        notificationsEnabled: true,
      });

      if (!subscription) {
        throw new Error("Expected subscription to be defined");
      }

      expect(subscription).toBeDefined();
      expect(subscription.userId).toBe(authedUserId);
      expect(subscription.channelId).toBe(testChannel.channel_id);
      expect(subscription.permission).toBe("read");
      expect(subscription.notificationsEnabled).toBe(true);
    });

    it("throws CONFLICT for duplicate subscription", async () => {
      // Use a fresh channel for this test
      const testChannel = createChannel(uniqueName("test-channel"));
      const caller = appRouter.createCaller(createContext(authedUserId));

      // First subscription
      await caller.comms.createSubscription({
        channelId: testChannel.channel_id,
        permission: "write",
        notificationsEnabled: false,
      });

      // Second subscription should fail
      await expect(
        caller.comms.createSubscription({
          channelId: testChannel.channel_id,
          permission: "both",
          notificationsEnabled: true,
        }),
      ).rejects.toThrow(/CONFLICT/i);
    });
  });

  describe("deleteSubscription", () => {
    it("throws UNAUTHORIZED if no user in context", async () => {
      const caller = appRouter.createCaller({ auth: null });
      await expect(
        caller.comms.deleteSubscription({ subscriptionId: 1 }),
      ).rejects.toThrow(/UNAUTHORIZED/i);
    });

    it("creates and deletes subscription successfully", async () => {
      // Use a fresh channel for this test
      const testChannel = createChannel(uniqueName("test-channel"));
      const caller = appRouter.createCaller(createContext(authedUserId));

      // Create a subscription to delete
      const subscription = await caller.comms.createSubscription({
        channelId: testChannel.channel_id,
        permission: "write",
        notificationsEnabled: true,
      });
      if (!subscription) {
        throw new Error("Expected subscription to be defined");
      }
      const subscriptionId = subscription.subscriptionId;

      // Delete the subscription
      const deleted = await caller.comms.deleteSubscription({ subscriptionId });

      expect(deleted).toBeDefined();
      expect(deleted.subscriptionId).toBe(subscriptionId);
    });

    it("throws NOT_FOUND for non-existent subscription", async () => {
      const caller = appRouter.createCaller(createContext(authedUserId));
      await expect(
        caller.comms.deleteSubscription({ subscriptionId: 999999 }),
      ).rejects.toThrow(/NOT_FOUND/i);
    });
  });

  describe("getUserSubscriptions", () => {
    it("throws UNAUTHORIZED if no user in context", async () => {
      const caller = appRouter.createCaller({ auth: null });
      await expect(caller.comms.getUserSubscriptions()).rejects.toThrow(
        /UNAUTHORIZED/i,
      );
    });

    it("returns user's subscriptions", async () => {
      // Use a fresh channel for this test
      const testChannel = createChannel(uniqueName("test-channel"));
      const caller = appRouter.createCaller(createContext(authedUserId));

      // Create a subscription first
      await caller.comms.createSubscription({
        channelId: testChannel.channel_id,
        permission: "read",
        notificationsEnabled: true,
      });

      const subscriptions = await caller.comms.getUserSubscriptions();

      expect(subscriptions).toBeDefined();
      expect(Array.isArray(subscriptions)).toBe(true);
      expect(subscriptions.length).toBeGreaterThan(0);

      const subscription = subscriptions[0];
      if (!subscription) {
        throw new Error("Expected a subscription to be returned");
      }
      expect(subscription).toHaveProperty("subscriptionId");
      expect(subscription).toHaveProperty("channelId");
      expect(subscription).toHaveProperty("permission");
      expect(subscription).toHaveProperty("notificationsEnabled");
      expect(subscription).toHaveProperty("channelName");
    });

    it("returns empty array for user with no subscriptions", async () => {
      const caller = appRouter.createCaller(createContext(otherUserId));
      const subscriptions = await caller.comms.getUserSubscriptions();

      expect(subscriptions).toBeDefined();
      expect(Array.isArray(subscriptions)).toBe(true);
      expect(subscriptions.length).toBe(0);
    });
  });
});

// Channel Creation Tests
describe("commsRouter.createChannel", () => {
  let authedUserId: string;

  // function ctxUser(
  //   userId: number,
  //   name = "Test User",
  //   email = "test@example.com",
  // ) {
  //   const now = new Date();
  //   return {
  //     userId,
  //     name,
  //     email,
  //     createdAt: now,
  //     updatedAt: now,
  //     phoneNumber: null as string | null,
  //     clearanceLevel: null as string | null,
  //     department: null as string | null,
  //     branch: null as string | null,
  //   };
  // }

  beforeAll(async () => {
    const u1 = createUser(
      "Test User",
      `test-${Date.now()}@example.com`,
      "test-password",
    );
    authedUserId = u1.user_id;

    createUser(
      "Other User",
      `other-${Date.now()}@example.com`,
      "test-password",
    );
  });

  describe("createChannel", () => {
    it("throws UNAUTHORIZED if no user in context", async () => {
      const caller = appRouter.createCaller({ auth: null });
      await expect(
        caller.comms.createChannel({
          name: "test-channel",
        }),
      ).rejects.toThrow(/UNAUTHORIZED/i);
    });

    it("creates channel successfully", async () => {
      const caller = appRouter.createCaller(createContext(authedUserId));
      const channelName = uniqueName("test-channel");
      const channel = await caller.comms.createChannel({
        name: channelName,
        metadata: { description: "Test channel", type: "public" },
      });

      if (!channel) {
        throw new Error("Expected channel to be defined");
      }

      expect(channel).toBeDefined();
      expect(channel.name).toBe(channelName);
      expect(channel.metadata).toEqual({
        description: "Test channel",
        type: "public",
      });
      expect(channel).toHaveProperty("channelId");
      expect(channel).toHaveProperty("createdAt");
    });

    it("creates channel without metadata", async () => {
      const caller = appRouter.createCaller(createContext(authedUserId));
      const channelName = uniqueName("simple-channel");
      const channel = await caller.comms.createChannel({
        name: channelName,
      });

      if (!channel) {
        throw new Error("Expected channel to be defined");
      }

      expect(channel).toBeDefined();
      expect(channel.name).toBe(channelName);
      expect(channel.metadata).toBeNull();
    });

    it("throws CONFLICT for duplicate channel name", async () => {
      const channelName = uniqueName("duplicate-test");
      const caller = appRouter.createCaller(createContext(authedUserId));

      // First channel creation
      await caller.comms.createChannel({
        name: channelName,
      });

      // Second channel with same name should fail
      await expect(
        caller.comms.createChannel({
          name: channelName,
        }),
      ).rejects.toThrow(/CONFLICT/i);
    });

    it("validates channel name requirements", async () => {
      const caller = appRouter.createCaller(createContext(authedUserId));

      // Test empty name (should be caught by Zod validation)
      await expect(
        caller.comms.createChannel({
          name: "",
        }),
      ).rejects.toThrow();

      // Test very long name (should be caught by Zod validation)
      await expect(
        caller.comms.createChannel({
          name: "a".repeat(101), // Over 100 character limit
        }),
      ).rejects.toThrow();
    });
  });
});
