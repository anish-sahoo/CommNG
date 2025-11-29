// import {
//   BedrockRuntimeClient,
//   InvokeModelCommand,
// } from "@aws-sdk/client-bedrock-runtime";
// import type {
//   EmbedBatchResponse,
//   EmbedResponse,
//   InvokeModelBody,
// } from "../types/embedding-types.js";

class EmbeddingService {
  // private model: string;
  // private client: BedrockRuntimeClient;

  // constructor(region = "us-east-1", model = "amazon.titan-embed-text-v2:0") {
  //   this.client = new BedrockRuntimeClient({ region });
  //   this.model = model;
  // }

  // private async invokeModel<T>(
  //   modelId: string,
  //   input: string | string[],
  // ): Promise<T> {
  //   const body: InvokeModelBody = {
  //     inputText: input,
  //     dimensions: 512,
  //     normalize: true,
  //   };

  //   const command = new InvokeModelCommand({
  //     modelId,
  //     body: JSON.stringify(body),
  //     contentType: "application/json",
  //     accept: "application/json",
  //   });
  //   const response = await this.client.send(command);
  //   const parsed = JSON.parse(new TextDecoder().decode(response.body));
  //   return parsed as T;
  // }

  /**
   * Send text to the Bedrock embedding model and return a float[] embedding.
   */
  async embed(_text: string): Promise<number[]> {
    // const json = await this.invokeModel<EmbedResponse>(this.model, text);
    // return json.embedding;
    return new Array(512).fill(0);
  }

  /**
   * Send text to the Bedrock embedding model and return a float[] embedding.
   */
  async embedBatch(texts: string[]): Promise<number[][]> {
    // const json = await this.invokeModel<EmbedBatchResponse>(this.model, texts);
    // return json.embeddings;
    return texts.map(() => new Array(512).fill(0));
  }
}

export const embeddingService: EmbeddingService = new EmbeddingService();
