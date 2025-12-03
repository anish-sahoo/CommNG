import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import pLimit from "p-limit";
import type {
  EmbedResponse,
  InvokeModelBody,
} from "../types/embedding-types.js";
import log from "../utils/logger.js";

class EmbeddingService {
  private model: string;
  private client?: BedrockRuntimeClient;
  private embeddingsEnabled: boolean;
  private readonly limit = pLimit(10);
  private readonly TIMEOUT_MS = 10000;

  constructor(region = "us-east-1", model = "amazon.titan-embed-text-v2:0") {
    this.model = model;
    this.embeddingsEnabled = process.env.EMBEDDINGS_ENABLED !== "false";
    if (this.embeddingsEnabled) {
      this.client = new BedrockRuntimeClient({ region });
      log.info(
        { model, region, embeddingsEnabled: this.embeddingsEnabled },
        "Connected to AWS Bedrock",
      );
    }
  }

  private async invokeModel<T>(
    modelId: string,
    input: string | string[],
  ): Promise<T> {
    if (!this.client) {
      throw new Error("Bedrock client not initialized");
    }
    const body: InvokeModelBody = {
      inputText: input,
      dimensions: 512,
      normalize: true,
    };

    const command = new InvokeModelCommand({
      modelId,
      body: JSON.stringify(body),
      contentType: "application/json",
      accept: "application/json",
    });
    const response = await this.client.send(command);
    const parsed = JSON.parse(new TextDecoder().decode(response.body));
    return parsed as T;
  }

  /**
   * Send text to the Bedrock embedding model and return a float[] embedding.
   */
  async embed(text: string): Promise<number[]> {
    if (!this.embeddingsEnabled) {
      log.warn("Embeddings not enabled, returning default value");
      return new Array(512).fill(0);
    }
    const embeddingPromise = this.invokeModel<EmbedResponse>(
      this.model,
      text,
    ).then((json) => json.embedding);
    const timeoutPromise = new Promise<number[]>((resolve) => {
      setTimeout(() => resolve(new Array(512).fill(0)), this.TIMEOUT_MS);
    });
    return Promise.race([embeddingPromise, timeoutPromise]);
  }

  /**
   * Send text to the Bedrock embedding model and return a float[] embedding.
   */
  async embedBatch(texts: string[]): Promise<number[][]> {
    if (!this.embeddingsEnabled) {
      log.warn("Embeddings not enabled, returning default value");
      return texts.map(() => new Array(512).fill(0));
    }
    const embeddingPromise = Promise.all(
      texts.map((text) => this.limit(() => this.embed(text))),
    );
    const timeoutPromise = new Promise<number[][]>((resolve) => {
      setTimeout(() => resolve([]), this.TIMEOUT_MS);
    });
    return Promise.race([embeddingPromise, timeoutPromise]);
  }
}

export const embeddingService: EmbeddingService = new EmbeddingService();
