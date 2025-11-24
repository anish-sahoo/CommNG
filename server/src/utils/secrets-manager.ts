import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";
import log from "@/utils/logger.js";

interface DatabaseCredentials {
  username: string;
  password: string;
  engine?: string;
}

class SecretsManager {
  private client: SecretsManagerClient | null = null;
  private secretId: string | null = null;
  private cachedSecret: DatabaseCredentials | null = null;
  private refreshInterval: NodeJS.Timeout | null = null;
  private onSecretRotate:
    | ((credentials: DatabaseCredentials) => Promise<void>)
    | null = null;

  constructor() {
    // Only initialize if running in AWS environment
    const awsRegion =
      process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";
    const secretId = process.env.DB_SECRET_ID;

    if (awsRegion && secretId) {
      this.client = new SecretsManagerClient({ region: awsRegion });
      this.secretId = secretId;
      log.info(
        `Secrets Manager initialized for secret: ${secretId} in region: ${awsRegion}`,
      );
    } else {
      log.info(
        "Secrets Manager not initialized - using environment variables directly",
      );
    }
  }

  /**
   * Fetch the secret from AWS Secrets Manager
   */
  async fetchSecret(): Promise<DatabaseCredentials | null> {
    if (!this.client || !this.secretId) {
      return null;
    }

    try {
      const command = new GetSecretValueCommand({
        SecretId: this.secretId,
      });

      const response = await this.client.send(command);

      if (!response.SecretString) {
        throw new Error("Secret string is empty");
      }

      const secret = JSON.parse(response.SecretString) as DatabaseCredentials;
      log.debug(
        "Successfully fetched database credentials from Secrets Manager",
      );
      return secret;
    } catch (error) {
      log.error(error, "Failed to fetch secret from Secrets Manager");
      throw error;
    }
  }

  /**
   * Start auto-refresh of secrets at specified interval
   * @param intervalMs Interval in milliseconds (default: 5 minutes)
   * @param callback Function to call when secret is rotated
   */
  async startAutoRefresh(
    intervalMs: number = 5 * 60 * 1000,
    callback?: (credentials: DatabaseCredentials) => Promise<void>,
  ): Promise<void> {
    if (!this.client || !this.secretId) {
      log.info("Auto-refresh not started - Secrets Manager not initialized");
      return;
    }

    if (callback) {
      this.onSecretRotate = callback;
    }

    // Initial fetch
    try {
      this.cachedSecret = await this.fetchSecret();
    } catch (error) {
      log.error(error, "Failed to fetch initial secret");
      throw error;
    }

    // Set up periodic refresh
    this.refreshInterval = setInterval(async () => {
      try {
        const newSecret = await this.fetchSecret();

        if (!newSecret) {
          return;
        }

        // Check if password has changed
        const passwordChanged =
          !this.cachedSecret ||
          this.cachedSecret.password !== newSecret.password;

        if (passwordChanged) {
          log.info("Database password rotation detected");
          this.cachedSecret = newSecret;

          // Call the rotation callback
          if (this.onSecretRotate) {
            await this.onSecretRotate(newSecret);
          }
        }
      } catch (error) {
        log.error(error, "Failed to refresh secret");
      }
    }, intervalMs);

    log.info(
      `Auto-refresh started - checking for secret rotation every ${intervalMs / 1000} seconds`,
    );
  }

  /**
   * Stop auto-refresh
   */
  stopAutoRefresh(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
      log.info("Auto-refresh stopped");
    }
  }

  /**
   * Get cached secret or fetch from environment variables
   */
  async getCredentials(): Promise<DatabaseCredentials | null> {
    if (this.cachedSecret) {
      return this.cachedSecret;
    }

    if (this.client && this.secretId) {
      this.cachedSecret = await this.fetchSecret();
      return this.cachedSecret;
    }

    return null;
  }

  /**
   * Check if Secrets Manager is enabled
   */
  isEnabled(): boolean {
    return this.client !== null && this.secretId !== null;
  }
}

// Singleton instance
export const secretsManager = new SecretsManager();
