/**
 * Script: create-roles.ts
 * ----------------------
 * Create all roles defined in `ROLE_HIERARCHIES` from `src/data/roles.ts`,
 * except for those that are channel-scoped (they require a numeric channel id)
 * or other roles that require a specific numeric id.
 *
 * This will create default "feature" roles such as `broadcast:create` and
 * `reporting:read` with a `subjectId` equal to the namespace to satisfy the
 * database constraint that non-global namespaces must provide a subject.
 *
 * Run example (loads .env):
 *
 *   npx dotenv -e .env -- tsx scripts/create-roles.ts
 *
 * This is idempotent: existing roles are skipped.
 */

import { ROLE_HIERARCHIES, broadcastRole, reportingRole, GLOBAL_ADMIN_KEY } from "../src/data/roles.js";
import { connectRedis, disconnectRedis } from "../src/data/db/redis.js";
import { connectPostgres, shutdownPostgres } from "../src/data/db/sql.js";
import { AuthRepository } from "../src/data/repository/auth-repo.js";
import type { RoleNamespace } from "../src/data/db/schema.js";

async function main() {
  await connectRedis();
  await connectPostgres();
  const authRepo = new AuthRepository();

  console.log("Starting role creation from ROLE_HIERARCHIES...");

  for (const [namespaceRaw, actions] of Object.entries(ROLE_HIERARCHIES) as [RoleNamespace, readonly string[]][]) {
    const namespace = namespaceRaw as RoleNamespace;

    // Skip channel-scoped roles since they require an id (e.g., channel:1:read)
    if (namespace === "channel") {
      console.log("Skipping channel namespace (requires numeric id)");
      continue;
    }

    // Skip if no actions are defined
    if (!actions || actions.length === 0) {
      console.log(`Skipping ${namespace}, no defined actions.`);
      continue;
    }

    for (const action of actions) {
      // Build roleKey for non-channel namespaces using helpers
      let roleKey: string;
      switch (namespace) {
        case "broadcast":
          // broadcast has only one action: "create"
          roleKey = broadcastRole(action as any);
          break;
        case "reporting":
          roleKey = reportingRole(action as any);
          break;
        case "global":
          roleKey = GLOBAL_ADMIN_KEY;
          break;
        default:
          // Unexpected namespace - fall back to "namespace:action" string
          roleKey = `${namespace}:${action}`;
      }

      const existingRoleId = await authRepo.getRoleId(roleKey as any);
      if (existingRoleId !== null) {
        console.log(`Role already exists: ${roleKey} (role id ${existingRoleId})`);
        continue;
      }

      const subjectId = namespace === "global" ? null : namespace;

      console.log(`Creating role: ${roleKey} (namespace=${namespace}, action=${action})`);

      const newRole = await authRepo.createRole(
        roleKey as any,
        action,
        namespace,
        undefined,
        subjectId,
      );

      if (newRole) {
        console.log("=> Created role", roleKey);
      } else {
        console.error("=> Failed to create role", roleKey);
      }
    }
  }

  console.log("Role creation complete.");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("Failed to create roles", e);
    process.exit(1);
  })
  .finally(async () => {
    await disconnectRedis();
    await shutdownPostgres();
  });
