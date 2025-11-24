const { ECSClient, UpdateServiceCommand } = require("@aws-sdk/client-ecs");
const { RDSClient, StopDBInstanceCommand } = require("@aws-sdk/client-rds");

const ecs = new ECSClient({ region: process.env.AWS_REGION || "us-east-1" });
const rds = new RDSClient({ region: process.env.AWS_REGION || "us-east-1" });

exports.handler = async (_event) => {
  console.log("Starting infrastructure shutdown at 6 PM EST");

  const clusterName = process.env.ECS_CLUSTER_NAME;
  const serviceNames = process.env.ECS_SERVICE_NAMES.split(",");
  const dbInstanceId = process.env.DB_INSTANCE_ID;

  const results = {
    ecs: [],
    rds: null,
  };

  try {
    // Scale ECS services to 0
    for (const serviceName of serviceNames) {
      console.log(`Scaling ${serviceName} to 0 tasks`);

      const updateCommand = new UpdateServiceCommand({
        cluster: clusterName,
        service: serviceName.trim(),
        desiredCount: 0,
      });

      const response = await ecs.send(updateCommand);
      results.ecs.push({
        service: serviceName.trim(),
        status: "scaled_to_zero",
        desiredCount: response.service.desiredCount,
      });

      console.log(`✓ ${serviceName} scaled to 0`);
    }

    // Stop RDS instance
    console.log(`Stopping RDS instance: ${dbInstanceId}`);

    const stopCommand = new StopDBInstanceCommand({
      DBInstanceIdentifier: dbInstanceId,
    });

    const rdsResponse = await rds.send(stopCommand);
    results.rds = {
      dbInstance: dbInstanceId,
      status: "stopping",
      state: rdsResponse.DBInstance.DBInstanceStatus,
    };

    console.log(`✓ RDS instance ${dbInstanceId} is stopping`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Infrastructure shutdown initiated successfully",
        timestamp: new Date().toISOString(),
        results,
      }),
    };
  } catch (error) {
    console.error("Error during shutdown:", error);
    throw error;
  }
};
