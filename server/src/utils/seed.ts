import { randomUUID } from "node:crypto";
import { eq, inArray, sql } from "drizzle-orm";
import {
  channels,
  type NewRole,
  type NewUser,
  roles,
  userRoles,
  users,
} from "../data/db/schema.js";
import { db, shutdownPostgres } from "../data/db/sql.js";

interface RoleDefinition
  extends Omit<NewRole, "roleId" | "createdAt" | "updatedAt"> {
  roleKey: string;
}

interface RoleAssignment {
  userEmail: string;
  roleKey: string;
  assignedByEmail?: string;
}

type ChannelSeed = {
  name: string;
  metadata: Record<string, unknown>;
};

async function upsertUsers(seedUsers: NewUser[]) {
  await db
    .insert(users)
    .values(seedUsers)
    .onConflictDoUpdate({
      target: users.email,
      set: {
        name: sql`excluded.name`,
        phoneNumber: sql`excluded.phone_number`,
        clearanceLevel: sql`excluded.clearance_level`,
        department: sql`excluded.department`,
        branch: sql`excluded.branch`,
        updatedAt: sql`now()`,
      },
    });

  const userRows = await db
    .select({ userId: users.id, email: users.email })
    .from(users)
    .where(
      inArray(
        users.email,
        seedUsers.map((user) => user.email),
      ),
    );

  return new Map(userRows.map((row) => [row.email, row.userId]));
}

async function upsertChannels(seedChannels: ChannelSeed[]) {
  const channelMap = new Map<string, number>();

  for (const { name, metadata } of seedChannels) {
    const existing = await db
      .select({ channelId: channels.channelId })
      .from(channels)
      .where(eq(channels.name, name))
      .limit(1);

    if (existing.length > 0) {
      const channel = existing[0];
      if (!channel) throw new Error("channel not found");

      await db
        .update(channels)
        .set({ metadata })
        .where(eq(channels.channelId, channel.channelId));

      channelMap.set(name, channel.channelId);
      continue;
    }

    const [created] = await db
      .insert(channels)
      .values({ name, metadata })
      .returning({ channelId: channels.channelId });

    if (!created) {
      throw new Error(`Failed to create channel ${name}`);
    }

    channelMap.set(name, created.channelId);
  }

  return channelMap;
}

async function upsertRoles(seedRoles: RoleDefinition[]) {
  await db
    .insert(roles)
    .values(seedRoles)
    .onConflictDoUpdate({
      target: roles.roleKey,
      set: {
        namespace: sql`excluded.namespace`,
        subjectId: sql`excluded.subject_id`,
        action: sql`excluded.action`,
        channelId: sql`excluded.channel_id`,
        metadata: sql`excluded.metadata`,
        description: sql`excluded.description`,
        updatedAt: sql`now()`,
      },
    });

  const roleRows = await db
    .select({ roleId: roles.roleId, roleKey: roles.roleKey })
    .from(roles)
    .where(
      inArray(
        roles.roleKey,
        seedRoles.map((role) => role.roleKey),
      ),
    );

  return new Map(roleRows.map((row) => [row.roleKey, row.roleId]));
}

async function upsertUserRoles(
  assignments: RoleAssignment[],
  userMap: Map<string, string>,
  roleMap: Map<string, number>,
) {
  for (const assignment of assignments) {
    const userId = userMap.get(assignment.userEmail);
    if (userId === undefined) {
      throw new Error(`Missing seeded user for ${assignment.userEmail}`);
    }

    const roleId = roleMap.get(assignment.roleKey);
    if (roleId === undefined) {
      throw new Error(`Missing seeded role for ${assignment.roleKey}`);
    }

    const assignedBy = assignment.assignedByEmail
      ? (userMap.get(assignment.assignedByEmail) ?? null)
      : null;

    await db
      .insert(userRoles)
      .values({
        userId,
        roleId,
        assignedBy,
      })
      .onConflictDoUpdate({
        target: [userRoles.userId, userRoles.roleId],
        set: {
          assignedAt: sql`now()`,
          assignedBy,
        },
      });
  }
}

async function seed() {
  const usersToSeed: NewUser[] = [
    {
      id: randomUUID(),
      name: "Alice Johnson",
      email: "alice@example.com",
      phoneNumber: "555-0100",
      clearanceLevel: "Top Secret",
      department: "Operations",
      branch: "East",
    },
    {
      id: randomUUID(),
      name: "Brandon Smith",
      email: "brandon@example.com",
      phoneNumber: "555-0101",
      clearanceLevel: "Secret",
      department: "Intelligence",
      branch: "West",
    },
    {
      id: randomUUID(),
      name: "Chloe Martinez",
      email: "chloe@example.com",
      phoneNumber: "555-0102",
      clearanceLevel: "Top Secret",
      department: "Mentorship",
      branch: "North",
    },
  ];

  const channelsToSeed: ChannelSeed[] = [
    {
      name: "Operations",
      metadata: { description: "Operations command channel" },
    },
    {
      name: "Mentorship",
      metadata: { description: "Mentorship coordination channel" },
    },
  ];

  const userMap = await upsertUsers(usersToSeed);
  const channelMap = await upsertChannels(channelsToSeed);

  const opsChannelId = channelMap.get("Operations");
  const mentorshipChannelId = channelMap.get("Mentorship");

  if (opsChannelId === undefined || mentorshipChannelId === undefined) {
    throw new Error("Seeding prerequisites missing required IDs");
  }

  const rolesToSeed: RoleDefinition[] = [
    {
      namespace: "channel",
      subjectId: String(opsChannelId),
      action: "read",
      roleKey: `channel:${opsChannelId}:read`,
      channelId: opsChannelId,
      metadata: { channelName: "Operations", capability: "read" },
      description: "Read access to channel messages",
    },
    {
      namespace: "channel",
      subjectId: String(opsChannelId),
      action: "admin",
      roleKey: `channel:${opsChannelId}:admin`,
      channelId: opsChannelId,
      metadata: { channelName: "Operations", capability: "administration" },
      description: "Administrative privileges for the channel",
    },
    {
      namespace: "channel",
      subjectId: String(opsChannelId),
      action: "insert",
      roleKey: `channel:${opsChannelId}:insert`,
      channelId: opsChannelId,
      metadata: { channelName: "Operations", capability: "publish" },
      description: "Publish or insert new messages into the channel",
    },
    {
      namespace: "channel",
      subjectId: String(mentorshipChannelId),
      action: "read",
      roleKey: `channel:${mentorshipChannelId}:read`,
      channelId: mentorshipChannelId,
      metadata: { channelName: "Mentorship", capability: "read" },
      description: "Read access to channel messages",
    },
    {
      namespace: "mentor",
      subjectId: "mentorship",
      action: "mentor",
      roleKey: "mentor",
      channelId: null,
      metadata: { capability: "mentor-role" },
      description:
        "Identifies the user as a mentor with full mentorship privileges",
    },
    {
      namespace: "mentor",
      subjectId: "mentorship",
      action: "mentee",
      roleKey: "mentee",
      channelId: null,
      metadata: { capability: "mentee-role" },
      description: "Identifies the user as a mentee with mentorship access",
    },
  ];

  const roleMap = await upsertRoles(rolesToSeed);

  const assignments: RoleAssignment[] = [
    {
      userEmail: "alice@example.com",
      roleKey: `channel:${opsChannelId}:read`,
      assignedByEmail: "alice@example.com",
    },
    {
      userEmail: "brandon@example.com",
      roleKey: `channel:${opsChannelId}:read`,
      assignedByEmail: "alice@example.com",
    },
    {
      userEmail: "alice@example.com",
      roleKey: `channel:${opsChannelId}:admin`,
      assignedByEmail: "alice@example.com",
    },
    {
      userEmail: "alice@example.com",
      roleKey: `channel:${opsChannelId}:insert`,
      assignedByEmail: "alice@example.com",
    },
    {
      userEmail: "alice@example.com",
      roleKey: `channel:${mentorshipChannelId}:read`,
      assignedByEmail: "alice@example.com",
    },
    {
      userEmail: "chloe@example.com",
      roleKey: `channel:${mentorshipChannelId}:read`,
      assignedByEmail: "chloe@example.com",
    },
    {
      userEmail: "chloe@example.com",
      roleKey: "mentor",
      assignedByEmail: "chloe@example.com",
    },
    {
      userEmail: "brandon@example.com",
      roleKey: "mentee",
      assignedByEmail: "alice@example.com",
    },
  ];

  await upsertUserRoles(assignments, userMap, roleMap);
}

seed()
  .then(async () => {
    await shutdownPostgres();
    console.log("✅ Seed data applied successfully");
  })
  .catch(async (error) => {
    await shutdownPostgres();
    console.error("❌ Failed to seed database", error);
    process.exit(1);
  });
