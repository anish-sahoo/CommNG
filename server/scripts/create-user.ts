import { auth } from "../src/auth.js";
import { shutdownPostgres } from "../src/data/db/sql.js";

/**
 * Script to create a new user account using better-auth
 *
 * Edit the userData object below with the user details you want to create.
 *
 * Usage:
 *   cd server
 *   npx dotenv -e .env -- tsx scripts/create-user.ts
 */

async function createUser() {
  // Edit this object to create a new user
  const userData = {
    email: "test@test.test",
    password: "pass1234",
    name: "John Doe",
    phoneNumber: "555-1234", // optional
    rank: "Captain", // optional
    department: "Engineering", // optional
    branch: "Army", // optional
  };

  console.log("Creating user with the following details:");
  console.log(`  Email: ${userData.email}`);
  console.log(`  Name: ${userData.name}`);
  if (userData.phoneNumber) console.log(`  Phone: ${userData.phoneNumber}`);
  if (userData.rank) console.log(`  Rank: ${userData.rank}`);
  if (userData.department) console.log(`  Department: ${userData.department}`);
  if (userData.branch) console.log(`  Branch: ${userData.branch}`);
  console.log("");

  try {
    // Use better-auth's internal API to create the user
    const result = await auth.api.signUpEmail({
      body: {
        email: userData.email.toLowerCase().trim(),
        password: userData.password,
        name: userData.name.trim(),
        phoneNumber: userData.phoneNumber,
        rank: userData.rank,
        department: userData.department,
        branch: userData.branch,
      },
    });

    if (!result || "error" in result) {
      console.error("Failed to create user:");
      console.error(result);
      process.exit(1);
    }

    console.log("✓ Successfully created user!");
    console.log(`  User ID: ${result.user.id}`);
    console.log(`  Email: ${result.user.email}`);
    console.log(`  Name: ${result.user.name}`);
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
}

createUser()
  .then(() => {
    console.log("\nDone!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\nFailed to create user:", error);
    process.exit(1);
  })
  .finally(async () => {
    await shutdownPostgres();
  });
