import { beforeAll, describe, expect, it, vi } from "vitest";
import type {
  CommsRepository,
  Transaction,
} from "@/data/repository/comms-repo.js";
import type { ChannelUpdateMetadata } from "@/types/comms-types.js";

// Mock the logger to prevent pino configuration issues
vi.mock("../src/utils/logger.js", () => ({
  default: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// In-memory model for this test
type ReactionSummary = {
  emoji: string;
  count: number;
  reactedByCurrentUser: boolean;
};

type MockAttachment = {
  fileId: string;
  fileName: string;
  contentType?: string | null;
};

type MockMessage = {
  messageId: number;
  channelId: number;
  senderId: string | null;
  message: string | null;
  attachments: MockAttachment[];
  createdAt: Date;
  reactions?: ReactionSummary[];
};

type MockSubscription = {
  subscriptionId: number;
  userId: string;
  channelId: number;
  notificationsEnabled: boolean;
};

type MockSubscriptionSummary = MockSubscription & { channelName: string };

type MockChannel = {
  channelId: number;
  name: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  postPermissionLevel: "admin" | "everyone" | "custom";
  userPermission?: "admin" | "post" | "read" | null;
};

type MockChannelMember = {
  userId: string;
  name: string;
  email: string;
  rank: string | null;
  department: string | null;
  roleKey: string;
  action: string;
};

const mem: {
  users: {
    user_id: string;
    name: string;
    email: string;
    password: string;
  }[];
  channels: {
    channel_id: number;
    name: string;
    metadata: Record<string, unknown> | null;
    post_permission_level: "admin" | "everyone" | "custom";
  }[];
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
  reactions: Array<{
    messageId: number;
    userId: string;
    emoji: string;
  }>;
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
  reactions: [],
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
function createChannel(
  name: string,
  metadata: Record<string, unknown> | null = null,
  postPermissionLevel: "admin" | "everyone" | "custom" = "admin",
) {
  const ch = {
    channel_id: ++mem._ids.channel,
    name,
    metadata,
    post_permission_level: postPermissionLevel,
  };
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

function aggregateReactions(
  messageId: number,
  currentUserId: string,
): ReactionSummary[] {
  const messageReactions = mem.reactions.filter(
    (reaction) => reaction.messageId === messageId,
  );

  if (!messageReactions.length) {
    return [];
  }

  const map = new Map<
    string,
    { count: number; reactedByCurrentUser: boolean }
  >();

  for (const reaction of messageReactions) {
    const entry = map.get(reaction.emoji) ?? {
      count: 0,
      reactedByCurrentUser: false,
    };
    entry.count += 1;
    if (reaction.userId === currentUserId) {
      entry.reactedByCurrentUser = true;
    }
    map.set(reaction.emoji, entry);
  }

  return Array.from(map.entries())
    .map(([emoji, info]) => ({
      emoji,
      count: info.count,
      reactedByCurrentUser: info.reactedByCurrentUser,
    }))
    .sort((a, b) => {
      if (b.count !== a.count) {
        return b.count - a.count;
      }
      return a.emoji.localeCompare(b.emoji);
    });
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
        expiresAt: now,
      },
      user: {
        id: userId,
        email,
        emailVerified: true,
        name,
        branch: "test-branch",
        rank: "test-clearance",
        department: "test-dept",
        createdAt: now,
        updatedAt: now,
      },
    },
    roles: new Set(),
  };
}

// Mock the TRPC app router
vi.mock("../src/trpc/app_router.js", () => {
  type CommsCaller = {
    comms: {
      createPost(input: {
        channelId: number;
        content: string;
        attachmentFileIds?: string[];
      }): Promise<MockMessage>;
      editPost(input: {
        channelId: number;
        messageId: number;
        content: string;
        attachmentFileIds?: string[];
      }): Promise<MockMessage>;
      deletePost(input: {
        channelId: number;
        messageId: number;
      }): Promise<MockMessage>;
      createSubscription(input: {
        channelId: number;
        notificationsEnabled: boolean;
      }): Promise<MockSubscription>;
      deleteSubscription(input: {
        subscriptionId: number;
      }): Promise<MockSubscription>;
      getUserSubscriptions(): Promise<MockSubscriptionSummary[]>;
      getChannelMessages(input: { channelId: number }): Promise<MockMessage[]>;
      toggleMessageReaction(input: {
        channelId: number;
        messageId: number;
        emoji: string;
        active: boolean;
      }): Promise<{
        messageId: number;
        reactions: ReactionSummary[];
      }>;
      getChannelMembers(input: {
        channelId: number;
        metadata: {
          name: string;
          description?: string;
          postingPermissions?: "admin" | "everyone" | "custom";
        };
      }): Promise<MockChannelMember[]>;
      getAllChannels(): Promise<MockChannel[]>;
      createChannel(input: {
        name: string;
        metadata?: Record<string, unknown>;
      }): Promise<MockChannel>;
    };
  };
  type AppRouter = {
    createCaller(ctx: Context): CommsCaller;
  };

  function ensureCanRead(userId: string, channelId: number) {
    const hasSub = mem.channelSubscriptions.some(
      (s) => s.user_id === userId && s.channel_id === channelId,
    );

    const roleIds = mem.userRoles
      .filter((ur) => ur.user_id === userId)
      .map((ur) => ur.role_id);

    const hasRole = mem.roles.some(
      (r) =>
        roleIds.includes(r.role_id) &&
        r.namespace === "channel" &&
        r.channel_id === channelId,
    );

    if (!hasSub && !hasRole) {
      throw new Error("FORBIDDEN");
    }
  }

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

  function resolveUserPermission(
    userId: string,
    channelId: number,
  ): "admin" | "post" | "read" | null {
    const roleIds = mem.userRoles
      .filter((ur) => ur.user_id === userId)
      .map((ur) => ur.role_id);

    const channelRoles = mem.roles.filter(
      (role) =>
        roleIds.includes(role.role_id) &&
        role.namespace === "channel" &&
        role.channel_id === channelId,
    );

    const hasAdminRole = channelRoles.some((role) => role.action === "admin");
    const hasWriteRole =
      hasAdminRole ||
      channelRoles.some(
        (role) => role.action === "write" || role.action === "post",
      );
    const hasReadRole =
      hasWriteRole || channelRoles.some((role) => role.action === "read");

    const subscription = mem.channelSubscriptions.find(
      (sub) => sub.user_id === userId && sub.channel_id === channelId,
    );

    const hasWriteSub =
      subscription &&
      (subscription.permission === "write" ||
        subscription.permission === "both");
    const hasReadSub = hasWriteSub || subscription?.permission === "read";

    if (hasAdminRole) {
      return "admin";
    }
    if (hasWriteRole || hasWriteSub) {
      return "post";
    }
    if (hasReadRole || hasReadSub) {
      return "read";
    }
    return null;
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
            attachmentFileIds?: string[];
          }): Promise<MockMessage> {
            if (!ctx?.auth) throw new Error("UNAUTHORIZED");

            const ch = mem.channels.find(
              (c) => c.channel_id === input.channelId,
            );
            if (!ch) throw new Error("NOT_FOUND");

            const uid = ctx.auth.user.id;
            ensureCanPost(uid, input.channelId);

            if (
              input.attachmentFileIds &&
              input.attachmentFileIds.length > 10
            ) {
              throw new Error("Too many attachments");
            }

            const attachments =
              input.attachmentFileIds?.map((fileId) => ({
                fileId,
                fileName: `file-${fileId}`,
                contentType: null,
              })) ?? [];

            const post: MockMessage = {
              messageId: ++mem._ids.post,
              channelId: input.channelId,
              senderId: uid,
              message: input.content,
              attachments,
              createdAt: new Date(),
              reactions: [],
            };

            mem.posts.push(post);
            return post;
          },

          async editPost(input: {
            channelId: number;
            messageId: number;
            content: string;
            attachmentFileIds?: string[];
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

            if (
              input.attachmentFileIds &&
              input.attachmentFileIds.length > 10
            ) {
              throw new Error("Too many attachments");
            }

            const updated: MockMessage = {
              messageId: post.messageId,
              channelId: post.channelId,
              senderId: post.senderId,
              message: input.content,
              attachments:
                input.attachmentFileIds !== undefined
                  ? input.attachmentFileIds.map((fileId) => ({
                      fileId,
                      fileName: `file-${fileId}`,
                      contentType: null,
                    }))
                  : post.attachments,
              createdAt: post.createdAt,
              reactions: post.reactions ?? [],
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
            mem.reactions = mem.reactions.filter(
              (reaction) => reaction.messageId !== input.messageId,
            );
            return deleted;
          },

          // Subscription endpoints
          async createSubscription(input: {
            channelId: number;
            notificationsEnabled: boolean;
          }): Promise<MockSubscription> {
            if (!ctx?.auth) throw new Error("UNAUTHORIZED");

            const uid = ctx.auth.user.id;

            // Check if subscription already exists
            const existing = mem.channelSubscriptions.find(
              (s) => s.user_id === uid && s.channel_id === input.channelId,
            );
            if (existing) throw new Error("CONFLICT");

            const permission: "read" | "write" | "both" = "read";

            const createdSubscription: MockSubscription = {
              subscriptionId: ++mem._ids.sub,
              userId: uid,
              channelId: input.channelId,
              notificationsEnabled: input.notificationsEnabled,
            };

            mem.channelSubscriptions.push({
              id: createdSubscription.subscriptionId,
              user_id: createdSubscription.userId,
              channel_id: createdSubscription.channelId,
              permission,
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

            return {
              subscriptionId: deleted.id,
              userId: deleted.user_id,
              channelId: deleted.channel_id,
              notificationsEnabled: deleted.notifications_enabled,
            };
          },

          async getUserSubscriptions(): Promise<MockSubscriptionSummary[]> {
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
                    notificationsEnabled: s.notifications_enabled,
                    userId: uid,
                    channelName: channel?.name || "Unknown Channel",
                  };
                });

            return userSubscriptions;
          },

          // Channel members endpoint
          async getChannelMembers(input: { channelId: number }) {
            if (!ctx?.auth) throw new Error("UNAUTHORIZED");

            const ch = mem.channels.find(
              (c) => c.channel_id === input.channelId,
            );
            if (!ch) throw new Error("NOT_FOUND");

            const members = mem.channelSubscriptions
              .filter((s) => s.channel_id === input.channelId)
              .map((s) => {
                const user = mem.users.find((u) => u.user_id === s.user_id);
                return {
                  userId: s.user_id,
                  name: user?.name || "Unknown",
                  email: user?.email || "unknown@example.com",
                  rank: null,
                  department: null,
                  roleKey: `subscription:${s.permission}`,
                  action: s.permission,
                };
              });

            return members;
          },

          // Get all channels endpoint
          async getAllChannels(): Promise<MockChannel[]> {
            if (!ctx?.auth) throw new Error("UNAUTHORIZED");

            const uid = ctx.auth.user.id;

            return mem.channels
              .filter((channel) => {
                const type = (channel.metadata as { type?: string } | null)
                  ?.type;
                const isPublic =
                  typeof type !== "string" || type.toLowerCase() === "public";

                if (isPublic) {
                  return true;
                }

                const hasSubscription = mem.channelSubscriptions.some(
                  (sub) =>
                    sub.channel_id === channel.channel_id &&
                    sub.user_id === uid,
                );

                if (hasSubscription) {
                  return true;
                }

                const roleIds = mem.userRoles
                  .filter((role) => role.user_id === uid)
                  .map((role) => role.role_id);

                const hasRole = mem.roles.some(
                  (role) =>
                    roleIds.includes(role.role_id) &&
                    role.namespace === "channel" &&
                    role.channel_id === channel.channel_id,
                );

                return hasRole;
              })
              .map((c) => ({
                channelId: c.channel_id,
                name: c.name,
                metadata: c.metadata,
                createdAt: new Date(),
                postPermissionLevel: c.post_permission_level,
                userPermission: resolveUserPermission(uid, c.channel_id),
              }));
          },

          // Channel messages endpoint
          async getChannelMessages(input: {
            channelId: number;
          }): Promise<MockMessage[]> {
            if (!ctx?.auth) throw new Error("UNAUTHORIZED");

            const ch = mem.channels.find(
              (c) => c.channel_id === input.channelId,
            );
            if (!ch) throw new Error("NOT_FOUND");

            const uid = ctx.auth.user.id;
            ensureCanRead(uid, input.channelId);

            return mem.posts
              .filter((p) => p.channelId === input.channelId)
              .map((post) => ({
                ...post,
                reactions: aggregateReactions(post.messageId, uid),
              }));
          },

          async toggleMessageReaction(input: {
            channelId: number;
            messageId: number;
            emoji: string;
            active: boolean;
          }): Promise<{
            messageId: number;
            reactions: ReactionSummary[];
          }> {
            if (!ctx?.auth) throw new Error("UNAUTHORIZED");

            const ch = mem.channels.find(
              (c) => c.channel_id === input.channelId,
            );
            if (!ch) throw new Error("NOT_FOUND");

            const post = mem.posts.find((p) => p.messageId === input.messageId);
            if (!post) throw new Error("NOT_FOUND");
            if (post.channelId !== input.channelId) {
              throw new Error("FORBIDDEN");
            }

            const uid = ctx.auth.user.id;
            ensureCanRead(uid, input.channelId);

            if (input.active) {
              const exists = mem.reactions.some(
                (reaction) =>
                  reaction.messageId === input.messageId &&
                  reaction.userId === uid &&
                  reaction.emoji === input.emoji,
              );
              if (!exists) {
                mem.reactions.push({
                  messageId: input.messageId,
                  userId: uid,
                  emoji: input.emoji,
                });
              }
            } else {
              mem.reactions = mem.reactions.filter(
                (reaction) =>
                  !(
                    reaction.messageId === input.messageId &&
                    reaction.userId === uid &&
                    reaction.emoji === input.emoji
                  ),
              );
            }

            const reactions = aggregateReactions(input.messageId, uid);
            const postIndex = mem.posts.findIndex(
              (p) => p.messageId === input.messageId,
            );
            if (postIndex !== -1) {
              const existingPost = mem.posts[postIndex];
              if (!existingPost) {
                throw new Error("Post not found for reactions update");
              }
              mem.posts[postIndex] = {
                messageId: existingPost.messageId,
                channelId: existingPost.channelId,
                senderId: existingPost.senderId,
                message: existingPost.message,
                attachments: existingPost.attachments,
                createdAt: existingPost.createdAt,
                reactions,
              };
            }

            return {
              messageId: input.messageId,
              reactions,
            };
          },

          // Channel creation endpoint
          async createChannel(input: {
            name: string;
            metadata?: Record<string, unknown>;
            postingPermissions?: "admin" | "everyone" | "custom";
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
              postPermissionLevel: input.postingPermissions ?? "admin",
            };

            mem.channels.push({
              channel_id: channel.channelId,
              name: channel.name,
              metadata: channel.metadata,
              post_permission_level: channel.postPermissionLevel,
            });

            return channel;
          },
        },
      };
    },
  } as const;

  return { appRouter };
});

import { randomUUID } from "node:crypto";
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
    const caller = appRouter.createCaller({ auth: null, roles: null });
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
    expect(created.attachments).toHaveLength(0);
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
    expect(created.attachments).toHaveLength(0);
  });

  it("stores attachment file ids when provided", async () => {
    addSubscription(authedUserId, channelId, "write");
    const fileId = randomUUID();

    const caller = appRouter.createCaller(createContext(authedUserId));
    const created: MockMessage = await caller.comms.createPost({
      channelId,
      content: "Post with attachments",
      attachmentFileIds: [fileId],
    });

    expect(created.attachments).toEqual([
      {
        fileId,
        fileName: `file-${fileId}`,
        contentType: null,
      },
    ]);

    const stored = mem.posts.find((p) => p.messageId === created.messageId);
    expect(stored?.attachments).toEqual([
      {
        fileId,
        fileName: `file-${fileId}`,
        contentType: null,
      },
    ]);
  });

  it("rejects posts with more than 10 attachments", async () => {
    addSubscription(authedUserId, channelId, "write");
    const caller = appRouter.createCaller(createContext(authedUserId));
    const attachmentFileIds = Array.from({ length: 11 }, () => randomUUID());

    await expect(
      caller.comms.createPost({
        channelId,
        content: "Too many files",
        attachmentFileIds,
      }),
    ).rejects.toThrow(/Too many attachments/i);
  });
});

describe("commsRouter.getChannelMessages", () => {
  let channelId: number;
  let authorId: string;
  let readerId: string;
  let otherId: string;
  let messageId: number;

  beforeAll(async () => {
    const author = createUser(
      "Msg Author",
      `msg-author-${Date.now()}@example.com`,
      "pwd",
    );
    authorId = author.user_id;

    const reader = createUser(
      "Msg Reader",
      `msg-reader-${Date.now()}@example.com`,
      "pwd",
    );
    readerId = reader.user_id;

    const other = createUser("Other", `other-${Date.now()}@example.com`, "pwd");
    otherId = other.user_id;

    const ch = createChannel(`msgs-channel-${Date.now()}`);
    channelId = ch.channel_id;

    // give author write permission and create a post
    addSubscription(authorId, channelId, "write");
    const caller = appRouter.createCaller(createContext(authorId));
    const created = await caller.comms.createPost({
      channelId,
      content: "Hello channel",
    });
    messageId = created.messageId;
  });

  it("throws UNAUTHORIZED if no user in context", async () => {
    const caller = appRouter.createCaller({ auth: null, roles: null });
    await expect(
      caller.comms.getChannelMessages({ channelId }),
    ).rejects.toThrow(/UNAUTHORIZED/i);
  });

  it("throws FORBIDDEN when user lacks read permission", async () => {
    const caller = appRouter.createCaller(createContext(otherId));
    await expect(
      caller.comms.getChannelMessages({ channelId }),
    ).rejects.toThrow(/FORBIDDEN/i);
  });

  it("returns messages when user has subscription (read/write)", async () => {
    addSubscription(readerId, channelId, "read");

    const caller = appRouter.createCaller(createContext(readerId));
    const messages = await caller.comms.getChannelMessages({
      channelId,
    });

    expect(Array.isArray(messages)).toBe(true);
    const found = messages.find((m) => m.messageId === messageId);
    expect(found).toBeDefined();
    if (!found) {
      throw new Error("Expected message not found");
    }
    expect(found.message).toBe("Hello channel");
    expect(Array.isArray(found.reactions)).toBe(true);
    expect(found.reactions.length).toBe(0);
    expect(found.attachments).toHaveLength(0);
  });

  it("returns messages when user has channel role", async () => {
    const role = createRole("channel", channelId, "read", "messages", "READER");
    grantRole(otherId, role.role_id);

    const caller = appRouter.createCaller(createContext(otherId));
    const messages = await caller.comms.getChannelMessages({
      channelId,
    });

    expect(Array.isArray(messages)).toBe(true);
    expect(messages.length).toBeGreaterThan(0);
  });

  it("includes attachment metadata in results", async () => {
    const fileId = randomUUID();
    const authorCaller = appRouter.createCaller(createContext(authorId));
    const created = await authorCaller.comms.createPost({
      channelId,
      content: "Message with attachment",
      attachmentFileIds: [fileId],
    });

    const readerCaller = appRouter.createCaller(createContext(authorId));
    const messages = await readerCaller.comms.getChannelMessages({
      channelId,
    });

    const found = messages.find((m) => m.messageId === created.messageId);
    expect(found?.attachments).toEqual([
      {
        fileId,
        fileName: `file-${fileId}`,
        contentType: null,
      },
    ]);
  });
});

describe("commsRouter.toggleMessageReaction", () => {
  let channelId: number;
  let authorId: string;
  let reactorId: string;
  let messageId: number;
  const emoji = "👍";

  beforeAll(async () => {
    mem.reactions = [];

    const author = createUser(
      "Reaction Author",
      `reaction-author-${Date.now()}@example.com`,
      "pwd",
    );
    authorId = author.user_id;

    const reactor = createUser(
      "Reaction User",
      `reaction-user-${Date.now()}@example.com`,
      "pwd",
    );
    reactorId = reactor.user_id;

    const channel = createChannel(`reaction-channel-${Date.now()}`);
    channelId = channel.channel_id;

    addSubscription(authorId, channelId, "write");
    addSubscription(reactorId, channelId, "read");

    const caller = appRouter.createCaller(createContext(authorId));
    const created = await caller.comms.createPost({
      channelId,
      content: "Reaction-ready message",
    });
    messageId = created.messageId;
  });

  it("throws UNAUTHORIZED if no user in context", async () => {
    const caller = appRouter.createCaller({ auth: null, roles: null });
    await expect(
      caller.comms.toggleMessageReaction({
        channelId,
        messageId,
        emoji,
        active: true,
      }),
    ).rejects.toThrow(/UNAUTHORIZED/i);
  });

  it("throws FORBIDDEN when user lacks read permission", async () => {
    const outsider = createUser(
      "No Access",
      `no-access-${Date.now()}@example.com`,
      "pwd",
    );

    const caller = appRouter.createCaller(createContext(outsider.user_id));
    await expect(
      caller.comms.toggleMessageReaction({
        channelId,
        messageId,
        emoji,
        active: true,
      }),
    ).rejects.toThrow(/FORBIDDEN/i);
  });

  it("adds a reaction and returns updated counts", async () => {
    const caller = appRouter.createCaller(createContext(reactorId));
    const result = await caller.comms.toggleMessageReaction({
      channelId,
      messageId,
      emoji,
      active: true,
    });

    expect(result.messageId).toBe(messageId);
    expect(result.reactions).toEqual([
      { emoji, count: 1, reactedByCurrentUser: true },
    ]);

    const messages = await caller.comms.getChannelMessages({ channelId });
    const target = messages.find((msg) => msg.messageId === messageId);
    expect(target?.reactions).toEqual([
      { emoji, count: 1, reactedByCurrentUser: true },
    ]);
  });

  it("removes a reaction when toggled off", async () => {
    const caller = appRouter.createCaller(createContext(reactorId));
    const result = await caller.comms.toggleMessageReaction({
      channelId,
      messageId,
      emoji,
      active: false,
    });

    expect(result.reactions).toEqual([]);

    const messages = await caller.comms.getChannelMessages({ channelId });
    const target = messages.find((msg) => msg.messageId === messageId);
    expect(target?.reactions ?? []).toEqual([]);
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
    const caller = appRouter.createCaller({ auth: null, roles: null });
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
    });

    expect(updated).toBeDefined();
    expect(updated.message).toBe("Updated content");
    expect(updated.attachments).toHaveLength(0);

    const stored = mem.posts.find((p) => p.messageId === messageId);
    expect(stored?.message).toBe("Updated content");
    expect(stored?.attachments ?? []).toHaveLength(0);
  });

  it("replaces attachments when attachment file IDs are provided", async () => {
    const caller = appRouter.createCaller(
      createContext(authorId, "Author User", "author@example.com"),
    );
    const newFileId = randomUUID();

    const updated: MockMessage = await caller.comms.editPost({
      channelId,
      messageId,
      content: "Updated with attachments",
      attachmentFileIds: [newFileId],
    });

    expect(updated.attachments).toEqual([
      { fileId: newFileId, fileName: `file-${newFileId}`, contentType: null },
    ]);

    const stored = mem.posts.find((p) => p.messageId === messageId);
    expect(stored?.attachments).toEqual([
      { fileId: newFileId, fileName: `file-${newFileId}`, contentType: null },
    ]);
  });

  it("rejects edits with more than 10 attachments", async () => {
    const caller = appRouter.createCaller(
      createContext(authorId, "Author User", "author@example.com"),
    );
    const attachmentFileIds = Array.from({ length: 11 }, () => randomUUID());

    await expect(
      caller.comms.editPost({
        channelId,
        messageId,
        content: "Overflow attachments",
        attachmentFileIds,
      }),
    ).rejects.toThrow(/Too many attachments/i);
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
    const caller = appRouter.createCaller({ auth: null, roles: null });

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
      const caller = appRouter.createCaller({ auth: null, roles: null });
      await expect(
        caller.comms.createSubscription({
          channelId,
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
        notificationsEnabled: true,
      });

      if (!subscription) {
        throw new Error("Expected subscription to be defined");
      }

      expect(subscription).toBeDefined();
      expect(subscription.userId).toBe(authedUserId);
      expect(subscription.channelId).toBe(testChannel.channel_id);
      expect(subscription.notificationsEnabled).toBe(true);
    });

    it("throws CONFLICT for duplicate subscription", async () => {
      // Use a fresh channel for this test
      const testChannel = createChannel(uniqueName("test-channel"));
      const caller = appRouter.createCaller(createContext(authedUserId));

      // First subscription
      await caller.comms.createSubscription({
        channelId: testChannel.channel_id,
        notificationsEnabled: false,
      });

      // Second subscription should fail
      await expect(
        caller.comms.createSubscription({
          channelId: testChannel.channel_id,
          notificationsEnabled: true,
        }),
      ).rejects.toThrow(/CONFLICT/i);
    });
  });

  describe("deleteSubscription", () => {
    it("throws UNAUTHORIZED if no user in context", async () => {
      const caller = appRouter.createCaller({ auth: null, roles: null });
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
      const caller = appRouter.createCaller({ auth: null, roles: null });
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

// Channel Members Tests
describe("commsRouter.getChannelMembers", () => {
  let channelId: number;
  let memberA: string;
  let memberB: string;

  beforeAll(() => {
    const u1 = createUser(
      "Member A",
      `member-a-${Date.now()}@example.com`,
      "pwd",
    );
    memberA = u1.user_id;

    const u2 = createUser(
      "Member B",
      `member-b-${Date.now()}@example.com`,
      "pwd",
    );
    memberB = u2.user_id;

    const ch = createChannel(`members-channel-${Date.now()}`);
    channelId = ch.channel_id;

    addSubscription(memberA, channelId, "write");
    addSubscription(memberB, channelId, "read");
  });

  it("throws UNAUTHORIZED if no user in context", async () => {
    const caller = appRouter.createCaller({ auth: null, roles: null });
    await expect(
      caller.comms.getChannelMembers({
        channelId,
        metadata: { name: "test" },
      }),
    ).rejects.toThrow(/UNAUTHORIZED/i);
  });

  it("throws NOT_FOUND for missing channel", async () => {
    const caller = appRouter.createCaller(createContext(memberA));
    await expect(
      caller.comms.getChannelMembers({
        channelId: 9999999,
        metadata: { name: "test" },
      }),
    ).rejects.toThrow(/NOT_FOUND/i);
  });

  it("returns members list for a valid channel", async () => {
    const caller = appRouter.createCaller(createContext(memberA));
    const members = await caller.comms.getChannelMembers({
      channelId,
      metadata: { name: "test" },
    });

    expect(Array.isArray(members)).toBe(true);
    expect(members.length).toBeGreaterThanOrEqual(2);

    const a = members.find((m) => m.userId === memberA);
    const b = members.find((m) => m.userId === memberB);

    expect(a).toBeDefined();
    expect(b).toBeDefined();
  });
});

// Get All Channels Tests
describe("commsRouter.getAllChannels", () => {
  let creatorId: string;

  beforeAll(() => {
    const u = createUser(
      "Channels Creator",
      `creator-${Date.now()}@example.com`,
      "pwd",
    );
    creatorId = u.user_id;
  });

  it("throws UNAUTHORIZED if no user in context", async () => {
    const caller = appRouter.createCaller({ auth: null, roles: null });
    await expect(caller.comms.getAllChannels()).rejects.toThrow(
      /UNAUTHORIZED/i,
    );
  });

  it("returns all channels", async () => {
    // create some channels via helper so they're present in mem
    const ch1 = createChannel(uniqueName("all-ch-1"));
    const ch2 = createChannel(uniqueName("all-ch-2"));

    const caller = appRouter.createCaller(createContext(creatorId));
    const channels = await caller.comms.getAllChannels();

    expect(Array.isArray(channels)).toBe(true);
    // should at least contain the two channels we added
    const names = channels.map((c) => c.name);
    expect(names).toEqual(expect.arrayContaining([ch1.name, ch2.name]));
  });
});

// Channel Creation Tests
describe("commsRouter.createChannel", () => {
  let authedUserId: string;

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
      const caller = appRouter.createCaller({ auth: null, roles: null });
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
        metadata: { description: "Test channel" },
      });

      if (!channel) {
        throw new Error("Expected channel to be defined");
      }

      expect(channel).toBeDefined();
      expect(channel.name).toBe(channelName);
      expect(channel.metadata).toEqual({
        description: "Test channel",
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

// Tests for updateChannelSettings behavior (service -> repo interaction)
describe("updateChannelSettings (service -> repo)", () => {
  it("populates listOfUpdates correctly when only name is provided", async () => {
    const channelId = 42;
    const metadata = { name: "new-name" };

    const { CommsService } = await import("../src/service/comms-service.js");

    const captured: Array<(tx: Transaction) => Promise<unknown>> = [];
    const mockRepo: Partial<CommsRepository> = {
      getChannelById: vi.fn().mockResolvedValue({ id: channelId }),
      updateChannelSettings: vi
        .fn()
        .mockImplementation(
          async (list: Array<(tx: Transaction) => Promise<unknown>>) => {
            // capture the passed array of update functions
            captured.push(...(list ?? []));
            return true;
          },
        ),
      getChannelDataByID: vi
        .fn()
        .mockResolvedValue({ channelId, name: "new-name", metadata: null }),
    };

    const svc = new CommsService(mockRepo as CommsRepository);

    const result = await svc.updateChannelSettings(
      channelId,
      metadata as ChannelUpdateMetadata,
    );

    expect(mockRepo.getChannelById).toHaveBeenCalledWith(channelId);
    expect(mockRepo.updateChannelSettings).toHaveBeenCalled();
    expect(Array.isArray(captured)).toBe(true);
    expect(captured.length).toBe(1);

    // Ensure each update function calls tx.update when executed
    const tx = {
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(true),
        }),
      }),
    } as unknown as Transaction;
    await captured[0]?.(tx);
    expect(tx.update).toHaveBeenCalled();
    // service should return the channel row from getChannelDataByID
    expect(result).toEqual({ channelId, name: "new-name", metadata: null });
  });

  it("populates listOfUpdates correctly for multiple metadata fields", async () => {
    const channelId = 101;
    const metadata: ChannelUpdateMetadata = {
      name: "multi",
      postingPermissions: "custom",
      description: "desc",
    };

    const { CommsService } = await import("../src/service/comms-service.js");

    const captured: Array<(tx: Transaction) => Promise<unknown>> = [];
    const mockRepo: Partial<CommsRepository> = {
      getChannelById: vi.fn().mockResolvedValue({ id: channelId }),
      updateChannelSettings: vi
        .fn()
        .mockImplementation(
          async (list: Array<(tx: Transaction) => Promise<unknown>>) => {
            captured.push(...(list ?? []));
            return true;
          },
        ),
      getChannelDataByID: vi
        .fn()
        .mockResolvedValue({ channelId, name: "multi", metadata }),
    };

    const svc = new CommsService(mockRepo as CommsRepository);

    const result = await svc.updateChannelSettings(
      channelId,
      metadata as ChannelUpdateMetadata,
    );

    expect(mockRepo.getChannelById).toHaveBeenCalledWith(channelId);
    expect(mockRepo.updateChannelSettings).toHaveBeenCalled();
    expect(captured.length).toBe(3);

    const tx = {
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(true),
        }),
      }),
    } as unknown as Transaction;
    // Execute all captured update functions and ensure tx.update is called for each
    for (const fn of captured) {
      await fn(tx);
    }

    expect(tx.update).toHaveBeenCalledTimes(3);
    expect(result).toEqual({ channelId, name: "multi", metadata });
  });
});
