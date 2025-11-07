/**
 * Lambda function to restart ECS services when Secrets Manager rotates secrets
 * Triggered by EventBridge rule on SecretsManager RotationSucceeded events
 */

const { ECSClient, UpdateServiceCommand } = require("@aws-sdk/client-ecs");

// AWS Lambda automatically sets AWS_REGION environment variable
const ecsClient = new ECSClient({ region: process.env.AWS_REGION });

exports.handler = async (event) => {
  console.log("Event received:", JSON.stringify(event, null, 2));

  try {
    // Extract secret ARN from the event
    const secretArn = event.detail?.requestParameters?.secretId || event.detail?.secretId;
    
    if (!secretArn) {
      console.error("No secret ARN found in event");
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "No secret ARN found in event" })
      };
    }

    console.log(`Secret rotated: ${secretArn}`);

    // Get ECS cluster and services from environment variables
    const clusterName = process.env.ECS_CLUSTER_NAME;
    const serviceNames = process.env.ECS_SERVICE_NAMES?.split(",") || [];

    if (!clusterName || serviceNames.length === 0) {
      console.error("ECS_CLUSTER_NAME or ECS_SERVICE_NAMES not configured");
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Lambda not properly configured" })
      };
    }

    console.log(`Restarting services in cluster ${clusterName}: ${serviceNames.join(", ")}`);

    // Force new deployment for each service
    const results = await Promise.allSettled(
      serviceNames.map(async (serviceName) => {
        const command = new UpdateServiceCommand({
          cluster: clusterName,
          service: serviceName.trim(),
          forceNewDeployment: true
        });

        const response = await ecsClient.send(command);
        console.log(`Successfully triggered restart for service: ${serviceName}`);
        return { serviceName, success: true, taskDefinition: response.service?.taskDefinition };
      })
    );

    // Log results
    const succeeded = results.filter(r => r.status === "fulfilled");
    const failed = results.filter(r => r.status === "rejected");

    console.log(`Restart completed: ${succeeded.length} succeeded, ${failed.length} failed`);
    
    if (failed.length > 0) {
      console.error("Failed services:", failed.map(f => f.reason));
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "ECS service restart triggered",
        secretArn,
        clusterName,
        results: {
          succeeded: succeeded.length,
          failed: failed.length,
          total: results.length
        }
      })
    };

  } catch (error) {
    console.error("Error processing event:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message,
        stack: error.stack
      })
    };
  }
};
