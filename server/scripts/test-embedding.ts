import readline from "node:readline";
import { embeddingService } from "../src/service/embedding-service.js";

async function ask(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise<string>((resolve) =>
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    }),
  );
}

async function main() {
  try {
    const input: string =
      process.argv.slice(2).join(" ") || (await ask("Enter text to embed: "));

    console.log("\nEmbedding text:", `"${input}"`);
    console.log("Calling Titan...");

    const vector: number[][] = await embeddingService.embedBatch([
      input,
      input,
      input,
    ]);

    vector.forEach(
      (v) => void console.log("Embedding (length", `${v.length}):`),
    );
    vector.forEach((v) => void console.log("First 10 values:", v.slice(0, 10)));
    console.log();
  } catch (err) {
    // try to detect common AWS access errors and output helpful guidance
    console.error("❌ Error:", err);

    try {
      console.error(
        "\nIt looks like a permissions error (AccessDenied / explicit deny).",
      );
      console.error(
        "This is commonly caused by an AWS Organizations Service Control Policy (SCP) or an IAM permission/permission boundary that explicitly denies the 'bedrock:InvokeModel' action.",
      );
    } catch (_inner) {
      // silence any diagnostic failure — continue to propagate the original error data
      /* noop */
    }
  }
}

main();
