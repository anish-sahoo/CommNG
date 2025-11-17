/**
 * Script: grant-broadcast-role.ts
 * --------------------------------
 * Grants the `broadcast:create` permission to a user by email. This uses the
 * role builder helper from `src/data/roles.ts` so the role key stays consistent.
 *
 * Example usage (loads environment from .env and runs with tsx):
 *
 *   npx dotenv -e .env -- tsx scripts/grant-broadcast-role.ts admin@your.company
 *
 * If you omit the email it will default to `admin@admin.admin` (useful for
 * local development).
 */
import { eq } from "drizzle-orm";
import { roles, userRoles, users } from "../src/data/db/schema.js";
import { db } from "../src/data/db/sql.js";
import { broadcastRole } from "../src/data/roles.js";

const roleKey = broadcastRole("create");
const userEmail = (process.argv[2] ?? "admin@admin.admin").toLowerCase();

async function main() {
  const [role] = await db
    .select({ roleId: roles.roleId })
    .from(roles)
    .where(eq(roles.roleKey, roleKey));

  if (!role) {
    console.error(
      `Role ${roleKey} not found. Make sure it exists in the roles table.`,
    );
    process.exit(1);
  }

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, userEmail));

  if (!user) {
    console.error(`Could not locate user with email ${userEmail}`);
    process.exit(1);
  }

  await db
    .insert(userRoles)
    .values({ userId: user.id, roleId: role.roleId })
    .onConflictDoNothing({ target: [userRoles.userId, userRoles.roleId] });

  console.log(`Granted ${roleKey} to ${userEmail}`);
}

main().catch((error) => {
  console.error("Failed to grant broadcast role", error);
  process.exit(1);
});
