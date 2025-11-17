# ------------------------------------------------------------
# Infrastructure Scheduler Lambdas
# ------------------------------------------------------------
data "archive_file" "scheduler_shutdown_lambda" {
  type        = "zip"
  source_dir  = "${path.module}/lambda/infrastructure_scheduler"
  output_path = "${path.module}/lambda/infrastructure_scheduler_shutdown.zip"
  excludes    = ["startup.js", "package.json"]
}

data "archive_file" "scheduler_startup_lambda" {
  type        = "zip"
  source_dir  = "${path.module}/lambda/infrastructure_scheduler"
  output_path = "${path.module}/lambda/infrastructure_scheduler_startup.zip"
  excludes    = ["shutdown.js", "package.json"]
}

resource "aws_lambda_function" "infrastructure_shutdown" {
  count            = var.enable_infrastructure_scheduler ? 1 : 0
  filename         = data.archive_file.scheduler_shutdown_lambda.output_path
  function_name    = "${local.name_prefix}-infrastructure-shutdown"
  role             = aws_iam_role.scheduler_lambda[0].arn
  handler          = "shutdown.handler"
  source_code_hash = data.archive_file.scheduler_shutdown_lambda.output_base64sha256
  runtime          = "nodejs20.x"
  timeout          = 120

  environment {
    variables = {
      ECS_CLUSTER_NAME  = aws_ecs_cluster.main.name
      ECS_SERVICE_NAMES = "${aws_ecs_service.server.name},${aws_ecs_service.web.name}"
      DB_INSTANCE_ID    = aws_db_instance.dev_db_comm_ng.identifier
    }
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-infrastructure-shutdown"
  })
}

resource "aws_lambda_function" "infrastructure_startup" {
  count            = var.enable_infrastructure_scheduler ? 1 : 0
  filename         = data.archive_file.scheduler_startup_lambda.output_path
  function_name    = "${local.name_prefix}-infrastructure-startup"
  role             = aws_iam_role.scheduler_lambda[0].arn
  handler          = "startup.handler"
  source_code_hash = data.archive_file.scheduler_startup_lambda.output_base64sha256
  runtime          = "nodejs20.x"
  timeout          = 120

  environment {
    variables = {
      ECS_CLUSTER_NAME  = aws_ecs_cluster.main.name
      ECS_SERVICE_NAMES = "${aws_ecs_service.server.name},${aws_ecs_service.web.name}"
      DB_INSTANCE_ID    = aws_db_instance.dev_db_comm_ng.identifier
    }
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-infrastructure-startup"
  })
}

resource "aws_cloudwatch_log_group" "scheduler_shutdown_lambda" {
  count             = var.enable_infrastructure_scheduler ? 1 : 0
  name              = "/aws/lambda/${aws_lambda_function.infrastructure_shutdown[0].function_name}"
  retention_in_days = var.log_retention_days

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-scheduler-shutdown-lambda-logs"
  })
}

resource "aws_cloudwatch_log_group" "scheduler_startup_lambda" {
  count             = var.enable_infrastructure_scheduler ? 1 : 0
  name              = "/aws/lambda/${aws_lambda_function.infrastructure_startup[0].function_name}"
  retention_in_days = var.log_retention_days

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-scheduler-startup-lambda-logs"
  })
}

# ------------------------------------------------------------
# EventBridge Schedules
# ------------------------------------------------------------
resource "aws_cloudwatch_event_rule" "infrastructure_shutdown_schedule" {
  count               = var.enable_infrastructure_scheduler ? 1 : 0
  name                = "${local.name_prefix}-shutdown-6pm-est"
  description         = "Shutdown infrastructure at 6 PM EST daily"
  schedule_expression = "cron(0 23 * * ? *)"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-shutdown-schedule"
  })
}

resource "aws_cloudwatch_event_rule" "infrastructure_startup_schedule" {
  count               = var.enable_infrastructure_scheduler ? 1 : 0
  name                = "${local.name_prefix}-startup-8am-est"
  description         = "Startup infrastructure at 8 AM EST daily"
  schedule_expression = "cron(0 13 * * ? *)"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-startup-schedule"
  })
}

resource "aws_cloudwatch_event_target" "shutdown_lambda" {
  count     = var.enable_infrastructure_scheduler ? 1 : 0
  rule      = aws_cloudwatch_event_rule.infrastructure_shutdown_schedule[0].name
  target_id = "InfrastructureShutdownLambda"
  arn       = aws_lambda_function.infrastructure_shutdown[0].arn
}

resource "aws_cloudwatch_event_target" "startup_lambda" {
  count     = var.enable_infrastructure_scheduler ? 1 : 0
  rule      = aws_cloudwatch_event_rule.infrastructure_startup_schedule[0].name
  target_id = "InfrastructureStartupLambda"
  arn       = aws_lambda_function.infrastructure_startup[0].arn
}

resource "aws_lambda_permission" "allow_eventbridge_shutdown" {
  count         = var.enable_infrastructure_scheduler ? 1 : 0
  statement_id  = "AllowExecutionFromEventBridgeShutdown"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.infrastructure_shutdown[0].function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.infrastructure_shutdown_schedule[0].arn
}

resource "aws_lambda_permission" "allow_eventbridge_startup" {
  count         = var.enable_infrastructure_scheduler ? 1 : 0
  statement_id  = "AllowExecutionFromEventBridgeStartup"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.infrastructure_startup[0].function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.infrastructure_startup_schedule[0].arn
}
