# ------------------------------------------------------------
# ECS Cluster
# ------------------------------------------------------------
resource "aws_ecs_cluster" "main" {
  name = "${local.name_prefix}-cluster"

  setting {
    name  = "containerInsights"
    value = var.enable_container_insights ? "enabled" : "disabled"
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-cluster"
  })
}

# ------------------------------------------------------------
# ECS Task Definitions
# ------------------------------------------------------------
resource "aws_ecs_task_definition" "server" {
  family                   = "${local.name_prefix}-server"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = tostring(var.ecs_cpu)
  memory                   = tostring(var.ecs_memory)
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name      = "server"
      image     = "${aws_ecr_repository.server.repository_url}:latest"
      essential = true

      portMappings = [
        {
          containerPort = 3000
          protocol      = "tcp"
        }
      ]

      environment = [
        {
          name  = "NODE_ENV"
          value = "production"
        },
        {
          name  = "PORT"
          value = "3000"
        },
        {
          name  = "REDIS_HOST"
          value = aws_elasticache_serverless_cache.dev_cache_valkey.endpoint[0].address
        },
        {
          name  = "REDIS_PORT"
          value = "6379"
        },
        {
          name  = "REDIS_USERNAME"
          value = "default"
        },
        {
          name  = "POSTGRES_HOST"
          value = split(":", aws_db_instance.dev_db_comm_ng.endpoint)[0]
        },
        {
          name  = "POSTGRES_PORT"
          value = "5432"
        },
        {
          name  = "POSTGRES_DB"
          value = aws_db_instance.dev_db_comm_ng.db_name
        },
        {
          name  = "POSTGRES_SSL"
          value = "true"
        },
        {
          name  = "POSTGRES_USER"
          value = aws_db_instance.dev_db_comm_ng.username
        },
        {
          name  = "S3_BUCKET_NAME"
          value = aws_s3_bucket.comm_ng_files.bucket
        },
        {
          name  = "USE_PRESIGNED_UPLOADS"
          value = "true"
        },
        {
          name  = "AWS_REGION"
          value = var.aws_region
        },
        {
          name  = "BEDROCK_MODEL_ID"
          value = "amazon.titan-embed-text-v2:0"
        },
        {
          name  = "DB_SECRET_ID"
          value = aws_db_instance.dev_db_comm_ng.master_user_secret[0].secret_arn
        },
        {
          name  = "DB_SECRET_REFRESH_INTERVAL_MS"
          value = "300000"
        },
        {
          name  = "BACKEND_URL"
          value = "http://${aws_lb.main.dns_name}"
        }
      ]

      secrets = [
        {
          name      = "POSTGRES_PASSWORD"
          valueFrom = "${aws_db_instance.dev_db_comm_ng.master_user_secret[0].secret_arn}:password::"
        },
        {
          name      = "REDIS_PASSWORD"
          valueFrom = aws_secretsmanager_secret.cache_auth.arn
        },
        {
          name      = "BETTER_AUTH_SECRET"
          valueFrom = aws_secretsmanager_secret.better_auth_secret.arn
        },
        {
          name      = "VAPID_PUBLIC_KEY"
          valueFrom = "${aws_secretsmanager_secret.vapid_keys.arn}:publicKey::"
        },
        {
          name      = "VAPID_PRIVATE_KEY"
          valueFrom = "${aws_secretsmanager_secret.vapid_keys.arn}:privateKey::"
        },
        {
          name      = "VAPID_CONTACT_EMAIL"
          valueFrom = "${aws_secretsmanager_secret.vapid_keys.arn}:contactEmail::"
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.server.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1"]
        interval    = 30
        timeout     = 10
        retries     = 10
        startPeriod = 180
      }
    }
  ])

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-server-task"
  })
}

resource "aws_ecs_task_definition" "web" {
  family                   = "${local.name_prefix}-web"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = tostring(var.ecs_cpu)
  memory                   = tostring(var.ecs_memory)
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name      = "web"
      image     = "${aws_ecr_repository.web.repository_url}:latest"
      essential = true

      portMappings = [
        {
          containerPort = 3001
          protocol      = "tcp"
        }
      ]

      environment = [
        {
          name  = "NODE_ENV"
          value = "production"
        },
        {
          name  = "PORT"
          value = "3001"
        },
        {
          name  = "NEXT_PUBLIC_API_BASE_URL"
          value = "http://${aws_lb.main.dns_name}"
        },
        {
          name  = "NEXT_PUBLIC_WEB_BASE_URL"
          value = "http://${aws_lb.main.dns_name}"
        }
      ]

      secrets = [
        {
          name      = "NEXT_PUBLIC_VAPID_PUBLIC_KEY"
          valueFrom = "${aws_secretsmanager_secret.vapid_keys.arn}:publicKey::"
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.web.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-web-task"
  })
}

# ------------------------------------------------------------
# ECS Services
# ------------------------------------------------------------
resource "aws_ecs_service" "server" {
  name            = "${local.name_prefix}-server-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.server.arn
  desired_count   = var.ecs_desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = data.aws_subnets.default_vpc.ids
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.server.arn
    container_name   = "server"
    container_port   = 3000
  }

  depends_on = [aws_lb_listener.http]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-server-service"
  })
}

resource "aws_ecs_service" "web" {
  name            = "${local.name_prefix}-web-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.web.arn
  desired_count   = var.ecs_desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = data.aws_subnets.default_vpc.ids
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.web.arn
    container_name   = "web"
    container_port   = 3001
  }

  depends_on = [aws_lb_listener.http]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-web-service"
  })
}

# ------------------------------------------------------------
# Auto Scaling Configuration
# ------------------------------------------------------------
resource "aws_appautoscaling_target" "server" {
  max_capacity       = var.ecs_max_capacity
  min_capacity       = var.ecs_desired_count
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.server.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "server_cpu" {
  name               = "${local.name_prefix}-server-cpu-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.server.resource_id
  scalable_dimension = aws_appautoscaling_target.server.scalable_dimension
  service_namespace  = aws_appautoscaling_target.server.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value       = 70.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

resource "aws_appautoscaling_target" "web" {
  max_capacity       = var.ecs_max_capacity
  min_capacity       = var.ecs_desired_count
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.web.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "web_cpu" {
  name               = "${local.name_prefix}-web-cpu-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.web.resource_id
  scalable_dimension = aws_appautoscaling_target.web.scalable_dimension
  service_namespace  = aws_appautoscaling_target.web.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value       = 70.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}
