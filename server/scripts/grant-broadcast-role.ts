import { eq } from "drizzle-orm";
import { roles, userRoles, users } from "../src/data/db/schema.js";
import { db } from "../src/data/db/sql.js";

const roleKey = "global:broadcast:create";
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
