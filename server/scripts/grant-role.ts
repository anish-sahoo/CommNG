import { eq } from "drizzle-orm";
import { connectRedis, disconnectRedis } from "../src/data/db/redis.js";
import { users } from "../src/data/db/schema.js";
import { connectPostgres, db, shutdownPostgres } from "../src/data/db/sql.js";
import { AuthRepository } from "../src/data/repository/auth-repo.js";
import type { RoleKey } from "../src/data/roles.js";

/**
 * Usage:
 *   npx dotenv -e .env -- tsx scripts/grant-role.ts admin@admin.admin reporting:admin
 * The script ensures the role exists and adds it to the user.
 */

async function grantRole() {
  const emailArg = process.argv[2];
  const roleKeyArg = process.argv[3];

  if (!emailArg || !roleKeyArg) {
    console.error(
      "Usage: tsx scripts/grant-role.ts <user-email> <role-key>\nExample: tsx scripts/grant-role.ts admin@admin.admin reporting:admin",
    );
    process.exit(1);
  }

  await connectRedis();
  await connectPostgres();
  const authRepo = new AuthRepository();

  const email = emailArg.toLowerCase().trim();
  const roleKey = roleKeyArg as RoleKey;

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    console.error(`User with email ${email} not found.`);
    process.exit(1);
  }

  const roleId = await authRepo.getRoleId(roleKey);
  if (!roleId) {
    console.error(
      `Role ${roleKey} was not found. Run scripts/create-roles.ts first.`,
    );
    process.exit(1);
  }

  const granted = await authRepo.grantAccess(
    user.id,
    user.id,
    roleId,
    roleKey,
  );

  if (granted) {
    console.log(`Granted ${roleKey} to ${email}`);
  } else {
    console.error(`Failed to grant ${roleKey} to ${email}`);
    process.exit(1);
  }
}

grantRole()
  .catch((error) => {
    console.error("Failed to grant role:", error);
    process.exit(1);
  })
  .finally(async () => {
    await disconnectRedis();
    await shutdownPostgres();
  });
