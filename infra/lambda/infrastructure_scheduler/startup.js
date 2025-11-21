const { ECSClient, UpdateServiceCommand } = require("@aws-sdk/client-ecs");
const { RDSClient, StartDBInstanceCommand } = require("@aws-sdk/client-rds");

const ecs = new ECSClient({ region: process.env.AWS_REGION || "us-east-1" });
const rds = new RDSClient({ region: process.env.AWS_REGION || "us-east-1" });

exports.handler = async (_event) => {
  console.log("Starting infrastructure startup at 8 AM EST");

  const clusterName = process.env.ECS_CLUSTER_NAME;
  const serviceNames = process.env.ECS_SERVICE_NAMES.split(",");
  const dbInstanceId = process.env.DB_INSTANCE_ID;

  const results = {
    ecs: [],
    rds: null,
  };

  try {
    // Start RDS instance first
    console.log(`Starting RDS instance: ${dbInstanceId}`);

    const startCommand = new StartDBInstanceCommand({
      DBInstanceIdentifier: dbInstanceId,
    });

    const rdsResponse = await rds.send(startCommand);
    results.rds = {
      dbInstance: dbInstanceId,
      status: "starting",
      state: rdsResponse.DBInstance.DBInstanceStatus,
    };

    console.log(`✓ RDS instance ${dbInstanceId} is starting`);

    // Scale ECS services back to 1
    for (const serviceName of serviceNames) {
      console.log(`Scaling ${serviceName} to 1 task`);

      const updateCommand = new UpdateServiceCommand({
        cluster: clusterName,
        service: serviceName.trim(),
        desiredCount: 1,
      });

      const response = await ecs.send(updateCommand);
      results.ecs.push({
        service: serviceName.trim(),
        status: "scaled_to_one",
        desiredCount: response.service.desiredCount,
      });

      console.log(`✓ ${serviceName} scaled to 1`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Infrastructure startup initiated successfully",
        timestamp: new Date().toISOString(),
        results,
      }),
    };
  } catch (error) {
    console.error("Error during startup:", error);
    throw error;
  }
};
