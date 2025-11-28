import { eq } from "drizzle-orm";
import { connectRedis, disconnectRedis } from "../src/data/db/redis.js";
import { users } from "../src/data/db/schema.js";
import { connectPostgres, db, shutdownPostgres } from "../src/data/db/sql.js";
import { AuthRepository } from "../src/data/repository/auth-repo.js";
import { CommsRepository } from "../src/data/repository/comms-repo.js";
import { channelRole, type RoleKey } from "../src/data/roles.js";

/**
 * Create a channel and grant admin/post/read roles to a target user.
 *
 * Usage:
 *   npx dotenv -e .env -- tsx scripts/create-channel.ts "Channel Name" target@example.com "Optional description"
 *
 * Notes:
 * - Requires roles to exist (run scripts/create-roles.ts once if not).
 * - Creates channel as public (postPermissionLevel = "everyone") with description stored in metadata.
 */
async function main() {
  const channelName = process.argv[2];
  const targetEmail = process.argv[3];
  const description = process.argv[4] ?? "";
  const shouldGrantRoles = process.argv.includes("--grant");

  if (!channelName || !targetEmail) {
    console.error(
      'Usage: tsx scripts/create-channel.ts "Channel Name" target@example.com "Optional description"',
    );
    process.exit(1);
  }

  await connectRedis();
  await connectPostgres();

  const authRepo = new AuthRepository();
  const commsRepo = new CommsRepository();

  const email = targetEmail.toLowerCase().trim();
  const [user] = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    console.error(`User with email ${email} not found.`);
    process.exit(1);
  }

  console.log(`Creating channel "${channelName}" as public...`);
  const channel = await commsRepo.createChannel(
    channelName.trim(),
    {
      summary: description || undefined,
      description: description || undefined,
      type: "public",
    },
    "everyone",
  );
  if (!channel) {
    console.error("Channel creation failed; no channel returned.");
    process.exit(1);
  }
  console.log(`✓ Channel created with id ${channel.channelId}`);

  if (shouldGrantRoles) {
    console.log("Granting channel roles to target user…");
    const roleKeys = [
      channelRole("admin", channel.channelId),
      channelRole("post", channel.channelId),
      channelRole("read", channel.channelId),
    ] as const;

    for (const key of roleKeys) {
      const roleId =
        (await authRepo.getRoleId(key as RoleKey)) ??
        (
          await authRepo.createRole(
            key as RoleKey,
            key.split(":")[2] ?? "read",
            "channel",
            channel.channelId,
            "messages",
          )
        )?.roleId;

      if (!roleId) {
        console.error(`Failed to ensure role ${key}.`);
        continue;
      }

      const granted = await authRepo.grantAccess(
        user.id,
        user.id,
        roleId,
        key as RoleKey,
      );

      if (granted) {
        console.log(`✓ Granted ${key} to ${email}`);
      } else {
        console.error(`Failed to grant ${key} to ${email}`);
      }
    }
  } else {
    console.log(
      "Skipping role grants (pass --grant if you want to auto-assign channel roles).",
    );
  }

  console.log("\nDone!");
}

main()
  .catch((error) => {
    console.error("Error creating channel:", error);
    process.exit(1);
  })
  .finally(async () => {
    await disconnectRedis().catch(() => undefined);
    await shutdownPostgres();
  });
