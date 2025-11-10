import { PolicyEngine } from "../src/service/policy-engine.js";
import { AuthRepository } from "../src/data/repository/auth-repo.js";
import { eq } from "drizzle-orm";
import { users } from "../src/data/db/schema.js";
import { db, shutdownPostgres } from "../src/data/db/sql.js";
import { connectRedis, disconnectRedis } from "../src/data/db/redis.js";
import log from "../src/utils/logger.js";

const channelIdArg = process.argv[2];
const userEmailArg = process.argv[3];
const permission = process.argv[4];

if (!channelIdArg || !userEmailArg || !permission) {
  console.error("Usage: npx tsx fix-channel-permissions.ts <channelId> <userEmail>");
  console.error("Example: npx tsx fix-channel-permissions.ts 31 admin@example.com");
  process.exit(1);
}

const channelId = channelIdArg;
const userEmail = userEmailArg;

async function main() {
  // Connect to Redis and Postgres
  await connectRedis();
  
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, userEmail.toLowerCase()));

  if (!user) {
    console.error(`Could not locate user with email ${userEmail}`);
    process.exit(1);
  }

  const authRepo = new AuthRepository();
  const policyEngine = new PolicyEngine(authRepo);

  const channelIdNum = Number.parseInt(channelId, 10);
  const roleKey = `channel:${channelIdNum}:${permission}`;
  
  console.log(`Granting ${roleKey} to ${userEmail} (${user.id})`);

  try {
    const result = await policyEngine.createRoleAndAssign(
      user.id,
      user.id,
      roleKey,
      permission!,
      "channel",
      channelIdNum,
    );

    if (result) {
      console.log(`✓ Successfully granted ${roleKey} to ${userEmail}`);
    } else {
      console.error(`✗ Failed to grant ${roleKey} to ${userEmail}`);
      process.exit(1);
    }
  } catch (error) {
    console.error("Error granting role:", error);
    process.exit(1);
  }
}

main()
  .then(() => {
    console.log("Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed to fix channel permissions", error);
    process.exit(1);
  })
  .finally(async () => {
    await disconnectRedis();
    await shutdownPostgres();
  });
