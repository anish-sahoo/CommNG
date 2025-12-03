/**
 * Script: clear-channel-roles.ts
 * -------------------------------
 * Removes channel-scoped roles for a user by email.
 *
 * Usage:
 *   # Remove ALL channel roles for the user
 *   npx tsx --env-file=.env scripts/clear-channel-roles.ts user@example.com
 *
 *   # Remove channel roles only for channel 1 and 2
 *   npx tsx --env-file=.env scripts/clear-channel-roles.ts user@example.com 1,2
 */
import { and, eq, inArray } from "drizzle-orm";
import { roles, userRoles, users } from "../src/data/db/schema.js";
import { connectPostgres, db, shutdownPostgres } from "../src/data/db/sql.js";

async function main() {
  const emailArg = process.argv[2];
  const channelArg = process.argv[3];

  if (!emailArg) {
    console.error(
      "Usage: npx tsx scripts/clear-channel-roles.ts <userEmail> [channelIdsCommaSeparated]",
    );
    process.exit(1);
  }

  const channelIds =
    channelArg && channelArg.length > 0
      ? channelArg
          .split(",")
          .map((c) => Number.parseInt(c.trim(), 10))
          .filter((n) => Number.isFinite(n))
      : [];

  await connectPostgres();

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, emailArg.toLowerCase()));

  if (!user) {
    console.error(`Could not find user with email ${emailArg}`);
    process.exit(1);
  }

  const roleRows = await db
    .select({
      roleId: roles.roleId,
      roleKey: roles.roleKey,
      channelId: roles.channelId,
    })
    .from(roles)
    .innerJoin(userRoles, eq(userRoles.roleId, roles.roleId))
    .where(
      and(
        eq(userRoles.userId, user.id),
        eq(roles.namespace, "channel"),
        channelIds.length > 0
          ? inArray(roles.channelId, channelIds)
          : eq(roles.channelId, roles.channelId), // no-op filter when no channelIds provided
      ),
    );

  if (roleRows.length === 0) {
    console.log("No matching channel roles to remove for this user.");
    process.exit(0);
  }

  const roleIds = roleRows.map((r) => r.roleId);
  const deleted = await db
    .delete(userRoles)
    .where(
      and(eq(userRoles.userId, user.id), inArray(userRoles.roleId, roleIds)),
    )
    .returning({ roleId: userRoles.roleId });

  console.log(
    `Removed ${deleted.length} channel role assignment(s) for ${emailArg}:`,
  );
  for (const row of roleRows) {
    console.log(`- ${row.roleKey}`);
  }
}

main()
  .catch((err) => {
    console.error("Failed to clear channel roles:", err);
    process.exit(1);
  })
  .finally(async () => {
    await shutdownPostgres();
  });
