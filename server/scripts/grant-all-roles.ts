#!/usr/bin/env tsx

/**
 * Grant all supported non-channel roles to a list of emails.
 * Optionally includes channel-scoped roles when a channel ID is provided.
 *
 * Usage:
 *   npx dotenv -e .env -- tsx scripts/grant-all-roles.ts -f emails.txt
 *   npx dotenv -e .env -- tsx scripts/grant-all-roles.ts -c 13 alice@example.com bob@example.com
 */

import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";

interface Args {
  channelId?: number;
  emailsFile?: string;
  emails: string[];
}

function parseArgs(): Args {
  const args = process.argv.slice(2);
  const result: Args = { emails: [] };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "-c" && i + 1 < args.length) {
      const channelIdStr = args[i + 1];
      if (channelIdStr) {
        result.channelId = parseInt(channelIdStr, 10);
      }
      i++;
    } else if (arg === "-f" && i + 1 < args.length) {
      result.emailsFile = args[i + 1];
      i++;
    } else if (arg && !arg.startsWith("-")) {
      result.emails.push(arg);
    } else if (arg) {
      console.error(`Unknown option: ${arg}`);
      process.exit(1);
    }
  }

  return result;
}

function loadEmailsFromFile(filePath: string): string[] {
  const content = readFileSync(filePath, "utf-8");
  return content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));
}

async function grantRole(email: string, role: string): Promise<boolean> {
  return new Promise((resolve) => {
    const child = spawn(
      "npx",
      [
        "dotenv",
        "-e",
        ".env",
        "--",
        "tsx",
        "scripts/grant-role.ts",
        email,
        role,
      ],
      {
        stdio: "inherit",
        cwd: process.cwd(),
      },
    );

    child.on("close", (code) => {
      resolve(code === 0);
    });

    child.on("error", () => {
      resolve(false);
    });
  });
}

async function main() {
  const args = parseArgs();

  if (args.emailsFile) {
    try {
      const fileEmails = loadEmailsFromFile(args.emailsFile);
      args.emails.push(...fileEmails);
    } catch (_error) {
      console.error(`Failed to read emails file: ${args.emailsFile}`);
      process.exit(1);
    }
  }

  if (args.emails.length === 0) {
    console.error(
      "No emails provided. Use -f file or pass emails as arguments.",
    );
    process.exit(1);
  }

  // Roles to grant (derived from server/src/data/roles.ts)
  const reportingRoles = [
    "reporting:admin",
    "reporting:assign",
    "reporting:delete",
    "reporting:update",
    "reporting:create",
    "reporting:read",
  ];
  const broadcastRoles = ["broadcast:create"];
  const globalRoles = ["global:admin", "global:create-invite"];

  const allRoles = [...reportingRoles, ...broadcastRoles, ...globalRoles];

  if (args.channelId) {
    allRoles.push(
      `channel:${args.channelId}:admin`,
      `channel:${args.channelId}:post`,
      `channel:${args.channelId}:read`,
    );
  }

  console.log(
    `Granting ${allRoles.length} roles to ${args.emails.length} email(s)...`,
  );

  for (const email of args.emails) {
    console.log(`\n== Processing: ${email} ==`);
    for (const role of allRoles) {
      console.log(`Granting ${role} to ${email}`);
      const success = await grantRole(email, role);
      if (success) {
        console.log("  -> success");
      } else {
        console.error(`  -> FAILED for ${role} on ${email}`);
      }
      // Slight pause to avoid hammering the DB
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }

  console.log("\nAll done.");
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
