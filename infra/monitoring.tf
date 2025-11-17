# ------------------------------------------------------------
# CloudWatch Log Groups
# ------------------------------------------------------------
resource "aws_cloudwatch_log_group" "server" {
  name              = "/ecs/${local.name_prefix}-server"
  retention_in_days = var.log_retention_days

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-server-logs"
  })
}

resource "aws_cloudwatch_log_group" "web" {
  name              = "/ecs/${local.name_prefix}-web"
  retention_in_days = var.log_retention_days

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-web-logs"
  })
}

# ------------------------------------------------------------
# ECS Restart on Secret Rotation
# ------------------------------------------------------------
data "archive_file" "ecs_restart_lambda" {
  type        = "zip"
  source_dir  = "${path.module}/lambda/ecs_restart_on_secret_rotation"
  output_path = "${path.module}/lambda/ecs_restart_on_secret_rotation.zip"
}

resource "aws_lambda_function" "ecs_restart_on_secret_rotation" {
  filename         = data.archive_file.ecs_restart_lambda.output_path
  function_name    = "${local.name_prefix}-ecs-restart-on-secret-rotation"
  role             = aws_iam_role.ecs_restart_lambda.arn
  handler          = "index.handler"
  source_code_hash = data.archive_file.ecs_restart_lambda.output_base64sha256
  runtime          = "nodejs20.x"
  timeout          = 60

  environment {
    variables = {
      ECS_CLUSTER_NAME  = aws_ecs_cluster.main.name
      ECS_SERVICE_NAMES = "${aws_ecs_service.server.name},${aws_ecs_service.web.name}"
    }
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-ecs-restart-on-secret-rotation"
  })
}

resource "aws_cloudwatch_log_group" "ecs_restart_lambda" {
  name              = "/aws/lambda/${aws_lambda_function.ecs_restart_on_secret_rotation.function_name}"
  retention_in_days = var.log_retention_days

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-ecs-restart-lambda-logs"
  })
}

resource "aws_cloudwatch_event_rule" "secret_rotation" {
  name        = "${local.name_prefix}-secret-rotation-trigger"
  description = "Trigger ECS restart when Secrets Manager rotates secrets"

  event_pattern = jsonencode({
    source      = ["aws.secretsmanager"]
    detail-type = ["AWS Secrets Manager Secret Rotation"]
    resources = [
      aws_db_instance.dev_db_comm_ng.master_user_secret[0].secret_arn,
      aws_secretsmanager_secret.cache_auth.arn,
      aws_secretsmanager_secret.vapid_keys.arn,
      aws_secretsmanager_secret.better_auth_secret.arn
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-secret-rotation-trigger"
  })
}

resource "aws_cloudwatch_event_target" "ecs_restart_lambda" {
  rule      = aws_cloudwatch_event_rule.secret_rotation.name
  target_id = "ECSRestartLambda"
  arn       = aws_lambda_function.ecs_restart_on_secret_rotation.arn
}

resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.ecs_restart_on_secret_rotation.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.secret_rotation.arn
}
