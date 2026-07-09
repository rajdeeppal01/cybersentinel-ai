terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

# IAM Role for Autonomous Security Agent Lambda
resource "aws_iam_role" "agent_lambda_role" {
  name = "autonomous_agent_lambda_role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

# Attach basic execution policy
resource "aws_iam_role_policy_attachment" "agent_lambda_policy" {
  role       = aws_iam_role.agent_lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# The Serverless Agent Function
resource "aws_lambda_function" "security_agent" {
  filename         = "agent_deployment_package.zip"
  function_name    = "cyber_sentinel_autonomous_agent"
  role             = aws_iam_role.agent_lambda_role.arn
  handler          = "agent.handler"
  runtime          = "python3.10"
  timeout          = 30

  environment {
    variables = {
      ANTHROPIC_API_KEY = "dummy-key-for-tf"
      GEMINI_API_KEY    = "dummy-key-for-tf"
      GITHUB_TOKEN      = "dummy-token-for-prs"
    }
  }
}

# API Gateway to receive SIEM/EDR webhooks
resource "aws_apigatewayv2_api" "agent_api" {
  name          = "agent-webhook-api"
  protocol_type = "HTTP"
}

# Integration between API Gateway and Agent Lambda
resource "aws_apigatewayv2_integration" "agent_integration" {
  api_id           = aws_apigatewayv2_api.agent_api.id
  integration_type = "AWS_PROXY"

  integration_uri    = aws_lambda_function.security_agent.invoke_arn
  integration_method = "POST"
}
