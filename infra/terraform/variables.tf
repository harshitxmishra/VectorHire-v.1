variable "aws_region" {
  type        = string
  description = "AWS deployment region"
  default     = "us-east-1"
}

variable "environment" {
  type        = string
  description = "Environment identifier (e.g. prod, staging, dev)"
  default     = "production"
}

variable "bucket_name_prefix" {
  type        = string
  description = "Prefix for S3 storage bucket"
  default     = "vectorhire-storage"
}

variable "ec2_instance_type" {
  type        = string
  description = "EC2 instance size for the NestJS API & BullMQ workers"
  default     = "t3.medium"
}

variable "allowed_cors_origins" {
  type        = list(string)
  description = "Allowed origins for S3 CORS access"
  default = [
    "https://vector-hire-v-1.vercel.app",
    "http://localhost:3000",
    "http://127.0.0.1:3000"
  ]
}
